use crate::error::AppError;
use std::process::Command;

/// Maps the editor chosen in settings to the program to spawn.
///
/// On Windows the VS Code and Cursor launchers are `.cmd` scripts, and
/// `Command` does not resolve `PATHEXT`, so the extension must be explicit.
/// A custom command is treated as a program name only: it is never passed
/// through a shell, so it cannot inject extra commands.
pub fn resolve_editor_program(
    editor: &str,
    custom_command: Option<&str>,
    is_windows: bool,
) -> Result<String, AppError> {
    let program = match (editor, is_windows) {
        ("code", true) => "code.cmd",
        ("cursor", true) => "cursor.cmd",
        ("subl", true) => "subl.exe",
        ("notepad++", true) => "notepad++.exe",
        ("code" | "cursor" | "subl" | "notepad++", false) => editor,
        ("custom", _) => {
            let custom = custom_command.map(str::trim).unwrap_or_default();
            if custom.is_empty() {
                return Err(AppError::InvalidOperation(
                    "Custom editor command is empty".to_string(),
                ));
            }
            return Ok(custom.to_string());
        }
        _ => {
            return Err(AppError::InvalidOperation(format!(
                "Unknown editor: {editor}"
            )))
        }
    };
    Ok(program.to_string())
}

/// Strips the Windows verbatim prefix (`\\?\`), which editors do not accept.
pub fn to_editor_path(path: &str) -> String {
    if let Some(unc) = path.strip_prefix(r"\\?\UNC\") {
        return format!(r"\\{unc}");
    }
    path.strip_prefix(r"\\?\").unwrap_or(path).to_string()
}

fn spawn_editor(program: &str, path: &str) -> Result<(), AppError> {
    let mut cmd = Command::new(program);
    cmd.arg(path);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    match cmd.spawn() {
        Ok(_) => Ok(()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
            Err(AppError::NotFound(program.to_string()))
        }
        Err(err) => Err(AppError::Io(err.to_string())),
    }
}

/// Opens the repository folder in the user's external editor.
#[tauri::command]
#[specta::specta]
pub fn open_in_editor(
    repo_path: String,
    editor: String,
    custom_command: Option<String>,
) -> Result<(), AppError> {
    let program = resolve_editor_program(&editor, custom_command.as_deref(), cfg!(windows))?;
    spawn_editor(&program, &to_editor_path(&repo_path))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_known_editors_to_windows_launchers() {
        let cases = [
            ("code", "code.cmd"),
            ("cursor", "cursor.cmd"),
            ("subl", "subl.exe"),
            ("notepad++", "notepad++.exe"),
        ];
        for (editor, expected) in cases {
            assert_eq!(
                resolve_editor_program(editor, None, true).unwrap(),
                expected
            );
        }
    }

    #[test]
    fn keeps_bare_names_outside_windows() {
        assert_eq!(resolve_editor_program("code", None, false).unwrap(), "code");
        assert_eq!(resolve_editor_program("subl", None, false).unwrap(), "subl");
    }

    #[test]
    fn trims_custom_command() {
        let program = resolve_editor_program("custom", Some("  nvim-qt  "), true).unwrap();
        assert_eq!(program, "nvim-qt");
    }

    #[test]
    fn rejects_empty_custom_command() {
        assert!(matches!(
            resolve_editor_program("custom", Some("   "), true),
            Err(AppError::InvalidOperation(_))
        ));
        assert!(matches!(
            resolve_editor_program("custom", None, false),
            Err(AppError::InvalidOperation(_))
        ));
    }

    #[test]
    fn rejects_unknown_editor() {
        assert!(matches!(
            resolve_editor_program("vim; rm -rf /", None, true),
            Err(AppError::InvalidOperation(_))
        ));
    }

    #[test]
    fn strips_verbatim_prefixes() {
        assert_eq!(to_editor_path(r"\\?\D:\repo"), r"D:\repo");
        assert_eq!(to_editor_path(r"\\?\UNC\server\share"), r"\\server\share");
        assert_eq!(to_editor_path("/home/me/repo"), "/home/me/repo");
    }

    #[test]
    fn reports_missing_program_as_not_found() {
        let result = spawn_editor("gitvista-editor-that-does-not-exist", ".");
        assert!(matches!(result, Err(AppError::NotFound(_))));
    }
}
