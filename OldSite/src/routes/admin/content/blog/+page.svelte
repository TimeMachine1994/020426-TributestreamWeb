<!--
BLOG POSTS ADMIN PAGE

Manage blog posts and articles
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';
	import { applyFilters, type FilterRule } from '$lib/utils/filter-utils';

	let { data } = $props();

	// State
	let selectedPosts = $state<Set<string>>(new Set());
	let showFilters = $state(false);
	let activeFilters = $state<FilterRule[]>([]);

	// Derived filtered data
	let filteredPosts = $derived.by(() => {
		return applyFilters(data.posts, activeFilters);
	});

	// Column configuration
	const columns = [
		{
			id: 'title',
			label: 'Title',
			field: 'title',
			width: 300,
			sortable: true
		},
		{
			id: 'author',
			label: 'Author',
			field: 'author',
			width: 150,
			sortable: true
		},
		{
			id: 'category',
			label: 'Category',
			field: 'category',
			width: 150,
			formatter: (val: string) => {
				const categoryMap: Record<string, string> = {
					'memorial-planning': '💝 Memorial Planning',
					'grief-support': '🤝 Grief Support',
					technology: '💻 Technology',
					'funeral-industry': '🏥 Funeral Industry',
					livestreaming: '📹 Livestreaming',
					'company-news': '📰 Company News',
					'customer-stories': '⭐ Customer Stories'
				};
				return categoryMap[val] || val;
			}
		},
		{
			id: 'status',
			label: 'Status',
			field: 'status',
			width: 120,
			formatter: (val: string) => {
				const statusMap: Record<string, string> = {
					published: '✅ Published',
					draft: '📝 Draft',
					scheduled: '🕒 Scheduled',
					archived: '📦 Archived'
				};
				return statusMap[val] || val;
			},
			sortable: true
		},
		{
			id: 'featured',
			label: 'Featured',
			field: 'featured',
			width: 100,
			formatter: (val: boolean) => (val ? '⭐ Yes' : '-')
		},
		{
			id: 'publishedAt',
			label: 'Published',
			field: 'publishedAt',
			width: 120,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		},
		{
			id: 'createdAt',
			label: 'Created',
			field: 'createdAt',
			width: 120,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		}
	];

	// Actions
	async function handleBulkAction(action: string, ids: string[]) {
		if (!ids.length) return;

		console.log('Bulk action on blog posts:', action, ids);

		try {
			if (action === 'delete') {
				if (!confirm(`Delete ${ids.length} blog post(s)?`)) return;

				for (const id of ids) {
					await fetch('/api/admin/blog', {
						method: 'DELETE',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ id })
					});
				}

				alert('Blog posts deleted successfully');
				location.reload();
			} else if (action === 'publish') {
				for (const id of ids) {
					await fetch('/api/admin/blog', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ id, status: 'published' })
					});
				}

				alert('Blog posts published successfully');
				location.reload();
			} else if (action === 'draft') {
				for (const id of ids) {
					await fetch('/api/admin/blog', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ id, status: 'draft' })
					});
				}

				alert('Blog posts moved to draft');
				location.reload();
			}
		} catch (error) {
			console.error('Bulk action failed:', error);
			alert('Bulk action failed');
		}
	}

	function handleRowClick(post: any) {
		goto(`/admin/content/blog/${post.id}`);
	}
</script>

<AdminLayout
	title="Blog Posts"
	subtitle="Manage blog articles and content"
	actions={[
		{
			label: 'Filters',
			icon: '🔍',
			onclick: () => (showFilters = !showFilters)
		},
		{
			label: 'View Live Blog',
			icon: '🌐',
			onclick: () => window.open('/blog', '_blank')
		},
		...$can('blog_post', 'create')
			? [
					{
						label: 'New Post',
						icon: '➕',
						variant: 'primary',
						onclick: () => goto('/admin/content/blog/create')
					}
				]
			: []
	]}
>
	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{ id: 'title', label: 'Title', type: 'string' },
					{ id: 'author', label: 'Author', type: 'string' },
					{
						id: 'category',
						label: 'Category',
						type: 'enum',
						options: [
							{ value: 'memorial-planning', label: 'Memorial Planning' },
							{ value: 'grief-support', label: 'Grief Support' },
							{ value: 'technology', label: 'Technology' },
							{ value: 'funeral-industry', label: 'Funeral Industry' },
							{ value: 'livestreaming', label: 'Livestreaming' },
							{ value: 'company-news', label: 'Company News' },
							{ value: 'customer-stories', label: 'Customer Stories' }
						]
					},
					{
						id: 'status',
						label: 'Status',
						type: 'enum',
						options: [
							{ value: 'published', label: 'Published' },
							{ value: 'draft', label: 'Draft' },
							{ value: 'scheduled', label: 'Scheduled' },
							{ value: 'archived', label: 'Archived' }
						]
					},
					{ id: 'featured', label: 'Featured', type: 'boolean' }
				]}
				onFilterChange={(filters) => {
					activeFilters = filters;
				}}
			/>
		</div>
	{/if}

	<div class="stats-bar">
		<div class="stat">
			<span class="stat-label">Published</span>
			<span class="stat-value published">{data.stats.published}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Drafts</span>
			<span class="stat-value draft">{data.stats.draft}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Scheduled</span>
			<span class="stat-value scheduled">{data.stats.scheduled}</span>
		</div>
		<div class="stat">
			<span class="stat-label">Featured</span>
			<span class="stat-value featured">{data.stats.featured}</span>
		</div>
	</div>

	<DataGrid
		{columns}
		data={filteredPosts}
		selectable={$can('blog', 'update')}
		bind:selectedMemorials={selectedPosts}
		onRowClick={handleRowClick}
		resourceType="blog_post"
	/>
</AdminLayout>

<style>
	.filters-panel {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.stats-bar {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-align: center;
	}

	.stat-label {
		font-size: 0.8125rem;
		color: #718096;
		font-weight: 500;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #2d3748;
	}

	.stat-value.published {
		color: #38a169;
	}

	.stat-value.draft {
		color: #718096;
	}

	.stat-value.scheduled {
		color: #d69e2e;
	}

	.stat-value.featured {
		color: #805ad5;
	}
</style>
