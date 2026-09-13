use crate::error::AppError;
use git2::build::CheckoutBuilder;
use git2::{ApplyLocation, Diff, IndexAddOption, Repository};
use std::collections::HashSet;
use std::path::Path;

/// Stage a specific file (new, modified, or deleted).
pub fn stage_file<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let workdir = repo
        .workdir()
        .ok_or_else(|| AppError::InvalidOperation("Bare repository not supported".to_string()))?;

    let normalized_path = file_path.replace('\\', "/");
    let full_path = workdir.join(&normalized_path);

    let mut index = repo.index()?;
    let path = Path::new(&normalized_path);

    if std::fs::symlink_metadata(&full_path).is_ok() {
        index.add_path(path)?;
    } else {
        index.remove_path(path)?;
    }

    index.write()?;
    Ok(())
}

/// Unstage a specific file.
pub fn unstage_file<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let normalized_path = file_path.replace('\\', "/");

    let head_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());

    if let Some(commit) = head_commit {
        repo.reset_default(Some(commit.as_object()), &[&normalized_path])?;
    } else {
        let mut index = repo.index()?;
        index.remove_path(Path::new(&normalized_path))?;
        index.write()?;
    }

    Ok(())
}

/// Stage all changes (new, modified, deleted).
pub fn stage_all<P: AsRef<Path>>(repo_path: P) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let workdir = repo
        .workdir()
        .ok_or_else(|| AppError::InvalidOperation("Bare repository not supported".to_string()))?;

    let mut index = repo.index()?;

    // Remove any tracked entries that have been deleted from disk
    let mut to_remove = Vec::new();
    for entry in index.iter() {
        if let Ok(path_str) = std::str::from_utf8(&entry.path) {
            let full_path = workdir.join(path_str);
            if std::fs::symlink_metadata(&full_path).is_err() {
                to_remove.push(path_str.to_string());
            }
        }
    }
    for path in to_remove {
        index.remove_path(Path::new(&path))?;
    }

    // Add new/untracked files and modified files
    index.add_all(["*"], IndexAddOption::DEFAULT, None)?;
    index.write()?;

    Ok(())
}

/// Unstage all staged changes.
pub fn unstage_all<P: AsRef<Path>>(repo_path: P) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let head_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());

    if let Some(commit) = head_commit {
        repo.reset(commit.as_object(), git2::ResetType::Mixed, None)?;
    } else {
        let mut index = repo.index()?;
        index.clear()?;
        index.write()?;
    }

    Ok(())
}

/// Discard working tree changes for a specific file, restoring from HEAD.
pub fn discard_file_changes<P: AsRef<Path>>(repo_path: P, file_path: &str) -> Result<(), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let normalized_path = file_path.replace('\\', "/");

    let mut checkout = CheckoutBuilder::new();
    checkout.path(&normalized_path);
    checkout.force();

    repo.checkout_head(Some(&mut checkout))?;
    Ok(())
}

fn append_patch_line(patch_lines: &mut String, prefix: char, content: &str) {
    patch_lines.push(prefix);
    patch_lines.push_str(content);
    if !content.ends_with('\n') {
        patch_lines.push('\n');
        patch_lines.push_str("\\ No newline at end of file\n");
    }
}

/// Stage a specific hunk of a file (forward if is_staged == false, reverse if is_staged == true).
pub fn stage_hunk<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
    hunk_index: u32,
    is_staged: bool,
) -> Result<(), AppError> {
    let repo_path_ref = repo_path.as_ref();
    let file_diff =
        crate::read::status::get_working_file_diff(repo_path_ref, file_path, is_staged)?;
    let hunk = file_diff
        .hunks
        .get(hunk_index as usize)
        .ok_or_else(|| AppError::InvalidOperation(format!("Hunk index {} out of range", hunk_index)))?;

    let all_line_indices: Vec<u32> = (0..hunk.lines.len() as u32).collect();
    stage_lines(
        repo_path_ref,
        file_path,
        hunk_index,
        &all_line_indices,
        is_staged,
    )
}

/// Stage specific lines within a hunk of a file.
pub fn stage_lines<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
    hunk_index: u32,
    line_indices: &[u32],
    is_staged: bool,
) -> Result<(), AppError> {
    let repo_path_ref = repo_path.as_ref();
    let repo = Repository::open(repo_path_ref)?;
    let file_diff =
        crate::read::status::get_working_file_diff(repo_path_ref, file_path, is_staged)?;
    let hunk = file_diff
        .hunks
        .get(hunk_index as usize)
        .ok_or_else(|| AppError::InvalidOperation(format!("Hunk index {} out of range", hunk_index)))?;

    let selected_set: HashSet<u32> = line_indices.iter().copied().collect();
    let normalized_path = file_path.replace('\\', "/");

    let mut patch_lines = String::new();
    let mut patch_old_lines: u32 = 0;
    let mut patch_new_lines: u32 = 0;
    let mut has_changes = false;

    if !is_staged {
        // Forward staging: from workdir to index
        for (idx, line) in hunk.lines.iter().enumerate() {
            let is_selected = selected_set.contains(&(idx as u32));
            match line.line_type.as_str() {
                "context" => {
                    append_patch_line(&mut patch_lines, ' ', &line.content);
                    patch_old_lines += 1;
                    patch_new_lines += 1;
                }
                "add" => {
                    if is_selected {
                        append_patch_line(&mut patch_lines, '+', &line.content);
                        patch_new_lines += 1;
                        has_changes = true;
                    }
                }
                "delete" => {
                    if is_selected {
                        append_patch_line(&mut patch_lines, '-', &line.content);
                        patch_old_lines += 1;
                        has_changes = true;
                    } else {
                        // Unselected delete remains in index as context
                        append_patch_line(&mut patch_lines, ' ', &line.content);
                        patch_old_lines += 1;
                        patch_new_lines += 1;
                    }
                }
                _ => {}
            }
        }
    } else {
        // Reverse staging (unstaging): from index to HEAD
        for (idx, line) in hunk.lines.iter().enumerate() {
            let is_selected = selected_set.contains(&(idx as u32));
            match line.line_type.as_str() {
                "context" => {
                    append_patch_line(&mut patch_lines, ' ', &line.content);
                    patch_old_lines += 1;
                    patch_new_lines += 1;
                }
                "add" => {
                    if is_selected {
                        // Selected add will be reverted (deleted from index)
                        append_patch_line(&mut patch_lines, '-', &line.content);
                        patch_old_lines += 1;
                        has_changes = true;
                    } else {
                        // Unselected add remains in index as context
                        append_patch_line(&mut patch_lines, ' ', &line.content);
                        patch_old_lines += 1;
                        patch_new_lines += 1;
                    }
                }
                "delete" => {
                    if is_selected {
                        // Selected delete will be reverted (restored to index)
                        append_patch_line(&mut patch_lines, '+', &line.content);
                        patch_new_lines += 1;
                        has_changes = true;
                    }
                }
                _ => {}
            }
        }
    }

    if !has_changes {
        return Ok(());
    }

    let (patch_old_start, patch_new_start) = if !is_staged {
        (hunk.old_start, hunk.old_start)
    } else {
        (hunk.new_start, hunk.new_start)
    };

    let patch_header = format!(
        "diff --git a/{path} b/{path}\n--- a/{path}\n+++ b/{path}\n@@ -{},{} +{},{} @@\n",
        patch_old_start,
        patch_old_lines,
        patch_new_start,
        patch_new_lines,
        path = normalized_path
    );

    let full_patch = format!("{}{}", patch_header, patch_lines);

    let diff = Diff::from_buffer(full_patch.as_bytes())?;
    repo.apply(&diff, ApplyLocation::Index, None)?;

    let mut index = repo.index()?;
    index.write()?;

    Ok(())
}

