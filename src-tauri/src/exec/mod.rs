//! Module `exec`: Nơi duy nhất được phép spawn process thực thi `git` CLI (push, pull, fetch, rebase, merge).
//! Đảm bảo thừa hưởng credentials, SSH agent, hook, và xử lý timeout/cancel tập trung.

pub mod merge;
pub mod remote;

use crate::error::AppError;
use std::collections::HashMap;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex, OnceLock};

#[derive(Debug, Clone)]
pub struct GitCliOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub success: bool,
}

static ACTIVE_TASKS: OnceLock<Mutex<HashMap<String, u32>>> = OnceLock::new();
static CANCELLED_TASKS: OnceLock<Mutex<HashMap<String, bool>>> = OnceLock::new();

fn get_active_tasks() -> &'static Mutex<HashMap<String, u32>> {
    ACTIVE_TASKS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn get_cancelled_tasks() -> &'static Mutex<HashMap<String, bool>> {
    CANCELLED_TASKS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub fn register_task_process(task_id: &str, pid: u32) {
    if let Ok(mut map) = get_active_tasks().lock() {
        map.insert(task_id.to_string(), pid);
    }
}

pub fn unregister_task_process(task_id: &str) {
    if let Ok(mut map) = get_active_tasks().lock() {
        map.remove(task_id);
    }
    if let Ok(mut map) = get_cancelled_tasks().lock() {
        map.remove(task_id);
    }
}

pub fn cancel_task(task_id: &str) -> bool {
    let mut pid_to_kill = None;
    if let Ok(mut map) = get_cancelled_tasks().lock() {
        map.insert(task_id.to_string(), true);
    }
    if let Ok(map) = get_active_tasks().lock() {
        if let Some(&pid) = map.get(task_id) {
            pid_to_kill = Some(pid);
        }
    }

    if let Some(pid) = pid_to_kill {
        #[cfg(target_os = "windows")]
        {
            let _ = std::process::Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .output();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = std::process::Command::new("kill")
                .args(["-9", &pid.to_string()])
                .output();
        }
        return true;
    }
    false
}

pub fn is_task_cancelled(task_id: &str) -> bool {
    if let Ok(map) = get_cancelled_tasks().lock() {
        return map.get(task_id).copied().unwrap_or(false);
    }
    false
}

/// Bóc tách phần trăm và giai đoạn tiến độ từ dòng output git CLI
pub fn parse_git_progress_line(line: &str) -> Option<(u32, String)> {
    let colon_idx = line.find(':')?;
    let percent_idx = line.find('%')?;
    if percent_idx <= colon_idx {
        return None;
    }

    let stage = line[..colon_idx].trim();
    let num_part = line[colon_idx + 1..percent_idx].trim();
    let percent: u32 = num_part.split_whitespace().last()?.parse().ok()?;

    if percent <= 100 {
        Some((percent, format!("{}: {}%", stage, percent)))
    } else {
        None
    }
}

/// Chạy một lệnh git CLI trong repo_dir chỉ định (đồng bộ đơn giản)
pub fn run_git_command<P: AsRef<Path>>(
    repo_dir: P,
    args: &[&str],
) -> Result<GitCliOutput, AppError> {
    let output = Command::new("git")
        .current_dir(repo_dir.as_ref())
        .args(args)
        .output()
        .map_err(AppError::from)?;

    let exit_code = output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        return Err(AppError::CommandFailed {
            code: exit_code,
            stderr,
        });
    }

    Ok(GitCliOutput {
        stdout,
        stderr,
        exit_code,
        success: true,
    })
}

/// Chạy một lệnh git CLI có streaming tiến độ và hỗ trợ huỷ
pub fn run_git_streaming_command<P: AsRef<Path>, F: Fn(u32, String) + Send + Sync + 'static>(
    repo_dir: P,
    args: &[&str],
    task_id: &str,
    on_progress: F,
) -> Result<GitCliOutput, AppError> {
    let mut child = Command::new("git")
        .current_dir(repo_dir.as_ref())
        .args(args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(AppError::from)?;

    register_task_process(task_id, child.id());

    let stderr = child.stderr.take();
    let stdout = child.stdout.take();

    let on_progress_arc = Arc::new(on_progress);
    let on_progress_clone = on_progress_arc.clone();

    let stderr_handle = std::thread::spawn(move || {
        let mut full_stderr = String::new();
        if let Some(reader) = stderr {
            use std::io::Read;
            let mut buffer = [0u8; 1024];
            let mut line_buf = Vec::new();
            let mut r = reader;
            while let Ok(n) = r.read(&mut buffer) {
                if n == 0 {
                    break;
                }
                for &b in &buffer[..n] {
                    if b == b'\r' || b == b'\n' {
                        let line = String::from_utf8_lossy(&line_buf).to_string();
                        if let Some((pct, text)) = parse_git_progress_line(&line) {
                            on_progress_clone(pct, text);
                        }
                        full_stderr.push_str(&line);
                        full_stderr.push('\n');
                        line_buf.clear();
                    } else {
                        line_buf.push(b);
                    }
                }
            }
            if !line_buf.is_empty() {
                let line = String::from_utf8_lossy(&line_buf).to_string();
                if let Some((pct, text)) = parse_git_progress_line(&line) {
                    on_progress_clone(pct, text);
                }
                full_stderr.push_str(&line);
            }
        }
        full_stderr
    });

    let stdout_handle = std::thread::spawn(move || {
        let mut full_stdout = String::new();
        if let Some(mut reader) = stdout {
            use std::io::Read;
            let _ = reader.read_to_string(&mut full_stdout);
        }
        full_stdout
    });

    let status = child.wait().map_err(AppError::from)?;
    let was_cancelled = is_task_cancelled(task_id);
    unregister_task_process(task_id);

    let stderr_str = stderr_handle.join().unwrap_or_default();
    let stdout_str = stdout_handle.join().unwrap_or_default();

    if was_cancelled {
        return Err(AppError::InvalidOperation(
            "Tác vụ đã bị huỷ bởi người dùng".into(),
        ));
    }

    let exit_code = status.code().unwrap_or(-1);
    if !status.success() {
        return Err(AppError::CommandFailed {
            code: exit_code,
            stderr: stderr_str,
        });
    }

    Ok(GitCliOutput {
        stdout: stdout_str,
        stderr: stderr_str,
        exit_code,
        success: true,
    })
}

/// Kiểm tra phiên bản Git CLI đang cài đặt trên máy người dùng
pub fn get_git_cli_version() -> Result<String, AppError> {
    let output = Command::new("git")
        .arg("--version")
        .output()
        .map_err(AppError::from)?;

    if !output.status.success() {
        return Err(AppError::CommandFailed {
            code: output.status.code().unwrap_or(-1),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}
