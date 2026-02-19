<script lang="ts">
	import type { MemorialBlock, LivestreamConfig, EmbedConfig, TextConfig } from '$lib/types/memorial-blocks';
	import { getEnabledBlocks } from '$lib/utils/block-utils';
	import MemorialStreamDisplay from '$lib/components/MemorialStreamDisplay.svelte';
	import EmbedRenderer from './EmbedRenderer.svelte';
	import TextRenderer from './TextRenderer.svelte';

	interface Props {
		blocks: MemorialBlock[];
		streams: any[];
		memorial: any;
	}

	let { blocks, streams, memorial }: Props = $props();

	// Get only enabled blocks, sorted by order
	const enabledBlocks = $derived(getEnabledBlocks(blocks || []));

	// Find stream by ID
	function findStream(streamId: string) {
		return streams?.find(s => s.id === streamId);
	}

	// Get streams for livestream blocks
	function getBlockStreams(block: MemorialBlock): any[] {
		if (block.type !== 'livestream') return [];
		const config = block.config as LivestreamConfig;
		const stream = findStream(config.streamId);
		return stream ? [stream] : [];
	}
</script>

<div class="block-renderer">
	{#each enabledBlocks as block (block.id)}
		<div class="block-container" data-block-type={block.type}>
			{#if block.type === 'livestream'}
				{@const blockStreams = getBlockStreams(block)}
				{#if blockStreams.length > 0}
					<MemorialStreamDisplay 
						streams={blockStreams} 
						memorialName={memorial.lovedOneName}
					/>
				{/if}
			{:else if block.type === 'embed'}
				<EmbedRenderer 
					config={block.config as EmbedConfig} 
				/>
			{:else if block.type === 'text'}
				<TextRenderer 
					config={block.config as TextConfig} 
				/>
			{/if}
		</div>
	{/each}
</div>

<style>
	.block-renderer {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.block-container {
		width: 100%;
	}

	.block-container[data-block-type="text"] {
		/* Text blocks may need different spacing */
	}

	.block-container[data-block-type="embed"] {
		/* Embed blocks styling */
	}
</style>
