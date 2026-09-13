//! Filesystem watcher với debounce và event filtering cho Git repository.
//! Tuân thủ Deep Module: che giấu cơ chế notify OS-level và lọc các file nội bộ git.

use crate::error::AppError;
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc::{channel, Receiver, RecvTimeoutError, Sender};
use std::thread::{spawn, JoinHandle};
use std::time::Duration;

#[derive(Debug)]
enum DebounceMsg {
    Event,
    Stop,
}

/// Kiểm tra xem một đường dẫn có thuộc danh sách bỏ qua (git internal / editor temp) hay không.
pub fn is_ignored_path<P: AsRef<Path>>(path: P) -> bool {
    let p = path.as_ref();
    let s = p.to_string_lossy();
    let normalized = s.replace('\\', "/");
    let lower = normalized.to_lowercase();

    // 1. Thư mục .git chính (thay đổi metadata thư mục khi tạo lock file trong .git)
    if let Some(file_name) = p.file_name().and_then(|n| n.to_str()) {
        if file_name.eq_ignore_ascii_case(".git") {
            return true;
        }
    }

    // 2. Bỏ qua các git metadata không ảnh hưởng trực tiếp tới status/diff hiển thị:
    // .git/objects, .git/index.lock, .git/FETCH_HEAD, .git/ORIG_HEAD
    if lower.contains("/.git/objects")
        || lower.starts_with(".git/objects")
        || lower.contains("/.git/index.lock")
        || lower.starts_with(".git/index.lock")
        || lower.contains("/.git/fetch_head")
        || lower.starts_with(".git/fetch_head")
        || lower.contains("/.git/orig_head")
        || lower.starts_with(".git/orig_head")
    {
        return true;
    }

    // 3. Bỏ qua các file tạm của text editors (e.g. .swp, ~, 4913, .#)
    if let Some(file_name) = p.file_name().and_then(|n| n.to_str()) {
        let name_lower = file_name.to_lowercase();
        if name_lower.ends_with(".swp")
            || name_lower.ends_with(".swo")
            || name_lower.ends_with(".swx")
            || name_lower.ends_with('~')
            || name_lower == "4913"
            || name_lower.starts_with(".#")
            || name_lower.ends_with(".tmp")
        {
            return true;
        }
    }

    false
}

/// Bỏ qua event nếu TẤT CẢ các file liên quan đều thuộc danh sách bỏ qua.
/// Đảm bảo các file làm việc (workdir) và `.git/HEAD`, `.git/refs/`, `.git/index` được theo dõi.
pub fn should_ignore_event<P: AsRef<Path>>(paths: &[P]) -> bool {
    if paths.is_empty() {
        return true;
    }
    paths.iter().all(|p| is_ignored_path(p.as_ref()))
}

/// Bộ theo dõi filesystem cho Git repository với debounce và lọc file.
pub struct RepoWatcher {
    watcher: Option<RecommendedWatcher>,
    stop_tx: Option<Sender<DebounceMsg>>,
    worker_handle: Option<JoinHandle<()>>,
}

impl RepoWatcher {
    /// Bắt đầu theo dõi repository tại `repo_path` với debounce 200ms mặc định.
    pub fn start<P: AsRef<Path>, F>(repo_path: P, on_changed: F) -> Result<Self, AppError>
    where
        F: Fn(String) + Send + Sync + 'static,
    {
        Self::start_with_debounce(repo_path, Duration::from_millis(200), on_changed)
    }

    /// Bắt đầu theo dõi repository với khoảng thời gian debounce tùy chỉnh.
    pub fn start_with_debounce<P: AsRef<Path>, F>(
        repo_path: P,
        debounce_duration: Duration,
        on_changed: F,
    ) -> Result<Self, AppError>
    where
        F: Fn(String) + Send + Sync + 'static,
    {
        let repo_path = repo_path.as_ref();
        if !repo_path.exists() {
            return Err(AppError::NotFound(format!(
                "Repository path does not exist: {}",
                repo_path.display()
            )));
        }

        let (tx, rx): (Sender<DebounceMsg>, Receiver<DebounceMsg>) = channel();
        let event_tx = tx.clone();

        let mut watcher = RecommendedWatcher::new(
            move |res: Result<notify::Event, notify::Error>| {
                if let Ok(event) = res {
                    if !should_ignore_event(&event.paths) {
                        let _ = event_tx.send(DebounceMsg::Event);
                    }
                }
            },
            Config::default(),
        )
        .map_err(|e| AppError::Io(e.to_string()))?;

        watcher
            .watch(repo_path, RecursiveMode::Recursive)
            .map_err(|e| AppError::Io(e.to_string()))?;

        let worker_handle = spawn(move || {
            while let Ok(msg) = rx.recv() {
                match msg {
                    DebounceMsg::Stop => break,
                    DebounceMsg::Event => {
                        let mut quiet = false;
                        while !quiet {
                            match rx.recv_timeout(debounce_duration) {
                                Ok(DebounceMsg::Event) => {
                                    // Sự kiện mới đến trong cửa sổ debounce -> reset timer
                                    continue;
                                }
                                Ok(DebounceMsg::Stop) => {
                                    // Dừng watcher ngay lập tức, không kích hoạt callback
                                    return;
                                }
                                Err(RecvTimeoutError::Timeout) => {
                                    // Đã đủ khoảng thời gian yên lặng 200ms
                                    quiet = true;
                                }
                                Err(RecvTimeoutError::Disconnected) => {
                                    // Kênh đóng
                                    return;
                                }
                            }
                        }
                        on_changed("fs_watch".to_string());
                    }
                }
            }
        });

        Ok(Self {
            watcher: Some(watcher),
            stop_tx: Some(tx),
            worker_handle: Some(worker_handle),
        })
    }

    /// Dừng theo dõi và dọn dẹp tài nguyên thread một cách an toàn.
    pub fn stop(&mut self) {
        if let Some(watcher) = self.watcher.take() {
            drop(watcher);
        }
        if let Some(tx) = self.stop_tx.take() {
            let _ = tx.send(DebounceMsg::Stop);
        }
        if let Some(handle) = self.worker_handle.take() {
            let _ = handle.join();
        }
    }
}

impl Drop for RepoWatcher {
    fn drop(&mut self) {
        self.stop();
    }
}
