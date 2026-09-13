mod common;

use common::fixtures::create_clean_repo;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use visual_git_lib::repo::watcher::{is_ignored_path, should_ignore_event, RepoWatcher};
use visual_git_lib::repo::RepoManager;

fn wait_for_count(counter: &AtomicUsize, expected: usize, timeout: Duration) -> bool {
    let start = Instant::now();
    while start.elapsed() < timeout {
        if counter.load(Ordering::SeqCst) >= expected {
            return true;
        }
        std::thread::sleep(Duration::from_millis(20));
    }
    counter.load(Ordering::SeqCst) >= expected
}

#[test]
fn test_path_filtering_unit() {
    // 1. Ignored patterns
    assert!(is_ignored_path(Path::new("d:/repo/.git/objects/12/3456")));
    assert!(is_ignored_path(Path::new("d:\\repo\\.git\\objects\\pack\\pack-1.pack")));
    assert!(is_ignored_path(Path::new(".git/objects/abc")));
    assert!(is_ignored_path(Path::new("d:/repo/.git/index.lock")));
    assert!(is_ignored_path(Path::new("d:\\repo\\.git\\index.lock")));
    assert!(is_ignored_path(Path::new(".git/index.lock")));
    assert!(is_ignored_path(Path::new("d:/repo/.git")));
    assert!(is_ignored_path(Path::new(".git")));
    assert!(is_ignored_path(Path::new("d:/repo/.git/FETCH_HEAD")));
    assert!(is_ignored_path(Path::new("d:/repo/.git/ORIG_HEAD")));

    // Temporary editor files
    assert!(is_ignored_path(Path::new("d:/repo/file.txt.swp")));
    assert!(is_ignored_path(Path::new("d:/repo/file.txt.swo")));
    assert!(is_ignored_path(Path::new("d:/repo/file.txt~")));
    assert!(is_ignored_path(Path::new("d:/repo/4913")));
    assert!(is_ignored_path(Path::new("d:/repo/.#file.txt")));

    // 2. Watched patterns (must NOT be ignored)
    assert!(!is_ignored_path(Path::new("d:/repo/.git/HEAD")));
    assert!(!is_ignored_path(Path::new("d:/repo/.git/refs/heads/master")));
    assert!(!is_ignored_path(Path::new("d:/repo/.git/refs/tags/v1.0")));
    assert!(!is_ignored_path(Path::new("d:/repo/.git/index")));
    assert!(!is_ignored_path(Path::new("d:/repo/src/main.rs")));
    assert!(!is_ignored_path(Path::new("d:/repo/README.md")));

    // 3. should_ignore_event: ignore only if ALL paths match
    let all_ignored = vec![
        PathBuf::from("d:/repo/.git/objects/12"),
        PathBuf::from("d:/repo/.git/index.lock"),
    ];
    assert!(should_ignore_event(&all_ignored));

    let mixed = vec![
        PathBuf::from("d:/repo/.git/index.lock"),
        PathBuf::from("d:/repo/.git/index"),
    ];
    assert!(!should_ignore_event(&mixed));

    let none_ignored = vec![PathBuf::from("d:/repo/src/main.rs")];
    assert!(!should_ignore_event(&none_ignored));

    let empty: Vec<PathBuf> = vec![];
    assert!(should_ignore_event(&empty));
}

#[test]
fn test_watcher_triggers_on_file_change() {
    let (dir, _repo) = create_clean_repo().expect("Failed to create fixture repo");
    let repo_path = dir.path();

    let event_count = Arc::new(AtomicUsize::new(0));
    let count_clone = Arc::clone(&event_count);

    let last_reason = Arc::new(std::sync::Mutex::new(String::new()));
    let reason_clone = Arc::clone(&last_reason);

    let watcher = RepoWatcher::start(repo_path, move |reason| {
        *reason_clone.lock().unwrap() = reason;
        count_clone.fetch_add(1, Ordering::SeqCst);
    })
    .expect("Failed to start watcher");

    // Give watcher time to initialize directory hooks
    std::thread::sleep(Duration::from_millis(100));

    // Create a new file in the working tree
    let file_path = repo_path.join("watcher_test.txt");
    fs::write(&file_path, "test content").expect("Failed to write file");

    // Wait for 200ms debounce + margin
    let triggered = wait_for_count(&event_count, 1, Duration::from_millis(1500));
    assert!(triggered, "Watcher did not trigger after file change");
    assert_eq!(event_count.load(Ordering::SeqCst), 1);
    assert_eq!(*last_reason.lock().unwrap(), "fs_watch");

    drop(watcher);
}

#[test]
fn test_watcher_debounce_consolidation() {
    let (dir, _repo) = create_clean_repo().expect("Failed to create fixture repo");
    let repo_path = dir.path();

    let event_count = Arc::new(AtomicUsize::new(0));
    let count_clone = Arc::clone(&event_count);

    let watcher = RepoWatcher::start(repo_path, move |_reason| {
        count_clone.fetch_add(1, Ordering::SeqCst);
    })
    .expect("Failed to start watcher");

    std::thread::sleep(Duration::from_millis(100));

    // Rapidly write 5 times within 150ms (< 200ms debounce interval)
    let file_path = repo_path.join("rapid_write.txt");
    for i in 0..5 {
        fs::write(&file_path, format!("content {}", i)).expect("Failed to write file");
        std::thread::sleep(Duration::from_millis(30));
    }

    // Wait for debounce period (200ms after last write) + margin
    let triggered = wait_for_count(&event_count, 1, Duration::from_millis(1500));
    assert!(triggered, "Watcher should have triggered once after rapid writes");

    // Wait extra time to ensure no second trigger arrives
    std::thread::sleep(Duration::from_millis(350));
    assert_eq!(
        event_count.load(Ordering::SeqCst),
        1,
        "Rapid writes should be consolidated into a single trigger"
    );

    drop(watcher);
}

#[test]
fn test_watcher_filters_git_objects_and_index_lock() {
    let (dir, _repo) = create_clean_repo().expect("Failed to create fixture repo");
    let repo_path = dir.path();

    let event_count = Arc::new(AtomicUsize::new(0));
    let count_clone = Arc::clone(&event_count);

    let watcher = RepoWatcher::start(repo_path, move |_reason| {
        count_clone.fetch_add(1, Ordering::SeqCst);
    })
    .expect("Failed to start watcher");

    std::thread::sleep(Duration::from_millis(100));

    // 1. Modify .git/objects
    let objects_dir = repo_path.join(".git").join("objects");
    fs::create_dir_all(&objects_dir).expect("Failed to create objects dir");
    fs::write(objects_dir.join("test_obj"), "obj_data").expect("Failed to write object");

    // 2. Modify .git/index.lock
    fs::write(repo_path.join(".git").join("index.lock"), "locked").expect("Failed to write index.lock");

    // Wait for potential (unwanted) debounce
    std::thread::sleep(Duration::from_millis(400));
    assert_eq!(
        event_count.load(Ordering::SeqCst),
        0,
        "Modifications to .git/objects and .git/index.lock must be ignored"
    );

    // 3. Now modify a valid workdir file to verify watcher is still functioning
    fs::write(repo_path.join("valid_after_filter.txt"), "valid").expect("Failed to write valid file");

    let triggered = wait_for_count(&event_count, 1, Duration::from_millis(1500));
    assert!(triggered, "Watcher should trigger for valid workdir file after ignored events");
    assert_eq!(event_count.load(Ordering::SeqCst), 1);

    drop(watcher);
}

#[test]
fn test_watcher_stop_prevents_notifications() {
    let (dir, _repo) = create_clean_repo().expect("Failed to create fixture repo");
    let repo_path = dir.path();

    let event_count = Arc::new(AtomicUsize::new(0));
    let count_clone = Arc::clone(&event_count);

    let mut watcher = RepoWatcher::start(repo_path, move |_reason| {
        count_clone.fetch_add(1, Ordering::SeqCst);
    })
    .expect("Failed to start watcher");

    std::thread::sleep(Duration::from_millis(100));

    // Explicitly stop the watcher
    watcher.stop();

    // Modify a file after stop
    fs::write(repo_path.join("after_stop.txt"), "should not trigger").expect("Failed to write file");

    // Wait to verify no notification occurs
    std::thread::sleep(Duration::from_millis(400));
    assert_eq!(
        event_count.load(Ordering::SeqCst),
        0,
        "No events should be triggered after stop() has been called"
    );
}

#[test]
fn test_repo_manager_watcher_integration() {
    let (dir, _repo) = create_clean_repo().expect("Failed to create fixture repo");
    let repo_path = dir.path();

    let mut manager = RepoManager::new();
    assert!(!manager.has_watcher());

    // Starting watcher before opening repo returns error
    let err = manager.start_watcher(|_| {});
    assert!(err.is_err());

    // Open repository
    manager.open(repo_path).expect("Failed to open repo");

    let event_count = Arc::new(AtomicUsize::new(0));
    let count_clone = Arc::clone(&event_count);

    manager
        .start_watcher(move |_reason| {
            count_clone.fetch_add(1, Ordering::SeqCst);
        })
        .expect("Failed to start watcher in RepoManager");

    assert!(manager.has_watcher());

    std::thread::sleep(Duration::from_millis(100));

    // Trigger change
    fs::write(repo_path.join("manager_test.txt"), "mgr").expect("Failed to write file");
    let triggered = wait_for_count(&event_count, 1, Duration::from_millis(1500));
    assert!(triggered);

    // Stop watcher via manager
    manager.stop_watcher();
    assert!(!manager.has_watcher());

    fs::write(repo_path.join("manager_test2.txt"), "mgr2").expect("Failed to write file");
    std::thread::sleep(Duration::from_millis(400));
    assert_eq!(event_count.load(Ordering::SeqCst), 1);

    // Reopen repo stops existing watcher if any
    let (dir2, _repo2) = create_clean_repo().expect("Failed to create fixture repo 2");
    manager.open(dir2.path()).expect("Failed to open repo 2");
    assert!(!manager.has_watcher());
}
