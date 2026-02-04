<script lang="ts">
	let { data } = $props();
</script>

<div>
	<h1 class="text-2xl font-bold text-gray-900">Audit Log</h1>
	<p class="mt-2 text-gray-600">View all system activity for SOC2 compliance.</p>

	<div class="mt-8">
		<div class="overflow-hidden rounded-lg bg-white shadow">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Timestamp
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							User
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Action
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Target
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							IP Address
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					<!-- TODO: Populate with audit logs from database -->
					<tr>
						<td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
							No audit logs yet.
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>
