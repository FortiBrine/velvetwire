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
    pub offset_hours: Option<u64>,
    pub offset_minutes: Option<u64>,
    pub buttons_enabled: bool,
    pub button1_label: Option<String>,
    pub button1_url: Option<String>,
    pub button2_label: Option<String>,
    pub button2_url: Option<String>,
}

impl ActivityConfig {
    fn offset_secs(&self) -> u64 {
        self.offset_hours.unwrap_or(0) * 3600 + self.offset_minutes.unwrap_or(0) * 60
    }
}

pub struct AppState {
    pub client: Arc<Mutex<Option<Client>>>,
    pub timer_handle: Mutex<Option<JoinHandle<()>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            client: Arc::new(Mutex::new(None)),
            timer_handle: Mutex::new(None),
        }
    }

    fn teardown(&self) -> Result<(), String> {
        {
            let mut h = self.timer_handle.lock().map_err(|e| e.to_string())?;
            if let Some(handle) = h.take() {
                handle.abort();
            }
        }
        {
            let mut guard = self.client.lock().map_err(|e| e.to_string())?;
            if let Some(old) = guard.take() {
                let _ = old.clone().clear_activity();
                let _ = old.shutdown();
            }
        }
        Ok(())
    }
}

fn append_button(act: Activity, label: Option<&str>, url: Option<&str>) -> Activity {
    match label
        .filter(|s| !s.is_empty())
        .zip(url.filter(|s| !s.is_empty()))
    {
        Some((label, url)) => {
            let label = label.to_string();
            let url = url.to_string();
            act.append_buttons(move |b| b.label(label).url(url))
        }
        None => act,
    }
}

fn apply_activity(
    act: Activity,
    config: &ActivityConfig,
    start_ts: Option<u64>,
    end_ts: Option<u64>,
) -> Activity {
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

    let act = match (start_ts, end_ts) {
        (Some(s), None) => act.timestamps(|t| t.start(s)),
        (None, Some(e)) => act.timestamps(|t| t.end(e)),
        (Some(s), Some(e)) => act.timestamps(|t| t.start(s).end(e)),
        (None, None) => act,
    };

    if config.buttons_enabled {
        let act = append_button(act, config.button1_label.as_deref(), config.button1_url.as_deref());
        append_button(act, config.button2_label.as_deref(), config.button2_url.as_deref())
    } else {
        act
    }
}

#[tauri::command]
pub async fn start_rpc(
    config: ActivityConfig,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.teardown()?;

    tokio::time::sleep(Duration::from_millis(800)).await;

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

    for _ in 0..50 {
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

    let offset = config.offset_secs();
    let (start_ts, end_ts) = match config.time_mode.as_str() {
        "elapsed" | "freeze" => (Some(unix_now().saturating_sub(offset)), None),
        "countdown" => (None, Some(unix_now() + offset)),
        _ => (None, None),
    };

    {
        let cfg = config.clone();
        client
            .set_activity(|act| apply_activity(act, &cfg, start_ts, end_ts))
            .map_err(|e| e.to_string())?;
    }

    {
        let mut guard = state.client.lock().map_err(|e| e.to_string())?;
        *guard = Some(client);
    }

    if config.time_mode == "freeze" {
        let client_arc = Arc::clone(&state.client);
        let config_task = config.clone();

        let handle = tokio::spawn(async move {
            let mut ticker = interval(Duration::from_secs(5));
            ticker.tick().await;
            loop {
                ticker.tick().await;
                let start = unix_now().saturating_sub(config_task.offset_secs());
                let mut guard = client_arc.lock().unwrap();
                if let Some(ref mut c) = *guard {
                    let _ = c.set_activity(|act| {
                        apply_activity(act, &config_task, Some(start), None)
                    });
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
pub async fn stop_rpc(state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.teardown()
}
