<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import WikiEditor from '$lib/components/wiki/WikiEditor.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Pre-fill title from URL query parameter
	const titleFromUrl = $page.url.searchParams.get('title') || '';
	
	let title = $state(titleFromUrl);
	let content = $state('');
	let category = $state('');
	let tags = $state('');
	let isSubmitting = $state(false);

	const pageMap = $derived(new Map(Object.entries(data.pageMap)));

	// Common categories (can be customized)
	const suggestedCategories = [
		'Documentation',
		'Guides',
		'API Reference',
		'Troubleshooting',
		'Best Practices',
		'FAQ'
	];
</script>

<svelte:head>
	<title>Create Wiki Page - Admin Dashboard</title>
</svelte:head>

<div class="create-page">
	<div class="page-container">
		<!-- Header -->
		<header class="page-header">
			<div class="header-content">
				<a href="/admin/wiki" class="back-link">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back to Wiki
				</a>
				<h1 class="page-title">Create New Page</h1>
			</div>
		</header>

		<!-- Form -->
		<form method="POST" use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}>
			<!-- Metadata Section -->
			<div class="form-section">
				<div class="form-row">
					<div class="form-group">
						<label for="title" class="form-label">Page Title *</label>
						<input
							type="text"
							id="title"
							name="title"
							class="form-input"
							bind:value={title}
							placeholder="Enter page title..."
							required
						/>
						<p class="form-hint">This will be used as the page heading and URL</p>
					</div>
				</div>

				<div class="form-row two-cols">
					<div class="form-group">
						<label for="category" class="form-label">Category</label>
						<input
							type="text"
							id="category"
							name="category"
							class="form-input"
							bind:value={category}
							list="category-suggestions"
							placeholder="Select or create category..."
						/>
						<datalist id="category-suggestions">
							{#each suggestedCategories as cat}
								<option value={cat} />
							{/each}
						</datalist>
					</div>

					<div class="form-group">
						<label for="tags" class="form-label">Tags</label>
						<input
							type="text"
							id="tags"
							name="tags"
							class="form-input"
							bind:value={tags}
							placeholder="tag1, tag2, tag3..."
						/>
						<p class="form-hint">Separate tags with commas</p>
					</div>
				</div>
			</div>

			<!-- Editor Section -->
			<div class="form-section">
				<label for="content" class="form-label">Content *</label>
				<input type="hidden" name="content" value={content} />
				<div class="editor-wrapper">
					<WikiEditor bind:content {pageMap} />
				</div>
				<div class="editor-tips">
					<h4>Formatting Tips:</h4>
					<ul>
						<li><strong>Headers:</strong> # H1, ## H2, ### H3</li>
						<li><strong>Bold:</strong> **bold text**</li>
						<li><strong>Italic:</strong> *italic text*</li>
						<li><strong>Wiki Links:</strong> [[Page Title]] or [[Page Title|Display Text]]</li>
						<li><strong>External Links:</strong> [Link Text](https://url.com)</li>
						<li><strong>Code:</strong> `inline code` or ```code block```</li>
					</ul>
				</div>
			</div>

			<!-- Actions -->
			<div class="form-actions">
				<a href="/admin/wiki" class="btn-secondary">Cancel</a>
				<button
					type="submit"
					class="btn-primary"
					disabled={isSubmitting || !title || !content}
				>
					{#if isSubmitting}
						<svg class="spinner" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
								fill="none"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
						Creating...
					{:else}
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						Create Page
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.create-page {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
		padding: 2rem;
	}

	.page-container {
		max-width: 80rem;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		text-decoration: none;
		font-size: 0.9375rem;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #d5ba7f;
	}

	.back-link svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0;
	}

	.form-section {
		background: white;
		border-radius: 0.5rem;
		padding: 2rem;
		margin-bottom: 1.5rem;
		border: 1px solid #e5e7eb;
	}

	.form-row {
		display: grid;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.form-row:last-child {
		margin-bottom: 0;
	}

	.form-row.two-cols {
		grid-template-columns: 1fr 1fr;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-weight: 500;
		color: #111827;
		font-size: 0.9375rem;
	}

	.form-input {
		padding: 0.75rem 1rem;
		font-size: 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		transition: all 0.2s;
	}

	.form-input:focus {
		outline: none;
		border-color: #d5ba7f;
		box-shadow: 0 0 0 3px rgba(213, 186, 127, 0.1);
	}

	.form-hint {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.editor-wrapper {
		height: 32rem;
		margin-bottom: 1rem;
	}

	.editor-tips {
		padding: 1rem;
		background: #f9fafb;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
	}

	.editor-tips h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.editor-tips ul {
		margin: 0;
		padding-left: 1.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.editor-tips li {
		margin: 0.25rem 0;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1.5rem 2rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.btn-secondary,
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
		border-radius: 0.375rem;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		font-size: 1rem;
	}

	.btn-secondary {
		background: white;
		color: #6b7280;
		border: 1px solid #d1d5db;
	}

	.btn-secondary:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.btn-primary {
		background: #d5ba7f;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #b8a06d;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary svg,
	.btn-secondary svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.create-page {
			padding: 1rem;
		}

		.page-title {
			font-size: 2rem;
		}

		.form-row.two-cols {
			grid-template-columns: 1fr;
		}

		.form-section {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column;
		}

		.btn-secondary,
		.btn-primary {
			width: 100%;
			justify-content: center;
		}
	}
</style>
