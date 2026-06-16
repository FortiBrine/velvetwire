<script lang="ts">
	import { presets } from '$lib/stores/presets.svelte';
	import { i18n } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';

	let showNameInput = $state(false);
	let pendingName = $state('');

	const activePresetName = $derived(
		presets.list.find((p) => p.id === presets.activePresetId)?.name ?? null
	);

	function handleSaveClick() {
		if (presets.activePresetId !== null) {
			presets.overwriteActive();
		} else {
			showNameInput = true;
			pendingName = '';
		}
	}

	function handleConfirmSave() {
		if (!pendingName.trim()) return;
		presets.saveNew(pendingName);
		showNameInput = false;
		pendingName = '';
	}

	function handleCancelSave() {
		showNameInput = false;
		pendingName = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleConfirmSave();
		if (e.key === 'Escape') handleCancelSave();
	}
</script>

<div class="flex items-center gap-2 px-5 py-1.5 border-b border-border shrink-0">
	<span class="text-xs text-muted-foreground shrink-0">{$i18n.presets.label}</span>

	{#if showNameInput}
		<Input
			class="h-7 text-xs bg-input border-border flex-1 max-w-52"
			placeholder={$i18n.presets.namePlaceholder}
			bind:value={pendingName}
			onkeydown={handleKeydown}
			autofocus
		/>
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
			disabled={!pendingName.trim()}
			onclick={handleConfirmSave}
		>
			<Check class="size-3.5" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7"
			onclick={handleCancelSave}
		>
			<X class="size-3.5" />
		</Button>
	{:else}
		<Select.Root
			type="single"
			value={presets.activePresetId ?? ''}
			onValueChange={(id) => { if (id) presets.load(id); }}
		>
			<Select.Trigger class="h-7 text-xs bg-input border-border flex-1 max-w-52">
				<span class="text-foreground truncate">
					{activePresetName ?? $i18n.presets.unsaved}
				</span>
			</Select.Trigger>
			<Select.Content class="bg-popover border-border text-xs">
				{#each presets.list as preset (preset.id)}
					<Select.Item value={preset.id} label={preset.name} />
				{/each}
			</Select.Content>
		</Select.Root>

		<Button
			size="sm"
			variant="outline"
			class="h-7 px-2.5 text-xs border-border shrink-0"
			disabled={presets.atLimit && presets.activePresetId === null}
			onclick={handleSaveClick}
		>
			{presets.activePresetId !== null ? $i18n.presets.overwrite : $i18n.presets.save}
		</Button>

		<Button
			variant="ghost"
			size="icon"
			class="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
			disabled={presets.activePresetId === null}
			onclick={() => { if (presets.activePresetId) presets.delete(presets.activePresetId); }}
		>
			<Trash2 class="size-3.5" />
		</Button>
	{/if}
</div>
