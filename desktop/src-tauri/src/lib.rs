// FORENZA Native Desktop Library (Tauri 2.x)

#[tauri::command]
fn get_platform_info() -> String {
    format!(
        "FORENZA Desktop Client v1.0.0 — Target: {} / Arch: {}",
        std::env::consts::OS,
        std::env::consts::ARCH
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_platform_info])
        .run(tauri::generate_context!())
        .expect("error while running FORENZA desktop application");
}
