<script lang="ts">
	import type { MemorialBlock, TextConfig, TextStyle } from '$lib/types/memorial-blocks';

	interface Props {
		block: MemorialBlock;
		onClose: () => void;
		onSave: (updates: Partial<TextConfig>) => void;
	}

	let { block, onClose, onSave }: Props = $props();

	const config = block.config as TextConfig;

	// Form state
	let content = $state(config.content || '');
	let style = $state<TextStyle>(config.style || 'paragraph');

	function handleSubmit() {
		if (!content.trim()) {
			alert('Please enter text content');
			return;
		}

		onSave({
			content: content.trim(),
			style
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
			<h3>Edit Text Block</h3>
			<button class="close-btn" onclick={onClose}>✕</button>
		</div>

		<div class="modal-body">
			<div class="form-group">
				<label for="text-style">Style</label>
				<select id="text-style" bind:value={style}>
					<option value="paragraph">¶ Paragraph — Normal body text</option>
					<option value="heading">H Heading — Larger, bold text</option>
					<option value="note">📌 Note — Styled card with background</option>
				</select>
			</div>

			<div class="form-group">
				<label for="text-content">Content *</label>
				<textarea
					id="text-content"
					bind:value={content}
					placeholder="Enter your text content..."
					rows="8"
				></textarea>
				<p class="char-count">{content.length} characters</p>
			</div>

			<div class="preview-section">
				<h4>Preview</h4>
				<div class="text-preview" class:heading={style === 'heading'} class:note={style === 'note'}>
					{content || 'Your text will appear here...'}
				</div>
			</div>
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

	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}

	.form-group textarea {
		resize: vertical;
		font-family: inherit;
		line-height: 1.5;
	}

	.char-count {
		margin: 0.5rem 0 0 0;
		font-size: 0.75rem;
		color: #a0aec0;
		text-align: right;
	}

	.preview-section {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e2e8f0;
	}

	.preview-section h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		color: #4a5568;
	}

	.text-preview {
		padding: 1rem;
		border-radius: 0.375rem;
		background: #f7fafc;
		color: #4a5568;
		font-size: 0.9375rem;
		line-height: 1.6;
		min-height: 60px;
		white-space: pre-wrap;
	}

	.text-preview.heading {
		font-size: 1.25rem;
		font-weight: 700;
		color: #2d3748;
		background: transparent;
		border-bottom: 2px solid #e2e8f0;
		border-radius: 0;
		padding: 0.5rem 0;
	}

	.text-preview.note {
		background: #fffbeb;
		border: 1px solid #fcd34d;
		color: #92400e;
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
