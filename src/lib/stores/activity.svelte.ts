import { invoke } from '@tauri-apps/api/core';
import { get } from 'svelte/store';
import { i18n } from '$lib/i18n';

export type TimeMode = 'none' | 'freeze' | 'elapsed' | 'countdown';

export interface RpcError {
	code: 'discord_unavailable' | 'internal';
	message: string;
}

// keep in sync with ActivityConfig in activity.rs
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

const ACTIVITY_STORAGE_KEY = 'velvetwire_activity';

interface PersistedActivity {
	customClientIdEnabled: boolean;
	customClientId: string;
	activityType: string;
	nameEnabled: boolean;
	activityName: string;
	detailsEnabled: boolean;
	details: string;
	stateEnabled: boolean;
	stateText: string;
	imagesEnabled: boolean;
	largeImage: string;
	largeText: string;
	smallImage: string;
	smallText: string;
	timeMode: TimeMode;
	offsetHours: number;
	offsetMinutes: number;
	buttonsEnabled: boolean;
	button1Label: string;
	button1Url: string;
	button2Label: string;
	button2Url: string;
}

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
		ACTIVITY_TYPES.find((t) => t.value === this.activityType) ?? ACTIVITY_TYPES[0],
	);

	isOverLimit = $derived(
		this.activityName.length > CHAR_LIMITS.activityName ||
			this.details.length > CHAR_LIMITS.details ||
			this.stateText.length > CHAR_LIMITS.stateText ||
			this.largeImage.length > CHAR_LIMITS.largeImage ||
			this.largeText.length > CHAR_LIMITS.largeText ||
			this.smallImage.length > CHAR_LIMITS.smallImage ||
			this.smallText.length > CHAR_LIMITS.smallText ||
			this.button1Label.length > CHAR_LIMITS.button1Label ||
			this.button1Url.length > CHAR_LIMITS.button1Url ||
			this.button2Label.length > CHAR_LIMITS.button2Label ||
			this.button2Url.length > CHAR_LIMITS.button2Url,
	);

	constructor() {
		this.#loadState();
		$effect.root(() => {
			$effect(() => {
				this.#saveState();
			});
		});
	}

	#snapshot(): PersistedActivity {
		return {
			customClientIdEnabled: this.customClientIdEnabled,
			customClientId: this.customClientId,
			activityType: this.activityType,
			nameEnabled: this.nameEnabled,
			activityName: this.activityName,
			detailsEnabled: this.detailsEnabled,
			details: this.details,
			stateEnabled: this.stateEnabled,
			stateText: this.stateText,
			imagesEnabled: this.imagesEnabled,
			largeImage: this.largeImage,
			largeText: this.largeText,
			smallImage: this.smallImage,
			smallText: this.smallText,
			timeMode: this.timeMode,
			offsetHours: this.offsetHours,
			offsetMinutes: this.offsetMinutes,
			buttonsEnabled: this.buttonsEnabled,
			button1Label: this.button1Label,
			button1Url: this.button1Url,
			button2Label: this.button2Label,
			button2Url: this.button2Url,
		};
	}

	#saveState(): void {
		localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(this.#snapshot()));
	}

	#loadState(): void {
		try {
			const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
			if (!raw) return;
			const s = JSON.parse(raw) as PersistedActivity;
			this.customClientIdEnabled = s.customClientIdEnabled ?? false;
			this.customClientId = s.customClientId ?? '';
			this.activityType = s.activityType ?? '0';
			this.nameEnabled = s.nameEnabled ?? false;
			this.activityName = s.activityName ?? '';
			this.detailsEnabled = s.detailsEnabled ?? true;
			this.details = s.details ?? '';
			this.stateEnabled = s.stateEnabled ?? true;
			this.stateText = s.stateText ?? '';
			this.imagesEnabled = s.imagesEnabled ?? true;
			this.largeImage = s.largeImage ?? '';
			this.largeText = s.largeText ?? '';
			this.smallImage = s.smallImage ?? '';
			this.smallText = s.smallText ?? '';
			this.timeMode = s.timeMode ?? 'none';
			this.offsetHours = s.offsetHours ?? 0;
			this.offsetMinutes = s.offsetMinutes ?? 0;
			this.buttonsEnabled = s.buttonsEnabled ?? false;
			this.button1Label = s.button1Label ?? '';
			this.button1Url = s.button1Url ?? '';
			this.button2Label = s.button2Label ?? '';
			this.button2Url = s.button2Url ?? '';
		} catch {
			// ignore parse errors, start with defaults
		}
	}

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
				button2_url: this.buttonsEnabled ? this.button2Url.trim() || null : null,
			};

			await invoke('start_rpc', { config });
			this.isActive = true;
			if (this.timeMode === 'elapsed') this.startPreviewTimer();
			else this.stopPreviewTimer();
		} catch (e) {
			const err = e as RpcError;
			const locale = get(i18n);
			this.errorMsg =
				err?.code === 'discord_unavailable' ? locale.errors.discord : (err?.message ?? String(e));
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
			const err = e as RpcError;
			this.errorMsg = err?.message ?? String(e);
		} finally {
			this.isLoading = false;
		}
	}
}

export const activity = new ActivityStore();
