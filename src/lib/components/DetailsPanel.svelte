<script lang="ts">
	import { activity } from '$lib/stores/activity.svelte';
	import { i18n } from '$lib/i18n';
	import { type TimeMode, CHAR_LIMITS } from '$lib/stores/activity.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';

	const timeModes: { value: TimeMode; label: string }[] = [
		{ value: 'none', label: $i18n.sections.timestamp.modes.none },
		{ value: 'freeze', label: $i18n.sections.timestamp.modes.freeze },
		{ value: 'elapsed', label: $i18n.sections.timestamp.modes.elapsed },
		{ value: 'countdown', label: $i18n.sections.timestamp.modes.countdown }
	];
</script>

<div class="flex flex-col gap-4 p-5 overflow-y-auto h-full">

	<div class="space-y-3">
		<SectionHeader
			title={$i18n.sections.images.title}
			description={$i18n.sections.images.description}
			enabled={activity.imagesEnabled}
			onToggle={() => (activity.imagesEnabled = !activity.imagesEnabled)}
		/>
		{#if activity.imagesEnabled}
			<div class="space-y-2">
				<div class="space-y-1.5">
					<Label class="text-xs text-muted-foreground">{$i18n.sections.images.largeImage.label}</Label>
					<Input
						placeholder={$i18n.sections.images.largeImage.placeholder}
						bind:value={activity.largeImage}
						class="h-8 text-xs bg-input border-border"
					/>
					<p class="text-right text-[10px] {activity.largeImage.length > CHAR_LIMITS.largeImage ? 'text-destructive' : 'text-muted-foreground'}">
						{activity.largeImage.length}/{CHAR_LIMITS.largeImage}
					</p>
				</div>
				<div class="space-y-1.5">
					<Label class="text-xs text-muted-foreground">{$i18n.sections.images.largeText.label}</Label>
					<Input
						placeholder={$i18n.sections.images.largeText.placeholder}
						bind:value={activity.largeText}
						class="h-8 text-xs bg-input border-border"
					/>
					<p class="text-right text-[10px] {activity.largeText.length > CHAR_LIMITS.largeText ? 'text-destructive' : 'text-muted-foreground'}">
						{activity.largeText.length}/{CHAR_LIMITS.largeText}
					</p>
				</div>
				<div class="space-y-1.5">
					<Label class="text-xs text-muted-foreground">{$i18n.sections.images.smallImage.label}</Label>
					<Input
						placeholder={$i18n.sections.images.smallImage.placeholder}
						bind:value={activity.smallImage}
						class="h-8 text-xs bg-input border-border"
					/>
					<p class="text-right text-[10px] {activity.smallImage.length > CHAR_LIMITS.smallImage ? 'text-destructive' : 'text-muted-foreground'}">
						{activity.smallImage.length}/{CHAR_LIMITS.smallImage}
					</p>
				</div>
				<div class="space-y-1.5">
					<Label class="text-xs text-muted-foreground">{$i18n.sections.images.smallText.label}</Label>
					<Input
						placeholder={$i18n.sections.images.smallText.placeholder}
						bind:value={activity.smallText}
						class="h-8 text-xs bg-input border-border"
					/>
					<p class="text-right text-[10px] {activity.smallText.length > CHAR_LIMITS.smallText ? 'text-destructive' : 'text-muted-foreground'}">
						{activity.smallText.length}/{CHAR_LIMITS.smallText}
					</p>
				</div>
			</div>
		{/if}
	</div>

	<Separator class="bg-border/50" />

	<div class="space-y-3">
		<p class="text-sm font-medium text-foreground">{$i18n.sections.timestamp.title}</p>

		<div class="grid grid-cols-4 gap-1 bg-input rounded-md p-0.5">
			{#each timeModes as { value, label }}
				<button
					class="rounded px-2 py-1 text-xs font-medium transition-all
						{activity.timeMode === value
						? 'bg-secondary text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'}"
					onclick={() => (activity.timeMode = value)}
				>
					{label}
				</button>
			{/each}
		</div>

		{#if activity.timeMode !== 'none'}
			<div class="grid grid-cols-2 gap-2">
				<div class="space-y-1.5">
					<Label class="text-xs text-muted-foreground">{$i18n.sections.timestamp.hours}</Label>
					<Input
						type="number"
						min="0"
						max="99"
						bind:value={activity.offsetHours}
						class="h-8 text-xs bg-input border-border text-center"
					/>
				</div>
				<div class="space-y-1.5">
					<Label class="text-xs text-muted-foreground">{$i18n.sections.timestamp.minutes}</Label>
					<Input
						type="number"
						min="0"
						max="59"
						bind:value={activity.offsetMinutes}
						class="h-8 text-xs bg-input border-border text-center"
					/>
				</div>
			</div>
			{#if activity.timeMode === 'freeze'}
				<p class="text-xs text-muted-foreground">{$i18n.sections.timestamp.freeze.info}</p>
			{:else if activity.timeMode === 'elapsed'}
				<p class="text-xs text-muted-foreground">{$i18n.sections.timestamp.elapsed.info}</p>
			{:else if activity.timeMode === 'countdown'}
				<p class="text-xs text-muted-foreground">{$i18n.sections.timestamp.countdown.info}</p>
			{/if}
		{/if}
	</div>

	<Separator class="bg-border/50" />

	<div class="space-y-3">
		<SectionHeader
			title={$i18n.sections.buttons.title}
			description={$i18n.sections.buttons.description}
			enabled={activity.buttonsEnabled}
			onToggle={() => (activity.buttonsEnabled = !activity.buttonsEnabled)}
		/>
		{#if activity.buttonsEnabled}
			<div class="space-y-2">
				<div class="space-y-1.5">
					<Label class="text-xs text-muted-foreground">{$i18n.sections.buttons.button1.label}</Label>
					<div class="grid grid-cols-2 gap-2">
						<Input
							placeholder={$i18n.sections.buttons.button1.labelPlaceholder}
							bind:value={activity.button1Label}
							class="h-8 text-xs bg-input border-border"
						/>
						<Input
							placeholder={$i18n.sections.buttons.button1.urlPlaceholder}
							bind:value={activity.button1Url}
							class="h-8 text-xs bg-input border-border"
						/>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<p class="text-right text-[10px] {activity.button1Label.length > CHAR_LIMITS.button1Label ? 'text-destructive' : 'text-muted-foreground'}">
							{activity.button1Label.length}/{CHAR_LIMITS.button1Label}
						</p>
						<p class="text-right text-[10px] {activity.button1Url.length > CHAR_LIMITS.button1Url ? 'text-destructive' : 'text-muted-foreground'}">
							{activity.button1Url.length}/{CHAR_LIMITS.button1Url}
						</p>
					</div>
				</div>
				<div class="space-y-1.5">
					<Label class="text-xs text-muted-foreground">{$i18n.sections.buttons.button2.label}</Label>
					<div class="grid grid-cols-2 gap-2">
						<Input
							placeholder={$i18n.sections.buttons.button2.labelPlaceholder}
							bind:value={activity.button2Label}
							class="h-8 text-xs bg-input border-border"
						/>
						<Input
							placeholder={$i18n.sections.buttons.button2.urlPlaceholder}
							bind:value={activity.button2Url}
							class="h-8 text-xs bg-input border-border"
						/>
					</div>
					<div class="grid grid-cols-2 gap-2">
						<p class="text-right text-[10px] {activity.button2Label.length > CHAR_LIMITS.button2Label ? 'text-destructive' : 'text-muted-foreground'}">
							{activity.button2Label.length}/{CHAR_LIMITS.button2Label}
						</p>
						<p class="text-right text-[10px] {activity.button2Url.length > CHAR_LIMITS.button2Url ? 'text-destructive' : 'text-muted-foreground'}">
							{activity.button2Url.length}/{CHAR_LIMITS.button2Url}
						</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

</div>
