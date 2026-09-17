use crate::error::AppError;
use crate::read::config::ConfigScope;
use git2::{Config, ConfigLevel, Repository};

pub fn write_git_config(
    repo_path: Option<&str>,
    scope: ConfigScope,
    key: &str,
    value: &str,
) -> Result<(), AppError> {
    let is_bool_key = key == "pull.rebase"
        || key == "commit.gpgsign"
        || key == "fetch.prune"
        || key == "rebase.autoStash";

    match scope {
        ConfigScope::Global => {
            let cfg = Config::open_default()?;
            let mut global_cfg = cfg.open_level(ConfigLevel::Global)?;
            if is_bool_key {
                if let Ok(b) = value.parse::<bool>() {
                    global_cfg.set_bool(key, b)?;
                } else if value.trim().is_empty() {
                    let _ = global_cfg.remove(key);
                } else {
                    global_cfg.set_str(key, value)?;
                }
            } else if value.trim().is_empty() {
                let _ = global_cfg.remove(key);
            } else {
                global_cfg.set_str(key, value.trim())?;
            }
        }
        ConfigScope::Local => {
            let path = repo_path.ok_or_else(|| {
                AppError::InvalidOperation("Repository path required for local config".to_string())
            })?;
            let repo = Repository::open(path)?;
            let mut cfg = repo.config()?;
            if is_bool_key {
                if let Ok(b) = value.parse::<bool>() {
                    cfg.set_bool(key, b)?;
                } else if value.trim().is_empty() {
                    let _ = cfg.remove(key);
                } else {
                    cfg.set_str(key, value)?;
                }
            } else if value.trim().is_empty() {
                let _ = cfg.remove(key);
            } else {
                cfg.set_str(key, value.trim())?;
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_write_and_read_local_config() {
        let temp = TempDir::new().unwrap();
        let _repo = git2::Repository::init(temp.path()).unwrap();
        let repo_path = temp.path().to_str().unwrap();

        write_git_config(
            Some(repo_path),
            ConfigScope::Local,
            "user.name",
            "Test Author",
        )
        .unwrap();
        write_git_config(
            Some(repo_path),
            ConfigScope::Local,
            "user.email",
            "author@test.com",
        )
        .unwrap();
        write_git_config(
            Some(repo_path),
            ConfigScope::Local,
            "init.defaultBranch",
            "main",
        )
        .unwrap();
        write_git_config(
            Some(repo_path),
            ConfigScope::Local,
            "pull.rebase",
            "true",
        )
        .unwrap();
        write_git_config(
            Some(repo_path),
            ConfigScope::Local,
            "commit.gpgsign",
            "true",
        )
        .unwrap();
        write_git_config(
            Some(repo_path),
            ConfigScope::Local,
            "user.signingkey",
            "TESTKEY123",
        )
        .unwrap();
        write_git_config(
            Some(repo_path),
            ConfigScope::Local,
            "fetch.prune",
            "true",
        )
        .unwrap();
        write_git_config(
            Some(repo_path),
            ConfigScope::Local,
            "rebase.autoStash",
            "true",
        )
        .unwrap();

        let cfg = crate::read::config::read_git_config(Some(repo_path)).unwrap();
        assert_eq!(cfg.user_name.as_deref(), Some("Test Author"));
        assert_eq!(cfg.user_name_source, Some(ConfigScope::Local));
        assert_eq!(cfg.user_email.as_deref(), Some("author@test.com"));
        assert_eq!(cfg.user_email_source, Some(ConfigScope::Local));
        assert_eq!(cfg.default_branch.as_deref(), Some("main"));
        assert_eq!(cfg.pull_rebase, Some(true));
        assert_eq!(cfg.gpg_sign, Some(true));
        assert_eq!(cfg.gpg_key.as_deref(), Some("TESTKEY123"));
        assert_eq!(cfg.fetch_prune, Some(true));
        assert_eq!(cfg.rebase_autostash, Some(true));
    }
}
