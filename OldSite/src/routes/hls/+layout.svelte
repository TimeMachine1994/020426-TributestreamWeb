<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- Minimal layout for HLS embedding - no navbar/footer for OBS -->
{@render children?.()}

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #000;
		overflow: hidden;
		font-family: Arial, sans-serif;
	}
</style>
