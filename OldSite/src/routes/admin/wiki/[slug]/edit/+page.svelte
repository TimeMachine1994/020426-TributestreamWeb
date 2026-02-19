<script lang="ts">
	import { enhance } from '$app/forms';
	import WikiEditor from '$lib/components/wiki/WikiEditor.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let title = $state(data.page.title);
	let content = $state(data.page.content);
	let category = $state(data.page.category || '');
	let tags = $state(data.page.tags.join(', '));
	let isSubmitting = $state(false);
	let showDeleteConfirm = $state(false);

	const pageMap = $derived(new Map(Object.entries(data.pageMap)));

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
	<title>Edit {data.page.title} - Wiki</title>
</svelte:head>

<div class="edit-page">
	<div class="page-container">
		<!-- Header -->
		<header class="page-header">
			<div class="header-content">
				<a href="/admin/wiki/{data.page.slug}" class="back-link">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back to Page
				</a>
				<h1 class="page-title">Edit Page</h1>
				<p class="page-subtitle">Version {data.page.version}</p>
			</div>
		</header>

		<!-- Form -->
		<form method="POST" action="?/update" use:enhance={() => {
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
			</div>

			<!-- Actions -->
			<div class="form-actions">
				<button
					type="button"
					class="btn-danger"
					onclick={() => (showDeleteConfirm = true)}
				>
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
					Delete
				</button>

				<div class="actions-right">
					<a href="/admin/wiki/{data.page.slug}" class="btn-secondary">Cancel</a>
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
							Saving...
						{:else}
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							Save Changes
						{/if}
					</button>
				</div>
			</div>
		</form>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="modal-overlay" onclick={() => (showDeleteConfirm = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Delete Page</h3>
				<button class="modal-close" onclick={() => (showDeleteConfirm = false)}>
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<div class="modal-content">
				<p>Are you sure you want to delete "<strong>{data.page.title}</strong>"?</p>
				<p class="modal-warning">This action cannot be undone.</p>
			</div>
			<div class="modal-actions">
				<button class="btn-secondary" onclick={() => (showDeleteConfirm = false)}>
					Cancel
				</button>
				<form method="POST" action="?/delete" use:enhance>
					<button type="submit" class="btn-danger">Delete Page</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	.edit-page {
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
		gap: 0.5rem;
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

	.page-subtitle {
		font-size: 0.9375rem;
		color: #6b7280;
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
	}

	.form-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.actions-right {
		display: flex;
		gap: 1rem;
	}

	.btn-secondary,
	.btn-primary,
	.btn-danger {
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

	.btn-danger {
		background: #dc2626;
		color: white;
	}

	.btn-danger:hover {
		background: #b91c1c;
	}

	.btn-primary svg,
	.btn-secondary svg,
	.btn-danger svg {
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

	/* Modal styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal {
		background: white;
		border-radius: 0.5rem;
		max-width: 28rem;
		width: 100%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
	}

	.modal-close:hover {
		background: #f3f4f6;
		color: #111827;
	}

	.modal-close svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.modal-content {
		padding: 1.5rem;
	}

	.modal-content p {
		color: #374151;
		margin: 0 0 1rem 0;
		line-height: 1.6;
	}

	.modal-content p:last-child {
		margin-bottom: 0;
	}

	.modal-warning {
		color: #dc2626;
		font-weight: 500;
		font-size: 0.9375rem;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	@media (max-width: 768px) {
		.edit-page {
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
			align-items: stretch;
		}

		.actions-right {
			flex-direction: column;
		}

		.btn-secondary,
		.btn-primary,
		.btn-danger {
			width: 100%;
			justify-content: center;
		}
	}
</style>
