<script lang="ts">
	import type { WikiPage } from '$lib/types/wiki';

	interface Props {
		pages: WikiPage[];
		selectedCategory?: string | null;
		onCategoryChange?: (category: string | null) => void;
	}

	let { pages, selectedCategory = $bindable(null), onCategoryChange }: Props = $props();

	const categories = $derived(() => {
		const categoryMap = new Map<string, number>();
		
		pages.forEach(page => {
			if (page.category) {
				categoryMap.set(page.category, (categoryMap.get(page.category) || 0) + 1);
			}
		});

		return Array.from(categoryMap.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	function selectCategory(category: string | null) {
		selectedCategory = category;
		onCategoryChange?.(category);
	}
</script>

<div class="category-filter">
	<h3 class="filter-title">Categories</h3>
	
	<ul class="category-list">
		<li>
			<button
				class="category-btn"
				class:active={selectedCategory === null}
				onclick={() => selectCategory(null)}
			>
				<span class="category-name">All Pages</span>
				<span class="category-count">{pages.length}</span>
			</button>
		</li>
		
		{#each categories() as category}
			<li>
				<button
					class="category-btn"
					class:active={selectedCategory === category.name}
					onclick={() => selectCategory(category.name)}
				>
					<span class="category-name">{category.name}</span>
					<span class="category-count">{category.count}</span>
				</button>
			</li>
		{/each}
	</ul>
</div>

<style>
	.category-filter {
		padding: 1.5rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.filter-title {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #6b7280;
		margin-bottom: 1rem;
		letter-spacing: 0.05em;
	}

	.category-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.category-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		margin-bottom: 0.25rem;
	}

	.category-btn:hover {
		background: #f3f4f6;
	}

	.category-btn.active {
		background: #fef3c7;
		color: #92400e;
	}

	.category-name {
		font-size: 0.9375rem;
		color: #4b5563;
	}

	.category-btn.active .category-name {
		color: #92400e;
		font-weight: 500;
	}

	.category-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 0.5rem;
		background: #e5e7eb;
		color: #6b7280;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.category-btn.active .category-count {
		background: #d5ba7f;
		color: white;
	}
</style>
