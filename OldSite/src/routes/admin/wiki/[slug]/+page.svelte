<script lang="ts">
	import { parseMarkdown } from '$lib/utils/wiki/markdown';
	import { replaceWikiLinksClient } from '$lib/utils/wiki/wiki-links';
	import { generateTableOfContents } from '$lib/utils/wiki/toc';
	import WikiTableOfContents from '$lib/components/wiki/WikiTableOfContents.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const page = $derived(data.page);
	const pageMap = $derived(new Map(Object.entries(data.pageMap)));

	const htmlContent = $derived(() => {
		let html = parseMarkdown(page.content);
		if (pageMap.size > 0) {
			html = replaceWikiLinksClient(html, pageMap);
		}
		return html;
	});

	const toc = $derived(generateTableOfContents(page.content));

	const formattedDate = $derived(
		new Date(page.updatedAt).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	);
</script>

<svelte:head>
	<title>{page.title} - Wiki</title>
</svelte:head>

<div class="wiki-view-page">
	<div class="page-container">
		<!-- Header -->
		<header class="page-header">
			<a href="/admin/wiki" class="back-link">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Wiki
			</a>

			<div class="header-content">
				<div class="header-main">
					<div class="header-text">
						{#if page.category}
							<span class="page-category">{page.category}</span>
						{/if}
						<h1 class="page-title">{page.title}</h1>
					</div>

					<div class="header-actions">
						<a href="/admin/wiki/{page.slug}/edit" class="action-btn">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							Edit
						</a>
					</div>
				</div>

				<div class="page-meta">
					<span class="meta-item">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						Updated {formattedDate}
					</span>
					<span class="meta-item">
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
						{page.viewCount} views
					</span>
					<span class="meta-item">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						{page.updatedByEmail}
					</span>
				</div>

				{#if page.tags.length > 0}
					<div class="page-tags">
						{#each page.tags as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				{/if}
			</div>
		</header>

		<!-- Content Layout -->
		<div class="content-layout">
			<!-- Main Content -->
			<article class="wiki-content">
				{@html htmlContent()}
			</article>

			<!-- Table of Contents -->
			{#if toc.length > 0}
				<aside class="toc-sidebar">
					<WikiTableOfContents items={toc} />
				</aside>
			{/if}
		</div>
	</div>
</div>

<style>
	.wiki-view-page {
		min-height: 100vh;
		background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
		padding: 2rem;
	}

	.page-container {
		max-width: 80rem;
		margin: 0 auto;
	}

	.page-header {
		background: white;
		border-radius: 0.5rem;
		padding: 2rem;
		margin-bottom: 2rem;
		border: 1px solid #e5e7eb;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		text-decoration: none;
		font-size: 0.9375rem;
		margin-bottom: 1.5rem;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #d5ba7f;
	}

	.back-link svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.header-main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
	}

	.header-text {
		flex: 1;
	}

	.page-category {
		display: inline-block;
		padding: 0.375rem 0.875rem;
		background: #fef3c7;
		color: #92400e;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 1rem;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0;
		line-height: 1.2;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.25rem;
		background: white;
		color: #4b5563;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.action-btn:hover {
		background: #f9fafb;
		border-color: #d5ba7f;
		color: #d5ba7f;
	}

	.action-btn svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	.page-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.meta-item svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	.page-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		padding: 0.375rem 0.75rem;
		background: #f3f4f6;
		color: #4b5563;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.content-layout {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 2rem;
		align-items: start;
	}

	.wiki-content {
		background: white;
		border-radius: 0.5rem;
		padding: 3rem;
		border: 1px solid #e5e7eb;
		font-size: 1.0625rem;
		line-height: 1.75;
		color: #374151;
		min-width: 0;
	}

	.toc-sidebar {
		position: sticky;
		top: 2rem;
	}

	/* Markdown content styles */
	.wiki-content :global(h1) {
		font-size: 2.25rem;
		font-weight: 700;
		margin: 2.5rem 0 1.5rem 0;
		color: #111827;
		line-height: 1.25;
	}

	.wiki-content :global(h2) {
		font-size: 1.875rem;
		font-weight: 600;
		margin: 2rem 0 1rem 0;
		color: #111827;
		line-height: 1.3;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.wiki-content :global(h3) {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 1.5rem 0 0.75rem 0;
		color: #111827;
	}

	.wiki-content :global(h4) {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 1.25rem 0 0.5rem 0;
		color: #111827;
	}

	.wiki-content :global(p) {
		margin: 1.25rem 0;
	}

	.wiki-content :global(strong) {
		font-weight: 600;
		color: #111827;
	}

	.wiki-content :global(a) {
		color: #3b82f6;
		text-decoration: underline;
	}

	.wiki-content :global(a:hover) {
		color: #2563eb;
	}

	.wiki-content :global(a.wiki-link) {
		color: #d5ba7f;
		text-decoration: none;
		border-bottom: 1px solid #d5ba7f;
		transition: all 0.2s;
	}

	.wiki-content :global(a.wiki-link:hover) {
		color: #b8a06d;
		border-bottom-color: #b8a06d;
	}

	.wiki-content :global(a.wiki-link-broken) {
		color: #dc2626;
		text-decoration: none;
		border-bottom: 1px dashed #dc2626;
		cursor: pointer;
		transition: all 0.2s;
	}

	.wiki-content :global(a.wiki-link-broken:hover) {
		color: #991b1b;
		border-bottom-color: #991b1b;
		background: #fee2e2;
	}

	.wiki-content :global(code) {
		padding: 0.25rem 0.5rem;
		background: #f3f4f6;
		border-radius: 0.25rem;
		font-family: 'Courier New', monospace;
		font-size: 0.9em;
		color: #db2777;
	}

	.wiki-content :global(pre) {
		padding: 1.5rem;
		background: #1f2937;
		color: #f9fafb;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1.5rem 0;
		line-height: 1.5;
	}

	.wiki-content :global(pre code) {
		background: transparent;
		padding: 0;
		color: inherit;
		border-radius: 0;
	}

	.wiki-content :global(ul),
	.wiki-content :global(ol) {
		margin: 1.25rem 0;
		padding-left: 2rem;
	}

	.wiki-content :global(li) {
		margin: 0.75rem 0;
	}

	.wiki-content :global(blockquote) {
		padding: 1rem 1.5rem;
		margin: 1.5rem 0;
		border-left: 4px solid #d5ba7f;
		background: #fef3c7;
		color: #92400e;
		border-radius: 0 0.375rem 0.375rem 0;
	}

	.wiki-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
	}

	.wiki-content :global(th),
	.wiki-content :global(td) {
		padding: 0.75rem;
		border: 1px solid #e5e7eb;
		text-align: left;
	}

	.wiki-content :global(th) {
		background: #f9fafb;
		font-weight: 600;
		color: #111827;
	}

	.wiki-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1.5rem 0;
	}

	/* Scroll target highlight */
	.wiki-content :global(h1:target),
	.wiki-content :global(h2:target),
	.wiki-content :global(h3:target),
	.wiki-content :global(h4:target) {
		background: linear-gradient(90deg, #fef3c7 0%, transparent 100%);
		padding-left: 1rem;
		margin-left: -1rem;
		border-left: 3px solid #d5ba7f;
		animation: highlight 2s ease-out;
	}

	@keyframes highlight {
		0% {
			background: #fef3c7;
		}
		100% {
			background: linear-gradient(90deg, #fef3c7 0%, transparent 100%);
		}
	}

	@media (max-width: 1024px) {
		.content-layout {
			grid-template-columns: 1fr;
		}

		.toc-sidebar {
			position: static;
			order: -1;
		}
	}

	@media (max-width: 768px) {
		.wiki-view-page {
			padding: 1rem;
		}

		.page-header {
			padding: 1.5rem;
		}

		.page-title {
			font-size: 2rem;
		}

		.header-main {
			flex-direction: column;
		}

		.wiki-content {
			padding: 1.5rem;
		}

		.page-meta {
			flex-direction: column;
			gap: 0.75rem;
		}
	}
</style>
