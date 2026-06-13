use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::task::JoinHandle;
use tokio::time::interval;

use discord_presence::Client;
use discord_presence::models::rich_presence::{Activity, ActivityType};

const CLIENT_ID: u64 = 1515403261618819294;

fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[derive(serde::Deserialize, Debug, Clone)]
pub struct ActivityConfig {
    pub custom_client_id_enabled: bool,
    pub custom_client_id: Option<String>,
    pub activity_type: u8,
    pub name_enabled: bool,
    pub name: Option<String>,
    pub details_enabled: bool,
    pub details: Option<String>,
    pub state_enabled: bool,
    pub state: Option<String>,
    pub images_enabled: bool,
    pub large_image: Option<String>,
    pub large_text: Option<String>,
    pub small_image: Option<String>,
    pub small_text: Option<String>,
    pub time_mode: String,
    pub frozen_hours: Option<u64>,
    pub frozen_minutes: Option<u64>,
    pub fixed_timestamp: Option<u64>,
    pub buttons_enabled: bool,
    pub button1_label: Option<String>,
    pub button1_url: Option<String>,
    pub button2_label: Option<String>,
    pub button2_url: Option<String>,
}

pub struct AppState {
    client: Arc<Mutex<Option<Client>>>,
    timer_handle: Mutex<Option<JoinHandle<()>>>,
}

impl AppState {
    fn new() -> Self {
        Self {
            client: Arc::new(Mutex::new(None)),
            timer_handle: Mutex::new(None),
        }
    }
}

fn apply_activity(act: Activity, config: &ActivityConfig, start_ts: Option<u64>) -> Activity {
    let act = if config.name_enabled {
        match config.name.as_deref().filter(|s| !s.is_empty()) {
            Some(n) => act.name(n),
            None => act,
        }
    } else {
        act
    };

    let act = if config.details_enabled {
        match config.details.as_deref().filter(|s| !s.is_empty()) {
            Some(d) => act.details(d),
            None => act,
        }
    } else {
        act
    };

    let act = if config.state_enabled {
        match config.state.as_deref().filter(|s| !s.is_empty()) {
            Some(s) => act.state(s),
            None => act,
        }
    } else {
        act
    };

    let activity_type = match config.activity_type {
        2 => ActivityType::Listening,
        3 => ActivityType::Watching,
        5 => ActivityType::Competing,
        _ => ActivityType::Playing,
    };
    let act = act.activity_type(activity_type);

    let act = if config.images_enabled {
        let large = config.large_image.as_deref().filter(|s| !s.is_empty());
        let small = config.small_image.as_deref().filter(|s| !s.is_empty());

        if large.is_some() || small.is_some() {
            let large_text = config.large_text.as_deref().filter(|s| !s.is_empty());
            let small_text = config.small_text.as_deref().filter(|s| !s.is_empty());

            act.assets(|mut a| {
                if let Some(url) = large {
                    a = a.large_image(url);
                    if let Some(t) = large_text {
                        a = a.large_text(t);
                    }
                }
                if let Some(url) = small {
                    a = a.small_image(url);
                    if let Some(t) = small_text {
                        a = a.small_text(t);
                    }
                }
                a
            })
        } else {
            act
        }
    } else {
        act
    };

    let act = if let Some(start) = start_ts {
        act.timestamps(|t| t.start(start))
    } else {
        act
    };

    let act = if config.buttons_enabled {
        let b1 = config
            .button1_label
            .as_deref()
            .filter(|s| !s.is_empty())
            .zip(config.button1_url.as_deref().filter(|s| !s.is_empty()));

        let b2 = config
            .button2_label
            .as_deref()
            .filter(|s| !s.is_empty())
            .zip(config.button2_url.as_deref().filter(|s| !s.is_empty()));

        let act = if let Some((label, url)) = b1 {
            let label = label.to_string();
            let url = url.to_string();
            act.append_buttons(move |b| b.label(label).url(url))
        } else {
            act
        };

        if let Some((label, url)) = b2 {
            let label = label.to_string();
            let url = url.to_string();
            act.append_buttons(move |b| b.label(label).url(url))
        } else {
            act
        }
    } else {
        act
    };

    act
}

#[tauri::command]
async fn start_rpc(
    config: ActivityConfig,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    {
        let mut h = state.timer_handle.lock().map_err(|e| e.to_string())?;
        if let Some(handle) = h.take() {
            handle.abort();
        }
    }

    {
        let mut guard = state.client.lock().map_err(|e| e.to_string())?;
        if let Some(old) = guard.take() {
            let _ = old.clone().clear_activity();
            let _ = old.shutdown();
        }
    }

    tokio::time::sleep(Duration::from_millis(300)).await;

    let client_id = if config.custom_client_id_enabled {
        config
            .custom_client_id
            .as_deref()
            .and_then(|s| s.trim().parse::<u64>().ok())
            .unwrap_or(CLIENT_ID)
    } else {
        CLIENT_ID
    };

    let mut client = Client::new(client_id);
    client.start();

    for _ in 0..30 {
        if Client::is_ready() {
            break;
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    if !Client::is_ready() {
        return Err(
            "Could not connect to Discord. Make sure the desktop app is running.".into(),
        );
    }

    let start_ts = match config.time_mode.as_str() {
        "elapsed" => Some(unix_now()),
        "frozen" => {
            let h = config.frozen_hours.unwrap_or(0);
            let m = config.frozen_minutes.unwrap_or(0);
            Some(unix_now().saturating_sub(h * 3600 + m * 60))
        }
        "fixed" => config.fixed_timestamp,
        _ => None,
    };

    {
        let cfg = config.clone();
        client
            .set_activity(|act| apply_activity(act, &cfg, start_ts))
            .map_err(|e| e.to_string())?;
    }

    {
        let mut guard = state.client.lock().map_err(|e| e.to_string())?;
        *guard = Some(client);
    }

    if config.time_mode == "frozen" {
        let frozen_secs =
            config.frozen_hours.unwrap_or(0) * 3600 + config.frozen_minutes.unwrap_or(0) * 60;
        let client_arc = Arc::clone(&state.client);
        let config_task = config.clone();

        let handle = tokio::spawn(async move {
            let mut ticker = interval(Duration::from_secs(60));
            ticker.tick().await;
            loop {
                ticker.tick().await;
                let start = unix_now().saturating_sub(frozen_secs);
                let mut guard = client_arc.lock().unwrap();
                if let Some(ref mut c) = *guard {
                    let _ = c.set_activity(|act| apply_activity(act, &config_task, Some(start)));
                } else {
                    break;
                }
            }
        });

        let mut h = state.timer_handle.lock().map_err(|e| e.to_string())?;
        *h = Some(handle);
    }

    Ok(())
}

#[tauri::command]
async fn stop_rpc(state: tauri::State<'_, AppState>) -> Result<(), String> {
    {
        let mut h = state.timer_handle.lock().map_err(|e| e.to_string())?;
        if let Some(handle) = h.take() {
            handle.abort();
        }
    }

    {
        let mut guard = state.client.lock().map_err(|e| e.to_string())?;
        if let Some(old) = guard.take() {
            let _ = old.clone().clear_activity();
            let _ = old.shutdown();
        }
    }

    Ok(())
}

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
