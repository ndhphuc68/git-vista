use crate::error::AppError;
use git2::{build::CheckoutBuilder, BranchType, Reference, Repository};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct BranchDeletionRecovery {
    pub version: u8,
    pub branch_name: String,
    pub target: String,
    pub nonce: String,
}

fn recovery_signature(repo: &Repository) -> Result<git2::Signature<'static>, AppError> {
    repo.signature().map(|sig| sig.to_owned()).or_else(|_| {
        git2::Signature::now("Visual Git Client", "app@visualgit.local").map_err(AppError::from)
    })
}

/// Kiểm tra tính hợp lệ của tên nhánh Git
pub fn validate_branch_name(name: &str) -> Result<(), AppError> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err(AppError::InvalidOperation(
            "Tên nhánh không được để trống".into(),
        ));
    }
    if trimmed.starts_with('-') {
        return Err(AppError::InvalidOperation(
            "Branch name cannot start with '-' because Git CLI would parse it as an option".into(),
        ));
    }
    let ref_name = format!("refs/heads/{}", trimmed);
    if !Reference::is_valid_name(&ref_name) {
        return Err(AppError::InvalidOperation(format!(
            "Tên nhánh '{}' không hợp lệ theo quy chuẩn Git",
            trimmed
        )));
    }
    Ok(())
}

/// Creates a branch at HEAD or at the given revision (commit OID or ref), optionally checking it out.
pub fn create_branch<P: AsRef<Path>>(
    repo_path: P,
    name: &str,
    target_commit_id: Option<&str>,
    checkout: bool,
) -> Result<(), AppError> {
    let trimmed = name.trim();
    validate_branch_name(trimmed)?;
    let repo = Repository::open(repo_path.as_ref())?;

    if checkout && repo.state() != git2::RepositoryState::Clean {
        return Err(AppError::InvalidOperation(
            "OPERATION_IN_PROGRESS: Không thể chuyển sang nhánh mới khi kho lưu trữ đang có tiến trình dở dang (Merge, Rebase, Cherry-pick hoặc Revert). Vui lòng hoàn tất hoặc huỷ bỏ tiến trình trước.".to_string(),
        ));
    }

    // The start point is any revision: a commit OID, or a fully qualified ref
    // such as refs/heads/x or refs/remotes/origin/x for "branch from branch".
    let target_commit = if let Some(rev) = target_commit_id {
        let rev = rev.trim();
        repo.revparse_single(rev)
            .and_then(|object| object.peel_to_commit())
            .map_err(|e| {
                AppError::InvalidOperation(format!("Điểm bắt đầu '{}' không hợp lệ: {}", rev, e))
            })?
    } else {
        let head = repo.head()?;
        head.peel_to_commit()?
    };

    let mut new_branch = repo.branch(trimmed, &target_commit, false)?;

    if checkout {
        // A failed checkout must not leave behind a branch the user never got
        // onto: retrying the same name would then fail with "already exists".
        if let Err(err) = checkout_branch(repo_path, trimmed) {
            let _ = new_branch.delete();
            return Err(err);
        }
    }

    Ok(())
}

/// Chuyển sang nhánh chỉ định bằng cơ chế Safe Checkout của Git (hỗ trợ cả nhánh Local và Remote)
pub fn checkout_branch<P: AsRef<Path>>(repo_path: P, branch_name: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.state() != git2::RepositoryState::Clean {
        return Err(AppError::InvalidOperation(
            "OPERATION_IN_PROGRESS: Không thể chuyển nhánh khi kho lưu trữ đang có tiến trình dở dang (Merge, Rebase, Cherry-pick hoặc Revert). Vui lòng hoàn tất hoặc huỷ bỏ tiến trình trước.".to_string(),
        ));
    }

    let target = resolve_checkout_target(&repo, branch_name)?;
    if let Some(path) = worktree_holding_branch(&repo, &target.local_name) {
        return Err(AppError::InvalidOperation(format!(
            "BRANCH_IN_WORKTREE: Nhánh '{}' đang được checkout ở một worktree khác ({}). Hãy chuyển worktree đó sang nhánh khác trước.",
            target.local_name,
            path.display()
        )));
    }
    let tree = target.commit.tree()?;

    let mut checkout_opts = CheckoutBuilder::new();
    checkout_opts.safe();

    // The working tree is switched before any branch is created, so a conflict
    // leaves the repository exactly as it was.
    if let Err(e) = repo.checkout_tree(tree.as_object(), Some(&mut checkout_opts)) {
        if e.code() == git2::ErrorCode::Conflict {
            return Err(AppError::InvalidOperation(format!(
                "CHECKOUT_CONFLICT: Không thể chuyển sang nhánh '{}' vì có các thay đổi chưa commit bị xung đột với nhánh đích.",
                target.local_name
            )));
        }
        return Err(AppError::Git(e.message().to_string()));
    }

    if let Some(remote_name) = &target.create_from_remote {
        create_tracking_branch(&repo, &target.local_name, remote_name, &target.commit)?;
    }

    let ref_name = format!("refs/heads/{}", target.local_name);
    repo.set_head(&ref_name)?;

    Ok(())
}

/// Where a checkout request lands: the local branch to switch to, the commit it
/// points at, and the remote-tracking branch to create it from when it does not
/// exist yet.
struct CheckoutTarget<'r> {
    local_name: String,
    commit: git2::Commit<'r>,
    create_from_remote: Option<String>,
}

/// Resolves a local branch name, or a remote-tracking name such as
/// `origin/feature`, to the local branch it checks out. Nothing is written.
fn resolve_checkout_target<'r>(
    repo: &'r Repository,
    branch_name: &str,
) -> Result<CheckoutTarget<'r>, AppError> {
    let local_err = match repo.find_branch(branch_name, BranchType::Local) {
        Ok(branch) => {
            return Ok(CheckoutTarget {
                local_name: branch_name.to_string(),
                commit: branch.get().peel_to_commit()?,
                create_from_remote: None,
            })
        }
        Err(err) => err,
    };
    let Ok(remote_branch) = repo.find_branch(branch_name, BranchType::Remote) else {
        return Err(local_err.into());
    };
    let local_name = local_name_of_remote_branch(repo, branch_name);

    if let Ok(existing_local) = repo.find_branch(local_name, BranchType::Local) {
        return Ok(CheckoutTarget {
            local_name: local_name.to_string(),
            commit: existing_local.get().peel_to_commit()?,
            create_from_remote: None,
        });
    }
    // Checked here, before the working tree changes, rather than left to
    // `repo.branch` after it.
    if !git2::Branch::name_is_valid(local_name)? {
        return Err(AppError::InvalidOperation(format!(
            "Tên nhánh '{}' không hợp lệ theo quy chuẩn Git",
            local_name
        )));
    }
    Ok(CheckoutTarget {
        local_name: local_name.to_string(),
        commit: remote_branch.get().peel_to_commit()?,
        create_from_remote: Some(branch_name.to_string()),
    })
}

/// The local name a remote-tracking branch checks out as: `origin/feature`
/// becomes `feature`. The remote comes from Git's refspecs, so a remote whose
/// own name holds a slash (`team/origin`) is stripped whole.
fn local_name_of_remote_branch<'a>(repo: &Repository, branch_name: &'a str) -> &'a str {
    repo.branch_remote_name(&format!("refs/remotes/{branch_name}"))
        .ok()
        .and_then(|remote| remote.as_str().ok().map(|remote| format!("{remote}/")))
        .and_then(|prefix| branch_name.strip_prefix(prefix.as_str()))
        .or_else(|| branch_name.split_once('/').map(|(_remote, rest)| rest))
        .unwrap_or(branch_name)
}

/// The working directory of another worktree that has `local_name` checked out.
/// Git refuses to check a branch out in two worktrees at once; libgit2's
/// `set_head` does not, so the check is made here.
fn worktree_holding_branch(repo: &Repository, local_name: &str) -> Option<PathBuf> {
    let head_ref = format!("refs/heads/{local_name}");
    let canonical =
        |path: &Path| std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    let own_workdir = repo.workdir().map(canonical);

    // The main worktree first, then every linked one.
    let main = Repository::open(repo.commondir()).ok()?;
    let linked = main.worktrees().ok()?;
    let others: Vec<Repository> = linked
        .iter()
        .flatten()
        .flatten()
        .filter_map(|name| main.find_worktree(name).ok())
        .filter_map(|worktree| Repository::open_from_worktree(&worktree).ok())
        .collect();

    std::iter::once(main)
        .chain(others)
        .filter(|other| other.workdir().map(canonical) != own_workdir)
        .find(|other| {
            // HEAD's symbolic target, so an unborn branch still counts.
            other
                .find_reference("HEAD")
                .ok()
                .and_then(|head| {
                    head.symbolic_target()
                        .ok()
                        .flatten()
                        .map(|target| target == head_ref)
                })
                .unwrap_or(false)
        })
        .and_then(|other| other.workdir().map(Path::to_path_buf))
}

/// Creates `local_name` at `commit` and makes it track `remote_name`.
fn create_tracking_branch(
    repo: &Repository,
    local_name: &str,
    remote_name: &str,
    commit: &git2::Commit,
) -> Result<(), AppError> {
    let mut new_branch = repo.branch(local_name, commit, false)?;
    if new_branch.set_upstream(Some(remote_name)).is_err() {
        if let Some(remote) = remote_name.strip_suffix(&format!("/{local_name}")) {
            if let Ok(mut config) = repo.config() {
                let _ = config.set_str(&format!("branch.{local_name}.remote"), remote);
                let _ = config.set_str(
                    &format!("branch.{local_name}.merge"),
                    &format!("refs/heads/{local_name}"),
                );
            }
        }
    }
    Ok(())
}

/// Chuyển sang commit chỉ định (Detached HEAD) bằng cơ chế Safe Checkout của Git
pub fn checkout_commit<P: AsRef<Path>>(repo_path: P, commit_id: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.state() != git2::RepositoryState::Clean {
        return Err(AppError::InvalidOperation(
            "OPERATION_IN_PROGRESS: Không thể chuyển sang commit khi kho lưu trữ đang có tiến trình dở dang (Merge, Rebase, Cherry-pick hoặc Revert). Vui lòng hoàn tất hoặc huỷ bỏ tiến trình trước.".to_string(),
        ));
    }

    let oid = git2::Oid::from_str(commit_id.trim())
        .map_err(|e| AppError::InvalidOperation(format!("Commit OID không hợp lệ: {}", e)))?;
    let commit = repo.find_commit(oid)?;
    let tree = commit.tree()?;

    let mut checkout_opts = CheckoutBuilder::new();
    checkout_opts.safe();

    if let Err(e) = repo.checkout_tree(tree.as_object(), Some(&mut checkout_opts)) {
        if e.code() == git2::ErrorCode::Conflict {
            return Err(AppError::InvalidOperation(format!(
                "CHECKOUT_CONFLICT: Không thể chuyển sang commit '{}' vì có các thay đổi chưa commit bị xung đột.",
                &commit_id[..std::cmp::min(7, commit_id.len())]
            )));
        }
        return Err(AppError::Git(e.message().to_string()));
    }

    repo.set_head_detached(oid)?;

    Ok(())
}

/// Đổi tên nhánh local
pub fn rename_branch<P: AsRef<Path>>(
    repo_path: P,
    old_name: &str,
    new_name: &str,
) -> Result<(), AppError> {
    let trimmed_new = new_name.trim();
    validate_branch_name(trimmed_new)?;

    let repo = Repository::open(repo_path.as_ref())?;
    let mut branch = repo.find_branch(old_name.trim(), BranchType::Local)?;
    branch.rename(trimmed_new, false)?;

    Ok(())
}

/// Xoá nhánh an toàn: kiểm tra HEAD, kiểm tra merged, tạo backup ref
pub fn delete_branch<P: AsRef<Path>>(
    repo_path: P,
    branch_name: &str,
    force: bool,
) -> Result<String, AppError> {
    let trimmed = branch_name.trim();
    validate_branch_name(trimmed)?;
    let repo = Repository::open(repo_path.as_ref())?;
    let branch_ref = format!("refs/heads/{trimmed}");
    let mut transaction = repo.transaction()?;
    transaction.lock_ref("HEAD")?;
    transaction.lock_ref(&branch_ref)?;

    // 1. Kiểm tra HEAD
    if let Ok(head) = repo.head() {
        if head.shorthand().ok() == Some(trimmed) {
            return Err(AppError::InvalidOperation(
                "Không thể xoá nhánh đang được chọn (HEAD)".into(),
            ));
        }
    }

    let branch = repo.find_branch(trimmed, BranchType::Local)?;
    let branch_commit = branch.get().peel_to_commit()?;

    // 2. Kiểm tra merged
    if !force {
        if let Ok(head) = repo.head() {
            if let Ok(head_commit) = head.peel_to_commit() {
                let is_merged = head_commit.id() == branch_commit.id()
                    || repo
                        .graph_descendant_of(head_commit.id(), branch_commit.id())
                        .unwrap_or(false);
                if !is_merged {
                    return Err(AppError::InvalidOperation(
                        "UNMERGED_BRANCH: Nhánh này chứa các commit chưa được gộp vào HEAD.".into(),
                    ));
                }
            }
        }
    }

    // 3. Create a typed receipt whose payload binds this exact branch to its
    // target. The parent keeps the deleted commit reachable for recovery.
    static NEXT_RECEIPT: AtomicU64 = AtomicU64::new(0);
    let nonce = format!(
        "{}-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos(),
        NEXT_RECEIPT.fetch_add(1, Ordering::Relaxed)
    );
    let recovery = BranchDeletionRecovery {
        version: 1,
        branch_name: trimmed.to_string(),
        target: branch_commit.id().to_string(),
        nonce,
    };
    let message =
        serde_json::to_string(&recovery).map_err(|error| AppError::Io(error.to_string()))?;
    let tree = branch_commit.tree()?;
    let signature = recovery_signature(&repo)?;
    let receipt_commit = repo.commit(
        None,
        &signature,
        &signature,
        &message,
        &tree,
        &[&branch_commit],
    )?;
    let backup_ref_name = crate::write::create_backup_ref(&repo, "delete-branch", receipt_commit)?;

    // 4. Remove exactly the ref whose target was captured while the lock was
    // held. A concurrent checkout/retarget cannot slip between receipt and delete.
    drop(branch);
    transaction.remove(&branch_ref)?;
    transaction.commit()?;

    Ok(backup_ref_name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_checkout_branch_rejects_when_operation_in_progress() {
        let temp = TempDir::new().unwrap();
        let repo = Repository::init(temp.path()).unwrap();
        let mut config = repo.config().unwrap();
        config.set_str("user.name", "Test").unwrap();
        config.set_str("user.email", "test@example.com").unwrap();

        let file_path = temp.path().join("file.txt");
        fs::write(&file_path, "initial\n").unwrap();
        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("file.txt")).unwrap();
        index.write().unwrap();
        let tree_id = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = repo.signature().unwrap();
        let commit = repo
            .commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[])
            .unwrap();

        // Create branch-b
        let commit_obj = repo.find_commit(commit).unwrap();
        repo.branch("branch-b", &commit_obj, false).unwrap();

        // Simulate in-progress merge
        let git_dir = repo.path();
        fs::write(git_dir.join("MERGE_HEAD"), format!("{}\n", commit)).unwrap();
        fs::write(git_dir.join("MERGE_MSG"), "Merge commit\n").unwrap();

        assert_eq!(repo.state(), git2::RepositoryState::Merge);

        // Attempt checkout branch-b
        let result = checkout_branch(temp.path(), "branch-b");
        assert!(
            result.is_err(),
            "Checkout should fail when merge is in progress"
        );
        let err_str = result.unwrap_err().to_string();
        assert!(
            err_str.contains("OPERATION_IN_PROGRESS"),
            "Error should indicate OPERATION_IN_PROGRESS, got: {}",
            err_str
        );

        // Verify HEAD did not change
        let head = repo.head().unwrap();
        assert_ne!(head.shorthand().unwrap(), "branch-b");
    }

    #[test]
    fn test_checkout_commit_detached_head() {
        let temp = TempDir::new().unwrap();
        let repo = Repository::init(temp.path()).unwrap();
        let mut config = repo.config().unwrap();
        config.set_str("user.name", "Test").unwrap();
        config.set_str("user.email", "test@example.com").unwrap();

        let file_path = temp.path().join("file.txt");
        fs::write(&file_path, "c1\n").unwrap();
        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("file.txt")).unwrap();
        index.write().unwrap();
        let tree_id = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = repo.signature().unwrap();
        let c1 = repo
            .commit(Some("HEAD"), &sig, &sig, "commit 1", &tree, &[])
            .unwrap();

        fs::write(&file_path, "c2\n").unwrap();
        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("file.txt")).unwrap();
        index.write().unwrap();
        let tree_id2 = index.write_tree().unwrap();
        let tree2 = repo.find_tree(tree_id2).unwrap();
        let _c2 = repo
            .commit(
                Some("HEAD"),
                &sig,
                &sig,
                "commit 2",
                &tree2,
                &[&repo.find_commit(c1).unwrap()],
            )
            .unwrap();

        assert!(!repo.head_detached().unwrap());

        // Checkout c1
        checkout_commit(temp.path(), &c1.to_string()).expect("checkout commit should succeed");

        let repo_reopened = Repository::open(temp.path()).unwrap();
        assert!(repo_reopened.head_detached().unwrap());
        assert_eq!(repo_reopened.head().unwrap().target().unwrap(), c1);
        assert_eq!(fs::read_to_string(&file_path).unwrap().trim(), "c1");
    }
}
