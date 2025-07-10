fn main() {
    // 在Windows上跳过资源文件生成
    #[cfg(target_os = "windows")]
    {
        std::env::set_var("TAURI_SKIP_EMBEDDED_RESOURCES", "1");
    }

    tauri_build::build()
}
