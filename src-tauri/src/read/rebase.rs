use crate::error::AppError;
use git2::{Oid, Repository, Sort};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct RebaseCommitItem {
    pub id: String,
    pub short_id: String,
    pub summary: String,
    pub message: String,
    pub author_name: String,
    pub author_email: String,
    pub timestamp: i64,
    pub parent_ids: Vec<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Type, PartialEq, Eq)]
pub enum RebaseActionKind {
    Pick,
    Reword,
    Squash,
    Fixup,
    Drop,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct RebasePlanStep {
    pub commit_id: String,
    pub action: RebaseActionKind,
    pub new_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct InteractiveRebaseResult {
    pub success: bool,
    pub status: String, // "Success" | "Conflict" | "Error"
    pub head_commit_id: Option<String>,
    pub undo_token: Option<String>,
    pub output: String,
}

pub fn get_rebase_commits<P: AsRef<Path>>(
    repo_path: P,
    base_commit_id: &str,
) -> Result<Vec<RebaseCommitItem>, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    get_rebase_commits_from_repo(&repo, base_commit_id)
}

pub fn get_rebase_commits_from_repo(
    repo: &Repository,
    base_commit_id: &str,
) -> Result<Vec<RebaseCommitItem>, AppError> {
    let base_oid = Oid::from_str(base_commit_id.trim())
        .map_err(|e| AppError::InvalidOperation(format!("Invalid base commit OID: {e}")))?;

    let head = repo.head()?;
    let head_commit = head.peel_to_commit()?;
    let head_oid = head_commit.id();

    if head_oid == base_oid {
        return Ok(Vec::new());
    }

    let mut revwalk = repo.revwalk()?;
    // Chronological order: oldest commits after base first, up to HEAD last
    revwalk.set_sorting(Sort::TOPOLOGICAL | Sort::TIME | Sort::REVERSE)?;
    revwalk.push(head_oid)?;
    revwalk.hide(base_oid)?;

    let mut items = Vec::new();
    for oid_res in revwalk {
        let oid = oid_res?;
        let commit = repo.find_commit(oid)?;
        let summary = commit.summary().ok().flatten().unwrap_or("").to_string();
        let message = commit.message().unwrap_or("").to_string();
        let author = commit.author();
        let author_name = author.name().unwrap_or("").to_string();
        let author_email = author.email().unwrap_or("").to_string();
        let timestamp = commit.time().seconds();
        let parent_ids = commit.parent_ids().map(|p| p.to_string()).collect();

        items.push(RebaseCommitItem {
            id: oid.to_string(),
            short_id: format!("{:.7}", oid.to_string()),
            summary,
            message,
            author_name,
            author_email,
            timestamp,
            parent_ids,
        });
    }

    Ok(items)
}
