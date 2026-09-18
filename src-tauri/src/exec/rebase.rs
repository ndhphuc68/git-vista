use crate::error::AppError;
use crate::read::rebase::{InteractiveRebaseResult, RebaseActionKind, RebasePlanStep};
use crate::write::create_backup_ref;
use git2::{Oid, Repository, RepositoryState};
use std::fs;
use std::path::Path;
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(serde::Serialize, serde::Deserialize)]
struct CommitRecovery {
    head_ref: String,
    before: Option<String>,
    after: String,
}

fn head_ref_name(repo: &Repository) -> Result<String, AppError> {
    let head = repo.find_reference("HEAD")?;
    Ok(head.symbolic_target()?.unwrap_or("HEAD").to_string())
}

fn create_undo_token(
    repo: &Repository,
    head_ref: &str,
    before_oid: Option<Oid>,
    after_oid: Oid,
) -> Result<String, AppError> {
    let sig = repo.signature().map_err(|_| {
        AppError::InvalidOperation("Git user.name or user.email not configured".to_string())
    })?;
    let recovery = CommitRecovery {
        head_ref: head_ref.to_string(),
        before: before_oid.map(|o| o.to_string()),
        after: after_oid.to_string(),
    };
    let message = serde_json::to_string(&recovery).map_err(|e| AppError::Io(e.to_string()))?;
    let after_commit = repo.find_commit(after_oid)?;
    let tree = after_commit.tree()?;
    let mut parents = vec![&after_commit];
    let before_commit_holder;
    if let Some(b) = before_oid {
        if let Ok(bc) = repo.find_commit(b) {
            before_commit_holder = bc;
            parents.push(&before_commit_holder);
        }
    }
    let receipt = repo.commit(None, &sig, &sig, &message, &tree, &parents)?;
    static NEXT: AtomicU64 = AtomicU64::new(0);
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let action = format!(
        "commit-undo-rebase-{}-{}-{}",
        std::process::id(),
        unique,
        NEXT.fetch_add(1, Ordering::Relaxed)
    );
    let ref_name = create_backup_ref(repo, &action, receipt)?;
    Ok(ref_name)
}

pub fn execute_interactive_rebase<P: AsRef<Path>>(
    repo_path: P,
    base_commit_id: &str,
    steps: Vec<RebasePlanStep>,
    auto_stash: bool,
) -> Result<InteractiveRebaseResult, AppError> {
    crate::exec::validate_git_operand(base_commit_id, "base_commit_id")?;
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.state() != RepositoryState::Clean {
        return Err(AppError::InvalidOperation(
            "Repository has unfinished operations. Please resolve or abort them first.".into(),
        ));
    }

    if steps.is_empty() {
        return Err(AppError::InvalidOperation(
            "Rebase plan cannot be empty.".into(),
        ));
    }

    let non_dropped: Vec<&RebasePlanStep> = steps
        .iter()
        .filter(|s| s.action != RebaseActionKind::Drop)
        .collect();

    if non_dropped.is_empty() {
        return Err(AppError::InvalidOperation(
            "Cannot drop all commits in interactive rebase.".into(),
        ));
    }

    if matches!(
        non_dropped[0].action,
        RebaseActionKind::Squash | RebaseActionKind::Fixup
    ) {
        return Err(AppError::InvalidOperation(
            "Cannot squash or fixup the first commit.".into(),
        ));
    }

    // Check if working tree is dirty
    let statuses = repo.statuses(None)?;
    let is_dirty = !statuses.is_empty();
    if is_dirty && !auto_stash {
        return Err(AppError::InvalidOperation(
            "Working tree has uncommitted changes. Please stash or commit them first, or enable auto-stash.".into(),
        ));
    }

    let head_commit = repo.head()?.peel_to_commit()?;
    let head_oid = head_commit.id();
    let head_ref = head_ref_name(&repo)?;

    // Create safety backup of current head before rebasing
    let _ = create_backup_ref(&repo, "interactive-rebase", head_oid)?;

    // Prepare temp dir for custom todo and message files
    let temp_dir = tempfile::tempdir().map_err(|e| AppError::Io(e.to_string()))?;
    let mut todo_lines = Vec::new();

    for (idx, step) in steps.iter().enumerate() {
        crate::exec::validate_git_operand(&step.commit_id, "step_commit_id")?;
        let short_sha = if step.commit_id.len() >= 7 {
            &step.commit_id[..7]
        } else {
            &step.commit_id
        };

        match step.action {
            RebaseActionKind::Pick => {
                todo_lines.push(format!("pick {}", short_sha));
            }
            RebaseActionKind::Reword => {
                todo_lines.push(format!("pick {}", short_sha));
                if let Some(msg) = &step.new_message {
                    let msg_file = temp_dir.path().join(format!("msg_{}.txt", idx));
                    fs::write(&msg_file, msg.as_bytes()).map_err(|e| AppError::Io(e.to_string()))?;
                    let msg_file_posix = msg_file.to_string_lossy().replace('\\', "/");
                    todo_lines.push(format!("exec git commit --amend -F '{}'", msg_file_posix));
                }
            }
            RebaseActionKind::Fixup => {
                todo_lines.push(format!("fixup {}", short_sha));
            }
            RebaseActionKind::Squash => {
                todo_lines.push(format!("fixup {}", short_sha));
                if let Some(msg) = &step.new_message {
                    let msg_file = temp_dir.path().join(format!("msg_{}.txt", idx));
                    fs::write(&msg_file, msg.as_bytes()).map_err(|e| AppError::Io(e.to_string()))?;
                    let msg_file_posix = msg_file.to_string_lossy().replace('\\', "/");
                    todo_lines.push(format!("exec git commit --amend -F '{}'", msg_file_posix));
                }
            }
            RebaseActionKind::Drop => {
                todo_lines.push(format!("drop {}", short_sha));
            }
        }
    }
    todo_lines.push(String::new());
    let todo_content = todo_lines.join("\n");

    let todo_file_path = temp_dir.path().join("git-rebase-todo-custom");
    fs::write(&todo_file_path, todo_content.as_bytes())
        .map_err(|e| AppError::Io(e.to_string()))?;

    let todo_path_posix = todo_file_path.to_string_lossy().replace('\\', "/");

    let mut cmd = Command::new("git");
    cmd.current_dir(repo_path.as_ref());
    let mut args = vec!["rebase", "-i"];
    if auto_stash {
        args.push("--autostash");
    }
    args.push(base_commit_id.trim());
    cmd.args(&args);
    cmd.env("GIT_SEQUENCE_EDITOR", format!("cp '{}'", todo_path_posix));
    cmd.env("GIT_EDITOR", "true");

    let output = cmd.output().map_err(|e| AppError::Io(e.to_string()))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr).trim().to_string();

    if output.status.success() {
        let fresh_repo = Repository::open(repo_path.as_ref())?;
        let new_head = fresh_repo.head()?.peel_to_commit()?.id();
        let undo_token = create_undo_token(&fresh_repo, &head_ref, Some(head_oid), new_head).ok();

        Ok(InteractiveRebaseResult {
            success: true,
            status: "Success".into(),
            head_commit_id: Some(new_head.to_string()),
            undo_token,
            output: combined,
        })
    } else {
        let is_conflict = combined.contains("CONFLICT")
            || combined.contains("could not apply")
            || combined.contains("Resolve all conflicts manually");

        let status = if is_conflict {
            "Conflict".into()
        } else {
            "Error".into()
        };

        Ok(InteractiveRebaseResult {
            success: false,
            status,
            head_commit_id: None,
            undo_token: None,
            output: combined,
        })
    }
}
