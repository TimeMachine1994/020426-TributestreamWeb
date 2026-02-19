<script lang="ts">
	import { TIER_PRICES, ADDON_PRICES, HOURLY_OVERAGE_RATE, ADDITIONAL_SERVICE_FEE, type CustomPricing } from '$lib/config/pricing';
	import type { Memorial } from '$lib/types/memorial';

	interface Props {
		memorial: Memorial;
		onUpdate?: () => void;
	}

	let { memorial, onUpdate }: Props = $props();

	// State
	let isEditing = $state(false);
	let isSaving = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);

	// Initialize form data from memorial's custom pricing
	let formData = $state<CustomPricing>({
		enabled: memorial.customPricing?.enabled || false,
		tiers: {
			record: memorial.customPricing?.tiers?.record ?? TIER_PRICES.record,
			live: memorial.customPricing?.tiers?.live ?? TIER_PRICES.live,
			legacy: memorial.customPricing?.tiers?.legacy ?? TIER_PRICES.legacy
		},
		addons: {
			photography: memorial.customPricing?.addons?.photography ?? ADDON_PRICES.photography,
			audioVisualSupport: memorial.customPricing?.addons?.audioVisualSupport ?? ADDON_PRICES.audioVisualSupport,
			liveMusician: memorial.customPricing?.addons?.liveMusician ?? ADDON_PRICES.liveMusician,
			woodenUsbDrives: memorial.customPricing?.addons?.woodenUsbDrives ?? ADDON_PRICES.woodenUsbDrives
		},
		rates: {
			hourlyOverage: memorial.customPricing?.rates?.hourlyOverage ?? HOURLY_OVERAGE_RATE,
			additionalServiceFee: memorial.customPricing?.rates?.additionalServiceFee ?? ADDITIONAL_SERVICE_FEE
		},
		notes: memorial.customPricing?.notes || ''
	});

	// Track which fields are customized
	let customizedFields = $derived({
		record: formData.enabled && formData.tiers?.record !== TIER_PRICES.record,
		live: formData.enabled && formData.tiers?.live !== TIER_PRICES.live,
		legacy: formData.enabled && formData.tiers?.legacy !== TIER_PRICES.legacy,
		photography: formData.enabled && formData.addons?.photography !== ADDON_PRICES.photography,
		audioVisualSupport: formData.enabled && formData.addons?.audioVisualSupport !== ADDON_PRICES.audioVisualSupport,
		liveMusician: formData.enabled && formData.addons?.liveMusician !== ADDON_PRICES.liveMusician,
		woodenUsbDrives: formData.enabled && formData.addons?.woodenUsbDrives !== ADDON_PRICES.woodenUsbDrives,
		hourlyOverage: formData.enabled && formData.rates?.hourlyOverage !== HOURLY_OVERAGE_RATE,
		additionalServiceFee: formData.enabled && formData.rates?.additionalServiceFee !== ADDITIONAL_SERVICE_FEE
	});

	function startEditing() {
		isEditing = true;
		error = null;
		success = null;
	}

	function cancelEditing() {
		isEditing = false;
		// Reset to memorial's current pricing
		formData = {
			enabled: memorial.customPricing?.enabled || false,
			tiers: {
				record: memorial.customPricing?.tiers?.record ?? TIER_PRICES.record,
				live: memorial.customPricing?.tiers?.live ?? TIER_PRICES.live,
				legacy: memorial.customPricing?.tiers?.legacy ?? TIER_PRICES.legacy
			},
			addons: {
				photography: memorial.customPricing?.addons?.photography ?? ADDON_PRICES.photography,
				audioVisualSupport: memorial.customPricing?.addons?.audioVisualSupport ?? ADDON_PRICES.audioVisualSupport,
				liveMusician: memorial.customPricing?.addons?.liveMusician ?? ADDON_PRICES.liveMusician,
				woodenUsbDrives: memorial.customPricing?.addons?.woodenUsbDrives ?? ADDON_PRICES.woodenUsbDrives
			},
			rates: {
				hourlyOverage: memorial.customPricing?.rates?.hourlyOverage ?? HOURLY_OVERAGE_RATE,
				additionalServiceFee: memorial.customPricing?.rates?.additionalServiceFee ?? ADDITIONAL_SERVICE_FEE
			},
			notes: memorial.customPricing?.notes || ''
		};
		error = null;
		success = null;
	}

	function resetToDefaults() {
		formData.tiers = {
			record: TIER_PRICES.record,
			live: TIER_PRICES.live,
			legacy: TIER_PRICES.legacy
		};
		formData.addons = {
			photography: ADDON_PRICES.photography,
			audioVisualSupport: ADDON_PRICES.audioVisualSupport,
			liveMusician: ADDON_PRICES.liveMusician,
			woodenUsbDrives: ADDON_PRICES.woodenUsbDrives
		};
		formData.rates = {
			hourlyOverage: HOURLY_OVERAGE_RATE,
			additionalServiceFee: ADDITIONAL_SERVICE_FEE
		};
	}

	async function savePricing() {
		isSaving = true;
		error = null;
		success = null;

		try {
			const response = await fetch(`/api/admin/memorials/${memorial.id}/pricing`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ customPricing: formData })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to save custom pricing');
			}

			success = 'Custom pricing saved successfully!';
			isEditing = false;
			onUpdate?.();

			// Clear success message after 3 seconds
			setTimeout(() => {
				success = null;
			}, 3000);
		} catch (err: any) {
			error = err.message || 'Failed to save custom pricing';
		} finally {
			isSaving = false;
		}
	}

	async function deletePricing() {
		if (!confirm('Remove custom pricing and revert to defaults?')) {
			return;
		}

		isSaving = true;
		error = null;
		success = null;

		try {
			const response = await fetch(`/api/admin/memorials/${memorial.id}/pricing`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to remove custom pricing');
			}

			success = 'Custom pricing removed, reverted to defaults!';
			formData.enabled = false;
			resetToDefaults();
			isEditing = false;
			onUpdate?.();

			// Clear success message after 3 seconds
			setTimeout(() => {
				success = null;
			}, 3000);
		} catch (err: any) {
			error = err.message || 'Failed to remove custom pricing';
		} finally {
			isSaving = false;
		}
	}
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
	<div class="mb-4 flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold text-gray-900">Custom Pricing Override</h3>
			<p class="mt-1 text-sm text-gray-600">
				Set custom pricing for this memorial (overrides default pricing)
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if memorial.customPricing?.enabled}
				<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
					<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
					</svg>
					Active
				</span>
			{/if}
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if success}
		<div class="mb-4 rounded-md bg-green-50 p-4">
			<div class="flex">
				<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
				</svg>
				<p class="ml-3 text-sm font-medium text-green-800">{success}</p>
			</div>
		</div>
	{/if}

	{#if error}
		<div class="mb-4 rounded-md bg-red-50 p-4">
			<div class="flex">
				<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
				</svg>
				<p class="ml-3 text-sm font-medium text-red-800">{error}</p>
			</div>
		</div>
	{/if}

	{#if !isEditing}
		<!-- View Mode -->
		<div class="space-y-4">
			<!-- Enable/Disable Toggle -->
			<div class="flex items-center justify-between rounded-lg bg-gray-50 p-4">
				<div>
					<p class="font-medium text-gray-900">Custom Pricing Status</p>
					<p class="text-sm text-gray-600">
						{formData.enabled ? 'Custom pricing is active' : 'Using default pricing'}
					</p>
				</div>
				<div class="text-right">
					<span class="text-2xl font-bold {formData.enabled ? 'text-amber-600' : 'text-gray-400'}">
						{formData.enabled ? 'ON' : 'OFF'}
					</span>
				</div>
			</div>

			{#if memorial.customPricing?.enabled}
				<!-- Show active custom pricing -->
				<div class="space-y-3">
					<h4 class="font-medium text-gray-900">Active Custom Prices</h4>
					
					<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{#if customizedFields.record}
							<div class="rounded-lg border border-amber-200 bg-amber-50 p-3">
								<p class="text-xs font-medium text-gray-600">Record Tier</p>
								<p class="mt-1 text-lg font-bold text-gray-900">${formData.tiers?.record}</p>
								<p class="text-xs text-gray-500">Default: ${TIER_PRICES.record}</p>
							</div>
						{/if}
						{#if customizedFields.live}
							<div class="rounded-lg border border-amber-200 bg-amber-50 p-3">
								<p class="text-xs font-medium text-gray-600">Live Tier</p>
								<p class="mt-1 text-lg font-bold text-gray-900">${formData.tiers?.live}</p>
								<p class="text-xs text-gray-500">Default: ${TIER_PRICES.live}</p>
							</div>
						{/if}
						{#if customizedFields.legacy}
							<div class="rounded-lg border border-amber-200 bg-amber-50 p-3">
								<p class="text-xs font-medium text-gray-600">Legacy Tier</p>
								<p class="mt-1 text-lg font-bold text-gray-900">${formData.tiers?.legacy}</p>
								<p class="text-xs text-gray-500">Default: ${TIER_PRICES.legacy}</p>
							</div>
						{/if}
						{#if customizedFields.photography}
							<div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
								<p class="text-xs font-medium text-gray-600">Photography</p>
								<p class="mt-1 text-lg font-bold text-gray-900">${formData.addons?.photography}</p>
								<p class="text-xs text-gray-500">Default: ${ADDON_PRICES.photography}</p>
							</div>
						{/if}
						{#if customizedFields.audioVisualSupport}
							<div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
								<p class="text-xs font-medium text-gray-600">AV Support</p>
								<p class="mt-1 text-lg font-bold text-gray-900">${formData.addons?.audioVisualSupport}</p>
								<p class="text-xs text-gray-500">Default: ${ADDON_PRICES.audioVisualSupport}</p>
							</div>
						{/if}
						{#if customizedFields.liveMusician}
							<div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
								<p class="text-xs font-medium text-gray-600">Live Musician</p>
								<p class="mt-1 text-lg font-bold text-gray-900">${formData.addons?.liveMusician}</p>
								<p class="text-xs text-gray-500">Default: ${ADDON_PRICES.liveMusician}</p>
							</div>
						{/if}
						{#if customizedFields.woodenUsbDrives}
							<div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
								<p class="text-xs font-medium text-gray-600">Wooden USB</p>
								<p class="mt-1 text-lg font-bold text-gray-900">${formData.addons?.woodenUsbDrives}</p>
								<p class="text-xs text-gray-500">Default: ${ADDON_PRICES.woodenUsbDrives}</p>
							</div>
						{/if}
						{#if customizedFields.hourlyOverage}
							<div class="rounded-lg border border-purple-200 bg-purple-50 p-3">
								<p class="text-xs font-medium text-gray-600">Hourly Overage</p>
								<p class="mt-1 text-lg font-bold text-gray-900">${formData.rates?.hourlyOverage}/hr</p>
								<p class="text-xs text-gray-500">Default: ${HOURLY_OVERAGE_RATE}/hr</p>
							</div>
						{/if}
						{#if customizedFields.additionalServiceFee}
							<div class="rounded-lg border border-purple-200 bg-purple-50 p-3">
								<p class="text-xs font-medium text-gray-600">Additional Service</p>
								<p class="mt-1 text-lg font-bold text-gray-900">${formData.rates?.additionalServiceFee}</p>
								<p class="text-xs text-gray-500">Default: ${ADDITIONAL_SERVICE_FEE}</p>
							</div>
						{/if}
					</div>

					{#if memorial.customPricing?.notes}
						<div class="rounded-lg bg-gray-50 p-4">
							<p class="text-sm font-medium text-gray-700">Notes:</p>
							<p class="mt-1 text-sm text-gray-600">{memorial.customPricing.notes}</p>
						</div>
					{/if}
				</div>
			{/if}

			<div class="flex gap-2">
				<button
					onclick={startEditing}
					class="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
				>
					{formData.enabled ? 'Edit Pricing' : 'Set Custom Pricing'}
				</button>
				{#if memorial.customPricing?.enabled}
					<button
						onclick={deletePricing}
						disabled={isSaving}
						class="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
					>
						{isSaving ? 'Removing...' : 'Remove Custom Pricing'}
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Edit Mode -->
		<div class="space-y-6">
			<!-- Enable Toggle -->
			<div class="flex items-center gap-3">
				<input
					type="checkbox"
					id="enableCustomPricing"
					bind:checked={formData.enabled}
					class="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
				/>
				<label for="enableCustomPricing" class="font-medium text-gray-900">
					Enable Custom Pricing
				</label>
			</div>

			{#if formData.enabled}
				<!-- Tier Prices -->
				<div>
					<h4 class="mb-3 font-medium text-gray-900">Service Tier Pricing</h4>
					<div class="grid gap-4 sm:grid-cols-3">
						<div>
							<label for="record" class="block text-sm font-medium text-gray-700">
								Record Tier
								<span class="text-xs text-gray-500">(default: ${TIER_PRICES.record})</span>
							</label>
							<div class="mt-1 flex">
								<span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">$</span>
								<input
									type="number"
									id="record"
									bind:value={formData.tiers.record}
									min="0"
									max="50000"
									class="block w-full rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
								/>
							</div>
						</div>
						<div>
							<label for="live" class="block text-sm font-medium text-gray-700">
								Live Tier
								<span class="text-xs text-gray-500">(default: ${TIER_PRICES.live})</span>
							</label>
							<div class="mt-1 flex">
								<span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">$</span>
								<input
									type="number"
									id="live"
									bind:value={formData.tiers.live}
									min="0"
									max="50000"
									class="block w-full rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
								/>
							</div>
						</div>
						<div>
							<label for="legacy" class="block text-sm font-medium text-gray-700">
								Legacy Tier
								<span class="text-xs text-gray-500">(default: ${TIER_PRICES.legacy})</span>
							</label>
							<div class="mt-1 flex">
								<span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">$</span>
								<input
									type="number"
									id="legacy"
									bind:value={formData.tiers.legacy}
									min="0"
									max="50000"
									class="block w-full rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Add-on Prices -->
				<div>
					<h4 class="mb-3 font-medium text-gray-900">Add-on Service Pricing</h4>
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div>
							<label for="photography" class="block text-sm font-medium text-gray-700">
								Photography
								<span class="text-xs text-gray-500">(default: ${ADDON_PRICES.photography})</span>
							</label>
							<div class="mt-1 flex">
								<span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">$</span>
								<input
									type="number"
									id="photography"
									bind:value={formData.addons.photography}
									min="0"
									max="50000"
									class="block w-full rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
								/>
							</div>
						</div>
						<div>
							<label for="av" class="block text-sm font-medium text-gray-700">
								AV Support
								<span class="text-xs text-gray-500">(default: ${ADDON_PRICES.audioVisualSupport})</span>
							</label>
							<div class="mt-1 flex">
								<span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">$</span>
								<input
									type="number"
									id="av"
									bind:value={formData.addons.audioVisualSupport}
									min="0"
									max="50000"
									class="block w-full rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
								/>
							</div>
						</div>
						<div>
							<label for="musician" class="block text-sm font-medium text-gray-700">
								Live Musician
								<span class="text-xs text-gray-500">(default: ${ADDON_PRICES.liveMusician})</span>
							</label>
							<div class="mt-1 flex">
								<span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">$</span>
								<input
									type="number"
									id="musician"
									bind:value={formData.addons.liveMusician}
									min="0"
									max="50000"
									class="block w-full rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
								/>
							</div>
						</div>
						<div>
							<label for="usb" class="block text-sm font-medium text-gray-700">
								Wooden USB
								<span class="text-xs text-gray-500">(default: ${ADDON_PRICES.woodenUsbDrives})</span>
							</label>
							<div class="mt-1 flex">
								<span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">$</span>
								<input
									type="number"
									id="usb"
									bind:value={formData.addons.woodenUsbDrives}
									min="0"
									max="50000"
									class="block w-full rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Rates -->
				<div>
					<h4 class="mb-3 font-medium text-gray-900">Hourly & Additional Service Rates</h4>
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label for="overage" class="block text-sm font-medium text-gray-700">
								Hourly Overage Rate
								<span class="text-xs text-gray-500">(default: ${HOURLY_OVERAGE_RATE})</span>
							</label>
							<div class="mt-1 flex">
								<span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">$</span>
								<input
									type="number"
									id="overage"
									bind:value={formData.rates.hourlyOverage}
									min="0"
									max="5000"
									class="block w-full rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
								/>
							</div>
						</div>
						<div>
							<label for="additional" class="block text-sm font-medium text-gray-700">
								Additional Service Fee
								<span class="text-xs text-gray-500">(default: ${ADDITIONAL_SERVICE_FEE})</span>
							</label>
							<div class="mt-1 flex">
								<span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">$</span>
								<input
									type="number"
									id="additional"
									bind:value={formData.rates.additionalServiceFee}
									min="0"
									max="5000"
									class="block w-full rounded-r-md border-gray-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Notes -->
				<div>
					<label for="notes" class="block text-sm font-medium text-gray-700">
						Internal Notes
						<span class="text-xs text-gray-500">(visible to admins only)</span>
					</label>
					<textarea
						id="notes"
						bind:value={formData.notes}
						rows="3"
						placeholder="e.g., Phone quote 12/3/25 - loyalty discount for repeat customer"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
					></textarea>
				</div>

				<!-- Quick Actions -->
				<div class="rounded-md bg-gray-50 p-4">
					<p class="mb-2 text-sm font-medium text-gray-700">Quick Actions</p>
					<button
						type="button"
						onclick={resetToDefaults}
						class="text-sm text-amber-600 hover:text-amber-700 underline"
					>
						Reset all to defaults
					</button>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex gap-2 border-t pt-4">
				<button
					onclick={savePricing}
					disabled={isSaving}
					class="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
				>
					{isSaving ? 'Saving...' : 'Save Custom Pricing'}
				</button>
				<button
					onclick={cancelEditing}
					disabled={isSaving}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}
</div>
