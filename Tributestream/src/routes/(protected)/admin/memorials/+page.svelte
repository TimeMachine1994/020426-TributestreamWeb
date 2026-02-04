<script lang="ts">
	let { data } = $props();
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
							Slug
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Status
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
					<!-- TODO: Populate with memorials from database -->
					<tr>
						<td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
							No memorials yet. Create your first memorial to get started.
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>
