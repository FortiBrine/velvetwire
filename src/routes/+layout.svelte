<script lang="ts">
	import './layout.css';

	const { children } = $props();
</script>

<!-- Force dark mode — the app always runs with Discord's dark palette -->
<div class="dark contents">
	{@render children()}
</div>
