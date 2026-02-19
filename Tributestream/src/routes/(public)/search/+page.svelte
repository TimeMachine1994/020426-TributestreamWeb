<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props();

	let searchInput = $state(data.query);

	const filtered = $derived(
		data.memorials.filter((m) => {
			if (!searchInput.trim()) return true;
			const q = searchInput.toLowerCase();
			return (
				(m.lovedOneName?.toLowerCase().includes(q)) ||
				(m.title?.toLowerCase().includes(q)) ||
				(m.funeralHomeName?.toLowerCase().includes(q))
			);
		})
	);

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchInput.trim()) {
			params.set('q', searchInput.trim());
		}
		goto(`/search?${params.toString()}`, { replaceState: true });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6">
	<h1 class="text-3xl font-bold text-gray-900">Search Memorials</h1>

	<div class="mt-6 flex gap-3">
		<input
			type="text"
			placeholder="Search by name..."
			bind:value={searchInput}
			onkeydown={handleKeydown}
			class="flex-1 rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
		/>
		<button
			onclick={handleSearch}
			class="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-indigo-500"
		>
			Search
		</button>
	</div>

	<div class="mt-8">
		{#if filtered.length === 0}
			<div class="py-16 text-center">
				<p class="text-lg text-gray-500">
					{#if searchInput.trim()}
						No memorials found matching "{searchInput}".
					{:else}
						No public memorials yet.
					{/if}
				</p>
				<a
					href="/"
					class="mt-4 inline-block text-sm text-indigo-600 hover:text-indigo-500"
				>
					&larr; Back to home
				</a>
			</div>
		{:else}
			<p class="mb-4 text-sm text-gray-500">{filtered.length} memorial{filtered.length === 1 ? '' : 's'} found</p>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each filtered as memorial}
					<a
						href="/{memorial.slug}"
						class="group block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
					>
						<h2 class="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
							{memorial.lovedOneName || memorial.title}
						</h2>
						{#if memorial.lovedOneName}
							<p class="mt-0.5 text-sm text-gray-500">{memorial.title}</p>
						{/if}
						{#if memorial.funeralHomeName}
							<p class="mt-1 text-sm text-gray-400">{memorial.funeralHomeName}</p>
						{/if}
						<p class="mt-2 text-xs text-gray-400">Created {formatDate(memorial.createdAt)}</p>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
