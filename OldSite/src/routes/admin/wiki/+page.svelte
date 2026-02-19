<script lang="ts">
	import WikiSearch from '$lib/components/wiki/WikiSearch.svelte';
	import WikiCategoryFilter from '$lib/components/wiki/WikiCategoryFilter.svelte';
	import WikiPageCard from '$lib/components/wiki/WikiPageCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedCategory = $state<string | null>(null);
	let searchQuery = $state('');

	const filteredPages = $derived(() => {
		let filtered = data.pages;

		// Filter by category
		if (selectedCategory) {
			filtered = filtered.filter((page) => page.category === selectedCategory);
		}

		return filtered;
	});

	const stats = $derived(() => {
		const totalPages = data.pages.length;
		const categories = new Set(data.pages.map((p) => p.category).filter(Boolean)).size;
		const totalViews = data.pages.reduce((sum, p) => sum + p.viewCount, 0);

		return { totalPages, categories, totalViews };
	});
</script>

<svelte:head>
	<title>Wiki - Admin Dashboard</title>
</svelte:head>

<div class="wiki-page">
	<!-- Header -->
	<div class="page-header">
		<div class="header-content">
			<div class="header-text">
				<h1 class="page-title">Admin Wiki</h1>
				<p class="page-description">Internal knowledge base and documentation</p>
			</div>
			<a href="/admin/wiki/new" class="create-btn">
				<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Create Page
			</a>
		</div>

		<!-- Stats -->
		<div class="stats-row">
			<div class="stat-card">
				<svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<div class="stat-content">
					<div class="stat-value">{stats().totalPages}</div>
					<div class="stat-label">Total Pages</div>
				</div>
			</div>

			<div class="stat-card">
				<svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
					/>
				</svg>
				<div class="stat-content">
					<div class="stat-value">{stats().categories}</div>
					<div class="stat-label">Categories</div>
				</div>
			</div>

			<div class="stat-card">
				<svg class="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
				<div class="stat-content">
					<div class="stat-value">{stats().totalViews}</div>
					<div class="stat-label">Total Views</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="page-content">
		<!-- Sidebar -->
		<aside class="sidebar">
			<WikiCategoryFilter pages={data.pages} bind:selectedCategory />
		</aside>

		<!-- Page List -->
		<main class="main-content">
			<!-- Search -->
			<div class="search-section">
				<WikiSearch pages={data.pages} />
			</div>

			<!-- Pages Grid -->
			{#if filteredPages().length === 0}
				<div class="empty-state">
					{#if selectedCategory}
						<svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<h3>No pages in this category</h3>
						<p>Try selecting a different category or create a new page.</p>
					{:else}
						<svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<h3>No wiki pages yet</h3>
						<p>Get started by creating your first page.</p>
						<a href="/admin/wiki/new" class="empty-action">Create First Page</a>
					{/if}
				</div>
			{:else}
				<div class="pages-grid">
					{#each filteredPages() as page (page.id)}
						<WikiPageCard {page} />
					{/each}
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	.wiki-page {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
		padding: 2rem;
	}

	.page-header {
		max-width: 80rem;
		margin: 0 auto 2rem;
	}

	.header-content {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.header-text {
		flex: 1;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.page-description {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
	}

	.create-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #d5ba7f;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		white-space: nowrap;
	}

	.create-btn:hover {
		background: #b8a06d;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.btn-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.stat-icon {
		width: 2.5rem;
		height: 2.5rem;
		color: #d5ba7f;
		flex-shrink: 0;
	}

	.stat-content {
		flex: 1;
	}

	.stat-value {
		font-size: 1.875rem;
		font-weight: 700;
		color: #111827;
		line-height: 1;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.page-content {
		max-width: 80rem;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 250px 1fr;
		gap: 2rem;
		align-items: start;
	}

	.sidebar {
		position: sticky;
		top: 2rem;
	}

	.main-content {
		min-width: 0;
	}

	.search-section {
		margin-bottom: 2rem;
	}

	.pages-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 0.5rem;
		border: 2px dashed #e5e7eb;
	}

	.empty-icon {
		width: 4rem;
		height: 4rem;
		color: #d1d5db;
		margin: 0 auto 1.5rem;
	}

	.empty-state h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.empty-state p {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
	}

	.empty-action {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #d5ba7f;
		color: white;
		border-radius: 0.5rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s;
	}

	.empty-action:hover {
		background: #b8a06d;
	}

	@media (max-width: 1024px) {
		.page-content {
			grid-template-columns: 1fr;
		}

		.sidebar {
			position: static;
		}
	}

	@media (max-width: 640px) {
		.wiki-page {
			padding: 1rem;
		}

		.page-title {
			font-size: 2rem;
		}

		.header-content {
			flex-direction: column;
		}

		.create-btn {
			width: 100%;
			justify-content: center;
		}

		.pages-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
