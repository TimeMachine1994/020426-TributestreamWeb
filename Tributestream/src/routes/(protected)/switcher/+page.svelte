<script lang="ts">
	let { data } = $props();

	const statusColors: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700',
		scheduled: 'bg-blue-100 text-blue-700',
		live: 'bg-red-100 text-red-700 animate-pulse'
	};

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'Not scheduled';
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<h1 class="text-2xl font-bold text-gray-900">Switcher Console</h1>
	<p class="mt-2 text-gray-600">Select a memorial to begin production.</p>

	<div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#if data.memorials.length === 0}
			<div class="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
				<p class="text-sm text-gray-500">No upcoming streams.</p>
				<p class="mt-2 text-xs text-gray-400">Memorials will appear here when assigned to you.</p>
			</div>
		{:else}
			{#each data.memorials as memorial}
				<a
					href="/switcher/{memorial.id}"
					class="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
				>
					<div class="flex items-start justify-between">
						<h3 class="font-semibold text-gray-900 group-hover:text-indigo-600">
							{memorial.title}
						</h3>
						<span
							class="inline-flex rounded-full px-2 py-1 text-xs font-medium {statusColors[
								memorial.status
							]}"
						>
							{memorial.status}
						</span>
					</div>
					{#if memorial.description}
						<p class="mt-2 line-clamp-2 text-sm text-gray-600">{memorial.description}</p>
					{/if}
					<div class="mt-4 flex items-center text-sm text-gray-500">
						<svg class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						{formatDate(memorial.scheduledAt)}
					</div>
					<div class="mt-4">
						<span
							class="inline-flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700"
						>
							Enter Production
							<svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</span>
					</div>
				</a>
			{/each}
		{/if}
	</div>
</div>
