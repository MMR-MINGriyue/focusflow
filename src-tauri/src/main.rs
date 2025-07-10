#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::{
  Manager, GlobalShortcutManager, WindowEvent
};
use window_shadows::set_shadow;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let window = app.get_window("main").unwrap();

      #[cfg(any(windows, target_os = "macos"))]
      set_shadow(&window, true).expect("Failed to set window shadow");

      // 注册全局快捷键
      let app_handle = app.handle();
      let mut shortcut_manager = app.global_shortcut_manager();

      // Ctrl+Shift+F 显示/隐藏窗口
      shortcut_manager
        .register("CmdOrCtrl+Shift+F", move || {
          if let Some(window) = app_handle.get_window("main") {
            if window.is_visible().unwrap_or(false) {
              let _ = window.hide();
            } else {
              let _ = window.show();
              let _ = window.set_focus();
            }
          }
        })
        .unwrap();

      // 处理窗口关闭事件
      let window_clone = window.clone();
      window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { .. } = event {
          // 允许正常关闭窗口
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}