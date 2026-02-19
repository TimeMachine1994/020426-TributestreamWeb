<script lang="ts">
	import type { MemorialBlock, BlockType, EmbedConfig, TextConfig, LivestreamConfig } from '$lib/types/memorial-blocks';
	import { sortBlocksByOrder } from '$lib/utils/block-utils';
	import BlockList from './BlockList.svelte';
	import BlockToolbar from './BlockToolbar.svelte';
	import AddBlockModal from './modals/AddBlockModal.svelte';
	import EditLivestreamModal from './modals/EditLivestreamModal.svelte';
	import EditEmbedModal from './modals/EditEmbedModal.svelte';
	import EditTextModal from './modals/EditTextModal.svelte';

	interface Props {
		memorialId: string;
		initialBlocks: MemorialBlock[];
		streams: any[];
		onSave?: () => void;
	}

	let { memorialId, initialBlocks, streams, onSave }: Props = $props();

	// State
	let blocks = $state<MemorialBlock[]>(sortBlocksByOrder(initialBlocks));
	let editingBlock = $state<MemorialBlock | null>(null);
	let showAddModal = $state(false);
	let isSaving = $state(false);
	let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');

	// Find stream data for a livestream block
	function findStream(streamId: string) {
		return streams.find(s => s.id === streamId);
	}

	// Handle reorder from drag-and-drop
	async function handleReorder(newOrder: string[]) {
		isSaving = true;
		saveStatus = 'saving';

		try {
			const response = await fetch(`/api/memorials/${memorialId}/blocks/reorder`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ order: newOrder })
			});

			if (!response.ok) {
				throw new Error('Failed to reorder blocks');
			}

			const data = await response.json();
			blocks = sortBlocksByOrder(data.blocks);
			saveStatus = 'saved';
			setTimeout(() => saveStatus = 'idle', 2000);
		} catch (err) {
			console.error('Error reordering blocks:', err);
			saveStatus = 'error';
		} finally {
			isSaving = false;
		}
	}

	// Handle toggle enabled
	async function handleToggle(blockId: string, enabled: boolean) {
		isSaving = true;
		saveStatus = 'saving';

		try {
			const response = await fetch(`/api/memorials/${memorialId}/blocks/${blockId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled })
			});

			if (!response.ok) {
				throw new Error('Failed to toggle block');
			}

			const data = await response.json();
			blocks = sortBlocksByOrder(data.blocks);
			saveStatus = 'saved';
			setTimeout(() => saveStatus = 'idle', 2000);
		} catch (err) {
			console.error('Error toggling block:', err);
			saveStatus = 'error';
		} finally {
			isSaving = false;
		}
	}

	// Handle delete
	async function handleDelete(blockId: string) {
		if (!confirm('Are you sure you want to delete this block?')) {
			return;
		}

		isSaving = true;
		saveStatus = 'saving';

		try {
			const response = await fetch(`/api/memorials/${memorialId}/blocks/${blockId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete block');
			}

			const data = await response.json();
			blocks = sortBlocksByOrder(data.blocks);
			saveStatus = 'saved';
			setTimeout(() => saveStatus = 'idle', 2000);
			onSave?.();
		} catch (err) {
			console.error('Error deleting block:', err);
			saveStatus = 'error';
		} finally {
			isSaving = false;
		}
	}

	// Handle edit click
	function handleEdit(block: MemorialBlock) {
		editingBlock = block;
	}

	// Handle add block
	async function handleAddBlock(type: BlockType, config: any) {
		isSaving = true;
		saveStatus = 'saving';
		showAddModal = false;

		try {
			let response;

			if (type === 'livestream') {
				// Use special livestream endpoint that creates stream + block
				response = await fetch(`/api/memorials/${memorialId}/blocks/livestream`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(config)
				});
			} else {
				// Use regular block creation
				response = await fetch(`/api/memorials/${memorialId}/blocks`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ type, config })
				});
			}

			if (!response.ok) {
				throw new Error('Failed to create block');
			}

			const data = await response.json();
			blocks = sortBlocksByOrder(data.blocks);
			
			// If a new stream was created, we need to refresh streams
			if (type === 'livestream' && data.stream) {
				streams = [...streams, data.stream];
			}

			saveStatus = 'saved';
			setTimeout(() => saveStatus = 'idle', 2000);
			onSave?.();
		} catch (err) {
			console.error('Error creating block:', err);
			saveStatus = 'error';
		} finally {
			isSaving = false;
		}
	}

	// Handle save from edit modal
	async function handleSaveEdit(blockId: string, updates: any) {
		isSaving = true;
		saveStatus = 'saving';
		editingBlock = null;

		try {
			const response = await fetch(`/api/memorials/${memorialId}/blocks/${blockId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ config: updates })
			});

			if (!response.ok) {
				throw new Error('Failed to update block');
			}

			const data = await response.json();
			blocks = sortBlocksByOrder(data.blocks);
			saveStatus = 'saved';
			setTimeout(() => saveStatus = 'idle', 2000);
		} catch (err) {
			console.error('Error updating block:', err);
			saveStatus = 'error';
		} finally {
			isSaving = false;
		}
	}

	// Handle move up
	function handleMoveUp(blockId: string) {
		const idx = blocks.findIndex(b => b.id === blockId);
		if (idx <= 0) return;
		const newOrder = blocks.map(b => b.id);
		[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
		handleReorder(newOrder);
	}

	// Handle move down
	function handleMoveDown(blockId: string) {
		const idx = blocks.findIndex(b => b.id === blockId);
		if (idx < 0 || idx >= blocks.length - 1) return;
		const newOrder = blocks.map(b => b.id);
		[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
		handleReorder(newOrder);
	}
</script>

<div class="block-editor">
	<div class="editor-header">
		<BlockToolbar onAdd={() => showAddModal = true} />
		<div class="save-status" class:saving={saveStatus === 'saving'} class:saved={saveStatus === 'saved'} class:error={saveStatus === 'error'}>
			{#if saveStatus === 'saving'}
				⏳ Saving...
			{:else if saveStatus === 'saved'}
				✅ Saved
			{:else if saveStatus === 'error'}
				❌ Error saving
			{/if}
		</div>
	</div>

	{#if blocks.length === 0}
		<div class="empty-state">
			<p>📦 No content blocks yet.</p>
			<p>Click "+ Add Block" to add livestreams, embeds, or text content.</p>
		</div>
	{:else}
		<BlockList
			{blocks}
			{streams}
			{memorialId}
			{findStream}
			onReorder={handleReorder}
			onEdit={handleEdit}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onMoveUp={handleMoveUp}
			onMoveDown={handleMoveDown}
		/>
	{/if}
</div>

<!-- Add Block Modal -->
{#if showAddModal}
	<AddBlockModal
		onClose={() => showAddModal = false}
		onAdd={handleAddBlock}
	/>
{/if}

<!-- Edit Modals -->
{#if editingBlock}
	{#if editingBlock.type === 'livestream'}
		<EditLivestreamModal
			block={editingBlock}
			stream={findStream((editingBlock.config as any).streamId)}
			onClose={() => editingBlock = null}
			onSave={(updates) => handleSaveEdit(editingBlock!.id, updates)}
		/>
	{:else if editingBlock.type === 'embed'}
		<EditEmbedModal
			block={editingBlock}
			onClose={() => editingBlock = null}
			onSave={(updates) => handleSaveEdit(editingBlock!.id, updates)}
		/>
	{:else if editingBlock.type === 'text'}
		<EditTextModal
			block={editingBlock}
			onClose={() => editingBlock = null}
			onSave={(updates) => handleSaveEdit(editingBlock!.id, updates)}
		/>
	{/if}
{/if}

<style>
	.block-editor {
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.save-status {
		font-size: 0.875rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		transition: opacity 0.3s;
		opacity: 0;
	}

	.save-status.saving {
		opacity: 1;
		color: #4a5568;
	}

	.save-status.saved {
		opacity: 1;
		color: #22543d;
	}

	.save-status.error {
		opacity: 1;
		color: #c53030;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #718096;
	}

	.empty-state p {
		margin: 0.5rem 0;
	}
</style>
