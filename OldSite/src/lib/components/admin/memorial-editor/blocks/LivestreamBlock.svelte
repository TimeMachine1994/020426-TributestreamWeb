<script lang="ts">
	import type { MemorialBlock, LivestreamConfig } from '$lib/types/memorial-blocks';
	import StreamCard from '$lib/components/streaming/StreamCard.svelte';

	interface Props {
		block: MemorialBlock;
		stream?: any;
		memorialId: string;
	}

	let { block, stream, memorialId }: Props = $props();

	const config = block.config as LivestreamConfig;
</script>

<div class="livestream-block">
	{#if stream}
		<StreamCard
			{stream}
			canManage={true}
			{memorialId}
		/>
	{:else}
		<div class="stream-missing">
			<p>⚠️ Stream not found</p>
			<p class="stream-id">Stream ID: {config.streamId}</p>
			<p>This stream may have been deleted. Consider removing this block.</p>
		</div>
	{/if}
</div>

<style>
	.livestream-block {
		width: 100%;
	}

	.stream-missing {
		background: #fed7d7;
		border: 1px solid #fc8181;
		border-radius: 0.375rem;
		padding: 1rem;
	}

	.stream-missing p {
		margin: 0.25rem 0;
		font-size: 0.875rem;
		color: #742a2a;
	}

	.stream-missing p:first-child {
		font-weight: 600;
	}

	.stream-id {
		font-family: monospace;
		font-size: 0.75rem !important;
		color: #a0aec0 !important;
	}
</style>
