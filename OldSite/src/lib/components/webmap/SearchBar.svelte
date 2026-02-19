<script lang="ts">
	import { filterState } from '$lib/stores/webmap';

	let searchInput = $state('');
	let showFilters = $state(false);
	
	const availableFileTypes = ['.ts', '.js', '.svelte', '.json', '.md', '.css', '.html'];
	
	function updateSearch() {
		filterState.update((state) => ({
			...state,
			query: searchInput
		}));
	}

	function toggleFileType(type: string) {
		filterState.update((state) => {
			const types = state.fileTypes.includes(type)
				? state.fileTypes.filter((t) => t !== type)
				: [...state.fileTypes, type];
			return { ...state, fileTypes: types };
		});
	}

	function clearFilters() {
		searchInput = '';
		filterState.set({
			query: '',
			fileTypes: [],
			tags: [],
			dateRange: undefined,
			sizeRange: undefined
		});
	}

	let debounceTimer: number;
	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(updateSearch, 300);
	}
</script>

<div class="search-bar">
	<div class="search-input-wrapper">
		<svg
			class="search-icon"
			xmlns="http://www.w3.org/2000/svg"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.3-4.3" />
		</svg>
		<input
			type="text"
			class="search-input"
			placeholder="Search files..."
			bind:value={searchInput}
			oninput={handleInput}
		/>
		{#if searchInput}
			<button class="clear-btn" onclick={clearFilters} title="Clear search" aria-label="Clear search">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 6 6 18" />
					<path d="m6 6 12 12" />
				</svg>
			</button>
		{/if}
		<button class="filter-btn" onclick={() => (showFilters = !showFilters)} title="Toggle filters" aria-label="Toggle filters">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
			</svg>
		</button>
	</div>

	{#if showFilters}
		<div class="filters-panel">
			<div class="filter-section">
				<span class="filter-label">File Types</span>
				<div class="filter-options">
					{#each availableFileTypes as type}
						<button
							class="filter-chip"
							class:active={$filterState.fileTypes.includes(type)}
							onclick={() => toggleFileType(type)}
						>
							{type}
						</button>
					{/each}
				</div>
			</div>

			{#if $filterState.fileTypes.length > 0 || searchInput}
				<button class="clear-all-btn" onclick={clearFilters}>Clear all filters</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.search-bar {
		width: 100%;
	}

	.search-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background-color: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
		transition: border-color 0.2s;
	}

	.search-input-wrapper:focus-within {
		border-color: #3b82f6;
	}

	.search-icon {
		color: #64748b;
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		color: #e2e8f0;
		font-size: 0.875rem;
		outline: none;
	}

	.search-input::placeholder {
		color: #64748b;
	}

	.clear-btn,
	.filter-btn {
		padding: 0.25rem;
		background: transparent;
		border: none;
		color: #64748b;
		cursor: pointer;
		transition: color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clear-btn:hover,
	.filter-btn:hover {
		color: #e2e8f0;
	}

	.filters-panel {
		margin-top: 0.75rem;
		padding: 1rem;
		background-color: #1e293b;
		border: 1px solid #334155;
		border-radius: 0.5rem;
	}

	.filter-section {
		margin-bottom: 1rem;
	}

	.filter-section:last-of-type {
		margin-bottom: 0;
	}

	.filter-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.filter-options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.filter-chip {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		border-radius: 0.25rem;
		background-color: #334155;
		border: 1px solid #475569;
		color: #e2e8f0;
		cursor: pointer;
		transition: all 0.2s;
	}

	.filter-chip:hover {
		background-color: #475569;
		border-color: #64748b;
	}

	.filter-chip.active {
		background-color: #3b82f6;
		border-color: #3b82f6;
		color: white;
	}

	.clear-all-btn {
		width: 100%;
		padding: 0.5rem;
		font-size: 0.75rem;
		border-radius: 0.25rem;
		background-color: #334155;
		border: 1px solid #475569;
		color: #e2e8f0;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 0.75rem;
	}

	.clear-all-btn:hover {
		background-color: #475569;
		border-color: #64748b;
	}
</style>
