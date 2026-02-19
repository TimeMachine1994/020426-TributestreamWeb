<script lang="ts">
	import type { WikiPage } from '$lib/types/wiki';
	import { extractExcerpt, estimateReadingTime } from '$lib/utils/wiki/markdown';

	interface Props {
		page: WikiPage;
	}

	let { page }: Props = $props();

	const excerpt = $derived(extractExcerpt(page.content, 150));
	const readingTime = $derived(estimateReadingTime(page.content));
	const formattedDate = $derived(
		new Date(page.updatedAt).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	);
</script>

<a href="/admin/wiki/{page.slug}" class="wiki-page-card">
	<div class="card-header">
		<h3 class="card-title">{page.title}</h3>
		{#if page.category}
			<span class="card-category">{page.category}</span>
		{/if}
	</div>

	<p class="card-excerpt">{excerpt}</p>

	<div class="card-footer">
		<div class="card-meta">
			<span class="meta-item">
				<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				{readingTime} min read
			</span>
			<span class="meta-item">
				<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				{formattedDate}
			</span>
		</div>

		{#if page.tags.length > 0}
			<div class="card-tags">
				{#each page.tags.slice(0, 3) as tag}
					<span class="tag">{tag}</span>
				{/each}
			</div>
		{/if}
	</div>
</a>

<style>
	.wiki-page-card {
		display: block;
		padding: 1.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		transition: all 0.2s;
		text-decoration: none;
		color: inherit;
	}

	.wiki-page-card:hover {
		border-color: #d5ba7f;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		line-height: 1.4;
	}

	.card-category {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: #fef3c7;
		color: #92400e;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.card-excerpt {
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.6;
		margin: 0 0 1rem 0;
	}

	.card-footer {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.icon {
		width: 1rem;
		height: 1rem;
	}

	.card-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		padding: 0.25rem 0.5rem;
		background: #f3f4f6;
		color: #4b5563;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}
</style>
