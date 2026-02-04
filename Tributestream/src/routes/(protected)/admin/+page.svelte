<script lang="ts">
	let { data } = $props();
</script>

<div>
	<h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
	<p class="mt-2 text-gray-600">Welcome, {data.user.username}. Manage your Tributestream platform.</p>

	<div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg bg-white p-6 shadow">
			<h3 class="text-sm font-medium text-gray-500">Total Memorials</h3>
			<p class="mt-2 text-3xl font-semibold text-gray-900">--</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow">
			<h3 class="text-sm font-medium text-gray-500">Active Streams</h3>
			<p class="mt-2 text-3xl font-semibold text-gray-900">--</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow">
			<h3 class="text-sm font-medium text-gray-500">Total Users</h3>
			<p class="mt-2 text-3xl font-semibold text-gray-900">--</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow">
			<h3 class="text-sm font-medium text-gray-500">Scheduled</h3>
			<p class="mt-2 text-3xl font-semibold text-gray-900">--</p>
		</div>
	</div>

	<div class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
		<div class="mt-4 flex gap-4">
			<a
				href="/admin/memorials/new"
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
			>
				Create Memorial
			</a>
			<a
				href="/admin/users"
				class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
			>
				Manage Users
			</a>
		</div>
	</div>
</div>
