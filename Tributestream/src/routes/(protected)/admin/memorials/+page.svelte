<script lang="ts">
	let { data } = $props();

	const statusColors: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700',
		scheduled: 'bg-blue-100 text-blue-700',
		live: 'bg-red-100 text-red-700',
		ended: 'bg-gray-100 text-gray-700',
		archived: 'bg-gray-100 text-gray-500'
	};

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div>
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Memorials</h1>
		<a
			href="/admin/memorials/new"
			class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
		>
			Create Memorial
		</a>
	</div>

	<div class="mt-8">
		<div class="overflow-hidden rounded-lg bg-white shadow">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Title
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Videographer
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Scheduled
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#if data.memorials.length === 0}
						<tr>
							<td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
								No memorials yet. Create your first memorial to get started.
							</td>
						</tr>
					{:else}
						{#each data.memorials as memorial}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4">
									<div class="flex flex-col">
										<span class="font-medium text-gray-900">{memorial.title}</span>
										<span class="text-sm text-gray-500">/{memorial.slug}</span>
									</div>
								</td>
								<td class="px-6 py-4">
									<span
										class="inline-flex rounded-full px-2 py-1 text-xs font-medium {statusColors[
											memorial.status
										]}"
									>
										{memorial.status}
									</span>
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">
									{memorial.videographerName ?? '—'}
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">
									{formatDate(memorial.scheduledAt)}
								</td>
								<td class="px-6 py-4 text-right text-sm">
									<a
										href="/admin/memorials/{memorial.id}"
										class="text-indigo-600 hover:text-indigo-900"
									>
										Edit
									</a>
									<span class="mx-2 text-gray-300">|</span>
									<a
										href="/{memorial.slug}"
										target="_blank"
										class="text-gray-600 hover:text-gray-900"
									>
										View
									</a>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
