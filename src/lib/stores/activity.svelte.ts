import { invoke } from '@tauri-apps/api/core';
import { ACTIVITY_TYPES, type ActivityConfig, type TimeMode } from '$lib/types';
import { i18n } from '$lib/i18n';

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
	frozenHours = $state(0);
	frozenMinutes = $state(0);
	fixedDatetime = $state('');

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
			const fixedTs =
				this.timeMode === 'fixed' && this.fixedDatetime
					? Math.floor(new Date(this.fixedDatetime).getTime() / 1000)
					: null;

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
				frozen_hours: this.timeMode === 'frozen' ? this.frozenHours : null,
				frozen_minutes: this.timeMode === 'frozen' ? this.frozenMinutes : null,
				fixed_timestamp: fixedTs,
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
