//! Recoverable, worktree-only discard. Backups survive application restarts.
use crate::error::AppError;
use git2::{build::CheckoutBuilder, Repository};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::Write,
    path::{Component, Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Serialize, Deserialize, PartialEq, Eq)]
struct Snapshot {
    bytes: Vec<u8>,
    mode: u32,
}
#[derive(Serialize, Deserialize)]
struct Record {
    repository: PathBuf,
    path: String,
    before: Option<Snapshot>,
    after: Option<Snapshot>,
}
fn invalid(message: &str) -> AppError {
    AppError::InvalidOperation(message.into())
}
fn unsafe_metadata(meta: &fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        if meta.file_attributes() & 0x400 != 0 {
            return true;
        }
    }
    meta.file_type().is_symlink()
}
fn safe_path(root: &Path, relative: &str) -> Result<PathBuf, AppError> {
    if relative.is_empty()
        || relative.contains('\\')
        || relative.contains(':')
        || relative.split('/').any(|s| {
            s.is_empty()
                || s == "."
                || s == ".."
                || s.eq_ignore_ascii_case(".git")
                || s.ends_with('.')
                || s.ends_with(' ')
        })
        || Path::new(relative)
            .components()
            .any(|c| !matches!(c, Component::Normal(_)))
    {
        return Err(invalid("Unsafe discard path"));
    }
    let mut full = root.to_path_buf();
    for part in relative.split('/') {
        full.push(part);
        match fs::symlink_metadata(&full) {
            Ok(meta) if unsafe_metadata(&meta) => {
                return Err(invalid(
                    "Discard does not follow symbolic links or junctions",
                ))
            }
            Ok(_) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => return Err(e.into()),
        }
    }
    Ok(full)
}
fn snapshot(path: &Path) -> Result<Option<Snapshot>, AppError> {
    let meta = match fs::symlink_metadata(path) {
        Ok(m) => m,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e.into()),
    };
    if unsafe_metadata(&meta) || !meta.is_file() {
        return Err(invalid("Discard supports only regular files"));
    }
    #[cfg(unix)]
    let mode = {
        use std::os::unix::fs::PermissionsExt;
        meta.permissions().mode()
    };
    #[cfg(not(unix))]
    let mode = if meta.permissions().readonly() { 1 } else { 0 };
    Ok(Some(Snapshot {
        bytes: fs::read(path)?,
        mode,
    }))
}
fn write_snapshot(
    path: &Path,
    expected: &Option<Snapshot>,
    state: &Option<Snapshot>,
) -> Result<(), AppError> {
    if snapshot(path)? != *expected {
        return Err(invalid("File changed during discard operation"));
    }
    match state {
        None => {
            if path.exists() {
                fs::remove_file(path)?;
            }
        }
        Some(state) => {
            // The parent may have been removed along with the file; recreate it
            // before staging the replacement beside its final location.
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            static NEXT: AtomicU64 = AtomicU64::new(0);
            let temporary = path.with_file_name(format!(
                ".visual-git-{}-{}-{}.tmp",
                std::process::id(),
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .map_err(|e| invalid(&e.to_string()))?
                    .as_nanos(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            let mut file = fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&temporary)?;
            let result = (|| -> Result<(), AppError> {
                file.write_all(&state.bytes)?;
                file.sync_all()?;
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    file.set_permissions(fs::Permissions::from_mode(state.mode))?;
                }
                #[cfg(not(unix))]
                {
                    let mut permissions = file.metadata()?.permissions();
                    permissions.set_readonly(state.mode != 0);
                    file.set_permissions(permissions)?;
                }
                if snapshot(path)? != *expected {
                    return Err(invalid("File changed during discard operation"));
                }
                drop(file);
                if expected.is_none() {
                    // A hard link publishes a new file without replacing a concurrent creation.
                    fs::hard_link(&temporary, path)?;
                    fs::remove_file(&temporary)?;
                } else {
                    fs::rename(&temporary, path)?;
                }
                Ok(())
            })();
            if result.is_err() {
                let _ = fs::remove_file(&temporary);
            }
            result?;
        }
    }
    Ok(())
}
struct Lock {
    _file: fs::File,
}
fn storage(repo: &Repository) -> Result<(PathBuf, Lock), AppError> {
    let dir = repo.path().canonicalize()?.join("visual-git-discard");
    match fs::create_dir(&dir) {
        Ok(()) => {}
        Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {}
        Err(e) => return Err(e.into()),
    }
    let meta = fs::symlink_metadata(&dir)?;
    if unsafe_metadata(&meta) || !meta.is_dir() {
        return Err(invalid("Unsafe discard backup directory"));
    }
    let lock = safe_path(&dir, "operation.lock")?;
    let file = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(false)
        .open(&lock)?;
    file.try_lock()
        .map_err(|e| invalid(&format!("Discard backup is busy: {e}")))?;
    Ok((dir, Lock { _file: file }))
}
fn persist(path: &Path, record: &Record) -> Result<(), AppError> {
    let bytes = serde_json::to_vec(record).map_err(|e| invalid(&e.to_string()))?;
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    file.write_all(&bytes)?;
    file.sync_all()?;
    Ok(())
}
pub fn discard_with_backup(repo_path: &str, file_path: &str) -> Result<String, AppError> {
    let repo = Repository::open(repo_path)?;
    let workdir = repo
        .workdir()
        .ok_or_else(|| invalid("Bare repository not supported"))?
        .canonicalize()?;
    let path = safe_path(&workdir, file_path)?;
    let before = snapshot(&path)?;
    let mut index = repo.index()?;
    if (1..=3).any(|stage| index.get_path(Path::new(file_path), stage).is_some()) {
        return Err(invalid("Resolve conflicts before discarding"));
    }
    let entry = index.get_path(Path::new(file_path), 0);
    if entry
        .as_ref()
        .is_some_and(|e| e.mode != 0o100644 && e.mode != 0o100755)
    {
        return Err(invalid("Discard supports only regular index files"));
    }
    if before.is_none() && entry.is_none() {
        return Err(invalid("File has no changes to discard"));
    }
    let (storage, _lock) = storage(&repo)?;
    static NEXT: AtomicU64 = AtomicU64::new(0);
    let token = format!(
        "{:x}-{:x}-{:x}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| invalid(&e.to_string()))?
            .as_nanos(),
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    );
    let backup = storage.join(&token);
    fs::create_dir(&backup)?;
    // Persist the original bytes before checkout or any destructive worktree operation.
    let mut record = Record {
        repository: workdir.clone(),
        path: file_path.into(),
        before,
        after: None,
    };
    persist(&backup.join("original.json"), &record)?;
    if entry.is_some() {
        let prepared = backup.join("prepared");
        fs::create_dir(&prepared)?;
        let mut checkout = CheckoutBuilder::new();
        checkout
            .force()
            .update_index(false)
            .disable_pathspec_match(true)
            .path(file_path)
            .target_dir(&prepared);
        repo.checkout_index(Some(&mut index), Some(&mut checkout))?;
        record.after = snapshot(&safe_path(&prepared, file_path)?)?;
        if record.after.is_none() {
            return Err(invalid("Could not prepare index file for discard"));
        }
    }
    persist(&backup.join("record.json"), &record)?;
    if snapshot(&safe_path(&workdir, file_path)?)? != record.before {
        return Err(invalid("File changed while preparing discard"));
    }
    write_snapshot(&path, &record.before, &record.after)?;
    // Only completed discards can be restored through their receipt.
    let marker = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(backup.join("ready"))?;
    marker.sync_all()?;
    Ok(token)
}
pub fn restore_discard(repo_path: &str, token: &str) -> Result<(), AppError> {
    if token.is_empty() || !token.bytes().all(|b| b.is_ascii_hexdigit() || b == b'-') {
        return Err(invalid("Invalid discard backup token"));
    }
    let repo = Repository::open(repo_path)?;
    let workdir = repo
        .workdir()
        .ok_or_else(|| invalid("Bare repository not supported"))?
        .canonicalize()?;
    let (storage, _lock) = storage(&repo)?;
    let backup = safe_path(&storage, token)?;
    let record_path = safe_path(&backup, "record.json")?;
    let bytes = snapshot(&record_path)?
        .ok_or_else(|| invalid("Discard backup not found"))?
        .bytes;
    let record: Record = serde_json::from_slice(&bytes).map_err(|e| invalid(&e.to_string()))?;
    if record.repository != workdir {
        return Err(invalid("Discard backup belongs to another repository"));
    }
    let ready = safe_path(&backup, "ready")?;
    if snapshot(&ready)?.is_none() {
        return Err(invalid("Discard backup already restored or incomplete"));
    }
    let path = safe_path(&workdir, &record.path)?;
    if snapshot(&path)? != record.after {
        return Err(invalid(
            "File changed since discard; restore would overwrite newer changes",
        ));
    }
    write_snapshot(&path, &record.after, &record.before)?;
    fs::remove_file(ready)?;
    Ok(())
}
#[cfg(test)]
#[path = "discard_tests.rs"]
mod tests;
