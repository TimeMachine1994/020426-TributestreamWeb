<script lang="ts">
	let { data } = $props();
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
	<p class="mt-2 text-gray-600">Welcome back, {data.user.username}!</p>

	<div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="text-lg font-semibold text-gray-900">My Memorials</h2>
			<p class="mt-2 text-sm text-gray-600">View memorials you have access to.</p>
			<!-- TODO: List memorials -->
		</div>
	</div>
</div>
