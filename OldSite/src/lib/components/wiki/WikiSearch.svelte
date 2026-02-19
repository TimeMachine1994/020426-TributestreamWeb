<script lang="ts">
	import type { WikiPage } from '$lib/types/wiki';
	import { searchPages } from '$lib/utils/wiki/search';

	interface Props {
		pages: WikiPage[];
		onResultClick?: () => void;
	}

	let { pages, onResultClick }: Props = $props();

	let query = $state('');
	let showResults = $state(false);

	const results = $derived(query.length >= 2 ? searchPages(pages, query) : []);

	function handleInput() {
		showResults = query.length >= 2;
	}

	function handleResultClick() {
		query = '';
		showResults = false;
		onResultClick?.();
	}

	function handleBlur() {
		// Delay to allow click events to fire
		setTimeout(() => {
			showResults = false;
		}, 200);
	}
</script>

<div class="wiki-search">
	<div class="search-input-wrapper">
		<svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<input
			type="text"
			class="search-input"
			placeholder="Search wiki pages..."
			bind:value={query}
			oninput={handleInput}
			onfocus={handleInput}
			onblur={handleBlur}
		/>
		{#if query}
			<button class="clear-button" onclick={() => (query = '')}>
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		{/if}
	</div>

	{#if showResults}
		<div class="search-results">
			{#if results.length === 0}
				<div class="no-results">
					<p>No pages found for "{query}"</p>
				</div>
			{:else}
				<div class="results-header">
					<span>{results.length} result{results.length === 1 ? '' : 's'}</span>
				</div>
				<ul class="results-list">
					{#each results as result}
						<li>
							<a href="/admin/wiki/{result.slug}" onclick={handleResultClick} class="result-item">
								<div class="result-header">
									<span class="result-title">{result.title}</span>
									{#if result.category}
										<span class="result-category">{result.category}</span>
									{/if}
								</div>
								<p class="result-excerpt">{result.excerpt}</p>
								{#if result.tags.length > 0}
									<div class="result-tags">
										{#each result.tags.slice(0, 3) as tag}
											<span class="result-tag">{tag}</span>
										{/each}
									</div>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	.wiki-search {
		position: relative;
		width: 100%;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		width: 1.25rem;
		height: 1.25rem;
		color: #9ca3af;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 3rem 0.75rem 3rem;
		font-size: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		transition: all 0.2s;
		background: white;
	}

	.search-input:focus {
		outline: none;
		border-color: #d5ba7f;
		box-shadow: 0 0 0 3px rgba(213, 186, 127, 0.1);
	}

	.clear-button {
		position: absolute;
		right: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		background: transparent;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		border-radius: 9999px;
		transition: all 0.2s;
	}

	.clear-button:hover {
		background: #f3f4f6;
		color: #4b5563;
	}

	.clear-button svg {
		width: 1rem;
		height: 1rem;
	}

	.search-results {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		max-height: 24rem;
		overflow-y: auto;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		z-index: 50;
	}

	.no-results {
		padding: 2rem;
		text-align: center;
		color: #9ca3af;
	}

	.results-header {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e7eb;
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.results-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.result-item {
		display: block;
		padding: 1rem;
		border-bottom: 1px solid #f3f4f6;
		text-decoration: none;
		color: inherit;
		transition: background 0.2s;
	}

	.result-item:hover {
		background: #f9fafb;
	}

	.result-item:last-child {
		border-bottom: none;
	}

	.result-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.result-title {
		font-weight: 600;
		color: #111827;
		font-size: 0.9375rem;
	}

	.result-category {
		padding: 0.125rem 0.5rem;
		background: #fef3c7;
		color: #92400e;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.result-excerpt {
		color: #6b7280;
		font-size: 0.8125rem;
		line-height: 1.5;
		margin: 0 0 0.5rem 0;
	}

	.result-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.result-tag {
		padding: 0.125rem 0.375rem;
		background: #f3f4f6;
		color: #6b7280;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
	}
</style>
