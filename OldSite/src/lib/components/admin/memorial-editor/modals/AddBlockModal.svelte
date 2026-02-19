<script lang="ts">
	import type { BlockType, EmbedConfig, TextConfig } from '$lib/types/memorial-blocks';

	interface Props {
		onClose: () => void;
		onAdd: (type: BlockType, config: any) => void;
	}

	let { onClose, onAdd }: Props = $props();

	// Step state
	let step = $state<'select' | 'configure'>('select');
	let selectedType = $state<BlockType | null>(null);

	// Livestream config
	let streamTitle = $state('');
	let streamDate = $state('');
	let streamTime = $state('');

	// Embed config
	let embedTitle = $state('');
	let embedCode = $state('');
	let embedType = $state<'video' | 'chat' | 'other'>('video');

	// Text config
	let textContent = $state('');
	let textStyle = $state<'paragraph' | 'heading' | 'note'>('paragraph');

	function selectType(type: BlockType) {
		selectedType = type;
		step = 'configure';
	}

	function goBack() {
		step = 'select';
		selectedType = null;
	}

	function handleSubmit() {
		if (!selectedType) return;

		switch (selectedType) {
			case 'livestream':
				if (!streamTitle.trim()) {
					alert('Please enter a stream title');
					return;
				}
				const scheduledStartTime = streamDate && streamTime 
					? `${streamDate}T${streamTime}:00`
					: null;
				onAdd('livestream', {
					title: streamTitle.trim(),
					scheduledStartTime,
					description: ''
				});
				break;

			case 'embed':
				if (!embedCode.trim()) {
					alert('Please enter embed code');
					return;
				}
				onAdd('embed', {
					title: embedTitle.trim() || 'Embed',
					embedCode: embedCode.trim(),
					embedType
				} as EmbedConfig);
				break;

			case 'text':
				if (!textContent.trim()) {
					alert('Please enter text content');
					return;
				}
				onAdd('text', {
					content: textContent.trim(),
					style: textStyle
				} as TextConfig);
				break;
		}
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
			<h3>
				{#if step === 'select'}
					Add Block
				{:else if selectedType === 'livestream'}
					Add Livestream
				{:else if selectedType === 'embed'}
					Add Embed
				{:else if selectedType === 'text'}
					Add Text
				{/if}
			</h3>
			<button class="close-btn" onclick={onClose}>✕</button>
		</div>

		<div class="modal-body">
			{#if step === 'select'}
				<p class="instruction">Select a block type to add:</p>
				
				<div class="type-options">
					<button class="type-option" onclick={() => selectType('livestream')}>
						<span class="type-icon">📹</span>
						<span class="type-name">Livestream</span>
						<span class="type-desc">Add a new scheduled livestream</span>
					</button>

					<button class="type-option" onclick={() => selectType('embed')}>
						<span class="type-icon">🔗</span>
						<span class="type-name">Embed</span>
						<span class="type-desc">Add external video/chat embed (YouTube, Vimeo, etc.)</span>
					</button>

					<button class="type-option" onclick={() => selectType('text')}>
						<span class="type-icon">📝</span>
						<span class="type-name">Text</span>
						<span class="type-desc">Add a text message or announcement</span>
					</button>
				</div>

			{:else if selectedType === 'livestream'}
				<div class="form-group">
					<label for="stream-title">Stream Title *</label>
					<input
						id="stream-title"
						type="text"
						bind:value={streamTitle}
						placeholder="e.g., Memorial Service for John Smith"
					/>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="stream-date">Date</label>
						<input
							id="stream-date"
							type="date"
							bind:value={streamDate}
						/>
					</div>

					<div class="form-group">
						<label for="stream-time">Time</label>
						<input
							id="stream-time"
							type="time"
							bind:value={streamTime}
						/>
					</div>
				</div>

			{:else if selectedType === 'embed'}
				<div class="form-group">
					<label for="embed-title">Title</label>
					<input
						id="embed-title"
						type="text"
						bind:value={embedTitle}
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
						rows="4"
					></textarea>
					<p class="help-text">Supports YouTube, Vimeo, and other video platforms</p>
				</div>

			{:else if selectedType === 'text'}
				<div class="form-group">
					<label for="text-style">Style</label>
					<select id="text-style" bind:value={textStyle}>
						<option value="paragraph">¶ Paragraph</option>
						<option value="heading">H Heading</option>
						<option value="note">📌 Note</option>
					</select>
				</div>

				<div class="form-group">
					<label for="text-content">Content *</label>
					<textarea
						id="text-content"
						bind:value={textContent}
						placeholder="Enter your text content..."
						rows="6"
					></textarea>
				</div>
			{/if}
		</div>

		<div class="modal-footer">
			{#if step === 'configure'}
				<button class="secondary-btn" onclick={goBack}>← Back</button>
			{/if}
			<button class="cancel-btn" onclick={onClose}>Cancel</button>
			{#if step === 'configure'}
				<button class="primary-btn" onclick={handleSubmit}>Add Block</button>
			{/if}
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
		max-width: 500px;
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

	.instruction {
		margin: 0 0 1rem 0;
		color: #4a5568;
	}

	.type-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.type-option {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 0.5rem;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.type-option:hover {
		border-color: #d5ba7f;
		background: #fffbf5;
	}

	.type-icon {
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}

	.type-name {
		font-weight: 600;
		color: #2d3748;
		font-size: 1rem;
	}

	.type-desc {
		font-size: 0.8125rem;
		color: #718096;
		margin-top: 0.25rem;
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
		font-family: inherit;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.help-text {
		margin: 0.5rem 0 0 0;
		font-size: 0.75rem;
		color: #718096;
		font-style: italic;
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

	.secondary-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		margin-right: auto;
	}

	.secondary-btn:hover {
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
