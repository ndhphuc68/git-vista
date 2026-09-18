use crate::error::AppError;
use git2::build::CheckoutBuilder;
use git2::{Oid, Repository};
use std::path::Path;
use std::process::Command;

pub fn create_tag<P: AsRef<Path>>(
    repo_path: P,
    name: &str,
    target_commit_id: &str,
    message: Option<&str>,
) -> Result<(), AppError> {
    let trimmed_name = name.trim();
    if trimmed_name.is_empty() {
        return Err(AppError::InvalidOperation(
            "Tag name cannot be empty".to_string(),
        ));
    }
    if trimmed_name.starts_with('-') {
        return Err(AppError::InvalidOperation(
            "Tag name cannot start with '-'".to_string(),
        ));
    }
    let ref_name = format!("refs/tags/{}", trimmed_name);
    if !git2::Reference::is_valid_name(&ref_name) {
        return Err(AppError::InvalidOperation(format!(
            "Invalid tag name '{}'",
            trimmed_name
        )));
    }

    let repo = Repository::open(repo_path.as_ref())?;
    let oid = Oid::from_str(target_commit_id.trim())
        .map_err(|e| AppError::Git(format!("Invalid commit OID '{}': {}", target_commit_id, e)))?;
    let target_obj = repo.find_object(oid, Some(git2::ObjectType::Commit))?;

    if let Some(msg) = message.filter(|m| !m.trim().is_empty()) {
        let sig = repo
            .signature()
            .or_else(|_| git2::Signature::now("Visual Git Client", "app@visualgit.local"))
            .map_err(|e| AppError::Git(format!("Failed to determine tagger signature: {}", e)))?;
        repo.tag(trimmed_name, &target_obj, &sig, msg, false)?;
    } else {
        repo.tag_lightweight(trimmed_name, &target_obj, false)?;
    }

    Ok(())
}

pub fn delete_tag<P: AsRef<Path>>(
    repo_path: P,
    name: &str,
    delete_remote: bool,
) -> Result<(), AppError> {
    let trimmed_name = name.trim();
    if trimmed_name.is_empty() {
        return Err(AppError::InvalidOperation(
            "Tag name cannot be empty".to_string(),
        ));
    }

    let repo = Repository::open(repo_path.as_ref())?;
    repo.tag_delete(trimmed_name)?;

    if delete_remote {
        let path = repo_path.as_ref();
        let output = Command::new("git")
            .current_dir(path)
            .args([
                "push",
                "origin",
                "--delete",
                &format!("refs/tags/{}", trimmed_name),
            ])
            .output();

        if let Ok(out) = output {
            if !out.status.success() {
                let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                return Err(AppError::CommandFailed {
                    code: out.status.code().unwrap_or(-1),
                    stderr,
                });
            }
        } else if let Err(e) = output {
            return Err(AppError::Io(e.to_string()));
        }
    }

    Ok(())
}

pub fn checkout_tag<P: AsRef<Path>>(repo_path: P, name: &str) -> Result<(), AppError> {
    let trimmed_name = name.trim();
    let repo = Repository::open(repo_path.as_ref())?;

    // Check statuses for uncommitted conflicts or unsafe changes
    let mut status_opts = git2::StatusOptions::new();
    status_opts.include_untracked(false);
    let statuses = repo.statuses(Some(&mut status_opts))?;
    let has_conflicts = statuses.iter().any(|s| s.status().is_conflicted());
    if has_conflicts {
        return Err(AppError::InvalidOperation(
            "Cannot checkout tag while there are unresolved merge conflicts".to_string(),
        ));
    }

    let ref_name = format!("refs/tags/{}", trimmed_name);
    let reference = repo.find_reference(&ref_name)?;
    let commit = reference.peel_to_commit()?;

    let mut checkout_opts = CheckoutBuilder::new();
    checkout_opts.safe();
    repo.set_head_detached(commit.id())?;
    repo.checkout_head(Some(&mut checkout_opts))?;

    Ok(())
}

pub fn push_tag<P: AsRef<Path>>(
    repo_path: P,
    name: &str,
    remote_name: Option<&str>,
) -> Result<(), AppError> {
    let trimmed_name = name.trim();
    let remote = remote_name.unwrap_or("origin");
    let path = repo_path.as_ref();

    let output = Command::new("git")
        .current_dir(path)
        .args(["push", remote, &format!("refs/tags/{}", trimmed_name)])
        .output();

    match output {
        Ok(out) => {
            if out.status.success() {
                Ok(())
            } else {
                let stderr = String::from_utf8_lossy(&out.stderr).to_string();
                Err(AppError::CommandFailed {
                    code: out.status.code().unwrap_or(-1),
                    stderr,
                })
            }
        }
        Err(e) => Err(AppError::Io(e.to_string())),
    }
}
