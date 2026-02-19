<script lang="ts">
	import BookingForm from './BookingForm.svelte';
	import Summary from './Summary.svelte';
	import StripeCheckout from './StripeCheckout.svelte';
	import TierSelector from './TierSelector.svelte';
	import type {
		CalculatorFormData,
		Tier,
		BookingItem,
		LivestreamConfig
	} from '$lib/types/livestream';
	import type { Memorial } from '$lib/types/memorial';
	import { onMount } from 'svelte';
	import { auth } from '$lib/firebase';
	import { useAutoSave } from '$lib/composables/useAutoSave';
	import { createStreamsFromSchedule } from '$lib/utils/streamMapper';
	import { Button } from '$lib/ui';
	import {
		TIER_PRICES,
		ADDON_PRICES,
		HOURLY_OVERAGE_RATE,
		ADDITIONAL_SERVICE_FEE
	} from '$lib/config/pricing';

	let {
		memorialId,
		data
	}: {
		memorialId: string | null;
		data: { memorial: Memorial | null; config: LivestreamConfig | null };
	} = $props();

	let currentStep = $state<'booking' | 'payment' | 'payNow'>('booking');
	let clientSecret = $state<string | null>(null);
	let configId = $state<string | null>(null);
	let selectedTier = $state<Tier>('record');

	// Auto-save functionality
	let autoSaveEnabled = $state(false);
	let showAutoSaveStatus = $state(false);

	// Memorial services data (authoritative source)
	let services = $state({
		main: {
			location: { name: '', address: '', isUnknown: false },
			time: { date: null, time: null, isUnknown: false },
			hours: 2
		},
		additional: [] as Array<{
			type: 'location' | 'day';
			location: { name: string; address: string; isUnknown: boolean };
			time: { date: string | null; time: string | null; isUnknown: boolean };
			hours: number;
		}>
	});

	// Calculator-specific data (booking/pricing)
	let calculatorData = $state<CalculatorFormData>({
		memorialId: memorialId || '',
		selectedTier: 'record',
		addons: {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: 0
		}
	});

	// Update calculatorData when selectedTier changes
	$effect(() => {
		calculatorData.selectedTier = selectedTier;
	});

	// Memorial context data
	let lovedOneName = $state(data.memorial?.lovedOneName || '');
	let funeralDirectorName = $state(data.memorial?.funeralDirectorName || '');
	let funeralHome = $state(data.memorial?.funeralHome || '');

	// Initialize auto-save when memorialId is available
	const autoSave = memorialId
		? useAutoSave(memorialId, {
				delay: 3000,
				onSave: (success, error) => {
					showAutoSaveStatus = true;
					if (!success && error) {
						console.error('Auto-save failed:', error);
					}
					setTimeout(() => {
						showAutoSaveStatus = false;
					}, 2000);
				}
			})
		: null;

	onMount(async () => {
		// Load existing data if available
		if (data.memorial) {
			// Load memorial metadata
			lovedOneName = data.memorial.lovedOneName || '';
			funeralDirectorName = data.memorial.funeralDirectorName || '';
			funeralHome = data.memorial.funeralHome || '';

			// Load existing calculator config if available
			if (data.memorial.calculatorConfig) {
				calculatorData = data.memorial.calculatorConfig;
				if (data.memorial.calculatorConfig.selectedTier) {
					selectedTier = data.memorial.calculatorConfig.selectedTier;
				}
			}

			// Load services data
			if (data.memorial.services) {
				services.main = data.memorial.services.main;
				services.additional = data.memorial.services.additional || [];
			}

			// Try to load auto-saved data
			if (autoSave && memorialId) {
				const autoSavedData = await autoSave.loadAutoSavedData();
				if (autoSavedData) {
					const shouldRestore = confirm(
						'We found an auto-saved version of your schedule. Would you like to restore it?'
					);
					if (shouldRestore) {
						if (autoSavedData.services) {
							services = autoSavedData.services;
						}
						if (autoSavedData.calculatorData) {
							calculatorData = autoSavedData.calculatorData;
							if (autoSavedData.calculatorData.selectedTier) {
								selectedTier = autoSavedData.calculatorData.selectedTier;
							}
						}
					}
				}
			}
		}

		// Enable auto-save after initial load
		if (memorialId) {
			autoSaveEnabled = true;
		}
	});

	let bookingItems = $derived.by(() => {
		const items: BookingItem[] = [];

		// 1. Base Package
		if (selectedTier) {
			const price = TIER_PRICES[selectedTier];
			items.push({
				id: selectedTier,
				name: `Tributestream ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`,
				package: `Tributestream ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`,
				price: price,
				quantity: 1,
				total: price
			});
		} else {
			return items;
		}

		// 2. Hourly Overage Charges
		const mainOverageHours = Math.max(0, services.main.hours - 2);
		if (mainOverageHours > 0) {
			items.push({
				id: 'main_overage',
				name: 'Main Location Overage',
				package: 'Add-on',
				price: HOURLY_OVERAGE_RATE,
				quantity: mainOverageHours,
				total: HOURLY_OVERAGE_RATE * mainOverageHours
			});
		}

		// 3. Additional Location
		const additionalLocation = services.additional.find((s) => s.type === 'location');
		if (additionalLocation) {
			items.push({
				id: 'addl_location_fee',
				name: 'Additional Location Fee',
				package: 'Add-on',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});
			const addlLocationOverage = Math.max(0, additionalLocation.hours - 2);
			if (addlLocationOverage > 0) {
				items.push({
					id: 'addl_location_overage',
					name: 'Add. Location Overage',
					package: 'Add-on',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlLocationOverage,
					total: HOURLY_OVERAGE_RATE * addlLocationOverage
				});
			}
		}

		// 4. Additional Day
		const additionalDay = services.additional.find((s) => s.type === 'day');
		if (additionalDay) {
			items.push({
				id: 'addl_day_fee',
				name: 'Additional Day Fee',
				package: 'Add-on',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});
			const addlDayOverage = Math.max(0, additionalDay.hours - 2);
			if (addlDayOverage > 0) {
				items.push({
					id: 'addl_day_overage',
					name: 'Add. Day Overage',
					package: 'Add-on',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlDayOverage,
					total: HOURLY_OVERAGE_RATE * addlDayOverage
				});
			}
		}

		// 5. Add-ons
		if (calculatorData.addons.photography) {
			items.push({
				id: 'photography',
				name: 'Photography',
				package: 'Add-on',
				price: ADDON_PRICES.photography,
				quantity: 1,
				total: ADDON_PRICES.photography
			});
		}
		if (calculatorData.addons.audioVisualSupport) {
			items.push({
				id: 'av_support',
				name: 'Audio/Visual Support',
				package: 'Add-on',
				price: ADDON_PRICES.audioVisualSupport,
				quantity: 1,
				total: ADDON_PRICES.audioVisualSupport
			});
		}
		if (calculatorData.addons.liveMusician) {
			items.push({
				id: 'live_musician',
				name: 'Live Musician',
				package: 'Add-on',
				price: ADDON_PRICES.liveMusician,
				quantity: 1,
				total: ADDON_PRICES.liveMusician
			});
		}
		if (calculatorData.addons.woodenUsbDrives > 0) {
			const isLegacy = selectedTier === 'legacy';
			const usbDrives = calculatorData.addons.woodenUsbDrives;
			const includedDrives = isLegacy ? 1 : 0;

			if (usbDrives > includedDrives) {
				const billableDrives = usbDrives - includedDrives;
				// First billable drive logic
				if (billableDrives > 0 && includedDrives === 0) {
					items.push({
						id: 'usb_drive_first',
						name: 'Wooden USB Drive',
						package: 'Add-on',
						price: ADDON_PRICES.woodenUsbDrives,
						quantity: 1,
						total: ADDON_PRICES.woodenUsbDrives
					});
					if (billableDrives > 1) {
						items.push({
							id: 'usb_drive_additional',
							name: 'Additional Wooden USB Drives',
							package: 'Add-on',
							price: 100,
							quantity: billableDrives - 1,
							total: 100 * (billableDrives - 1)
						});
					}
				} else {
					items.push({
						id: 'usb_drive_additional',
						name: 'Additional Wooden USB Drives',
						package: 'Add-on',
						price: 100,
						quantity: billableDrives,
						total: 100 * billableDrives
					});
				}
			}
		}

		console.log('📝 Booking items recalculated:', items);
		return items;
	});

	let total = $derived(bookingItems.reduce((acc, item) => acc + item.total, 0));

	$inspect(bookingItems, total);

	function handleTierChange(tier: Tier) {
		console.log('✨ Tier selected:', tier);
		selectedTier = tier;
		// Update calculator data
		calculatorData.selectedTier = tier;
		// Reset relevant parts of the addons when tier changes
		calculatorData.addons = {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: tier === 'legacy' ? 1 : 0
		};

		// Trigger auto-save when tier changes
		if (autoSaveEnabled && autoSave) {
			autoSave.triggerAutoSave({ services, calculatorData });
		}
	}

	// Watch for services and calculator data changes
	// Auto-save trigger when form data changes
	$effect(() => {
		if (autoSaveEnabled && autoSave) {
			if (selectedTier || services.main.location.name || services.additional.length > 0) {
				autoSave.triggerAutoSave({ services, calculatorData });
			}
		}
	});

	async function createStreamsFromScheduleLocal() {
		console.log('🎬 [CALCULATOR] ========== STREAM CREATION STARTED ==========');
		console.log('🎬 [CALCULATOR] createStreamsFromSchedule called', { memorialId });
		console.log('🎬 [CALCULATOR] Memorial data available:', !!data?.memorial);
		console.log('🎬 [CALCULATOR] Memorial name:', data?.memorial?.lovedOneName);
		
		if (!memorialId) {
			console.log('❌ [CALCULATOR] No memorialId, skipping stream creation');
			return;
		}

		try {
			console.log('🎬 [CALCULATOR] Creating streams from schedule data...');
			console.log('🎬 [CALCULATOR] Services data structure:', {
				hasMain: !!services.main,
				mainLocationName: services.main?.location?.name,
				mainLocationAddress: services.main?.location?.address,
				mainDate: services.main?.time?.date,
				mainTime: services.main?.time?.time,
				mainHours: services.main?.hours,
				additionalCount: services.additional?.length || 0
			});
			
			const streamCreationData = {
				services: services,
				calculatorData: {
					selectedTier,
					addons: calculatorData.addons
				},
				memorialName: data?.memorial?.lovedOneName
			};

			console.log('🔍 [CALCULATOR] Stream creation data being sent:', JSON.stringify(streamCreationData, null, 2));
			
			const streamResults = await createStreamsFromSchedule(memorialId, streamCreationData);
			
			console.log('📊 [CALCULATOR] Stream creation results:', {
				success: streamResults.success,
				createdCount: streamResults.createdStreams.length,
				failedCount: streamResults.failedStreams.length,
				errors: streamResults.errors
			});
			
			if (streamResults.success) {
				console.log(`✅ [CALCULATOR] Created ${streamResults.createdStreams.length} streams successfully`);
				if (streamResults.createdStreams.length > 0) {
					console.log('🎉 [CALCULATOR] Stream titles created:', 
						streamResults.createdStreams.map(s => s.title).join(', ')
					);
					
					// Show user feedback about created streams
					alert(`✅ Successfully created ${streamResults.createdStreams.length} stream(s):\n${streamResults.createdStreams.map(s => `• ${s.title}`).join('\n')}`);
				}
			} else {
				console.warn(`⚠️ [CALCULATOR] Stream creation had issues:`, streamResults.errors);
				if (streamResults.errors.length > 0) {
					alert(`⚠️ Stream creation issues:\n${streamResults.errors.join('\n')}`);
				}
			}
		} catch (error) {
			console.error('❌ [CALCULATOR] Error during stream creation:', error);
		}
	}

	async function saveAndPayLater(isPayNowFlow = false) {
		console.log('💾 [CALCULATOR] ========== SAVE AND PAY LATER STARTED ==========');
		console.log('💾 [CALCULATOR] saveAndPayLater called', { isPayNowFlow, memorialId });
		console.log('💾 [CALCULATOR] Current selectedTier:', selectedTier);
		console.log('💾 [CALCULATOR] Current services data:', JSON.stringify(services, null, 2));
		console.log('💾 [CALCULATOR] Current calculatorData:', JSON.stringify(calculatorData, null, 2));
		
		// Validate required data
		if (!selectedTier) {
			console.log('❌ [CALCULATOR] Validation failed: No tier selected');
			alert('Please select a service tier before proceeding.');
			return;
		}

		if (!services.main.location.name) {
			console.log('❌ [CALCULATOR] Validation failed: No main location name');
			alert('Please specify the main service location.');
			return;
		}

		if (bookingItems.length === 0) {
			console.log('❌ [CALCULATOR] Validation failed: No booking items');
			alert('Unable to calculate booking items. Please check your selections.');
			return;
		}

		console.log('✅ [CALCULATOR] All validations passed');

		// Prepare payload for API
		const payload = {
			services,
			calculatorData,
			bookingItems,
			totalPrice: bookingItems.reduce((sum, item) => sum + item.total, 0)
		};

		console.log('📦 [CALCULATOR] Payload being sent to schedule API:', JSON.stringify(payload, null, 2));

		try {
			console.log('📡 [CALCULATOR] Making API request to:', `/api/memorials/${memorialId}/schedule`);
			console.log('📡 [CALCULATOR] Request method: PATCH');
			console.log('📡 [CALCULATOR] Request headers:', { 'Content-Type': 'application/json' });
			
			const response = await fetch(`/api/memorials/${memorialId}/schedule`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			console.log('📡 [CALCULATOR] API response status:', response.status);
			console.log('📡 [CALCULATOR] API response ok:', response.ok);

			const result = await response.json();
			console.log('📡 [CALCULATOR] API response data:', JSON.stringify(result, null, 2));

			if (response.ok) {
				console.log('✅ [CALCULATOR] Schedule saved successfully, now creating streams...');
				
				// Clear auto-save data since we've successfully saved
				if (autoSave) {
					autoSave.clearAutoSave?.();
				}

				// Auto-create livestreams if dates/times are provided
				console.log('🎬 [CALCULATOR] About to call createStreamsFromScheduleLocal...');
				await createStreamsFromScheduleLocal();
				console.log('🎬 [CALCULATOR] createStreamsFromScheduleLocal completed');

				if (!isPayNowFlow) {
					alert('Schedule saved successfully!');
				}
				console.log('💾 [CALCULATOR] ========== SAVE AND PAY LATER COMPLETED SUCCESSFULLY ==========');
			} else {
				console.error('❌ [CALCULATOR] Failed to save schedule:', result.error);
				console.log('💾 [CALCULATOR] ========== SAVE AND PAY LATER FAILED ==========');
				alert(`Failed to save schedule: ${result.error}`);
			}
		} catch (error) {
			console.error('❌ [CALCULATOR] Exception during save:', error);
			console.log('💾 [CALCULATOR] ========== SAVE AND PAY LATER EXCEPTION ==========');
			alert('An error occurred while saving the schedule.');
		}
	}

	async function proceedToPayment() {
		if (!memorialId) {
			return;
		}
		const payload = {
			services,
			calculatorData,
			bookingItems,
			totalPrice: bookingItems.reduce((sum, item) => sum + item.total, 0)
		};

		const response = await fetch('/app/calculator?/continueToPayment', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const result = await response.json();

		if (result.success) {
			clientSecret = result.clientSecret;
			configId = result.configId;
			currentStep = 'payment';
		} else {
			alert('Failed to initiate payment. Please try again.');
		}
	}

	async function handlePayNow() {
		await saveAndPayLater(true);
		currentStep = 'payNow';
	}
</script>

<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
	<div class="space-y-8 lg:col-span-2">
		<!-- Auto-save Status -->
		{#if autoSaveEnabled && showAutoSaveStatus && autoSave}
			<div class="fixed top-4 right-4 z-50 transition-all duration-300">
				{#if autoSave.isSaving()}
					<div
						class="flex items-center space-x-2 rounded-lg bg-blue-500 px-4 py-2 text-white shadow-lg"
					>
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						<span class="text-sm">Auto-saving...</span>
					</div>
				{:else if autoSave.lastSaved()}
					<div
						class="flex items-center space-x-2 rounded-lg bg-green-500 px-4 py-2 text-white shadow-lg"
					>
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							></path>
						</svg>
						<span class="text-sm">Auto-saved</span>
					</div>
				{:else if autoSave.hasUnsavedChanges()}
					<div
						class="flex items-center space-x-2 rounded-lg bg-yellow-500 px-4 py-2 text-white shadow-lg"
					>
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							></path>
						</svg>
						<span class="text-sm">Unsaved changes</span>
					</div>
				{/if}
			</div>
		{/if}

		{#if currentStep === 'booking'}
			<TierSelector {selectedTier} onchange={handleTierChange} />
			{#if selectedTier}
				<BookingForm
					bind:services
					bind:calculatorData
					bind:lovedOneName
					bind:funeralDirectorName
					bind:funeralHome
				/>
			{/if}
		{:else if currentStep === 'payNow'}
			{#if memorialId}
				<StripeCheckout amount={total} {memorialId} {lovedOneName} />
			{/if}
		{:else if clientSecret && configId && memorialId}
			<StripeCheckout amount={total} {memorialId} {lovedOneName} />
		{:else}
			<div class="card p-4 text-center">
				<p>There was an error preparing the payment form. Please try again.</p>
				<Button
					variant="primary"
					size="md"
					onclick={() => (currentStep = 'booking')}
					rounded="lg"
				>
					Go Back
				</Button>
			</div>
		{/if}
	</div>

	<div class="lg:col-span-1">
		<Summary
			{bookingItems}
			{total}
			onsave={() => saveAndPayLater()}
			onpay={proceedToPayment}
			onpayNow={handlePayNow}
		/>

		<!-- Auto-save Info Panel -->
		{#if autoSaveEnabled && autoSave}
			<div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
				<div class="mb-2 flex items-center space-x-2">
					<svg class="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
							clip-rule="evenodd"
						></path>
					</svg>
					<span class="text-sm font-medium text-gray-700">Auto-save</span>
				</div>
				<p class="text-xs text-gray-500">
					{#if autoSave.lastSaved()}
						Last saved: {autoSave.lastSaved()?.toLocaleTimeString()}
					{:else}
						Changes are automatically saved as you work
					{/if}
				</p>
				{#if autoSave.hasUnsavedChanges()}
					<p class="mt-1 text-xs text-yellow-600">You have unsaved changes</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
