<script lang="ts">
	let { data } = $props();
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<h1 class="text-2xl font-bold text-gray-900">Switcher Console</h1>
	<p class="mt-2 text-gray-600">Select a memorial to begin production.</p>

	<div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- TODO: List scheduled/live memorials -->
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
			<p class="text-sm text-gray-500">No upcoming streams.</p>
			<p class="mt-2 text-xs text-gray-400">Memorials will appear here when scheduled.</p>
		</div>
	</div>

	<div class="mt-12">
		<h2 class="text-lg font-semibold text-gray-900">Connected Devices</h2>
		<p class="mt-1 text-sm text-gray-600">Phones and cameras connected to your session.</p>

		<div class="mt-4 flex items-center gap-4">
			<button
				type="button"
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
			>
				Add Camera (QR Code)
			</button>
		</div>

		<div class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<!-- TODO: List connected devices -->
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<p class="text-sm text-gray-500">No devices connected.</p>
			</div>
		</div>
	</div>
</div>
