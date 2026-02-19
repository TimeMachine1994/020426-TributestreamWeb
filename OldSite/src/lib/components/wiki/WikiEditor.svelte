<script lang="ts">
	import { parseMarkdown } from '$lib/utils/wiki/markdown';
	import { replaceWikiLinksClient } from '$lib/utils/wiki/wiki-links';
	import type { WikiPage } from '$lib/types/wiki';

	interface Props {
		content: string;
		pageMap?: Map<string, string>;
		onContentChange?: (content: string) => void;
	}

	let { content = $bindable(''), pageMap = new Map(), onContentChange }: Props = $props();

	let showPreview = $state(true);
	let editorTextarea: HTMLTextAreaElement | undefined = $state();

	// Parse markdown with wiki links
	const htmlContent = $derived(() => {
		let html = parseMarkdown(content);
		if (pageMap.size > 0) {
			html = replaceWikiLinksClient(html, pageMap);
		}
		return html;
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		content = target.value;
		onContentChange?.(content);
	}

	function insertMarkdown(before: string, after: string = '') {
		if (!editorTextarea) return;

		const start = editorTextarea.selectionStart;
		const end = editorTextarea.selectionEnd;
		const selectedText = content.substring(start, end);
		const newText = before + selectedText + after;

		content = content.substring(0, start) + newText + content.substring(end);
		onContentChange?.(content);

		// Restore selection
		setTimeout(() => {
			if (editorTextarea) {
				editorTextarea.focus();
				const newPos = start + before.length + selectedText.length;
				editorTextarea.setSelectionRange(newPos, newPos);
			}
		}, 0);
	}

	function insertHeading(level: number) {
		insertMarkdown('#'.repeat(level) + ' ', '\n');
	}

	function insertWikiLink() {
		insertMarkdown('[[', ']]');
	}
</script>

<div class="wiki-editor">
	<!-- Toolbar -->
	<div class="editor-toolbar">
		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn"
				onclick={() => insertHeading(1)}
				title="Heading 1"
			>
				<span class="btn-text">H1</span>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				onclick={() => insertHeading(2)}
				title="Heading 2"
			>
				<span class="btn-text">H2</span>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				onclick={() => insertHeading(3)}
				title="Heading 3"
			>
				<span class="btn-text">H3</span>
			</button>
		</div>

		<div class="toolbar-group">
			<button
				type="button"
				class="toolbar-btn"
				onclick={() => insertMarkdown('**', '**')}
				title="Bold"
			>
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 12h8m0 0a4 4 0 100-8H6v8zm8 0a4 4 0 110 8H6v-8z"
					/>
				</svg>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				onclick={() => insertMarkdown('*', '*')}
				title="Italic"
			>
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
					/>
				</svg>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				onclick={() => insertMarkdown('`', '`')}
				title="Code"
			>
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
					/>
				</svg>
			</button>
		</div>

		<div class="toolbar-group">
			<button type="button" class="toolbar-btn" onclick={insertWikiLink} title="Wiki Link">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
					/>
				</svg>
			</button>
			<button
				type="button"
				class="toolbar-btn"
				onclick={() => insertMarkdown('[', '](url)')}
				title="Link"
			>
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					/>
				</svg>
			</button>
		</div>

		<div class="toolbar-spacer"></div>

		<button
			type="button"
			class="toolbar-btn toggle-btn"
			class:active={showPreview}
			onclick={() => (showPreview = !showPreview)}
			title="Toggle Preview"
		>
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
				/>
			</svg>
		</button>
	</div>

	<!-- Editor and Preview -->
	<div class="editor-content" class:split-view={showPreview}>
		<div class="editor-pane">
			<textarea
				bind:this={editorTextarea}
				class="editor-textarea"
				bind:value={content}
				oninput={handleInput}
				placeholder="Start writing... Use [[Page Title]] for wiki links"
				spellcheck="true"
			></textarea>
		</div>

		{#if showPreview}
			<div class="preview-pane">
				<div class="preview-content">
					{@html htmlContent()}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.wiki-editor {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		overflow: hidden;
		background: white;
	}

	.editor-toolbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
		flex-wrap: wrap;
	}

	.toolbar-group {
		display: flex;
		gap: 0.25rem;
		padding: 0 0.5rem;
		border-right: 1px solid #e5e7eb;
	}

	.toolbar-group:last-of-type {
		border-right: none;
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: all 0.2s;
		color: #6b7280;
	}

	.toolbar-btn:hover {
		background: white;
		border-color: #d5ba7f;
		color: #d5ba7f;
	}

	.toolbar-btn.toggle-btn.active {
		background: #fef3c7;
		color: #92400e;
		border-color: #d5ba7f;
	}

	.toolbar-btn svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	.btn-text {
		font-size: 0.75rem;
		font-weight: 600;
	}

	.toolbar-spacer {
		flex: 1;
	}

	.editor-content {
		display: grid;
		grid-template-columns: 1fr;
		flex: 1;
		overflow: hidden;
	}

	.editor-content.split-view {
		grid-template-columns: 1fr 1fr;
	}

	.editor-pane,
	.preview-pane {
		overflow-y: auto;
		height: 100%;
	}

	.editor-pane {
		border-right: 1px solid #e5e7eb;
	}

	.editor-textarea {
		width: 100%;
		height: 100%;
		padding: 1.5rem;
		font-family: 'Courier New', monospace;
		font-size: 0.9375rem;
		line-height: 1.6;
		border: none;
		resize: none;
		outline: none;
	}

	.preview-pane {
		background: #f9fafb;
	}

	.preview-content {
		padding: 1.5rem;
		font-size: 1rem;
		line-height: 1.6;
		color: #111827;
	}

	/* Markdown preview styles */
	.preview-content :global(h1) {
		font-size: 2rem;
		font-weight: 700;
		margin: 2rem 0 1rem 0;
		color: #111827;
	}

	.preview-content :global(h2) {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 1.5rem 0 0.75rem 0;
		color: #111827;
	}

	.preview-content :global(h3) {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 1.25rem 0 0.5rem 0;
		color: #111827;
	}

	.preview-content :global(p) {
		margin: 1rem 0;
	}

	.preview-content :global(code) {
		padding: 0.125rem 0.375rem;
		background: #f3f4f6;
		border-radius: 0.25rem;
		font-family: 'Courier New', monospace;
		font-size: 0.875em;
	}

	.preview-content :global(pre) {
		padding: 1rem;
		background: #1f2937;
		color: #f9fafb;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	.preview-content :global(pre code) {
		background: transparent;
		padding: 0;
		color: inherit;
	}

	.preview-content :global(a.wiki-link) {
		color: #d5ba7f;
		text-decoration: none;
		border-bottom: 1px solid #d5ba7f;
	}

	.preview-content :global(a.wiki-link:hover) {
		color: #b8a06d;
		border-bottom-color: #b8a06d;
	}

	.preview-content :global(a.wiki-link-broken) {
		color: #dc2626;
		text-decoration: none;
		border-bottom: 1px dashed #dc2626;
		cursor: pointer;
		transition: all 0.2s;
	}

	.preview-content :global(a.wiki-link-broken:hover) {
		color: #991b1b;
		border-bottom-color: #991b1b;
		background: #fee2e2;
	}

	.preview-content :global(ul),
	.preview-content :global(ol) {
		margin: 1rem 0;
		padding-left: 2rem;
	}

	.preview-content :global(li) {
		margin: 0.5rem 0;
	}

	@media (max-width: 768px) {
		.editor-content.split-view {
			grid-template-columns: 1fr;
		}

		.preview-pane {
			display: none;
		}
	}
</style>
