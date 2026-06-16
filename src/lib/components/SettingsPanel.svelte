<script lang="ts">
	import { activity } from '$lib/stores/activity.svelte';
	import { i18n } from '$lib/i18n';
	import { ACTIVITY_TYPES, CHAR_LIMITS } from '$lib/stores/activity.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
</script>

<div class="flex flex-col gap-4 p-5 overflow-y-auto h-full">

	<div class="space-y-3">
		<SectionHeader
			title={$i18n.sections.appId.title}
			description={$i18n.sections.appId.description}
			enabled={activity.customClientIdEnabled}
			onToggle={() => (activity.customClientIdEnabled = !activity.customClientIdEnabled)}
		/>
		{#if activity.customClientIdEnabled}
			<div class="space-y-1.5">
				<Label class="text-xs text-muted-foreground">Discord Application ID</Label>
				<Input
					placeholder={$i18n.sections.appId.placeholder}
					bind:value={activity.customClientId}
					class="h-8 text-xs bg-input border-border font-mono"
				/>
			</div>
		{/if}
	</div>

	<Separator class="bg-border/50" />

	<div class="space-y-3">
		<p class="text-sm font-medium text-foreground">{$i18n.sections.activityType.title}</p>
		<Select.Root
			type="single"
			value={activity.activityType}
			onValueChange={(v: string) => { activity.activityType = v; }}
		>
			<Select.Trigger class="h-8 text-xs bg-input border-border w-full">
				<span class="flex items-center gap-1.5 text-foreground">
					{activity.activityTypeMeta.icon} {activity.activityTypeMeta.label}
				</span>
			</Select.Trigger>
			<Select.Content class="bg-popover border-border text-xs">
				{#each ACTIVITY_TYPES as t}
					<Select.Item value={t.value} label="{t.icon} {t.label}" />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<Separator class="bg-border/50" />

	<div class="space-y-3">
		<SectionHeader
			title={$i18n.sections.appName.title}
			description={$i18n.sections.appName.description}
			enabled={activity.nameEnabled}
			onToggle={() => (activity.nameEnabled = !activity.nameEnabled)}
		/>
		{#if activity.nameEnabled}
			<Input
				placeholder={$i18n.sections.appName.placeholder}
				bind:value={activity.activityName}
				class="h-8 text-xs bg-input border-border"
			/>
			<p class="text-right text-[10px] {activity.activityName.length > CHAR_LIMITS.activityName ? 'text-destructive' : 'text-muted-foreground'}">
				{activity.activityName.length}/{CHAR_LIMITS.activityName}
			</p>
		{/if}
	</div>

	<Separator class="bg-border/50" />

	<div class="space-y-3">
		<p class="text-sm font-medium text-foreground">{$i18n.sections.text.title}</p>

		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label class="text-xs text-muted-foreground">{$i18n.sections.text.details.label}</Label>
				<Switch
					checked={activity.detailsEnabled}
					size="sm"
					onCheckedChange={() => (activity.detailsEnabled = !activity.detailsEnabled)}
				/>
			</div>
			{#if activity.detailsEnabled}
				<Input
					placeholder={$i18n.sections.text.details.placeholder}
					bind:value={activity.details}
					class="h-8 text-xs bg-input border-border"
				/>
				<p class="text-right text-[10px] {activity.details.length > CHAR_LIMITS.details ? 'text-destructive' : 'text-muted-foreground'}">
					{activity.details.length}/{CHAR_LIMITS.details}
				</p>
			{/if}
		</div>

		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label class="text-xs text-muted-foreground">{$i18n.sections.text.state.label}</Label>
				<Switch
					checked={activity.stateEnabled}
					size="sm"
					onCheckedChange={() => (activity.stateEnabled = !activity.stateEnabled)}
				/>
			</div>
			{#if activity.stateEnabled}
				<Input
					placeholder={$i18n.sections.text.state.placeholder}
					bind:value={activity.stateText}
					class="h-8 text-xs bg-input border-border"
				/>
				<p class="text-right text-[10px] {activity.stateText.length > CHAR_LIMITS.stateText ? 'text-destructive' : 'text-muted-foreground'}">
					{activity.stateText.length}/{CHAR_LIMITS.stateText}
				</p>
			{/if}
		</div>
	</div>

</div>
