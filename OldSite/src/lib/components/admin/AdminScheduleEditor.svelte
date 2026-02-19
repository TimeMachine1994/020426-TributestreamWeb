<script lang="ts">
	import {
		TIER_PRICES,
		ADDON_PRICES,
		HOURLY_OVERAGE_RATE,
		ADDITIONAL_SERVICE_FEE,
		getTierDisplayName,
		getPricingForMemorial
	} from '$lib/config/pricing';
	import type { Tier } from '$lib/types/livestream';
	import type { Memorial } from '$lib/types/memorial';
	import { Calculator, DollarSign, Clock, MapPin, Camera, Send, FileText, Check, Copy } from 'lucide-svelte';

	interface Props {
		memorial: Memorial;
		onUpdate?: () => void;
	}

	let { memorial, onUpdate }: Props = $props();

	// Get effective pricing (respects custom pricing if set)
	const pricing = $derived(getPricingForMemorial(memorial.customPricing));

	// State
	let isEditing = $state(false);
	let isSaving = $state(false);
	let isCreatingInvoice = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);
	let createdInvoice = $state<{ invoiceId: string; paymentUrl: string } | null>(null);
	let copied = $state(false);

	// Schedule form data - initialize from memorial's saved schedule or defaults
	let selectedTier = $state<Tier>((memorial.schedule?.selectedTier as Tier) || 'record');
	let mainServiceHours = $state(memorial.schedule?.mainService?.hours || 2);
	let mainServiceLocation = $state(memorial.schedule?.mainService?.location?.name || '');
	let mainServiceAddress = $state(memorial.schedule?.mainService?.location?.address || '');
	let mainServiceDate = $state(memorial.schedule?.mainService?.time?.date || '');
	let mainServiceTime = $state(memorial.schedule?.mainService?.time?.time || '');

	// Additional services
	let additionalLocationEnabled = $state(memorial.schedule?.additionalLocation?.enabled || false);
	let additionalLocationHours = $state(memorial.schedule?.additionalLocation?.hours || 2);
	let additionalLocationName = $state(memorial.schedule?.additionalLocation?.location?.name || '');
	let additionalLocationDate = $state(memorial.schedule?.additionalLocation?.time?.date || '');
	let additionalLocationTime = $state(memorial.schedule?.additionalLocation?.time?.time || '');

	let additionalDayEnabled = $state(memorial.schedule?.additionalDay?.enabled || false);
	let additionalDayHours = $state(memorial.schedule?.additionalDay?.hours || 2);
	let additionalDayLocation = $state(memorial.schedule?.additionalDay?.location?.name || '');
	let additionalDayDate = $state(memorial.schedule?.additionalDay?.time?.date || '');
	let additionalDayTime = $state(memorial.schedule?.additionalDay?.time?.time || '');

	// Add-ons
	let photographyEnabled = $state(memorial.schedule?.addons?.photography || false);
	let audioVisualEnabled = $state(memorial.schedule?.addons?.audioVisualSupport || false);
	let liveMusicianEnabled = $state(memorial.schedule?.addons?.liveMusician || false);
	let woodenUsbCount = $state(memorial.schedule?.addons?.woodenUsbDrives || 0);

	// Invoice settings
	let customerEmail = $state(memorial.creatorEmail || '');
	let customerName = $state(memorial.funeralDirectorName || '');
	let sendEmail = $state(true);

	// Calculate booking items
	const bookingItems = $derived(calculateBookingItems());
	const totalPrice = $derived(bookingItems.reduce((acc, item) => acc + item.total, 0));

	function calculateBookingItems() {
		const items: Array<{ id: string; name: string; price: number; quantity: number; total: number }> = [];

		// 1. Base Package
		if (selectedTier) {
			const price = pricing.tiers[selectedTier as keyof typeof pricing.tiers];
			items.push({
				id: 'base-package',
				name: getTierDisplayName(selectedTier),
				price: price,
				quantity: 1,
				total: price
			});
		}

		// 2. Main Service Hourly Overage (over 2 hours)
		const mainOverageHours = Math.max(0, mainServiceHours - 2);
		if (mainOverageHours > 0) {
			items.push({
				id: 'main-overage',
				name: 'Main Service Overage',
				price: pricing.hourlyOverage,
				quantity: mainOverageHours,
				total: pricing.hourlyOverage * mainOverageHours
			});
		}

		// 3. Additional Location
		if (additionalLocationEnabled) {
			items.push({
				id: 'additional-location-base',
				name: 'Additional Location',
				price: pricing.additionalService,
				quantity: 1,
				total: pricing.additionalService
			});

			const addlLocationOverage = Math.max(0, additionalLocationHours - 2);
			if (addlLocationOverage > 0) {
				items.push({
					id: 'additional-location-overage',
					name: 'Additional Location Overage',
					price: pricing.hourlyOverage,
					quantity: addlLocationOverage,
					total: pricing.hourlyOverage * addlLocationOverage
				});
			}
		}

		// 4. Additional Day
		if (additionalDayEnabled) {
			items.push({
				id: 'additional-day-base',
				name: 'Additional Day',
				price: pricing.additionalService,
				quantity: 1,
				total: pricing.additionalService
			});

			const addlDayOverage = Math.max(0, additionalDayHours - 2);
			if (addlDayOverage > 0) {
				items.push({
					id: 'additional-day-overage',
					name: 'Additional Day Overage',
					price: pricing.hourlyOverage,
					quantity: addlDayOverage,
					total: pricing.hourlyOverage * addlDayOverage
				});
			}
		}

		// 5. Add-ons
		if (photographyEnabled) {
			items.push({
				id: 'photography',
				name: 'Photography Service',
				price: pricing.addons.photography,
				quantity: 1,
				total: pricing.addons.photography
			});
		}

		if (audioVisualEnabled) {
			items.push({
				id: 'audio-visual',
				name: 'Audio/Visual Support',
				price: pricing.addons.audioVisualSupport,
				quantity: 1,
				total: pricing.addons.audioVisualSupport
			});
		}

		if (liveMusicianEnabled) {
			items.push({
				id: 'live-musician',
				name: 'Live Musician',
				price: pricing.addons.liveMusician,
				quantity: 1,
				total: pricing.addons.liveMusician
			});
		}

		if (woodenUsbCount > 0) {
			const includedDrives = selectedTier === 'legacy' ? 1 : 0;
			const chargeableDrives = Math.max(0, woodenUsbCount - includedDrives);

			if (chargeableDrives > 0) {
				const firstDrivePrice = pricing.addons.woodenUsbDrives;
				const additionalDrivePrice = 100;

				let totalUsbPrice = 0;
				if (chargeableDrives === 1) {
					totalUsbPrice = firstDrivePrice;
				} else {
					totalUsbPrice = firstDrivePrice + (chargeableDrives - 1) * additionalDrivePrice;
				}

				items.push({
					id: 'wooden-usb',
					name: `Wooden USB Drive${chargeableDrives > 1 ? 's' : ''}`,
					price: totalUsbPrice / chargeableDrives,
					quantity: chargeableDrives,
					total: totalUsbPrice
				});
			}
		}

		return items;
	}

	function startEditing() {
		isEditing = true;
		error = null;
		success = null;
		createdInvoice = null;
	}

	function cancelEditing() {
		isEditing = false;
		error = null;
		// Reset to memorial's saved data
		selectedTier = (memorial.schedule?.selectedTier as Tier) || 'record';
		mainServiceHours = memorial.schedule?.mainService?.hours || 2;
		mainServiceLocation = memorial.schedule?.mainService?.location?.name || '';
		mainServiceAddress = memorial.schedule?.mainService?.location?.address || '';
		mainServiceDate = memorial.schedule?.mainService?.time?.date || '';
		mainServiceTime = memorial.schedule?.mainService?.time?.time || '';
		additionalLocationEnabled = memorial.schedule?.additionalLocation?.enabled || false;
		additionalLocationHours = memorial.schedule?.additionalLocation?.hours || 2;
		additionalDayEnabled = memorial.schedule?.additionalDay?.enabled || false;
		additionalDayHours = memorial.schedule?.additionalDay?.hours || 2;
		photographyEnabled = memorial.schedule?.addons?.photography || false;
		audioVisualEnabled = memorial.schedule?.addons?.audioVisualSupport || false;
		liveMusicianEnabled = memorial.schedule?.addons?.liveMusician || false;
		woodenUsbCount = memorial.schedule?.addons?.woodenUsbDrives || 0;
	}

	async function saveSchedule() {
		isSaving = true;
		error = null;
		success = null;

		try {
			const scheduleData = {
				selectedTier,
				mainService: {
					location: { name: mainServiceLocation, address: mainServiceAddress },
					time: { date: mainServiceDate, time: mainServiceTime },
					hours: mainServiceHours
				},
				additionalLocation: {
					enabled: additionalLocationEnabled,
					location: { name: additionalLocationName },
					time: { date: additionalLocationDate, time: additionalLocationTime },
					hours: additionalLocationHours
				},
				additionalDay: {
					enabled: additionalDayEnabled,
					location: { name: additionalDayLocation },
					time: { date: additionalDayDate, time: additionalDayTime },
					hours: additionalDayHours
				},
				addons: {
					photography: photographyEnabled,
					audioVisualSupport: audioVisualEnabled,
					liveMusician: liveMusicianEnabled,
					woodenUsbDrives: woodenUsbCount
				},
				bookingItems,
				totalPrice,
				lastUpdated: new Date().toISOString()
			};

			const response = await fetch(`/api/memorials/${memorial.id}/schedule/auto-save`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(scheduleData)
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to save schedule');
			}

			success = 'Schedule saved successfully!';
			onUpdate?.();

			setTimeout(() => {
				success = null;
			}, 3000);
		} catch (err: any) {
			error = err.message || 'Failed to save schedule';
		} finally {
			isSaving = false;
		}
	}

	async function createInvoice() {
		if (!customerEmail.trim()) {
			error = 'Customer email is required to create an invoice';
			return;
		}

		if (bookingItems.length === 0) {
			error = 'No items to invoice';
			return;
		}

		isCreatingInvoice = true;
		error = null;
		success = null;

		try {
			// First save the schedule
			await saveSchedule();

			// Then create the invoice
			const response = await fetch('/api/admin/invoices', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerEmail: customerEmail.trim(),
					customerName: customerName.trim() || undefined,
					memorialId: memorial.id,
					sendEmail,
					items: bookingItems.map((item) => ({
						name: item.name,
						quantity: item.quantity,
						price: Math.round(item.price * 100) // Convert to cents
					}))
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create invoice');
			}

			createdInvoice = {
				invoiceId: result.invoiceId,
				paymentUrl: result.paymentUrl
			};

			success = sendEmail
				? `Invoice created and sent to ${customerEmail}!`
				: 'Invoice created! Share the payment link with the customer.';

			onUpdate?.();
		} catch (err: any) {
			error = err.message || 'Failed to create invoice';
		} finally {
			isCreatingInvoice = false;
		}
	}

	async function copyLink() {
		if (!createdInvoice) return;

		try {
			await navigator.clipboard.writeText(createdInvoice.paymentUrl);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0
		}).format(amount);
	}

	const tiers = $derived<Array<{ name: string; alias: Tier; price: number }>>([
		{ name: 'Record', alias: 'record', price: pricing.tiers.record },
		{ name: 'Live', alias: 'live', price: pricing.tiers.live },
		{ name: 'Legacy', alias: 'legacy', price: pricing.tiers.legacy }
	]);
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Calculator class="h-5 w-5 text-blue-600" />
			<h3 class="text-lg font-semibold text-gray-900">Schedule & Billing</h3>
		</div>
		<div class="flex items-center gap-2">
			{#if memorial.isPaid}
				<span class="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
					✅ Paid
				</span>
			{:else}
				<span class="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
					❌ Unpaid
				</span>
			{/if}
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if success}
		<div class="mb-4 rounded-md bg-green-50 p-4">
			<p class="text-sm font-medium text-green-800">{success}</p>
		</div>
	{/if}

	{#if error}
		<div class="mb-4 rounded-md bg-red-50 p-4">
			<p class="text-sm font-medium text-red-800">{error}</p>
		</div>
	{/if}

	<!-- Invoice Created Success -->
	{#if createdInvoice}
		<div class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
			<div class="flex items-center gap-2 mb-3">
				<Check class="h-5 w-5 text-green-600" />
				<span class="font-medium text-green-800">Invoice Created!</span>
			</div>
			<div class="flex items-center gap-2">
				<input
					type="text"
					value={createdInvoice.paymentUrl}
					readonly
					class="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
				/>
				<button
					onclick={copyLink}
					class="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
				>
					{#if copied}
						<Check class="h-4 w-4" />
						Copied!
					{:else}
						<Copy class="h-4 w-4" />
						Copy
					{/if}
				</button>
				<a
					href="/pay/{createdInvoice.invoiceId}"
					target="_blank"
					class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
				>
					View
				</a>
			</div>
		</div>
	{/if}

	{#if !isEditing}
		<!-- View Mode -->
		<div class="space-y-4">
			<!-- Current Schedule Summary -->
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<p class="text-sm text-gray-600">Package</p>
						<p class="font-medium text-gray-900">
							{memorial.schedule?.selectedTier ? getTierDisplayName(memorial.schedule.selectedTier as Tier) : 'Not set'}
						</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">Total Price</p>
						<p class="text-xl font-bold text-gray-900">{formatCurrency(memorial.totalPrice || 0)}</p>
					</div>
				</div>
				{#if memorial.schedule?.mainService?.time?.date}
					<div class="mt-3 pt-3 border-t border-gray-200">
						<p class="text-sm text-gray-600">Service Date</p>
						<p class="font-medium text-gray-900">
							{new Date(memorial.schedule.mainService.time.date).toLocaleDateString()}
							{memorial.schedule.mainService.time.time || ''}
						</p>
					</div>
				{/if}
			</div>

			<button
				onclick={startEditing}
				class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				Edit Schedule & Create Invoice
			</button>
		</div>
	{:else}
		<!-- Edit Mode -->
		<div class="space-y-6">
			<!-- Package Selection -->
			<div>
				<h4 class="mb-3 font-medium text-gray-900 flex items-center gap-2">
					<DollarSign class="h-4 w-4 text-amber-500" />
					Select Package
				</h4>
				<div class="grid gap-3 sm:grid-cols-3">
					{#each tiers as tier}
						<button
							type="button"
							onclick={() => (selectedTier = tier.alias)}
							class="rounded-lg border-2 p-3 text-left transition-all {selectedTier === tier.alias
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-gray-300'}"
						>
							<p class="font-medium text-gray-900">Tributestream {tier.name}</p>
							<p class="text-lg font-bold text-blue-600">{formatCurrency(tier.price)}</p>
						</button>
					{/each}
				</div>
			</div>

			<!-- Main Service Details -->
			<div>
				<h4 class="mb-3 font-medium text-gray-900 flex items-center gap-2">
					<MapPin class="h-4 w-4 text-amber-500" />
					Main Service
				</h4>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label class="block text-sm font-medium text-gray-700">Location</label>
						<input
							type="text"
							bind:value={mainServiceLocation}
							placeholder="e.g., St. Mary's Church"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">Address</label>
						<input
							type="text"
							bind:value={mainServiceAddress}
							placeholder="123 Main St"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">Date</label>
						<input
							type="date"
							bind:value={mainServiceDate}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">Time</label>
						<input
							type="time"
							bind:value={mainServiceTime}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						/>
					</div>
				</div>
			</div>

			<!-- Service Duration -->
			<div>
				<h4 class="mb-3 font-medium text-gray-900 flex items-center gap-2">
					<Clock class="h-4 w-4 text-amber-500" />
					Duration
				</h4>
				<div>
					<label class="block text-sm font-medium text-gray-700">
						Main Service Hours (2 included, {formatCurrency(pricing.hourlyOverage)}/hr overage)
					</label>
					<input
						type="range"
						min="1"
						max="8"
						step="1"
						bind:value={mainServiceHours}
						class="mt-2 w-full"
					/>
					<div class="flex justify-between text-sm text-gray-500">
						<span>1 hr</span>
						<span class="font-medium text-blue-600">{mainServiceHours} hours</span>
						<span>8 hrs</span>
					</div>
				</div>
			</div>

			<!-- Additional Services -->
			<div>
				<h4 class="mb-3 font-medium text-gray-900">Additional Services</h4>
				<div class="space-y-3">
					<label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
						<input
							type="checkbox"
							bind:checked={additionalLocationEnabled}
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<div class="flex-1">
							<span class="font-medium text-gray-900">Additional Location</span>
							<span class="text-sm text-gray-500 ml-2">+{formatCurrency(pricing.additionalService)}</span>
						</div>
					</label>

					{#if additionalLocationEnabled}
						<div class="ml-7 grid gap-3 sm:grid-cols-3 p-3 bg-gray-50 rounded-lg">
							<input
								type="text"
								bind:value={additionalLocationName}
								placeholder="Location name"
								class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							/>
							<input
								type="date"
								bind:value={additionalLocationDate}
								class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							/>
							<div class="flex items-center gap-2">
								<input
									type="number"
									min="1"
									max="8"
									bind:value={additionalLocationHours}
									class="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
								/>
								<span class="text-sm text-gray-500">hours</span>
							</div>
						</div>
					{/if}

					<label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
						<input
							type="checkbox"
							bind:checked={additionalDayEnabled}
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<div class="flex-1">
							<span class="font-medium text-gray-900">Additional Day</span>
							<span class="text-sm text-gray-500 ml-2">+{formatCurrency(pricing.additionalService)}</span>
						</div>
					</label>

					{#if additionalDayEnabled}
						<div class="ml-7 grid gap-3 sm:grid-cols-3 p-3 bg-gray-50 rounded-lg">
							<input
								type="text"
								bind:value={additionalDayLocation}
								placeholder="Location name"
								class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							/>
							<input
								type="date"
								bind:value={additionalDayDate}
								class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
							/>
							<div class="flex items-center gap-2">
								<input
									type="number"
									min="1"
									max="8"
									bind:value={additionalDayHours}
									class="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
								/>
								<span class="text-sm text-gray-500">hours</span>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Add-ons -->
			<div>
				<h4 class="mb-3 font-medium text-gray-900 flex items-center gap-2">
					<Camera class="h-4 w-4 text-amber-500" />
					Add-ons
				</h4>
				<div class="grid gap-3 sm:grid-cols-2">
					<label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
						<input
							type="checkbox"
							bind:checked={photographyEnabled}
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<div>
							<span class="font-medium text-gray-900">Photography</span>
							<span class="block text-sm text-gray-500">+{formatCurrency(pricing.addons.photography)}</span>
						</div>
					</label>

					<label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
						<input
							type="checkbox"
							bind:checked={audioVisualEnabled}
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<div>
							<span class="font-medium text-gray-900">A/V Support</span>
							<span class="block text-sm text-gray-500">+{formatCurrency(pricing.addons.audioVisualSupport)}</span>
						</div>
					</label>

					<label class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50">
						<input
							type="checkbox"
							bind:checked={liveMusicianEnabled}
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<div>
							<span class="font-medium text-gray-900">Live Musician</span>
							<span class="block text-sm text-gray-500">+{formatCurrency(pricing.addons.liveMusician)}</span>
						</div>
					</label>

					<div class="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
						<div class="flex-1">
							<span class="font-medium text-gray-900">Wooden USB Drives</span>
							<span class="block text-sm text-gray-500">
								{selectedTier === 'legacy' ? '1 included, ' : ''}+{formatCurrency(pricing.addons.woodenUsbDrives)} first
							</span>
						</div>
						<input
							type="number"
							min="0"
							max="10"
							bind:value={woodenUsbCount}
							class="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-center"
						/>
					</div>
				</div>
			</div>

			<!-- Price Breakdown -->
			<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
				<h4 class="mb-3 font-medium text-gray-900">Price Breakdown</h4>
				<div class="space-y-2">
					{#each bookingItems as item}
						<div class="flex justify-between text-sm">
							<span class="text-gray-700">
								{item.name}
								{#if item.quantity > 1}
									<span class="text-gray-500">({item.quantity}x {formatCurrency(item.price)})</span>
								{/if}
							</span>
							<span class="font-medium text-gray-900">{formatCurrency(item.total)}</span>
						</div>
					{/each}
					<div class="border-t border-blue-200 pt-2 mt-2">
						<div class="flex justify-between">
							<span class="text-lg font-bold text-gray-900">Total</span>
							<span class="text-xl font-bold text-blue-600">{formatCurrency(totalPrice)}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Invoice Details -->
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
				<h4 class="mb-3 font-medium text-gray-900 flex items-center gap-2">
					<FileText class="h-4 w-4 text-gray-500" />
					Invoice Details
				</h4>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label class="block text-sm font-medium text-gray-700">Customer Email *</label>
						<input
							type="email"
							bind:value={customerEmail}
							placeholder="customer@example.com"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700">Customer Name</label>
						<input
							type="text"
							bind:value={customerName}
							placeholder="John Doe"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						/>
					</div>
				</div>
				<label class="mt-3 flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={sendEmail}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-700">Send invoice email to customer</span>
				</label>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-wrap gap-2 border-t pt-4">
				<button
					onclick={saveSchedule}
					disabled={isSaving || isCreatingInvoice}
					class="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
				>
					{isSaving ? 'Saving...' : 'Save Schedule Only'}
				</button>
				<button
					onclick={createInvoice}
					disabled={isSaving || isCreatingInvoice || !customerEmail.trim()}
					class="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
				>
					<Send class="h-4 w-4" />
					{isCreatingInvoice ? 'Creating Invoice...' : 'Save & Create Invoice'}
				</button>
				<button
					onclick={cancelEditing}
					disabled={isSaving || isCreatingInvoice}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}
</div>
