use crate::error::AppError;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct ConflictHunk {
    pub id: String,
    pub is_conflict: bool,
    pub content: Option<String>,
    pub ours: Option<String>,
    pub theirs: Option<String>,
    pub base: Option<String>,
    pub ours_label: Option<String>,
    pub theirs_label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq, Eq)]
pub struct ConflictFileData {
    pub file_path: String,
    pub total_conflicts: usize,
    pub hunks: Vec<ConflictHunk>,
}

pub fn get_conflict_file_data<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
) -> Result<ConflictFileData, AppError> {
    let full_path = repo_path.as_ref().join(file_path);
    let raw = fs::read_to_string(&full_path)?;

    let mut hunks = Vec::new();
    let mut current_normal = Vec::new();
    let mut in_ours = false;
    let mut in_base = false;
    let mut in_theirs = false;

    let mut current_ours = Vec::new();
    let mut current_base = Vec::new();
    let mut current_theirs = Vec::new();
    let mut ours_label = None;

    let mut hunk_counter = 0;
    let mut conflict_counter = 0;

    for line in raw.lines() {
        if line.starts_with("<<<<<<<") {
            // Đẩy normal lines trước đó nếu có
            if !current_normal.is_empty() {
                hunks.push(ConflictHunk {
                    id: format!("hunk_{}", hunk_counter),
                    is_conflict: false,
                    content: Some(current_normal.join("\n") + "\n"),
                    ours: None,
                    theirs: None,
                    base: None,
                    ours_label: None,
                    theirs_label: None,
                });
                hunk_counter += 1;
                current_normal.clear();
            }
            in_ours = true;
            ours_label = Some(line.trim_start_matches('<').trim().to_string());
        } else if line.starts_with("|||||||") && in_ours {
            in_ours = false;
            in_base = true;
        } else if line.starts_with("=======") && (in_ours || in_base) {
            in_ours = false;
            in_base = false;
            in_theirs = true;
        } else if line.starts_with(">>>>>>>") && in_theirs {
            in_theirs = false;
            let theirs_label = Some(line.trim_start_matches('>').trim().to_string());

            hunks.push(ConflictHunk {
                id: format!("hunk_{}", hunk_counter),
                is_conflict: true,
                content: None,
                ours: Some(if current_ours.is_empty() { String::new() } else { current_ours.join("\n") + "\n" }),
                theirs: Some(if current_theirs.is_empty() { String::new() } else { current_theirs.join("\n") + "\n" }),
                base: if current_base.is_empty() { None } else { Some(current_base.join("\n") + "\n") },
                ours_label: ours_label.take(),
                theirs_label,
            });
            hunk_counter += 1;
            conflict_counter += 1;

            current_ours.clear();
            current_base.clear();
            current_theirs.clear();
        } else if in_ours {
            current_ours.push(line);
        } else if in_base {
            current_base.push(line);
        } else if in_theirs {
            current_theirs.push(line);
        } else {
            current_normal.push(line);
        }
    }

    if !current_normal.is_empty() {
        hunks.push(ConflictHunk {
            id: format!("hunk_{}", hunk_counter),
            is_conflict: false,
            content: Some(current_normal.join("\n") + if raw.ends_with('\n') { "\n" } else { "" }),
            ours: None,
            theirs: None,
            base: None,
            ours_label: None,
            theirs_label: None,
        });
    }

    Ok(ConflictFileData {
        file_path: file_path.to_string(),
        total_conflicts: conflict_counter,
        hunks,
    })
}
