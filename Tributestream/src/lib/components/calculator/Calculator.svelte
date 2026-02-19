<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		Tier,
		MemorialServices,
		CalculatorFormData,
		BookingItem,
		CalculatorConfig,
		CustomPricing
	} from '$lib/features/booking/types';
	import {
		DEFAULT_MEMORIAL_SERVICES,
		createDefaultCalculatorFormData
	} from '$lib/features/booking/types';
	import {
		calculateBookingItems,
		calculateTotal,
		getPricingForMemorial
	} from '$lib/config/pricing';
	import type { PricingConfig } from '$lib/config/pricing';
	import { useAutoSave } from '$lib/composables/useAutoSave.svelte';
	import TierSelector from './TierSelector.svelte';
	import BookingForm from './BookingForm.svelte';
	import Summary from './Summary.svelte';

	interface CalculatorData {
		memorial: {
			id: string;
			title: string;
			slug: string;
			lovedOneName?: string | null;
			directorFullName?: string | null;
			funeralHomeName?: string | null;
		};
		services?: MemorialServices | null;
		calculatorConfig?: CalculatorConfig | null;
		customPricing?: CustomPricing | null;
	}

	let { data }: { data: CalculatorData } = $props();

	const memorialId = data.memorial.id;

	// Pricing config (supports custom overrides)
	const pricing: PricingConfig = getPricingForMemorial(data.customPricing);

	// Calculator state
	let currentStep = $state<'booking' | 'payment' | 'payNow'>('booking');
	let selectedTier = $state<Tier>(
		(data.calculatorConfig?.formData?.selectedTier as Tier) ?? 'record'
	);
	let services = $state<MemorialServices>(
		data.services ?? structuredClone(DEFAULT_MEMORIAL_SERVICES)
	);
	let calculatorData = $state<CalculatorFormData>(
		data.calculatorConfig?.formData ?? createDefaultCalculatorFormData(memorialId)
	);
	let lovedOneName = $state(data.memorial.lovedOneName ?? '');
	let funeralDirectorName = $state(data.memorial.directorFullName ?? '');
	let funeralHome = $state(data.memorial.funeralHomeName ?? '');

	let saveError = $state<string | null>(null);
	let saveSuccess = $state(false);
	let saving = $state(false);

	// Keep calculatorData.selectedTier in sync
	$effect(() => {
		calculatorData.selectedTier = selectedTier;
	});

	// Derived booking items + total (shared pure functions)
	let bookingItems = $derived<BookingItem[]>(
		calculateBookingItems(selectedTier, services, calculatorData.addons, pricing)
	);
	let total = $derived(calculateTotal(bookingItems));

	// Auto-save
	const autoSave = useAutoSave({ memorialId, delayMs: 3000 });

	// Trigger auto-save when state changes
	$effect(() => {
		// Access reactive dependencies
		const _tier = selectedTier;
		const _services = JSON.stringify(services);
		const _addons = JSON.stringify(calculatorData.addons);
		const _name = lovedOneName;

		autoSave.scheduleSave(services, calculatorData);
	});

	// Cleanup auto-save on component destroy
	$effect(() => {
		return () => {
			autoSave.destroy();
		};
	});

	// Save and Pay Later
	async function handleSave() {
		saving = true;
		saveError = null;
		saveSuccess = false;

		try {
			const res = await fetch(`/api/memorials/${memorialId}/schedule`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					services,
					calculatorData,
					lovedOneName,
					directorFullName: funeralDirectorName,
					funeralHomeName: funeralHome
				})
			});

			if (res.ok) {
				saveSuccess = true;
				setTimeout(() => (saveSuccess = false), 3000);
			} else {
				const data = await res.json().catch(() => ({ error: 'Save failed' }));
				saveError = data.error ?? 'Save failed';
			}
		} catch (e) {
			saveError = `Error: ${e}`;
		} finally {
			saving = false;
		}
	}

	// Continue to Payment (placeholder — Stripe integration in Step 10)
	function handleContinueToPayment() {
		currentStep = 'payment';
	}

	// Pay Now (placeholder — Stripe integration in Step 10)
	function handlePayNow() {
		currentStep = 'payNow';
	}

	function handleTierChange(tier: Tier) {
		selectedTier = tier;
	}
</script>

<div class="mx-auto max-w-7xl">
	{#if saveSuccess}
		<div
			class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
		>
			Booking saved successfully!
		</div>
	{/if}
	{#if saveError}
		<div
			class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
		>
			{saveError}
		</div>
	{/if}

	{#if currentStep === 'booking'}
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-2">
				<TierSelector
					{selectedTier}
					onchange={handleTierChange}
					{pricing}
				/>
				<BookingForm
					bind:services
					bind:calculatorData
					bind:lovedOneName
					bind:funeralDirectorName={funeralDirectorName}
					bind:funeralHome
					{pricing}
				/>
			</div>
			<div class="lg:col-span-1">
				<Summary
					{bookingItems}
					{total}
					onsave={handleSave}
					onpay={handleContinueToPayment}
					onpayNow={handlePayNow}
					isSaving={autoSave.isSaving || saving}
					lastSaved={autoSave.lastSaved}
				/>
			</div>
		</div>
	{:else if currentStep === 'payment' || currentStep === 'payNow'}
		<div class="mx-auto max-w-lg">
			<div class="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
				<h2 class="mb-4 text-2xl font-bold text-gray-900">Payment</h2>
				<p class="mb-6 text-gray-600">
					Total: <span class="text-2xl font-bold text-amber-600"
						>${total.toLocaleString()}</span
					>
				</p>
				<div
					class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700"
				>
					Stripe payment integration coming soon. Your booking details have been saved.
				</div>
				<button
					class="mt-6 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
					onclick={() => (currentStep = 'booking')}
				>
					← Back to Booking
				</button>
			</div>
		</div>
	{/if}
</div>
