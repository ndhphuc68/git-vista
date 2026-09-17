use crate::error::AppError;
use git2::Repository;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TagItem {
    pub name: String,
    pub target_commit_id: String,
    pub short_commit_id: String,
    pub commit_summary: String,
    pub is_annotated: bool,
    pub message: Option<String>,
    pub tagger_name: Option<String>,
    pub tagger_email: Option<String>,
    pub timestamp_sec: Option<f64>,
}

pub fn list_repo_tags<P: AsRef<Path>>(repo_path: P) -> Result<Vec<TagItem>, AppError> {
    let repo = Repository::open(repo_path.as_ref())?;

    if repo.is_empty()? {
        return Ok(Vec::new());
    }

    let mut tag_items = Vec::new();
    let references = repo.references_glob("refs/tags/*")?;

    for reference in references.flatten() {
        let name = reference.shorthand().unwrap_or("").to_string();

        let commit = match reference.peel_to_commit() {
            Ok(c) => c,
            Err(_) => continue,
        };

        let commit_summary = commit
            .summary()
            .ok()
            .flatten()
            .unwrap_or("")
            .to_string();

        let (is_annotated, message, tagger_name, tagger_email, timestamp_sec) =
            if let Some(target_oid) = reference.target() {
                if let Ok(tag) = repo.find_tag(target_oid) {
                    let tagger = tag.tagger();
                    let tagger_name = tagger.as_ref().and_then(|t| t.name().ok().map(|s| s.to_string()));
                    let tagger_email = tagger.as_ref().and_then(|t| t.email().ok().map(|s| s.to_string()));
                    let timestamp_sec = tagger
                        .as_ref()
                        .map(|t| t.when().seconds() as f64)
                        .or_else(|| Some(commit.time().seconds() as f64));
                    let message = tag.message().ok().flatten().map(|m| m.to_string());
                    (true, message, tagger_name, tagger_email, timestamp_sec)
                } else {
                    (false, None, None, None, Some(commit.time().seconds() as f64))
                }
            } else {
                (false, None, None, None, Some(commit.time().seconds() as f64))
            };

        let target_commit_id = commit.id().to_string();
        let short_commit_id = target_commit_id.chars().take(7).collect();

        tag_items.push(TagItem {
            name,
            target_commit_id,
            short_commit_id,
            commit_summary,
            is_annotated,
            message,
            tagger_name,
            tagger_email,
            timestamp_sec,
        });
    }

    tag_items.sort_by(|a, b| {
        b.timestamp_sec
            .partial_cmp(&a.timestamp_sec)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.name.cmp(&b.name))
    });

    Ok(tag_items)
}
