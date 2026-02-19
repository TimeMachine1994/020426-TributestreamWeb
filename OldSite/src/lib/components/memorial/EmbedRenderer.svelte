<script lang="ts">
	import type { EmbedConfig } from '$lib/types/memorial-blocks';

	interface Props {
		config: EmbedConfig;
	}

	let { config }: Props = $props();

	// Sanitize and prepare embed code
	function getSafeEmbedHtml(embedCode: string): string {
		// If it's just a URL, wrap it in an iframe
		if (embedCode.startsWith('http') && !embedCode.includes('<')) {
			return `<iframe src="${embedCode}" width="100%" height="450" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="aspect-ratio: 16/9;"></iframe>`;
		}
		
		// Return the embed code as-is (it should already be an iframe)
		return embedCode;
	}

	const safeHtml = $derived(getSafeEmbedHtml(config.embedCode));
</script>

<div class="embed-renderer" class:video={config.embedType === 'video'} class:chat={config.embedType === 'chat'}>
	{#if config.title}
		<h3 class="embed-title">{config.title}</h3>
	{/if}
	
	<div class="embed-container">
		{@html safeHtml}
	</div>
</div>

<style>
	.embed-renderer {
		width: 100%;
	}

	.embed-title {
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #2d3748;
	}

	.embed-container {
		width: 100%;
		background: #000;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.embed-renderer.video .embed-container {
		aspect-ratio: 16 / 9;
	}

	.embed-renderer.chat .embed-container {
		min-height: 400px;
		max-height: 600px;
	}

	.embed-container :global(iframe) {
		width: 100%;
		height: 100%;
		border: none;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.embed-renderer.chat .embed-container {
			min-height: 300px;
		}
	}
</style>
