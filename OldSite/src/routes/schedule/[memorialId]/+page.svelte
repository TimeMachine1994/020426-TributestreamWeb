<script lang="ts">
	import {
		Calculator,
		DollarSign,
		Users,
		Camera,
		Clock,
		Star,
		MapPin,
		Calendar,
		CheckCircle
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { useAutoSave } from '$lib/composables/useAutoSave';
	import { syncStreamsWithSchedule } from '$lib/utils/streamMapper';
	import type { CalculatorFormData, Tier } from '$lib/types/livestream';
	import ScheduleReceipt from './_components/ScheduleReceipt.svelte';
	import EditRequestModal from './_components/EditRequestModal.svelte';
	import {
		TIER_PRICES,
		ADDON_PRICES,
		HOURLY_OVERAGE_RATE,
		ADDITIONAL_SERVICE_FEE,
		TIER_FEATURES,
		getPricingForMemorial
	} from '$lib/config/pricing';

	let { data } = $props();

	// Console logging for debugging custom pricing
	console.log('📅 [SCHEDULE PAGE] Data received from server:', {
		hasMemorial: !!data?.memorial,
		memorialId: data?.memorial?.id,
		lovedOneName: data?.memorial?.lovedOneName,
		hasCustomPricing: !!data?.memorial?.customPricing,
		customPricingEnabled: data?.memorial?.customPricing?.enabled
	});

	if (data?.memorial?.customPricing) {
		console.log('💰 [SCHEDULE PAGE] Custom Pricing Data:', data.memorial.customPricing);
	} else {
		console.log('💰 [SCHEDULE PAGE] No custom pricing data received - will use defaults');
	}

	// Check if memorial is paid
	const isPaid = $derived(data?.memorial?.isPaid || false);

	// Get memorial-specific pricing (merges custom with defaults)
	const memorialPricing = $derived(getPricingForMemorial(data?.memorial?.customPricing));

	// Log the resolved pricing
	$effect(() => {
		console.log('💰 [SCHEDULE PAGE] Pricing resolved:', {
			isCustom: data?.memorial?.customPricing?.enabled || false,
			tiers: memorialPricing.tiers,
			addons: memorialPricing.addons,
			hourlyOverage: memorialPricing.hourlyOverage,
			additionalService: memorialPricing.additionalService
		});
	});

	// Edit request modal state
	let showEditModal = $state(false);
	let editRequestSuccess = $state(false);

	// Get memorial ID from route params
	const memorialId = $page.params.memorialId as string;

	// Loading state
	let pageLoaded = $state(true);

	// Calculator form data (design spec compliant)
	let calculatorData = $state<CalculatorFormData>({
		memorialId,
		selectedTier: 'record',
		addons: {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: 0
		},
		createdAt: new Date(),
		updatedAt: new Date(),
		autoSaved: false
	});

	// Service data (loaded from Memorial.services)
	let services = $state({
		main: data?.memorial?.services?.main || {
			location: { name: '', address: '', isUnknown: false },
			time: { date: null, time: null, isUnknown: false },
			hours: 2
		},
		additional: data?.memorial?.services?.additional || []
	});

	// Additional service toggles (UI state)
	let additionalLocation = $state({
		enabled: false,
		location: { name: '', address: '', isUnknown: false },
		time: { date: null, time: null, isUnknown: false },
		hours: 2
	});

	let additionalDay = $state({
		enabled: false,
		location: { name: '', address: '', isUnknown: false },
		time: { date: null, time: null, isUnknown: false },
		hours: 2
	});

	// Memorial metadata
	const lovedOneName = data?.memorial?.lovedOneName || '';

	// Data structure validation logging - moved to onMount to avoid state reference warnings

	// Validate data structure matches TypeScript interface
	function validateDataStructure() {
		const errors = [];

		if (!additionalLocation.time) {
			errors.push('❌ additionalLocation.time is missing');
		} else {
			if (!('date' in additionalLocation.time))
				errors.push('❌ additionalLocation.time.date is missing');
			if (!('time' in additionalLocation.time))
				errors.push('❌ additionalLocation.time.time is missing');
			if (!('isUnknown' in additionalLocation.time))
				errors.push('❌ additionalLocation.time.isUnknown is missing');
		}

		if (!additionalDay.time) {
			errors.push('❌ additionalDay.time is missing');
		} else {
			if (!('date' in additionalDay.time)) errors.push('❌ additionalDay.time.date is missing');
			if (!('time' in additionalDay.time)) errors.push('❌ additionalDay.time.time is missing');
			if (!('isUnknown' in additionalDay.time))
				errors.push('❌ additionalDay.time.isUnknown is missing');
		}

		if (errors.length > 0) {
			console.error('🚨 [VALIDATION] Data structure errors:', errors);
			return false;
		} else {
			console.log('✅ [VALIDATION] Data structure is valid');
			return true;
		}
	}

	// Auto-save functionality
	let saveStatus = $state<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
	let lastSaved = $state('');

	// Initialize auto-save
	const autoSave = useAutoSave(memorialId, {
		delay: 2000,
		onSave: (success, error) => {
			if (success) {
				saveStatus = 'saved';
				lastSaved = new Date().toLocaleTimeString();
			} else {
				saveStatus = 'error';
				console.error('Auto-save failed:', error);
			}
		},
		onLoad: (data) => {
			if (data) {
				console.log('Auto-saved data loaded');
			}
		}
	});

	// Reactive calculations
	const bookingItems = $derived(calculateBookingItems());
	const totalPrice = $derived(bookingItems.reduce((acc, item) => acc + item.total, 0));

	function calculateBookingItems() {
		const items = [];

		// Base Package
		if (calculatorData.selectedTier) {
			const price = memorialPricing.tiers[calculatorData.selectedTier as Tier];
			items.push({
				name: `Tributestream ${calculatorData.selectedTier.charAt(0).toUpperCase() + calculatorData.selectedTier.slice(1)}`,
				price: price,
				quantity: 1,
				total: price
			});
		}

		// Main Service Hourly Overage
		const mainOverageHours = Math.max(0, services.main.hours - 2);
		if (mainOverageHours > 0) {
			items.push({
				name: 'Main Location Overage',
				price: memorialPricing.hourlyOverage,
				quantity: mainOverageHours,
				total: memorialPricing.hourlyOverage * mainOverageHours
			});
		}

		// Additional Location
		if (additionalLocation.enabled) {
			items.push({
				name: 'Additional Location Fee',
				price: memorialPricing.additionalService,
				quantity: 1,
				total: memorialPricing.additionalService
			});
			const addlLocationOverage = Math.max(0, additionalLocation.hours - 2);
			if (addlLocationOverage > 0) {
				items.push({
					name: 'Add. Location Overage',
					price: memorialPricing.hourlyOverage,
					quantity: addlLocationOverage,
					total: memorialPricing.hourlyOverage * addlLocationOverage
				});
			}
		}

		// Additional Day
		if (additionalDay.enabled) {
			items.push({
				name: 'Additional Day Fee',
				price: memorialPricing.additionalService,
				quantity: 1,
				total: memorialPricing.additionalService
			});
			const addlDayOverage = Math.max(0, additionalDay.hours - 2);
			if (addlDayOverage > 0) {
				items.push({
					name: 'Add. Day Overage',
					price: memorialPricing.hourlyOverage,
					quantity: addlDayOverage,
					total: memorialPricing.hourlyOverage * addlDayOverage
				});
			}
		}

		// Add-ons
		if (calculatorData.addons.photography) {
			items.push({
				name: 'Photography',
				price: memorialPricing.addons.photography,
				quantity: 1,
				total: memorialPricing.addons.photography
			});
		}
		if (calculatorData.addons.audioVisualSupport) {
			items.push({
				name: 'Audio/Visual Support',
				price: memorialPricing.addons.audioVisualSupport,
				quantity: 1,
				total: memorialPricing.addons.audioVisualSupport
			});
		}
		if (calculatorData.addons.liveMusician) {
			items.push({
				name: 'Live Musician',
				price: memorialPricing.addons.liveMusician,
				quantity: 1,
				total: memorialPricing.addons.liveMusician
			});
		}
		if (calculatorData.addons.woodenUsbDrives > 0) {
			const isLegacy = calculatorData.selectedTier === 'legacy';
			const usbDrives = calculatorData.addons.woodenUsbDrives;
			const includedDrives = isLegacy ? 1 : 0;

			if (usbDrives > includedDrives) {
				const billableDrives = usbDrives - includedDrives;
				if (billableDrives > 0 && includedDrives === 0) {
					items.push({
						name: 'Wooden USB Drive',
						price: memorialPricing.addons.woodenUsbDrives,
						quantity: 1,
						total: memorialPricing.addons.woodenUsbDrives
					});
					if (billableDrives > 1) {
						items.push({
							name: 'Additional Wooden USB Drives',
							price: 100,
							quantity: billableDrives - 1,
							total: 100 * (billableDrives - 1)
						});
					}
				} else {
					items.push({
						name: 'Additional Wooden USB Drives',
						price: 100,
						quantity: billableDrives,
						total: 100 * billableDrives
					});
				}
			}
		}

		return items;
	}

	function selectTier(tier: Tier) {
		calculatorData.selectedTier = tier;
		// Reset addons when changing tiers
		calculatorData.addons = {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: tier === 'legacy' ? 1 : 0
		};
		triggerAutoSave();
	}

	function triggerAutoSave() {
		if (saveStatus === 'saved') {
			saveStatus = 'unsaved';
		}
		calculatorData.updatedAt = new Date();

		// Update services.additional array based on UI toggles
		const updatedServices = {
			main: services.main,
			additional: [
				...(additionalLocation.enabled
					? [
							{
								type: 'location',
								location: additionalLocation.location,
								time: additionalLocation.time,
								hours: additionalLocation.hours
							}
						]
					: []),
				...(additionalDay.enabled
					? [
							{
								type: 'day',
								location: additionalDay.location,
								time: additionalDay.time,
								hours: additionalDay.hours
							}
						]
					: [])
			]
		};

		// Log form data changes for debugging
		console.log('💾 [AUTO-SAVE] Triggering auto-save with data:', {
			additionalLocation: {
				enabled: additionalLocation.enabled,
				timeDate: additionalLocation.time?.date,
				timeTime: additionalLocation.time?.time,
				hours: additionalLocation.hours
			},
			additionalDay: {
				enabled: additionalDay.enabled,
				timeDate: additionalDay.time?.date,
				timeTime: additionalDay.time?.time,
				hours: additionalDay.hours
			}
		});

		// Validate data structure before saving
		const isValid = validateDataStructure();
		if (!isValid) {
			console.error('🚨 [AUTO-SAVE] Attempting to save invalid data structure!');
		}

		// Create proper AutoSaveData structure (design spec compliant)
		const autoSaveData = {
			services: updatedServices,
			calculatorData: calculatorData
		};

		autoSave.triggerAutoSave(autoSaveData);
	}

	function handleBookNow() {
		const bookingData = {
			items: bookingItems,
			total: totalPrice,
			calculatorData,
			memorialId,
			timestamp: new Date().toISOString()
		};

		const encodedData = btoa(JSON.stringify(bookingData));
		goto(`/payment?data=${encodedData}`);
	}

	async function handleSaveAndPayLater() {
		// Update services.additional array based on UI toggles
		const updatedServices = {
			main: services.main,
			additional: [
				...(additionalLocation.enabled
					? [
							{
								type: 'location' as const,
								location: additionalLocation.location,
								time: additionalLocation.time,
								hours: additionalLocation.hours
							}
						]
					: []),
				...(additionalDay.enabled
					? [
							{
								type: 'day' as const,
								location: additionalDay.location,
								time: additionalDay.time,
								hours: additionalDay.hours
							}
						]
					: [])
			]
		};

		// Force immediate save with proper data structure (design spec compliant)
		await autoSave.saveNow({
			services: updatedServices,
			calculatorData: calculatorData
		});

		// Create/sync streams from schedule data (ONLY on manual save)
		if (memorialId) {
			try {
				console.log('🎬 [SCHEDULE] Syncing streams with schedule data...');
				
				const streamSyncData = {
					services: updatedServices,
					calculatorData: calculatorData,
					memorialName: data?.memorial?.lovedOneName
				};

				const streamResults = await syncStreamsWithSchedule(memorialId, streamSyncData);
				
				if (streamResults.success) {
					console.log(`✅ [SCHEDULE] Stream sync completed:`, {
						created: streamResults.operations.created.length,
						updated: streamResults.operations.updated.length,
						deleted: streamResults.operations.deleted.length
					});
				} else {
					console.warn(`⚠️ [SCHEDULE] Stream sync had issues:`, streamResults.errors);
					// Could show user-friendly error message here
				}
			} catch (error) {
				console.error('❌ [SCHEDULE] Error during stream sync:', error);
				// Stream sync failure shouldn't block the save flow
			}
		}

		// Redirect to profile page for both owner and funeral director
		goto('/profile');
	}

	// Watch for changes and trigger auto-save
	$effect(() => {
		if (browser) {
			// Trigger reactivity for pricing calculations
			bookingItems;
			totalPrice;
		}
	});

	// Watch for checkbox changes specifically
	$effect(() => {
		if (browser) {
			console.log('🔄 [REACTIVITY] Additional services state changed:', {
				additionalLocation: additionalLocation.enabled,
				additionalDay: additionalDay.enabled,
				additionalLocationHours: additionalLocation.hours,
				additionalDayHours: additionalDay.hours
			});

			// Force reactivity trigger
			additionalLocation.enabled;
			additionalDay.enabled;
		}
	});

	onMount(async () => {
		// Data structure validation logging
		console.log('🔍 [VALIDATION] Form data initialized:', {
			additionalLocation: {
				hasTimeProperty: 'time' in additionalLocation,
				timeStructure: additionalLocation.time,
				enabled: additionalLocation.enabled
			},
			additionalDay: {
				hasTimeProperty: 'time' in additionalDay,
				timeStructure: additionalDay.time,
				enabled: additionalDay.enabled
			}
		});

		// Load existing auto-saved data
		const autoSavedData = await autoSave.loadAutoSavedData();
		if (autoSavedData) {
			// Restore calculator data
			if (autoSavedData.calculatorData) {
				calculatorData = autoSavedData.calculatorData;
			}

			// Restore service data
			if (autoSavedData.services) {
				services = autoSavedData.services;

				// Update UI toggles based on additional services
				const additionalServices = autoSavedData.services.additional || [];
				const locationService = additionalServices.find((s: any) => s.type === 'location');
				const dayService = additionalServices.find((s: any) => s.type === 'day');

				if (locationService) {
					additionalLocation = {
						enabled: true,
						location: locationService.location,
						time: locationService.time,
						hours: locationService.hours
					};
				}

				if (dayService) {
					additionalDay = {
						enabled: true,
						location: dayService.location,
						time: dayService.time,
						hours: dayService.hours
					};
				}
			}

			console.log('✅ Auto-saved data automatically restored');
			// Validate restored data structure
			validateDataStructure();
		}
	});

	const tiers = $derived([
		{
			name: 'Tributestream Record',
			alias: 'record' as Tier,
			price: memorialPricing.tiers.record,
			features: memorialPricing.features.record
		},
		{
			name: 'Tributestream Live',
			alias: 'live' as Tier,
			price: memorialPricing.tiers.live,
			features: memorialPricing.features.live
		},
		{
			name: 'Tributestream Legacy',
			alias: 'legacy' as Tier,
			price: memorialPricing.tiers.legacy,
			features: memorialPricing.features.legacy
		}
	]);

	// Handle edit request submission
	async function handleEditRequest(requestDetails: string) {
		try {
			const response = await fetch(`/api/memorials/${memorialId}/schedule/request-edit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ requestDetails })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to submit request');
			}

			// Success
			showEditModal = false;
			editRequestSuccess = true;

			// Hide success message after 5 seconds
			setTimeout(() => {
				editRequestSuccess = false;
			}, 5000);
		} catch (error) {
			console.error('Failed to submit edit request:', error);
			throw error;
		}
	}
</script>

<svelte:head>
	<title>{isPaid ? 'Payment Receipt' : 'Price Calculator'} - Tributestream</title>
	<meta
		name="description"
		content="Configure your memorial service livestream package with our comprehensive pricing calculator."
	/>
</svelte:head>

{#if isPaid}
	<!-- Payment Receipt View -->
	<ScheduleReceipt
		memorial={data.memorial}
		calculatorConfig={data.calculatorConfig}
		onRequestEdit={() => (showEditModal = true)}
	/>

	<!-- Success Message for Edit Request -->
	{#if editRequestSuccess}
		<div class="fixed bottom-4 right-4 z-50 max-w-md rounded-lg bg-green-500 p-4 text-white shadow-lg">
			<div class="flex items-start">
				<CheckCircle class="mr-3 h-5 w-5 flex-shrink-0" />
				<div>
					<p class="font-medium">Request Submitted Successfully!</p>
					<p class="mt-1 text-sm text-green-100">
						Our team will review your request and contact you soon.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Edit Request Modal -->
	{#if showEditModal}
		<EditRequestModal
			memorial={data.memorial}
			onClose={() => (showEditModal = false)}
			onSubmit={handleEditRequest}
		/>
	{/if}
{:else}
	<!-- Calculator View (Unpaid Memorial) -->
	<!-- Header -->
	<section class="bg-gradient-to-br from-black via-gray-900 to-amber-900 py-16 text-white">
	<div class="mx-auto max-w-4xl px-4 text-center">
		<div class="mb-6">
			<h1
				class="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-4xl font-bold text-transparent"
			>
				Tributestream Pricing Calculator
			</h1>
			
			<!-- Custom Pricing Indicator -->
			{#if data?.memorial?.customPricing?.enabled}
				<div class="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-1.5 text-sm font-medium text-amber-300 ring-1 ring-amber-500/30">
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
					</svg>
					Special Pricing Applied
				</div>
			{/if}
		</div>
		<p class="mx-auto max-w-2xl text-xl text-gray-300">
			Configure your memorial service livestream package for {lovedOneName || 'your loved one'}
		</p>

		<!-- Auto-save status indicator -->
		{#if browser}
			<div class="mt-4 flex items-center justify-center space-x-2 text-sm">
				<div class="flex items-center space-x-1">
					{#if saveStatus === 'saving'}
						<div class="h-2 w-2 animate-pulse rounded-full bg-amber-400"></div>
						<span class="text-amber-400">Saving...</span>
					{:else if saveStatus === 'saved'}
						<div class="h-2 w-2 rounded-full bg-green-400"></div>
						<span class="text-green-400">Saved {lastSaved}</span>
					{:else if saveStatus === 'error'}
						<div class="h-2 w-2 rounded-full bg-red-400"></div>
						<span class="text-red-400">Save failed</span>
					{:else}
						<div class="h-2 w-2 animate-pulse rounded-full bg-yellow-400"></div>
						<span class="text-yellow-400">Unsaved changes</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</section>

<!-- Calculator Section -->
<section class="bg-gray-900 px-4 py-12">
	<div class="mx-auto max-w-6xl">
		<div class="grid gap-8 lg:grid-cols-3">
			<!-- Configuration Panel -->
			<div class="space-y-8 lg:col-span-2">
				<!-- Package Selection -->
				<div
					class="rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<Star class="mr-2 h-6 w-6 text-amber-400" />
						Choose Your Tributestream Package
					</h2>

					<div class="grid gap-4 md:grid-cols-3">
						{#each tiers as tier}
							<button
								class="rounded-lg border-2 p-4 text-left transition-all {calculatorData.selectedTier ===
								tier.alias
									? 'border-amber-400 bg-amber-400/10'
									: 'border-gray-600 hover:border-amber-500/50'}"
								onclick={() => selectTier(tier.alias)}
							>
								<h3 class="mb-2 text-lg font-bold text-white">{tier.name}</h3>
								<p class="mb-3 text-2xl font-bold text-amber-400">${tier.price}</p>
								<ul class="space-y-1 text-sm text-gray-300">
									{#each tier.features as feature}
										<li class="flex items-start">
											<span class="mr-2 text-amber-400">✓</span>
											{feature}
										</li>
									{/each}
								</ul>
							</button>
						{/each}
					</div>
				</div>

				<!-- Service Duration -->
				<div
					class="rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<Clock class="mr-2 h-6 w-6 text-amber-400" />
						Service Duration
					</h2>

					<div class="space-y-4">
						<!-- Date and Time Picker -->
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label for="main-service-date" class="mb-2 block text-sm font-medium text-gray-300"
									>Service Date</label
								>
								<input
									id="main-service-date"
									type="date"
									bind:value={services.main.time.date}
									onchange={triggerAutoSave}
									class="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
								/>
							</div>
							<div>
								<label for="main-service-time" class="mb-2 block text-sm font-medium text-gray-300"
									>Start Time</label
								>
								<input
									id="main-service-time"
									type="time"
									bind:value={services.main.time.time}
									onchange={triggerAutoSave}
									class="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
								/>
							</div>
						</div>

						<!-- Service Hours Slider -->
						<div>
							<label for="main-service-hours" class="mb-2 block text-sm font-medium text-gray-300">
								Main Service Hours (2 hours included, ${HOURLY_OVERAGE_RATE}/hour overage)
							</label>
							<input
								id="main-service-hours"
								type="range"
								min="1"
								max="8"
								step="1"
								bind:value={services.main.hours}
								class="gold-slider w-full"
								onchange={triggerAutoSave}
							/>
							<div class="mt-1 flex justify-between text-sm text-gray-400">
								<span>1 hour</span>
								<span class="font-medium text-amber-400">{services.main.hours} hours</span>
								<span>8+ hours</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Additional Locations & Days -->
				<div
					class="rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<MapPin class="mr-2 h-6 w-6 text-amber-400" />
						Additional Services
					</h2>

					<div class="space-y-6">
						<!-- Additional Location -->
						<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
							<label class="mb-4 flex items-center justify-between">
								<div>
									<span class="font-medium text-white">Additional Location</span>
									<p class="text-sm text-gray-400">
										Stream from a second location (+${ADDITIONAL_SERVICE_FEE})
									</p>
								</div>
								<input
									type="checkbox"
									bind:checked={additionalLocation.enabled}
									onchange={() => {
										console.log(
											'📋 [CHECKBOX] Additional Location toggled:',
											additionalLocation.enabled
										);
										triggerAutoSave();
									}}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</label>

							<!-- Debug: Always show state -->
							<div class="mb-2 text-xs text-gray-500">
								Debug: additionalLocation.enabled = {additionalLocation.enabled}
							</div>

							{#if additionalLocation.enabled}
								<div class="space-y-4">
									<!-- Date and Time Picker for Additional Location -->
									<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<label
												for="additional-location-date"
												class="mb-2 block text-sm font-medium text-gray-300"
												>Additional Location Date</label
											>
											<input
												id="additional-location-date"
												type="date"
												bind:value={additionalLocation.time.date}
												onchange={triggerAutoSave}
												class="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
											/>
										</div>
										<div>
											<label
												for="additional-location-time"
												class="mb-2 block text-sm font-medium text-gray-300">Start Time</label
											>
											<input
												id="additional-location-time"
												type="time"
												bind:value={additionalLocation.time.time}
												onchange={triggerAutoSave}
												class="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
											/>
										</div>
									</div>

									<!-- Hours Slider for Additional Location -->
									<div>
										<label
											for="additional-location-hours"
											class="mb-2 block text-sm font-medium text-gray-300"
										>
											Additional Location Hours (2 hours included, ${HOURLY_OVERAGE_RATE}/hour
											overage)
										</label>
										<input
											id="additional-location-hours"
											type="range"
											min="1"
											max="8"
											step="1"
											bind:value={additionalLocation.hours}
											onchange={triggerAutoSave}
											class="gold-slider w-full"
										/>
										<div class="mt-1 flex justify-between text-sm text-gray-400">
											<span>1 hour</span>
											<span class="font-medium text-amber-400"
												>{additionalLocation.hours} hours</span
											>
											<span>8+ hours</span>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Additional Day -->
						<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
							<label class="mb-4 flex items-center justify-between">
								<div>
									<span class="font-medium text-white">Additional Day</span>
									<p class="text-sm text-gray-400">
										Stream on a second day (+${ADDITIONAL_SERVICE_FEE})
									</p>
								</div>
								<input
									type="checkbox"
									bind:checked={additionalDay.enabled}
									onchange={() => {
										console.log('📋 [CHECKBOX] Additional Day toggled:', additionalDay.enabled);
										triggerAutoSave();
									}}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</label>

							<!-- Debug: Always show state -->
							<div class="mb-2 text-xs text-gray-500">
								Debug: additionalDay.enabled = {additionalDay.enabled}
							</div>

							{#if additionalDay.enabled}
								<div class="space-y-4">
									<!-- Date and Time Picker for Additional Day -->
									<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<label
												for="additional-day-date"
												class="mb-2 block text-sm font-medium text-gray-300"
												>Additional Day Date</label
											>
											<input
												id="additional-day-date"
												type="date"
												bind:value={additionalDay.time.date}
												onchange={triggerAutoSave}
												class="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
											/>
										</div>
										<div>
											<label
												for="additional-day-time"
												class="mb-2 block text-sm font-medium text-gray-300">Start Time</label
											>
											<input
												id="additional-day-time"
												type="time"
												bind:value={additionalDay.time.time}
												onchange={triggerAutoSave}
												class="w-full rounded-lg border border-gray-600 bg-gray-700 p-3 text-white transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
											/>
										</div>
									</div>

									<!-- Hours Slider for Additional Day -->
									<div>
										<label
											for="additional-day-hours"
											class="mb-2 block text-sm font-medium text-gray-300"
										>
											Additional Day Hours (2 hours included, ${HOURLY_OVERAGE_RATE}/hour overage)
										</label>
										<input
											id="additional-day-hours"
											type="range"
											min="1"
											max="8"
											step="1"
											bind:value={additionalDay.hours}
											onchange={triggerAutoSave}
											class="gold-slider w-full"
										/>
										<div class="mt-1 flex justify-between text-sm text-gray-400">
											<span>1 hour</span>
											<span class="font-medium text-amber-400">{additionalDay.hours} hours</span>
											<span>8+ hours</span>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Add-ons -->
				<div
					class="rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<Camera class="mr-2 h-6 w-6 text-amber-400" />
						Add-on Services
					</h2>

					<div class="space-y-4">
						<label
							class="flex items-center justify-between rounded-lg border border-gray-700 p-4 transition-colors hover:bg-gray-800/50"
						>
							<div>
								<span class="font-medium text-white">Photography</span>
								<p class="text-sm text-gray-400">Professional photography service</p>
							</div>
							<div class="flex items-center">
								<span class="mr-4 font-bold text-amber-400">+${ADDON_PRICES.photography}</span>
								<input
									type="checkbox"
									bind:checked={calculatorData.addons.photography}
									onchange={triggerAutoSave}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</div>
						</label>

						<label
							class="flex items-center justify-between rounded-lg border border-gray-700 p-4 transition-colors hover:bg-gray-800/50"
						>
							<div>
								<span class="font-medium text-white">Audio/Visual Support</span>
								<p class="text-sm text-gray-400">Professional A/V technical support</p>
							</div>
							<div class="flex items-center">
								<span class="mr-4 font-bold text-amber-400"
									>+${ADDON_PRICES.audioVisualSupport}</span
								>
								<input
									type="checkbox"
									bind:checked={calculatorData.addons.audioVisualSupport}
									onchange={triggerAutoSave}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</div>
						</label>

						<label
							class="flex items-center justify-between rounded-lg border border-gray-700 p-4 transition-colors hover:bg-gray-800/50"
						>
							<div>
								<span class="font-medium text-white">Live Musician</span>
								<p class="text-sm text-gray-400">Professional live musical performance</p>
							</div>
							<div class="flex items-center">
								<span class="mr-4 font-bold text-amber-400">+${ADDON_PRICES.liveMusician}</span>
								<input
									type="checkbox"
									bind:checked={calculatorData.addons.liveMusician}
									onchange={triggerAutoSave}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</div>
						</label>

						<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
							<div class="mb-4 flex items-center justify-between">
								<div>
									<span class="font-medium text-white">Wooden USB Drives</span>
									<p class="text-sm text-gray-400">
										{#if calculatorData.selectedTier === 'legacy'}
											First drive included with Legacy. Additional drives: first +${ADDON_PRICES.woodenUsbDrives},
											then +$100 each
										{:else}
											First drive +${ADDON_PRICES.woodenUsbDrives}, additional drives +$100 each
										{/if}
									</p>
								</div>
							</div>
							<div class="flex items-center space-x-4">
								<label for="usb-drives-quantity" class="block text-sm font-medium text-gray-300">
									Quantity:
								</label>
								<input
									id="usb-drives-quantity"
									type="number"
									min="0"
									max="10"
									bind:value={calculatorData.addons.woodenUsbDrives}
									onchange={triggerAutoSave}
									class="w-20 rounded border border-gray-600 bg-gray-700 p-2 text-white focus:border-amber-500 focus:ring-amber-500"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Price Summary -->
			<div class="lg:col-span-1">
				<div
					class="sticky top-8 rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<DollarSign class="mr-2 h-6 w-6 text-amber-400" />
						Price Breakdown
					</h2>

					<div class="mb-6 space-y-3">
						{#each bookingItems as item}
							<div class="flex justify-between text-sm">
								<span class="flex-1 text-gray-300">
									{item.name}
									{#if item.quantity > 1}
										<span class="text-gray-500">({item.quantity}x ${item.price})</span>
									{/if}
								</span>
								<span class="font-medium text-white">${item.total}</span>
							</div>
						{/each}
					</div>

					<div class="border-t border-gray-700 pt-4">
						<div class="flex items-center justify-between text-2xl font-bold">
							<span class="text-white">Total</span>
							<span class="text-amber-400">${totalPrice}</span>
						</div>
						<p class="mt-2 text-sm text-gray-400">One-time payment</p>
					</div>

					<div class="mt-6 space-y-3">
						<button
							onclick={handleBookNow}
							class="w-full rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-3 font-medium text-black transition-all duration-300 hover:from-amber-600 hover:to-yellow-700 hover:shadow-lg hover:shadow-amber-500/25"
						>
							Book Now
						</button>
						<button
							onclick={handleSaveAndPayLater}
							class="w-full rounded-lg border border-amber-500 px-6 py-3 font-medium text-amber-400 transition-colors hover:bg-amber-500/10 hover:text-amber-300"
						>
							Save and Pay Later
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.gold-slider {
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		background: linear-gradient(to right, #374151 0%, #374151 100%);
		border-radius: 3px;
		outline: none;
	}

	.gold-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: linear-gradient(135deg, #f59e0b, #d97706);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
	}

	.gold-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: linear-gradient(135deg, #f59e0b, #d97706);
		border-radius: 50%;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
	}
</style>
{/if}
