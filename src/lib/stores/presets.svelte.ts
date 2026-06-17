import { untrack } from 'svelte';
import { get } from 'svelte/store';
import { i18n } from '$lib/i18n';
import { activity, type TimeMode } from './activity.svelte';

export interface PresetConfig {
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

export interface Preset {
	id: string;
	name: string;
	config: PresetConfig;
}

const STORAGE_KEY = 'velvetwire_presets';
const MAX_PRESETS = 20;

function snapshotActivity(): PresetConfig {
	return {
		customClientIdEnabled: activity.customClientIdEnabled,
		customClientId: activity.customClientId,
		activityType: activity.activityType,
		nameEnabled: activity.nameEnabled,
		activityName: activity.activityName,
		detailsEnabled: activity.detailsEnabled,
		details: activity.details,
		stateEnabled: activity.stateEnabled,
		stateText: activity.stateText,
		imagesEnabled: activity.imagesEnabled,
		largeImage: activity.largeImage,
		largeText: activity.largeText,
		smallImage: activity.smallImage,
		smallText: activity.smallText,
		timeMode: activity.timeMode,
		offsetHours: activity.offsetHours,
		offsetMinutes: activity.offsetMinutes,
		buttonsEnabled: activity.buttonsEnabled,
		button1Label: activity.button1Label,
		button1Url: activity.button1Url,
		button2Label: activity.button2Label,
		button2Url: activity.button2Url,
	};
}

function applyToActivity(c: PresetConfig): void {
	activity.customClientIdEnabled = c.customClientIdEnabled;
	activity.customClientId = c.customClientId;
	activity.activityType = c.activityType;
	activity.nameEnabled = c.nameEnabled;
	activity.activityName = c.activityName;
	activity.detailsEnabled = c.detailsEnabled;
	activity.details = c.details;
	activity.stateEnabled = c.stateEnabled;
	activity.stateText = c.stateText;
	activity.imagesEnabled = c.imagesEnabled;
	activity.largeImage = c.largeImage;
	activity.largeText = c.largeText;
	activity.smallImage = c.smallImage;
	activity.smallText = c.smallText;
	activity.timeMode = c.timeMode;
	activity.offsetHours = c.offsetHours;
	activity.offsetMinutes = c.offsetMinutes;
	activity.buttonsEnabled = c.buttonsEnabled;
	activity.button1Label = c.button1Label;
	activity.button1Url = c.button1Url;
	activity.button2Label = c.button2Label;
	activity.button2Url = c.button2Url;
}

class PresetsStore {
	list = $state<Preset[]>([]);
	activePresetId = $state<string | null>(null);

	atLimit = $derived(this.list.length >= MAX_PRESETS);

	constructor() {
		this.#load();

		$effect.root(() => {
			$effect(() => {
				snapshotActivity(); // reading the fields subscribes this effect to each of them
				untrack(() => {
					if (this.activePresetId !== null) this.activePresetId = null;
				});
			});
		});
	}

	#load(): void {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) this.list = JSON.parse(raw) as Preset[];
		} catch (e) {
			this.list = [];
			activity.errorMsg = get(i18n).errors.presetsCorrupted;
		}
	}

	#persist(): void {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.list));
	}

	saveNew(name: string): Preset {
		const preset: Preset = {
			id: crypto.randomUUID(),
			name: name.trim(),
			config: snapshotActivity(),
		};
		this.list = [...this.list, preset];
		untrack(() => {
			this.activePresetId = preset.id;
		});
		this.#persist();
		return preset;
	}

	overwriteActive(): void {
		if (!this.activePresetId) return;
		this.list = this.list.map((p) =>
			p.id === this.activePresetId ? { ...p, config: snapshotActivity() } : p,
		);
		this.#persist();
	}

	load(id: string): void {
		const preset = this.list.find((p) => p.id === id);
		if (!preset) return;
		untrack(() => applyToActivity(preset.config));
		this.activePresetId = id;
	}

	delete(id: string): void {
		this.list = this.list.filter((p) => p.id !== id);
		if (this.activePresetId === id) this.activePresetId = null;
		this.#persist();
	}
}

export const presets = new PresetsStore();
