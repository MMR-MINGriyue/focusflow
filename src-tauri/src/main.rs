#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::Manager;
use window_shadows::set_shadow;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .setup(|app| {
      let window = app.get_window("main").unwrap();

      #[cfg(any(windows, target_os = "macos"))]
      set_shadow(&window, true).expect("Failed to set window shadow");

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}