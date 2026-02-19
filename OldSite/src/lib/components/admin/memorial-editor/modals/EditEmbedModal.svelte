<script lang="ts">
	import type { MemorialBlock, EmbedConfig } from '$lib/types/memorial-blocks';

	interface Props {
		block: MemorialBlock;
		onClose: () => void;
		onSave: (updates: Partial<EmbedConfig>) => void;
	}

	let { block, onClose, onSave }: Props = $props();

	const config = block.config as EmbedConfig;

	// Form state
	let title = $state(config.title || '');
	let embedCode = $state(config.embedCode || '');
	let embedType = $state<'video' | 'chat' | 'other'>(config.embedType || 'video');

	function handleSubmit() {
		if (!embedCode.trim()) {
			alert('Please enter embed code');
			return;
		}

		onSave({
			title: title.trim() || 'Embed',
			embedCode: embedCode.trim(),
			embedType
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-overlay" onclick={onClose}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h3>Edit Embed Block</h3>
			<button class="close-btn" onclick={onClose}>✕</button>
		</div>

		<div class="modal-body">
			<div class="form-group">
				<label for="embed-title">Title</label>
				<input
					id="embed-title"
					type="text"
					bind:value={title}
					placeholder="e.g., YouTube Live Stream"
				/>
			</div>

			<div class="form-group">
				<label for="embed-type">Embed Type</label>
				<select id="embed-type" bind:value={embedType}>
					<option value="video">🎬 Video</option>
					<option value="chat">💬 Chat</option>
					<option value="other">🔗 Other</option>
				</select>
			</div>

			<div class="form-group">
				<label for="embed-code">Embed Code or URL *</label>
				<textarea
					id="embed-code"
					bind:value={embedCode}
					placeholder="Paste iframe embed code or video URL..."
					rows="6"
				></textarea>
				<p class="help-text">Supports YouTube, Vimeo, and other video platforms</p>
			</div>

			{#if embedCode.trim()}
				<div class="preview-section">
					<h4>Preview</h4>
					<div class="embed-preview">
						{@html embedCode}
					</div>
				</div>
			{/if}
		</div>

		<div class="modal-footer">
			<button class="cancel-btn" onclick={onClose}>Cancel</button>
			<button class="primary-btn" onclick={handleSubmit}>Save Changes</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #2d3748;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: #718096;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
	}

	.close-btn:hover {
		color: #2d3748;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #4a5568;
		font-size: 0.875rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}

	.form-group textarea {
		resize: vertical;
		font-family: monospace;
	}

	.help-text {
		margin: 0.5rem 0 0 0;
		font-size: 0.75rem;
		color: #718096;
		font-style: italic;
	}

	.preview-section {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.preview-section h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		color: #4a5568;
	}

	.embed-preview {
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		padding: 0.5rem;
		max-height: 300px;
		overflow: hidden;
	}

	.embed-preview :global(iframe) {
		max-width: 100%;
		max-height: 250px;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.cancel-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
	}

	.cancel-btn:hover {
		background: #f7fafc;
	}

	.primary-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: #3182ce;
		color: white;
		font-weight: 600;
		cursor: pointer;
	}

	.primary-btn:hover {
		background: #2c5282;
	}
</style>
