<script lang="ts">
	let { data } = $props();

	const roleLabels: Record<string, string> = {
		admin: 'Admin',
		funeral_director: 'Funeral Director',
		videographer: 'Videographer',
		family_member: 'Family Member',
		contributor: 'Contributor',
		viewer: 'Viewer'
	};

	const roleColors: Record<string, string> = {
		admin: 'bg-purple-100 text-purple-700',
		funeral_director: 'bg-blue-100 text-blue-700',
		videographer: 'bg-green-100 text-green-700',
		family_member: 'bg-amber-100 text-amber-700',
		contributor: 'bg-cyan-100 text-cyan-700',
		viewer: 'bg-gray-100 text-gray-600'
	};

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div>
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Users</h1>
		<span class="text-sm text-gray-500">{data.users.length} total</span>
	</div>

	<div class="mt-8">
		<div class="overflow-hidden rounded-lg bg-white shadow">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							User
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Role
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Memorials
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Created
						</th>
						<th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#if data.users.length === 0}
						<tr>
							<td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
								No users found.
							</td>
						</tr>
					{:else}
						{#each data.users as user}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4">
									<div class="flex flex-col">
										<span class="font-medium text-gray-900">{user.displayName || '—'}</span>
										<span class="text-sm text-gray-500">{user.email}</span>
										{#if user.phone}
											<span class="text-xs text-gray-400">{user.phone}</span>
										{/if}
									</div>
								</td>
								<td class="px-6 py-4">
									<span class="inline-flex rounded-full px-2 py-1 text-xs font-medium {roleColors[user.role] || 'bg-gray-100 text-gray-600'}">
										{roleLabels[user.role] || user.role}
									</span>
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">
									{user.memorialCount}
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">
									{formatDate(user.createdAt)}
								</td>
								<td class="px-6 py-4 text-right text-sm">
									<a
										href="/admin/users/{user.id}"
										class="text-indigo-600 hover:text-indigo-900"
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
