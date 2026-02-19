<script lang="ts">
	import type { MemorialBlock, EmbedConfig, TextConfig, LivestreamConfig } from '$lib/types/memorial-blocks';
	import { getBlockIcon, getBlockTypeLabel } from '$lib/utils/block-utils';
	import LivestreamBlock from './blocks/LivestreamBlock.svelte';
	import EmbedBlock from './blocks/EmbedBlock.svelte';
	import TextBlock from './blocks/TextBlock.svelte';

	interface Props {
		block: MemorialBlock;
		stream?: any;
		memorialId: string;
		onEdit: () => void;
		onToggle: (enabled: boolean) => void;
		onDelete: () => void;
		onMoveUp?: () => void;
		onMoveDown?: () => void;
		isFirst?: boolean;
		isLast?: boolean;
	}

	let { block, stream, memorialId, onEdit, onToggle, onDelete, onMoveUp, onMoveDown, isFirst = false, isLast = false }: Props = $props();

	function getBlockTitle(): string {
		switch (block.type) {
			case 'livestream':
				return stream?.title || 'Livestream';
			case 'embed':
				return (block.config as EmbedConfig).title || 'Embed';
			case 'text': {
				const content = (block.config as TextConfig).content;
				return content.length > 50 ? content.substring(0, 50) + '...' : content || 'Text';
			}
			default:
				return 'Block';
		}
	}
</script>

<div class="block-item" class:disabled={!block.enabled}>
	<div class="drag-handle" title="Drag to reorder">
		<span>⋮⋮</span>
	</div>

	<div class="block-icon">
		{getBlockIcon(block.type)}
	</div>

	<div class="block-content">
		<div class="block-header">
			<span class="block-type">{getBlockTypeLabel(block.type)}</span>
			<span class="block-title">{getBlockTitle()}</span>
		</div>

		<div class="block-preview">
			{#if block.type === 'livestream'}
				<LivestreamBlock {block} {stream} {memorialId} />
			{:else if block.type === 'embed'}
				<EmbedBlock {block} />
			{:else if block.type === 'text'}
				<TextBlock {block} />
			{/if}
		</div>
	</div>

	<div class="block-actions">
		{#if onMoveUp}
			<button
				class="action-btn move-btn"
				onclick={onMoveUp}
				disabled={isFirst}
				title="Move up"
			>
				▲
			</button>
		{/if}

		{#if onMoveDown}
			<button
				class="action-btn move-btn"
				onclick={onMoveDown}
				disabled={isLast}
				title="Move down"
			>
				▼
			</button>
		{/if}

		<button
			class="action-btn toggle-btn"
			class:enabled={block.enabled}
			onclick={() => onToggle(!block.enabled)}
			title={block.enabled ? 'Hide from public page' : 'Show on public page'}
		>
			{block.enabled ? '👁️' : '👁️‍🗨️'}
		</button>

		<button
			class="action-btn edit-btn"
			onclick={onEdit}
			title="Edit block"
		>
			✏️
		</button>

		<button
			class="action-btn delete-btn"
			onclick={onDelete}
			title="Delete block"
		>
			🗑️
		</button>
	</div>
</div>

<style>
	.block-item {
		display: flex;
		align-items: stretch;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
		transition: all 0.2s;
	}

	.block-item:hover {
		border-color: #cbd5e0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.block-item.disabled {
		opacity: 0.6;
		background: #f7fafc;
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		background: #f7fafc;
		cursor: grab;
		color: #a0aec0;
		font-size: 1rem;
		user-select: none;
	}

	.drag-handle:hover {
		background: #edf2f7;
		color: #718096;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.block-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		font-size: 1.25rem;
		background: #f7fafc;
		border-right: 1px solid #e2e8f0;
	}

	.block-content {
		flex: 1;
		padding: 0.75rem 1rem;
		min-width: 0;
	}

	.block-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.block-type {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #718096;
		background: #edf2f7;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
	}

	.block-title {
		font-weight: 600;
		color: #2d3748;
		font-size: 0.9375rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.block-preview {
		font-size: 0.875rem;
		color: #4a5568;
	}

	.block-actions {
		display: flex;
		flex-direction: column;
		border-left: 1px solid #e2e8f0;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: none;
		background: white;
		cursor: pointer;
		transition: background 0.2s;
		font-size: 1rem;
	}

	.action-btn:hover {
		background: #f7fafc;
	}

	.toggle-btn {
		border-bottom: 1px solid #e2e8f0;
	}

	.toggle-btn:not(.enabled) {
		opacity: 0.5;
	}

	.edit-btn {
		border-bottom: 1px solid #e2e8f0;
	}

	.delete-btn:hover {
		background: #fed7d7;
	}

	.move-btn {
		border-bottom: 1px solid #e2e8f0;
		font-size: 0.75rem;
		color: #718096;
	}

	.move-btn:hover:not(:disabled) {
		background: #ebf8ff;
		color: #3182ce;
	}

	.move-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
