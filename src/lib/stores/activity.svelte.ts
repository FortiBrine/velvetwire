import { invoke } from '@tauri-apps/api/core';
import { i18n } from '$lib/i18n';

export type TimeMode = 'none' | 'freeze' | 'elapsed' | 'countdown';

/** Must match the Rust `ActivityConfig` struct field-for-field (snake_case). */
export interface ActivityConfig {
	custom_client_id_enabled: boolean;
	custom_client_id: string | null;
	activity_type: number;
	name_enabled: boolean;
	name: string | null;
	details_enabled: boolean;
	details: string | null;
	state_enabled: boolean;
	state: string | null;
	images_enabled: boolean;
	large_image: string | null;
	large_text: string | null;
	small_image: string | null;
	small_text: string | null;
	time_mode: TimeMode;
	offset_hours: number | null;
	offset_minutes: number | null;
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

export const CHAR_LIMITS = {
	activityName: 128,
	details: 128,
	stateText: 128,
	largeImage: 256,
	largeText: 128,
	smallImage: 256,
	smallText: 128,
	button1Label: 32,
	button1Url: 512,
	button2Label: 32,
	button2Url: 512,
} as const;

class ActivityStore {
	isActive = $state(false);
	isLoading = $state(false);
	errorMsg = $state<string | null>(null);

	customClientIdEnabled = $state(false);
	customClientId = $state('');

	activityType = $state('0');

	nameEnabled = $state(false);
	activityName = $state('');

	detailsEnabled = $state(true);
	details = $state('');

	stateEnabled = $state(true);
	stateText = $state('');

	imagesEnabled = $state(true);
	largeImage = $state('');
	largeText = $state('');
	smallImage = $state('');
	smallText = $state('');

	timeMode = $state<TimeMode>('none');
	offsetHours = $state(0);
	offsetMinutes = $state(0);

	buttonsEnabled = $state(false);
	button1Label = $state('');
	button1Url = $state('');
	button2Label = $state('');
	button2Url = $state('');

	previewElapsed = $state(0);
	previewStartEpoch = $state<number | null>(null);
	#timerInterval: ReturnType<typeof setInterval> | null = null;

	activityTypeMeta = $derived(
		ACTIVITY_TYPES.find((t) => t.value === this.activityType) ?? ACTIVITY_TYPES[0]
	);

	isOverLimit = $derived(
		(Object.entries(CHAR_LIMITS) as [keyof typeof CHAR_LIMITS, number][]).some(
			([field, max]) => (this[field as keyof this] as string).length > max
		)
	);

	startPreviewTimer() {
		this.stopPreviewTimer();
		this.previewStartEpoch = Date.now();
		this.previewElapsed = 0;
		this.#timerInterval = setInterval(() => {
			if (this.previewStartEpoch !== null) {
				this.previewElapsed = Math.floor((Date.now() - this.previewStartEpoch) / 1000);
			}
		}, 1000);
	}

	stopPreviewTimer() {
		if (this.#timerInterval !== null) {
			clearInterval(this.#timerInterval);
			this.#timerInterval = null;
		}
		this.previewStartEpoch = null;
		this.previewElapsed = 0;
	}

	async startRpc() {
		this.isLoading = true;
		this.errorMsg = null;
		try {
			const hasOffset = this.timeMode !== 'none';

			const config: ActivityConfig = {
				custom_client_id_enabled: this.customClientIdEnabled,
				custom_client_id: this.customClientIdEnabled ? this.customClientId.trim() || null : null,
				activity_type: parseInt(this.activityType, 10),
				name_enabled: this.nameEnabled,
				name: this.nameEnabled ? this.activityName.trim() || null : null,
				details_enabled: this.detailsEnabled,
				details: this.detailsEnabled ? this.details.trim() || null : null,
				state_enabled: this.stateEnabled,
				state: this.stateEnabled ? this.stateText.trim() || null : null,
				images_enabled: this.imagesEnabled,
				large_image: this.imagesEnabled ? this.largeImage.trim() || null : null,
				large_text: this.imagesEnabled ? this.largeText.trim() || null : null,
				small_image: this.imagesEnabled ? this.smallImage.trim() || null : null,
				small_text: this.imagesEnabled ? this.smallText.trim() || null : null,
				time_mode: this.timeMode,
				offset_hours: hasOffset ? this.offsetHours : null,
				offset_minutes: hasOffset ? this.offsetMinutes : null,
				buttons_enabled: this.buttonsEnabled,
				button1_label: this.buttonsEnabled ? this.button1Label.trim() || null : null,
				button1_url: this.buttonsEnabled ? this.button1Url.trim() || null : null,
				button2_label: this.buttonsEnabled ? this.button2Label.trim() || null : null,
				button2_url: this.buttonsEnabled ? this.button2Url.trim() || null : null
			};

			await invoke('start_rpc', { config });
			this.isActive = true;
			if (this.timeMode === 'elapsed') this.startPreviewTimer();
			else this.stopPreviewTimer();
		} catch (e) {
			const errorText = String(e);
			let msg = errorText;
			i18n.subscribe((locale) => {
				if (errorText === 'Could not connect to Discord. Make sure the desktop app is running.') {
					msg = locale.errors.discord;
				}
			})();
			this.errorMsg = msg;
		} finally {
			this.isLoading = false;
		}
	}

	async stopRpc() {
		this.isLoading = true;
		this.errorMsg = null;
		try {
			await invoke('stop_rpc');
			this.isActive = false;
			this.stopPreviewTimer();
		} catch (e) {
			this.errorMsg = String(e);
		} finally {
			this.isLoading = false;
		}
	}
}

export const activity = new ActivityStore();
