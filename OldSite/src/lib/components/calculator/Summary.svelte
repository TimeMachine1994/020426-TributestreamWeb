<script lang="ts">
	import type { BookingItem } from '$lib/types/livestream';
	import { onMount } from 'svelte';

	let {
		bookingItems,
		total,
		onsave,
		onpay,
		onpayNow
	}: {
		bookingItems: BookingItem[];
		total: number;
		onsave: () => void;
		onpay: () => void;
		onpayNow: () => void;
	} = $props();

	console.log('🧾 Summary Component Initializing...', { bookingItems, total });
	$inspect(bookingItems, total);

	let groupedItems = $derived.by(() => {
		console.log('🔄 Recalculating grouped items...');
		const result = bookingItems.reduce((acc: Record<string, BookingItem[]>, item: BookingItem) => {
			const pkg = item.package;
			if (!acc[pkg]) {
				acc[pkg] = [];
			}
			acc[pkg].push(item);
			return acc;
		}, {});
		console.log('📦 Grouped items:', result);
		return result;
	});

	let isSticky = $state(false);
	let sentinel: HTMLDivElement;
	let summaryEl;

	onMount(() => {
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				isSticky = !entry.isIntersecting;
				console.log('📝 Intersection observer triggered. Is sticky:', !entry.isIntersecting);
			},
			{ threshold: 0 }
		);

		observer.observe(sentinel);

		return () => observer.disconnect();
	});
</script>

<div bind:this={sentinel}></div>
<div
	class="card preset-filled-surface-100-900 space-y-4 p-4 transition-all duration-300 md:p-6"
	class:sticky={isSticky}
	class:shadow-lg={isSticky}
	bind:this={summaryEl}
	style={isSticky ? 'position: sticky; top: 1.25rem;' : ''}
>
	{#if isSticky && bookingItems.length > 0}
		<div class="text-center">
			<h3 class="h3 font-bold">Total: <span class="text-primary-500">${total}</span></h3>
			{#if bookingItems[0]}
				<p class="text-sm opacity-75">{bookingItems[0].name}</p>
			{/if}
		</div>
	{:else}
		<h2 class="h2 text-center">Booking Summary</h2>
	{/if}

	{#if bookingItems.length === 0}
		<p class="py-8 text-center opacity-60">Please select a package to begin.</p>
	{:else}
		<div class="space-y-6">
			{#each Object.entries(groupedItems) as [pkg, items]}
				{@const typedItems = items as BookingItem[]}
				<div class="space-y-2">
					<h4 class="h4 border-surface-300-700 border-b pb-2 font-semibold">{pkg}</h4>
					<div class="space-y-1">
						{#each typedItems as item}
							<div class="flex items-baseline justify-between">
								<span
									>{item.name}
									{#if item.quantity > 1}(x{item.quantity}){/if}</span
								>
								<span class="font-medium">${item.total}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<hr class="!border-surface-300-700" />
		<div class="flex items-center justify-between text-xl">
			<h3 class="h3">Total</h3>
			<span class="text-primary-500 font-bold">${total}</span>
		</div>
	{/if}

	<div class="grid grid-cols-2 gap-2 pt-4">
		<button
			class="btn preset-tonal-surface"
			onclick={() => {
				console.log('💾 Calling save function');
				onsave();
			}}>Save and Pay Later</button
		>
		<button
			class="btn preset-tonal-surface"
			onclick={() => {
				console.log('💳 Calling payNow function');
				onpayNow();
			}}>Pay Now</button
		>
		<button
			class="btn preset-filled-primary col-span-2"
			onclick={() => {
				console.log('💳 Calling pay function');
				onpay();
			}}>Continue to Payment</button
		>
	</div>
</div>
