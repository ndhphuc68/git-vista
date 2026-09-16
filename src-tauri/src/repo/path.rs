use crate::error::AppError;
use cap_std::ambient_authority;
use cap_std::fs::{Dir, OpenOptions};
use git2::Repository;
use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};

fn invalid(message: &str) -> AppError {
    AppError::InvalidOperation(message.to_string())
}

fn open_worktree<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
) -> Result<(Dir, PathBuf), AppError> {
    let repo = Repository::open(repo_path.as_ref())?;
    let workdir = repo
        .workdir()
        .ok_or_else(|| invalid("Bare repository not supported"))?
        .canonicalize()?;
    let git_dir = repo.path().canonicalize()?;
    let relative = Path::new(file_path);
    if relative.as_os_str().is_empty() || relative.is_absolute() {
        return Err(invalid("Conflict path must be a non-empty relative path"));
    }

    let mut current = workdir.clone();
    for component in relative.components() {
        match component {
            Component::Normal(part) => {
                if part.to_string_lossy().eq_ignore_ascii_case(".git") {
                    return Err(invalid("Conflict path cannot access repository metadata"));
                }
                current.push(part);
                let metadata = std::fs::symlink_metadata(&current)?;
                if metadata.file_type().is_symlink() {
                    return Err(invalid("Conflict path cannot traverse symbolic links"));
                }
            }
            _ => return Err(invalid("Conflict path contains an unsafe component")),
        }
    }

    let resolved = current.canonicalize()?;
    if !resolved.starts_with(&workdir) || resolved.starts_with(&git_dir) || !resolved.is_file() {
        return Err(invalid("Conflict path is not a regular worktree file"));
    }

    // All actual I/O is relative to this already-opened capability. cap-std's
    // path resolution prevents a concurrent symlink swap from escaping it.
    let directory = Dir::open_ambient_dir(workdir, ambient_authority())?;
    Ok((directory, relative.to_path_buf()))
}

pub fn read_existing_worktree_file<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
) -> Result<String, AppError> {
    let (directory, relative) = open_worktree(repo_path, file_path)?;
    let mut file = directory.open(&relative)?;
    if !file.metadata()?.is_file() {
        return Err(invalid("Conflict path is not a regular worktree file"));
    }
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    Ok(content)
}

pub fn write_existing_worktree_file<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
    content: &str,
) -> Result<(), AppError> {
    let (directory, relative) = open_worktree(repo_path, file_path)?;
    let mut options = OpenOptions::new();
    options.write(true).truncate(true);
    let mut file = directory.open_with(&relative, &options)?;
    if !file.metadata()?.is_file() {
        return Err(invalid("Conflict path is not a regular worktree file"));
    }
    file.write_all(content.as_bytes())?;
    file.sync_all()?;
    Ok(())
}
