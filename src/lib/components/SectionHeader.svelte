<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';

	interface Props {
		title: string;
		description?: string;
		enabled: boolean;
		onToggle: () => void;
	}

	let { title, description = '', enabled, onToggle }: Props = $props();
</script>

<div class="flex items-center justify-between">
	<div>
		<p class="text-sm font-medium text-foreground">{title}</p>
		{#if description}
			<p class="text-xs text-muted-foreground mt-0.5">{description}</p>
		{/if}
	</div>
	<Switch checked={enabled} size="sm" onCheckedChange={onToggle} />
</div>
