use crate::error::AppError;
use crate::read::diff::{parse_diff_to_file_diff_result, FileDiffResult};
use git2::{Delta, DiffOptions, Oid, Repository};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
pub enum CompareMode {
    MergeBase,
    Direct,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CompareCommitItem {
    pub id: String,
    pub short_id: String,
    pub summary: String,
    pub author_name: String,
    pub author_email: String,
    pub timestamp: i64,
    pub parent_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CompareFileItem {
    pub path: String,
    pub old_path: Option<String>,
    pub status: String,
    pub additions: usize,
    pub deletions: usize,
    pub is_binary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CompareSummary {
    pub base_rev: String,
    pub target_rev: String,
    pub resolved_base_oid: String,
    pub resolved_target_oid: String,
    pub effective_base_oid: String,
    pub merge_base_oid: Option<String>,
    pub mode: CompareMode,
    pub ahead_count: usize,
    pub behind_count: usize,
    pub commits: Vec<CompareCommitItem>,
    pub files: Vec<CompareFileItem>,
    pub total_additions: usize,
    pub total_deletions: usize,
}

pub fn resolve_revision(repo: &Repository, rev: &str) -> Result<Oid, AppError> {
    let trimmed = rev.trim();
    if let Ok(oid) = Oid::from_str(trimmed) {
        if repo.find_commit(oid).is_ok() {
            return Ok(oid);
        }
    }
    if let Ok(reference) = repo.resolve_reference_from_short_name(trimmed) {
        if let Some(target) = reference.target() {
            return Ok(target);
        }
    }
    if let Ok(obj) = repo.revparse_single(trimmed) {
        if let Ok(commit) = obj.peel_to_commit() {
            return Ok(commit.id());
        }
        return Ok(obj.id());
    }
    Err(AppError::NotFound(format!("Revision not found: {}", rev)))
}

pub fn get_commits_in_range(
    repo: &Repository,
    base_oid: Oid,
    target_oid: Oid,
) -> Result<Vec<CompareCommitItem>, AppError> {
    if base_oid == target_oid {
        return Ok(Vec::new());
    }

    let mut revwalk = repo.revwalk()?;
    revwalk.set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)?;
    revwalk.push(target_oid)?;
    let _ = revwalk.hide(base_oid);

    let mut commits = Vec::new();
    for oid_res in revwalk {
        let oid = oid_res?;
        let commit = repo.find_commit(oid)?;
        let short_id = commit.as_object().short_id()?.as_str().unwrap_or("").to_string();
        let summary = commit.summary().ok().flatten().unwrap_or("").to_string();
        let author = commit.author();
        let author_name = author.name().unwrap_or("Unknown").to_string();
        let author_email = author.email().unwrap_or("").to_string();
        let timestamp = commit.time().seconds();
        let parent_ids = commit.parent_ids().map(|p| p.to_string()).collect();

        commits.push(CompareCommitItem {
            id: oid.to_string(),
            short_id,
            summary,
            author_name,
            author_email,
            timestamp,
            parent_ids,
        });
    }

    Ok(commits)
}

pub fn get_tree_diff_files(
    repo: &Repository,
    old_oid: Oid,
    new_oid: Oid,
) -> Result<(Vec<CompareFileItem>, usize, usize), AppError> {
    if old_oid == new_oid {
        return Ok((Vec::new(), 0, 0));
    }

    let old_commit = repo.find_commit(old_oid)?;
    let new_commit = repo.find_commit(new_oid)?;
    let old_tree = old_commit.tree()?;
    let new_tree = new_commit.tree()?;

    let mut diff = repo.diff_tree_to_tree(Some(&old_tree), Some(&new_tree), None)?;
    diff.find_similar(None)?;

    let mut files = Vec::new();
    let mut total_additions = 0;
    let mut total_deletions = 0;

    for (idx, delta) in diff.deltas().enumerate() {
        let path = delta
            .new_file()
            .path()
            .or_else(|| delta.old_file().path())
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let old_path = if delta.status() == Delta::Renamed {
            delta.old_file().path().map(|p| p.to_string_lossy().to_string())
        } else {
            None
        };

        let status = match delta.status() {
            Delta::Added => "added",
            Delta::Deleted => "deleted",
            Delta::Renamed => "renamed",
            Delta::Copied => "copied",
            Delta::Typechange => "typechange",
            _ => "modified",
        }
        .to_string();

        let is_binary = delta.flags().contains(git2::DiffFlags::BINARY);
        let mut additions = 0;
        let mut deletions = 0;

        if !is_binary {
            if let Ok(Some(patch)) = git2::Patch::from_diff(&diff, idx) {
                if let Ok((_, adds, dels)) = patch.line_stats() {
                    additions = adds;
                    deletions = dels;
                }
            }
        }

        total_additions += additions;
        total_deletions += deletions;

        files.push(CompareFileItem {
            path,
            old_path,
            status,
            additions,
            deletions,
            is_binary,
        });
    }

    Ok((files, total_additions, total_deletions))
}

pub fn get_compare_summary<P: AsRef<Path>>(
    repo_path: P,
    base_rev: &str,
    target_rev: &str,
    mode: CompareMode,
) -> Result<CompareSummary, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let base_oid = resolve_revision(&repo, base_rev)?;
    let target_oid = resolve_revision(&repo, target_rev)?;

    let (effective_base_oid, merge_base_oid) = match mode {
        CompareMode::MergeBase => {
            if let Ok(mb) = repo.merge_base(base_oid, target_oid) {
                (mb, Some(mb.to_string()))
            } else {
                (base_oid, None)
            }
        }
        CompareMode::Direct => (base_oid, None),
    };

    let commits = get_commits_in_range(&repo, effective_base_oid, target_oid)?;
    let (files, total_additions, total_deletions) =
        get_tree_diff_files(&repo, effective_base_oid, target_oid)?;

    let (ahead_count, behind_count) = match repo.graph_ahead_behind(target_oid, base_oid) {
        Ok((ahead, behind)) => (ahead, behind),
        Err(_) => (commits.len(), 0),
    };

    Ok(CompareSummary {
        base_rev: base_rev.to_string(),
        target_rev: target_rev.to_string(),
        resolved_base_oid: base_oid.to_string(),
        resolved_target_oid: target_oid.to_string(),
        effective_base_oid: effective_base_oid.to_string(),
        merge_base_oid,
        mode,
        ahead_count,
        behind_count,
        commits,
        files,
        total_additions,
        total_deletions,
    })
}

pub fn get_compare_file_diff<P: AsRef<Path>>(
    repo_path: P,
    base_rev: &str,
    target_rev: &str,
    file_path: &str,
    mode: CompareMode,
    ignore_ws: bool,
) -> Result<FileDiffResult, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let base_oid = resolve_revision(&repo, base_rev)?;
    let target_oid = resolve_revision(&repo, target_rev)?;

    let effective_base_oid = match mode {
        CompareMode::MergeBase => {
            if let Ok(mb) = repo.merge_base(base_oid, target_oid) {
                mb
            } else {
                base_oid
            }
        }
        CompareMode::Direct => base_oid,
    };

    let base_commit = repo.find_commit(effective_base_oid)?;
    let target_commit = repo.find_commit(target_oid)?;
    let base_tree = base_commit.tree()?;
    let target_tree = target_commit.tree()?;

    let mut opts = DiffOptions::new();
    opts.pathspec(file_path);
    if ignore_ws {
        opts.ignore_whitespace(true);
        opts.ignore_whitespace_eol(true);
    }

    let diff = repo.diff_tree_to_tree(Some(&base_tree), Some(&target_tree), Some(&mut opts))?;
    parse_diff_to_file_diff_result(&diff, file_path)
}
