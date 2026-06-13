export type TimeMode = 'none' | 'elapsed' | 'frozen' | 'fixed';

export type ActivityTypeValue = 0 | 1 | 2 | 3 | 5;

/** Must match the Rust `ActivityConfig` struct field-for-field (snake_case). */
export interface ActivityConfig {
  // Custom App ID
  custom_client_id_enabled: boolean;
  custom_client_id: string | null;

  // Activity type: 0=Playing 1=Streaming 2=Listening 3=Watching 5=Competing
  activity_type: number;

  // App name override (unstable_name feature)
  name_enabled: boolean;
  name: string | null;

  // Primary text
  details_enabled: boolean;
  details: string | null;

  // Secondary text
  state_enabled: boolean;
  state: string | null;

  // Images
  images_enabled: boolean;
  large_image: string | null;
  large_text: string | null;
  small_image: string | null;
  small_text: string | null;

  // Timestamps: "none" | "elapsed" | "frozen" | "fixed"
  time_mode: TimeMode;
  frozen_hours: number | null;
  frozen_minutes: number | null;
  fixed_timestamp: number | null; // Unix seconds (only used when time_mode === 'fixed')

  // Buttons
  buttons_enabled: boolean;
  button1_label: string | null;
  button1_url: string | null;
  button2_label: string | null;
  button2_url: string | null;
}

export interface ActivityTypeOption {
  value: string;
  label: string;
  verb: string;
  icon: string;
}

export const ACTIVITY_TYPES: ActivityTypeOption[] = [
  { value: '0', label: 'Playing', verb: 'Playing', icon: '🎮' },
  { value: '2', label: 'Listening', verb: 'Listening to', icon: '🎵' },
  { value: '3', label: 'Watching', verb: 'Watching', icon: '👁️' },
  { value: '5', label: 'Competing', verb: 'Competing in', icon: '🏆' },
];
