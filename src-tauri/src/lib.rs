mod activity;
pub use activity::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::new())
        .setup(|app| {
            use tauri::Manager;
            use tauri::menu::{MenuBuilder, MenuItem};
            use tauri::tray::TrayIconBuilder;

            let show_i =
                MenuItem::with_id(app, "show", "Show velvetwire", true, None::<&str>)?;
            let quit_i =
                MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = MenuBuilder::new(app)
                .items(&[&show_i, &quit_i])
                .build()?;

            TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("velvetwire — Discord Rich Presence")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    use tauri::tray::TrayIconEvent;
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![start_rpc, stop_rpc])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
