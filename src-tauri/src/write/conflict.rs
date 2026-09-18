use crate::error::AppError;
use std::path::Path;

pub fn resolve_conflict_file<P: AsRef<Path>>(
    repo_path: P,
    file_path: &str,
    resolved_content: &str,
    auto_stage: bool,
) -> Result<(), AppError> {
    crate::repo::path::write_existing_worktree_file(&repo_path, file_path, resolved_content)?;

    if auto_stage {
        let repo = git2::Repository::open(repo_path.as_ref())?;
        let mut index = repo.index()?;
        index.add_path(Path::new(file_path))?;
        index.write()?;
    }

    Ok(())
}
