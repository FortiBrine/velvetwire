<script lang="ts">
	import { onDestroy } from 'svelte';
	import { activity } from '$lib/stores/activity.svelte';
	import { i18n } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import DetailsPanel from '$lib/components/DetailsPanel.svelte';
	import PresetBar from '$lib/components/PresetBar.svelte';

	onDestroy(() => activity.stopPreviewTimer());
</script>

<div class="flex flex-col h-screen bg-background text-foreground select-none overflow-hidden">

	<header class="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
		<div class="flex items-center gap-2.5 mr-auto">
			<span class="font-semibold text-sm text-foreground">{$i18n.header.title}</span>
			<span class="text-xs text-muted-foreground">{$i18n.header.subtitle}</span>
		</div>

		{#if activity.isActive}
			<div class="flex items-center gap-1.5">
				<span class="relative flex size-2">
					<span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
					<span class="relative inline-flex rounded-full size-2 bg-emerald-400"></span>
				</span>
				<span class="text-xs font-medium text-emerald-400">{$i18n.header.live}</span>
			</div>
		{:else}
			<span class="text-xs text-muted-foreground">{$i18n.header.inactive}</span>
		{/if}

		<div class="flex gap-2">
			<Button
				size="sm"
				variant="outline"
				class="h-8 px-3 text-xs border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
				disabled={!activity.isActive || activity.isLoading}
				onclick={() => activity.stopRpc()}
			>
				{$i18n.header.stop}
			</Button>
			<Button
				size="sm"
				class="h-8 px-4 text-xs bg-primary hover:bg-primary/90 disabled:opacity-40"
				disabled={activity.isLoading || activity.isOverLimit}
				onclick={() => activity.startRpc()}
			>
				{activity.isLoading ? $i18n.header.connecting : activity.isActive ? $i18n.header.update : $i18n.header.start}
			</Button>
		</div>
	</header>

	{#if activity.errorMsg}
		<div class="flex items-center gap-2 px-5 py-2 bg-destructive/10 border-b border-destructive/30 text-destructive text-xs shrink-0">
			<svg viewBox="0 0 16 16" fill="currentColor" class="size-3.5 shrink-0">
				<path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 3.5h1.5v5h-1.5v-5Zm.75 7.25a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z" />
			</svg>
			<span class="flex-1 truncate">{activity.errorMsg}</span>
			<button
				class="text-destructive/60 hover:text-destructive transition-colors"
				onclick={() => (activity.errorMsg = null)}
			>
				✕
			</button>
		</div>
	{/if}

	<PresetBar />

	<div class="grid grid-cols-2 flex-1 overflow-hidden divide-x divide-border">
		<SettingsPanel />
		<DetailsPanel />
	</div>

</div>
