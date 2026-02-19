<script lang="ts">
	import type { BookingItem } from '$lib/features/booking/types';

	let {
		bookingItems,
		total,
		onsave,
		onpay,
		onpayNow,
		isSaving = false,
		lastSaved = null
	}: {
		bookingItems: BookingItem[];
		total: number;
		onsave: () => void;
		onpay: () => void;
		onpayNow: () => void;
		isSaving?: boolean;
		lastSaved?: number | null;
	} = $props();

	let groupedItems = $derived.by(() => {
		return bookingItems.reduce(
			(acc: Record<string, BookingItem[]>, item: BookingItem) => {
				const pkg = item.package;
				if (!acc[pkg]) {
					acc[pkg] = [];
				}
				acc[pkg].push(item);
				return acc;
			},
			{} as Record<string, BookingItem[]>
		);
	});

	let lastSavedText = $derived(
		lastSaved ? new Date(lastSaved).toLocaleTimeString() : null
	);
</script>

<div
	class="sticky top-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow"
>
	<h2 class="mb-4 text-center text-xl font-bold text-gray-900">Booking Summary</h2>

	{#if bookingItems.length === 0}
		<p class="py-8 text-center text-gray-400">Please select a package to begin.</p>
	{:else}
		<div class="space-y-4">
			{#each Object.entries(groupedItems) as [pkg, items]}
				<div>
					<h4 class="border-b border-gray-100 pb-2 text-sm font-semibold text-gray-700">
						{pkg}
					</h4>
					<div class="mt-2 space-y-1">
						{#each items as item}
							<div class="flex items-baseline justify-between text-sm">
								<span class="text-gray-600">
									{item.name}
									{#if item.quantity > 1}<span class="text-gray-400"
											>(x{item.quantity})</span
										>{/if}
								</span>
								<span class="font-medium text-gray-900"
									>${item.total.toLocaleString()}</span
								>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div class="my-4 border-t border-gray-200"></div>

		<div class="flex items-center justify-between text-lg">
			<span class="font-bold text-gray-900">Total</span>
			<span class="font-bold text-amber-600">${total.toLocaleString()}</span>
		</div>
	{/if}

	<!-- Auto-save indicator -->
	{#if isSaving}
		<p class="mt-3 text-center text-xs text-gray-400">Saving...</p>
	{:else if lastSavedText}
		<p class="mt-3 text-center text-xs text-gray-400">Last saved at {lastSavedText}</p>
	{/if}

	<!-- Action Buttons -->
	<div class="mt-6 grid grid-cols-2 gap-2">
		<button
			class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
			onclick={onsave}
		>
			Save & Pay Later
		</button>
		<button
			class="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600"
			onclick={onpayNow}
		>
			Pay Now
		</button>
		<button
			class="col-span-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
			onclick={onpay}
		>
			Continue to Payment
		</button>
	</div>
</div>
