<script lang="ts">
	let { data } = $props();

	const statusColors: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700',
		scheduled: 'bg-blue-100 text-blue-700',
		live: 'bg-green-100 text-green-700',
		ended: 'bg-yellow-100 text-yellow-700',
		archived: 'bg-red-100 text-red-700'
	};

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">My Memorials</h1>
			<p class="mt-1 text-gray-600">Welcome back, {data.user.displayName || data.user.email}.</p>
		</div>
		<a
			href="/dashboard/new"
			class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
		>
			+ Create Memorial
		</a>
	</div>

	{#if data.memorials.length === 0}
		<div class="mt-16 text-center">
			<div class="mx-auto h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center">
				<svg class="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
			</div>
			<h3 class="mt-4 text-lg font-semibold text-gray-900">No memorials yet</h3>
			<p class="mt-2 text-sm text-gray-500">Create your first memorial to get started with planning.</p>
			<a
				href="/dashboard/new"
				class="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
			>
				Create Your First Memorial
			</a>
		</div>
	{:else}
		<div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each data.memorials as memorial}
				<div class="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow">
					<div class="flex items-start justify-between">
						<h2 class="text-lg font-semibold text-gray-900 truncate">
							{memorial.lovedOneName || memorial.title}
						</h2>
						<span class="ml-2 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium {statusColors[memorial.status] || statusColors.draft}">
							{memorial.status}
						</span>
					</div>

					{#if memorial.lovedOneName}
						<p class="mt-1 text-sm text-gray-500">{memorial.title}</p>
					{/if}

					<div class="mt-3 text-sm text-gray-500">
						<p>Created {formatDate(memorial.createdAt)}</p>
						{#if memorial.totalPrice}
							<p class="mt-1">
								Total: <span class="font-medium text-gray-900">${memorial.totalPrice.toLocaleString()}</span>
								{#if memorial.isPaid}
									<span class="ml-1 text-green-600">Paid</span>
								{/if}
							</p>
						{/if}
					</div>

					<div class="mt-4 flex gap-3">
						<a
							href="/schedule/{memorial.id}"
							class="rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
						>
							Calculator
						</a>
						<a
							href="/{memorial.slug}"
							class="rounded-md bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
						>
							View Page
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
