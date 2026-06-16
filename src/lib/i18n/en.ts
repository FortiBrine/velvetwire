export const en = {
	header: {
		title: 'velvetwire',
		subtitle: 'Discord Rich Presence',
		live: 'LIVE',
		inactive: 'Inactive',
		connecting: 'Connecting…',
		update: 'Update',
		start: 'Start',
		stop: 'Stop'
	},
	sections: {
		appId: {
			title: 'App ID',
			description: 'Override the default Client ID',
			placeholder: 'e.g. 1234567890123456789'
		},
		activityType: {
			title: 'Activity Type'
		},
		appName: {
			title: 'App Name',
			description: 'Override activity name (unstable)',
			placeholder: 'My Cool Game'
		},
		text: {
			title: 'Text',
			details: {
				label: 'Details',
				placeholder: 'Primary line of text'
			},
			state: {
				label: 'State',
				placeholder: 'Secondary line of text'
			}
		},
		images: {
			title: 'Images',
			description: 'Large + small image URLs',
			largeImage: {
				label: 'Large Image URL',
				placeholder: 'https://…'
			},
			largeText: {
				label: 'Large Image Tooltip',
				placeholder: 'Hover text'
			},
			smallImage: {
				label: 'Small Image URL',
				placeholder: 'https://…'
			},
			smallText: {
				label: 'Small Image Tooltip',
				placeholder: 'Hover text'
			}
		},
		timestamp: {
			title: 'Timestamp',
			modes: {
				none: 'None',
				freeze: 'Freeze',
				elapsed: 'Elapsed',
				countdown: 'Countdown'
			},
			hours: 'Hours',
			minutes: 'Minutes',
			freeze: {
				info: 'Displays a fixed elapsed time — re-syncs every 5 s to keep drift imperceptible.'
			},
			elapsed: {
				info: 'Starts at the given offset and counts up.'
			},
			countdown: {
				info: 'Counts down from the given duration to zero.'
			}
		},
		buttons: {
			title: 'Buttons',
			description: 'Up to 2 clickable buttons',
			button1: {
				label: 'Button 1',
				labelPlaceholder: 'Label',
				urlPlaceholder: 'https://…'
			},
			button2: {
				label: 'Button 2',
				labelPlaceholder: 'Label',
				urlPlaceholder: 'https://…'
			}
		}
	},
	errors: {
		discord: 'Could not connect to Discord. Make sure the desktop app is running.'
	},
	presets: {
		label: 'Preset',
		unsaved: 'Unsaved…',
		save: 'Save as',
		overwrite: 'Overwrite',
		delete: 'Delete',
		namePlaceholder: 'Preset name…'
	}
};
