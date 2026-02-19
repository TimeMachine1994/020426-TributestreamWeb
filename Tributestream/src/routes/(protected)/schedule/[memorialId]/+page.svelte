<script lang="ts">
	import Calculator from '$lib/components/calculator/Calculator.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Schedule — {data.memorial.title} | Tributestream</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<header class="border-b border-gray-200 bg-white">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
			<div class="flex items-center gap-4">
				<a
					href="/admin/memorials/{data.memorial.id}"
					class="text-sm text-gray-500 hover:text-gray-700"
				>
					← Back to Memorial
				</a>
				<h1 class="text-xl font-bold text-gray-900">{data.memorial.title}</h1>
			</div>
			<span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
				Calculator
			</span>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<Calculator {data} />
	</main>
</div>
