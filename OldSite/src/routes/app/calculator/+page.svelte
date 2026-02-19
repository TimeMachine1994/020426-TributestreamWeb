<script lang="ts">
	import Calculator from '$lib/components/calculator/Calculator.svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const memorialId = $derived($page.url.searchParams.get('memorialId'));
</script>

<svelte:head>
	<title>Livestream Calculator | Tributestream</title>
	<meta name="description" content="Calculate the cost of your livestream package." />
</svelte:head>

<div class="container mx-auto p-4 md:p-8 lg:p-12">
	<h1 class="h1 mb-8 text-center">Livestream Calculator</h1>
	<Calculator {memorialId} {data} />
</div>
