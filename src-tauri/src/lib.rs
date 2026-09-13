pub mod commands;
pub mod error;
pub mod events;
pub mod exec;
pub mod read;
pub mod repo;
pub mod write;

use commands::*;
use tauri_specta::{collect_commands, Builder};

pub fn create_specta_builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new().commands(collect_commands![
        ping,
        get_system_info,
        get_repo_head_info,
        simulate_repo_change,
        open_repository,
        get_recent_repos,
        clear_recent_repos,
        remove_recent_repo,
        select_repo_folder,
        get_branches,
        get_commit_graph,
        get_commit_details,
        get_commit_file_diff,
        get_repo_status,
        get_working_file_diff,
        stage_file,
        unstage_file,
        stage_all,
        unstage_all,
        discard_file_changes,
        stage_hunk,
        stage_lines,
        create_commit,
        create_branch,
        checkout_branch,
        rename_branch,
        delete_branch
    ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let specta_builder = create_specta_builder();

    // Không tự động ghi đè src/ipc/bindings.ts: file đó được viết tay và
    // giữ hình dạng IPC riêng (invokeCommand trả Promise<T> trực tiếp, có
    // fallback mock cho môi trường browser dev), khác với format mà
    // tauri-specta tự sinh ra (commands.* trả {status, data|error}).

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(specta_builder.invoke_handler())
        .setup(move |app| {
            specta_builder.mount_events(app);

            // Cấu hình vibrancy theo từng OS (mục 7.3 trong đặc tả)
            #[cfg(target_os = "windows")]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window_vibrancy::apply_mica(&window, None);
                }
            }

            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                if let Some(window) = app.get_webview_window("main") {
                    let _ = apply_vibrancy(&window, NSVisualEffectMaterial::UnderWindowBackground, None, None);
                }
            }

            // Linux: giữ nền đặc theo mặc định

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

