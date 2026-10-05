use super::editor::to_editor_path;
use crate::error::AppError;
use std::ffi::OsStr;
use std::path::{Path, PathBuf};
use std::process::Command;

/// How to spawn the terminal chosen in settings.
#[derive(Debug, PartialEq, Eq)]
pub struct TerminalLaunch {
    pub program: PathBuf,
    pub args: Vec<String>,
    pub current_dir: Option<String>,
    /// Console programs need a window of their own; GUI launchers (wt, git-bash) do not.
    pub new_console: bool,
}

/// Maps the terminal chosen in settings to the program, arguments and working
/// directory to spawn. Windows only; the path is passed as an argument, never
/// through a shell.
pub fn resolve_terminal_launch(
    terminal: &str,
    path: &str,
    is_windows: bool,
    git_bash: Option<&Path>,
) -> Result<TerminalLaunch, AppError> {
    if !is_windows {
        return Err(AppError::InvalidOperation(
            "Opening a terminal is only supported on Windows".to_string(),
        ));
    }
    let launch = match terminal {
        "wt" => TerminalLaunch {
            program: PathBuf::from("wt.exe"),
            args: vec!["-d".to_string(), path.to_string()],
            current_dir: None,
            new_console: false,
        },
        "powershell" => TerminalLaunch {
            program: PathBuf::from("powershell.exe"),
            args: vec!["-NoExit".to_string()],
            current_dir: Some(path.to_string()),
            new_console: true,
        },
        "cmd" => TerminalLaunch {
            program: PathBuf::from("cmd.exe"),
            args: vec!["/K".to_string()],
            current_dir: Some(path.to_string()),
            new_console: true,
        },
        "bash" => {
            // Not `bash.exe`: on Windows that is often WSL, not Git Bash.
            let program = git_bash.ok_or_else(|| AppError::NotFound("git-bash.exe".to_string()))?;
            TerminalLaunch {
                program: program.to_path_buf(),
                args: vec![format!("--cd={path}")],
                current_dir: None,
                new_console: false,
            }
        }
        _ => {
            return Err(AppError::InvalidOperation(format!(
                "Unknown terminal: {terminal}"
            )))
        }
    };
    Ok(launch)
}

/// Finds Git for Windows' `git-bash.exe` from the first `git.exe` on `PATH`,
/// which lives in `<root>\cmd`, `<root>\bin` or `<root>\mingw64\bin`.
pub fn find_git_bash(path_var: &OsStr, is_file: impl Fn(&Path) -> bool) -> Option<PathBuf> {
    std::env::split_paths(path_var)
        .filter(|dir| is_file(&dir.join("git.exe")))
        .find_map(|dir| {
            dir.ancestors()
                .skip(1)
                .take(2)
                .map(|root| root.join("git-bash.exe"))
                .find(|candidate| is_file(candidate))
        })
}

fn spawn_terminal(launch: &TerminalLaunch) -> Result<(), AppError> {
    let mut cmd = Command::new(&launch.program);
    cmd.args(&launch.args);
    if let Some(dir) = &launch.current_dir {
        cmd.current_dir(dir);
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NEW_CONSOLE: u32 = 0x0000_0010;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(if launch.new_console {
            CREATE_NEW_CONSOLE
        } else {
            CREATE_NO_WINDOW
        });
    }

    match cmd.spawn() {
        Ok(_) => Ok(()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
            Err(AppError::NotFound(launch.program.display().to_string()))
        }
        Err(err) => Err(AppError::Io(err.to_string())),
    }
}

/// Opens the repository folder in the user's terminal of choice.
#[tauri::command]
#[specta::specta]
pub fn open_in_terminal(repo_path: String, terminal: String) -> Result<(), AppError> {
    let git_bash = std::env::var_os("PATH").and_then(|path| find_git_bash(&path, Path::is_file));
    let launch = resolve_terminal_launch(
        &terminal,
        &to_editor_path(&repo_path),
        cfg!(windows),
        git_bash.as_deref(),
    )?;
    spawn_terminal(&launch)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;
    use std::ffi::OsString;

    fn path_var(dirs: &[&str]) -> OsString {
        std::env::join_paths(dirs.iter().map(PathBuf::from)).unwrap()
    }

    #[test]
    fn launches_windows_terminal_in_the_repo() {
        let launch = resolve_terminal_launch("wt", r"D:\repo", true, None).unwrap();
        assert_eq!(launch.program, PathBuf::from("wt.exe"));
        assert_eq!(launch.args, vec!["-d".to_string(), r"D:\repo".to_string()]);
        assert!(!launch.new_console);
    }

    #[test]
    fn launches_console_shells_with_the_repo_as_working_dir() {
        let ps = resolve_terminal_launch("powershell", r"D:\repo", true, None).unwrap();
        assert_eq!(ps.program, PathBuf::from("powershell.exe"));
        assert_eq!(ps.args, vec!["-NoExit".to_string()]);
        assert_eq!(ps.current_dir.as_deref(), Some(r"D:\repo"));
        assert!(ps.new_console);

        let cmd = resolve_terminal_launch("cmd", r"D:\repo", true, None).unwrap();
        assert_eq!(cmd.program, PathBuf::from("cmd.exe"));
        assert_eq!(cmd.args, vec!["/K".to_string()]);
        assert_eq!(cmd.current_dir.as_deref(), Some(r"D:\repo"));
    }

    #[test]
    fn launches_git_bash_when_found() {
        let bash = Path::new("C:/Git/git-bash.exe");
        let launch = resolve_terminal_launch("bash", r"D:\repo", true, Some(bash)).unwrap();
        assert_eq!(launch.program, bash.to_path_buf());
        assert_eq!(launch.args, vec![r"--cd=D:\repo".to_string()]);
    }

    #[test]
    fn reports_missing_git_bash() {
        assert!(matches!(
            resolve_terminal_launch("bash", r"D:\repo", true, None),
            Err(AppError::NotFound(_))
        ));
    }

    #[test]
    fn rejects_unknown_terminals_and_other_platforms() {
        assert!(matches!(
            resolve_terminal_launch("xterm", r"D:\repo", true, None),
            Err(AppError::InvalidOperation(_))
        ));
        assert!(matches!(
            resolve_terminal_launch("cmd", "/repo", false, None),
            Err(AppError::InvalidOperation(_))
        ));
    }

    #[test]
    fn finds_git_bash_from_cmd_or_mingw_dirs() {
        let files: HashSet<PathBuf> = [
            "/c/Git/cmd/git.exe",
            "/c/Git/git-bash.exe",
            "/e/PortableGit/mingw64/bin/git.exe",
            "/e/PortableGit/git-bash.exe",
        ]
        .iter()
        .map(PathBuf::from)
        .collect();
        let is_file = |p: &Path| files.contains(p);

        assert_eq!(
            find_git_bash(&path_var(&["/c/Windows", "/c/Git/cmd"]), is_file),
            Some(PathBuf::from("/c/Git/git-bash.exe"))
        );
        assert_eq!(
            find_git_bash(&path_var(&["/e/PortableGit/mingw64/bin"]), is_file),
            Some(PathBuf::from("/e/PortableGit/git-bash.exe"))
        );
        assert_eq!(find_git_bash(&path_var(&["/c/Windows"]), is_file), None);
    }
}
