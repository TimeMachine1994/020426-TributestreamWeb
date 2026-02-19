<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

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

	const statusColors: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700',
		scheduled: 'bg-blue-100 text-blue-700',
		live: 'bg-red-100 text-red-700',
		ended: 'bg-gray-100 text-gray-700',
		archived: 'bg-gray-100 text-gray-500'
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
	<div class="mb-6">
		<a href="/admin/users" class="text-sm text-indigo-600 hover:text-indigo-900">&larr; Back to Users</a>
	</div>

	{#if form?.success}
		<div class="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-700">
			{form.message}
		</div>
	{/if}
	{#if form?.error}
		<div class="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
			{form.error}
		</div>
	{/if}

	<!-- User Info Card -->
	<div class="rounded-lg bg-white p-6 shadow">
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">
					{data.targetUser.displayName || data.targetUser.email}
				</h1>
				<p class="mt-1 text-gray-500">{data.targetUser.email}</p>
				{#if data.targetUser.phone}
					<p class="text-sm text-gray-400">{data.targetUser.phone}</p>
				{/if}
				<p class="mt-2 text-xs text-gray-400">
					Member since {formatDate(data.targetUser.createdAt)}
				</p>
			</div>
			<span class="inline-flex rounded-full px-3 py-1 text-sm font-medium {roleColors[data.targetUser.role] || 'bg-gray-100 text-gray-600'}">
				{roleLabels[data.targetUser.role] || data.targetUser.role}
			</span>
		</div>

		<!-- Admin Actions -->
		<div class="mt-6 flex flex-wrap gap-4 border-t border-gray-200 pt-6">
			<!-- Change Role -->
			<form method="POST" action="?/updateRole" use:enhance class="flex items-center gap-2">
				<label for="role" class="text-sm font-medium text-gray-700">Role:</label>
				<select
					id="role"
					name="role"
					class="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				>
					{#each Object.entries(roleLabels) as [value, label]}
						<option {value} selected={data.targetUser.role === value}>{label}</option>
					{/each}
				</select>
				<button
					type="submit"
					class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
				>
					Update
				</button>
			</form>

			<!-- Reset Password -->
			<form method="POST" action="?/resetPassword" use:enhance>
				<button
					type="submit"
					class="rounded-md bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-400"
				>
					Reset Password
				</button>
			</form>
		</div>
	</div>

	<!-- User's Memorials -->
	<div class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">
			Memorials ({data.memorials.length})
		</h2>

		{#if data.memorials.length === 0}
			<p class="mt-4 text-sm text-gray-500">This user has no memorials.</p>
		{:else}
			<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.memorials as memorial}
					<div class="rounded-lg bg-white p-5 shadow">
						<div class="flex items-start justify-between">
							<h3 class="font-medium text-gray-900">
								{memorial.lovedOneName || memorial.title}
							</h3>
							<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {statusColors[memorial.status]}">
								{memorial.status}
							</span>
						</div>
						{#if memorial.lovedOneName}
							<p class="mt-0.5 text-sm text-gray-500">{memorial.title}</p>
						{/if}
						<p class="mt-1 text-xs text-gray-400">/{memorial.slug}</p>

						<div class="mt-3 flex items-center gap-2">
							{#if memorial.hasBooking}
								<span class="text-xs text-green-600 font-medium">Booked</span>
							{:else}
								<span class="text-xs text-gray-400">No booking</span>
							{/if}
						</div>

						<div class="mt-3 flex gap-2 text-sm">
							<a href="/admin/memorials/{memorial.id}" class="text-indigo-600 hover:text-indigo-900">Edit</a>
							<span class="text-gray-300">|</span>
							<a href="/schedule/{memorial.id}" class="text-indigo-600 hover:text-indigo-900">Calculator</a>
							<span class="text-gray-300">|</span>
							<a href="/{memorial.slug}" target="_blank" class="text-gray-600 hover:text-gray-900">View</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
