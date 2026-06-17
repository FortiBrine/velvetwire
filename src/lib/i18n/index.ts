import { writable } from 'svelte/store';
import { en } from './en';

type Language = 'en';

function createI18nStore() {
	const { subscribe, set } = writable<typeof en>(en);

	return {
		subscribe,
		setLanguage: (lang: Language) => {
			if (lang === 'en') set(en);
		},
	};
}

export const i18n = createI18nStore();
