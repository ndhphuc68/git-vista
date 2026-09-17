use crate::error::AppError;
use git2::{Config, ConfigLevel, Repository};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum ConfigScope {
    Global,
    Local,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GitConfigDto {
    pub user_name: Option<String>,
    pub user_name_source: Option<ConfigScope>,
    pub user_email: Option<String>,
    pub user_email_source: Option<ConfigScope>,
    pub default_branch: Option<String>,
    pub pull_rebase: Option<bool>,
    pub gpg_sign: Option<bool>,
    pub gpg_key: Option<String>,
    pub fetch_prune: Option<bool>,
    pub rebase_autostash: Option<bool>,
}

fn get_entry_info(config: &Config, key: &str) -> (Option<String>, Option<ConfigScope>) {
    if let Ok(entry) = config.get_entry(key) {
        if let Ok(val) = entry.value() {
            let scope = if entry.level() == ConfigLevel::Local {
                ConfigScope::Local
            } else {
                ConfigScope::Global
            };
            return (Some(val.to_string()), Some(scope));
        }
    }
    (None, None)
}

pub fn read_git_config(repo_path: Option<&str>) -> Result<GitConfigDto, AppError> {
    let config = if let Some(path) = repo_path {
        if Path::new(path).exists() {
            if let Ok(repo) = Repository::open(path) {
                repo.config().or_else(|_| Config::open_default())?
            } else {
                Config::open_default()?
            }
        } else {
            Config::open_default()?
        }
    } else {
        Config::open_default()?
    };

    let (user_name, user_name_source) = get_entry_info(&config, "user.name");
    let (user_email, user_email_source) = get_entry_info(&config, "user.email");
    let default_branch = config
        .get_string("init.defaultBranch")
        .ok()
        .or_else(|| Some("main".to_string()));
    let pull_rebase = config.get_bool("pull.rebase").ok();
    let gpg_sign = config.get_bool("commit.gpgsign").ok();
    let gpg_key = config.get_string("user.signingkey").ok();
    let fetch_prune = config.get_bool("fetch.prune").ok();
    let rebase_autostash = config.get_bool("rebase.autoStash").ok();

    Ok(GitConfigDto {
        user_name,
        user_name_source,
        user_email,
        user_email_source,
        default_branch,
        pull_rebase,
        gpg_sign,
        gpg_key,
        fetch_prune,
        rebase_autostash,
    })
}
