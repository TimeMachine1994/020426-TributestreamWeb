<script lang="ts">
	import {
		Calculator,
		DollarSign,
		Users,
		Camera,
		Clock,
		Star,
		MapPin,
		Calendar
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import type {
		CalculatorFormData,
		Tier,
		LocationInfo,
		TimeInfo,
		ServiceDetails,
		AdditionalServiceDetails,
		Addons
	} from '$lib/types/livestream';
	import { useAutoSave } from '$lib/composables/useAutoSave';
	import { createStreamsFromSchedule } from '$lib/utils/streamMapper';
	import {
		TIER_PRICES,
		ADDON_PRICES,
		HOURLY_OVERAGE_RATE,
		ADDITIONAL_SERVICE_FEE
	} from '$lib/config/pricing';

	let { data } = $props();

	// Loading state
	let pageLoaded = $state(true);

	// Get memorial ID from route params or data
	const memorialId = $page.params.memorialId || data?.memorial?.id || '';
	let lovedOneName = $state('');

	// Memorial services data (new structure)
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

	// Calculator data (booking/pricing)
	let selectedTier: Tier = $state('record');
	let addons = $state<Addons>({
		photography: false,
		audioVisualSupport: false,
		liveMusician: false,
		woodenUsbDrives: 0
	});

	// Legacy form fields for backward compatibility
	let mainService = $derived(services.main);
	let additionalLocation = $derived({
		enabled: services.additional.some((s) => s.type === 'location'),
		...(services.additional.find((s) => s.type === 'location') || {
			location: { name: '', address: '', isUnknown: false },
			time: { date: null, time: null, isUnknown: false },
			hours: 2
		})
	});
	let additionalDay = $derived({
		enabled: services.additional.some((s) => s.type === 'day'),
		...(services.additional.find((s) => s.type === 'day') || {
			location: { name: '', address: '', isUnknown: false },
			time: { date: null, time: null, isUnknown: false },
			hours: 2
		})
	});

	// Contact information
	let funeralDirectorName = $state('');
	let funeralHome = $state('');

	// Auto-save functionality
	let autoSaveEnabled = $state(false);
	let showAutoSaveStatus = $state(false);

	// Initialize auto-save when memorialId is available
	const autoSave = $derived(
		memorialId
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
			: null
	);

	// Reactive calculations using SvelteKit 5 runes
	const bookingItems = $derived(calculateBookingItems());
	const totalPrice = $derived(bookingItems.reduce((acc, item) => acc + item.total, 0));

	// Create data structures for new API
	const calculatorData = $derived.by(
		() =>
			({
				memorialId,
				selectedTier,
				addons,
				createdAt: new Date(),
				updatedAt: new Date(),
				autoSaved: false
			}) as CalculatorFormData
	);

	// Auto-save trigger when form data changes
	$effect(() => {
		if (autoSaveEnabled && autoSave && memorialId) {
			if (selectedTier || services.main.location.name || services.additional.length > 0) {
				autoSave.triggerAutoSave({ services, calculatorData });
			}
		}
	});

	// Enable auto-save after component mounts
	onMount(() => {
		if (memorialId) {
			autoSaveEnabled = true;
		}
	});

	function calculateBookingItems() {
		const items = [];

		// 1. Base Package
		if (selectedTier) {
			const price = TIER_PRICES[selectedTier as keyof typeof TIER_PRICES];
			items.push({
				id: 'base-package',
				name: `Tributestream ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`,
				price: price,
				quantity: 1,
				total: price
			});
		}

		// 2. Main Service Hourly Overage (over 2 hours)
		const mainOverageHours = Math.max(0, services.main.hours - 2);
		if (mainOverageHours > 0) {
			items.push({
				id: 'main-overage',
				name: 'Main Location Overage',
				price: HOURLY_OVERAGE_RATE,
				quantity: mainOverageHours,
				total: HOURLY_OVERAGE_RATE * mainOverageHours
			});
		}

		// 3. Additional Location
		const hasAdditionalLocation = services.additional.some((s) => s.type === 'location');
		if (hasAdditionalLocation) {
			const additionalLocationService = services.additional.find((s) => s.type === 'location');
			items.push({
				id: 'additional-location-base',
				name: 'Additional Location',
				package: selectedTier || 'record',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});

			// Additional location overage
			const addlLocationOverage = Math.max(0, (additionalLocationService?.hours || 2) - 2);
			if (addlLocationOverage > 0) {
				items.push({
					id: 'additional-location-overage',
					name: 'Additional Location Overage',
					package: selectedTier || 'record',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlLocationOverage,
					total: HOURLY_OVERAGE_RATE * addlLocationOverage
				});
			}
		}

		// 4. Additional Day
		const hasAdditionalDay = services.additional.some((s) => s.type === 'day');
		if (hasAdditionalDay) {
			const additionalDayService = services.additional.find((s) => s.type === 'day');
			items.push({
				id: 'additional-day-base',
				name: 'Additional Day',
				package: selectedTier || 'record',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});

			// Additional day overage
			const addlDayOverage = Math.max(0, (additionalDayService?.hours || 2) - 2);
			if (addlDayOverage > 0) {
				items.push({
					id: 'additional-day-overage',
					name: 'Additional Day Overage',
					package: selectedTier || 'record',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlDayOverage,
					total: HOURLY_OVERAGE_RATE * addlDayOverage
				});
			}
		}

		// 5. Add-ons
		if (addons.photography) {
			items.push({
				id: 'photography',
				name: 'Photography Service',
				package: selectedTier || 'record',
				price: ADDON_PRICES.photography,
				quantity: 1,
				total: ADDON_PRICES.photography
			});
		}

		if (addons.audioVisualSupport) {
			items.push({
				id: 'audio-visual',
				name: 'Audio/Visual Support',
				package: selectedTier || 'record',
				price: ADDON_PRICES.audioVisualSupport,
				quantity: 1,
				total: ADDON_PRICES.audioVisualSupport
			});
		}

		if (addons.liveMusician) {
			items.push({
				id: 'live-musician',
				name: 'Live Musician',
				package: selectedTier || 'record',
				price: ADDON_PRICES.liveMusician,
				quantity: 1,
				total: ADDON_PRICES.liveMusician
			});
		}

		if (addons.woodenUsbDrives > 0) {
			// Legacy tier includes 1 USB drive
			const includedDrives = selectedTier === 'legacy' ? 1 : 0;
			const chargeableDrives = Math.max(0, addons.woodenUsbDrives - includedDrives);

			if (chargeableDrives > 0) {
				const firstDrivePrice = ADDON_PRICES.woodenUsbDrives;
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
					package: selectedTier || 'record',
					price: totalUsbPrice / chargeableDrives,
					quantity: chargeableDrives,
					total: totalUsbPrice
				});
			}
		}

		return items;
	}

	async function createStreamsFromScheduleLocal() {
		if (!memorialId) return;

		try {
			console.log('🎬 [SCHEDULE] Creating streams from schedule data...');
			
			const streamCreationData = {
				services: services,
				calculatorData: {
					selectedTier,
					addons
				},
				memorialName: lovedOneName
			};

			const streamResults = await createStreamsFromSchedule(memorialId, streamCreationData);
			
			if (streamResults.success) {
				console.log(`✅ [SCHEDULE] Created ${streamResults.createdStreams.length} streams successfully`);
				if (streamResults.createdStreams.length > 0) {
					console.log('🎉 [SCHEDULE] Stream titles created:', 
						streamResults.createdStreams.map(s => s.title).join(', ')
					);
				}
			} else {
				console.warn(`⚠️ [SCHEDULE] Stream creation had issues:`, streamResults.errors);
			}
		} catch (error) {
			console.error('❌ [SCHEDULE] Error during stream creation:', error);
		}
	}

	// Booking functions that integrate with our payment API
	async function handleBookNow() {
		if (!memorialId || !formData) {
			alert('Please ensure all required information is filled out.');
			return;
		}

		try {
			// Create payment intent with our existing API
			const response = await fetch('/api/create-payment-intent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					memorialId,
					amount: totalPrice,
					bookingItems,
					customerInfo: {
						email: '', // Will be filled from user context
						name: funeralDirectorName || lovedOneName
					}
				})
			});

			const result = await response.json();

			if (response.ok && result.clientSecret) {
				// Auto-create livestreams if dates/times are provided
				await createStreamsFromScheduleLocal();
				
				// Redirect to payment page with encoded data
				const paymentData = {
					memorialId,
					clientSecret: result.clientSecret,
					paymentIntentId: result.paymentIntentId,
					amount: totalPrice,
					total: totalPrice,
					bookingItems,
					formData
				};

				const encodedData = btoa(JSON.stringify(paymentData));
				goto(`/payment?data=${encodedData}`);
			} else {
				alert('Failed to create payment: ' + (result.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Booking error:', error);
			alert('An error occurred while processing your booking.');
		}
	}

	async function handleSaveAndPayLater() {
		if (!memorialId) {
			goto('/profile');
			return;
		}

		try {
			// Save configuration to the memorial's schedule data
			const scheduleData = {
				selectedTier,
				mainService,
				additionalLocation,
				additionalDay,
				addons,
				funeralDirectorName,
				funeralHome,
				bookingItems,
				totalPrice,
				status: 'draft',
				lastUpdated: new Date().toISOString()
			};

			const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(scheduleData)
			});

			if (response.ok) {
				// Auto-create livestreams if dates/times are provided
				await createStreamsFromScheduleLocal();
				
				// Redirect to profile page
				goto('/profile');
			} else {
				console.error('Save failed:', await response.text());
				goto('/profile');
			}
		} catch (error) {
			console.error('Save error:', error);
			goto('/profile');
		}
	}

	function selectTier(tier: string) {
		selectedTier = tier as Tier;
		// Reset addons when changing tiers
		addons = {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: selectedTier === 'legacy' ? 1 : 0 // Legacy includes 1 USB drive
		};
	}

	// Redirect to memorial-specific route or new memorial creation
	function redirectToProperRoute() {
		// Check if user has existing memorials
		goto('/schedule/new');
	}

	// This page now serves as a redirect to the proper memorial-specific route

	// Auto-save functionality moved to memorial-specific routes

	// Only redirect if no memorial ID is provided in URL
	$effect(() => {
		if (browser) {
			const urlParams = new URLSearchParams(window.location.search);
			const paramMemorialId = urlParams.get('memorialId');

			if (!paramMemorialId) {
				// No memorial ID provided, redirect to profile to select memorial
				goto('/profile');
			}
		}
	});

	onMount(async () => {
		// Load existing calculator config if available if we have a memorialId
		if (memorialId) {
			try {
				// Load existing data from API
				const response = await fetch(`/api/memorials/${memorialId}/schedule/auto-save`);
				const result = response.ok ? await response.json() : null;

				if (result && result.hasAutoSave && result.autoSave) {
					const savedData = result.autoSave.formData;

					// Populate form with saved data
					selectedTier = (savedData.selectedTier || 'record') as Tier;
					lovedOneName = savedData.lovedOneName || '';

					if (savedData.mainService) {
						mainService = {
							location: savedData.mainService.location || {
								name: '',
								address: '',
								isUnknown: false
							},
							time: savedData.mainService.time || { date: null, time: null, isUnknown: false },
							hours: savedData.mainService.hours || 2
						};
					}

					if (savedData.additionalLocation) {
						additionalLocation = {
							enabled: savedData.additionalLocation.enabled || false,
							location: savedData.additionalLocation.location || {
								name: '',
								address: '',
								isUnknown: false
							},
							time: savedData.additionalLocation.time || {
								date: null,
								time: null,
								isUnknown: false
							},
							hours: savedData.additionalLocation.hours || 2
						};
					}

					if (savedData.additionalDay) {
						additionalDay = {
							enabled: savedData.additionalDay.enabled || false,
							location: savedData.additionalDay.location || {
								name: '',
								address: '',
								isUnknown: false
							},
							time: savedData.additionalDay.time || { date: null, time: null, isUnknown: false },
							hours: savedData.additionalDay.hours || 2
						};
					}

					if (savedData.addons) {
						addons = {
							photography: savedData.addons.photography || false,
							audioVisualSupport: savedData.addons.audioVisualSupport || false,
							liveMusician: savedData.addons.liveMusician || false,
							woodenUsbDrives: savedData.addons.woodenUsbDrives || 0
						};
					}

					funeralDirectorName = savedData.funeralDirectorName || '';
					funeralHome = savedData.funeralHome || '';

					console.log('✅ Loaded existing calculator configuration:', savedData);
				} else {
					console.log('ℹ️ No saved configuration found, using defaults');
				}
			} catch (error) {
				console.error('Error loading existing data:', error);
			}
		} else {
			// If no memorial ID, redirect to profile to select/create memorial
			goto('/profile');
		}
	});

	const tiers = [
		{
			name: 'Tributestream Record',
			alias: 'record',
			price: 699,
			features: [
				'2 Hours of Broadcast Time',
				'Custom Link',
				'Complimentary Download',
				'One Year Hosting',
				'DIY Livestream Kit'
			]
		},
		{
			name: 'Tributestream Live',
			alias: 'live',
			price: 1299,
			features: [
				'2 Hours of Broadcast Time',
				'Custom Link',
				'Complimentary Download',
				'One Year Hosting',
				'Professional Videographer',
				'Professional Livestream Tech'
			]
		},
		{
			name: 'Tributestream Legacy',
			alias: 'legacy',
			price: 1599,
			features: [
				'2 Hours of Broadcast Time',
				'Custom Link',
				'Complimentary Download',
				'One Year Hosting',
				'Professional Videographer',
				'Professional Livestream Tech',
				'Video Editing',
				'Engraved USB Drive and Wooden Keepsake Box'
			]
		}
	];
</script>

<svelte:head>
	<title>Price Calculator - Tributestream</title>
	<meta
		name="description"
		content="Calculate the cost of your memorial service with our interactive pricing calculator."
	/>
</svelte:head>

<!-- Header -->
<section class="bg-gradient-to-br from-black via-gray-900 to-amber-900 py-16 text-white">
	<div class="mx-auto max-w-4xl px-4 text-center">
		<div class="mb-6 flex items-center justify-center">
			<Calculator class="mr-4 h-12 w-12 text-amber-400" />
			<h1
				class="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-4xl font-bold text-transparent"
			>
				Tributestream Pricing Calculator
			</h1>
		</div>
		<p class="mx-auto max-w-2xl text-xl text-gray-300">
			Configure your memorial service livestream package with our comprehensive pricing calculator
		</p>
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
								class="rounded-lg border-2 p-4 text-left transition-all {selectedTier === tier.alias
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

				<!-- Main Service Details -->
				<div
					class="rounded-lg border border-amber-500/20 bg-black/80 p-6 shadow-lg backdrop-blur-sm"
				>
					<h2 class="mb-6 flex items-center text-2xl font-bold text-white">
						<Calendar class="mr-2 h-6 w-6 text-amber-400" />
						Main Service Details
					</h2>
					<div class="space-y-4">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label for="main-location-name" class="mb-2 block text-sm font-medium text-gray-300"
									>Location Name</label
								>
								<input
									id="main-location-name"
									type="text"
									placeholder="e.g., St. Mary's Church"
									bind:value={mainService.location.name}
									class="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white"
								/>
							</div>
							<div>
								<label
									for="main-location-address"
									class="mb-2 block text-sm font-medium text-gray-300">Location Address</label
								>
								<input
									id="main-location-address"
									type="text"
									placeholder="e.g., 123 Main St, Anytown"
									bind:value={mainService.location.address}
									class="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white"
								/>
							</div>
						</div>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label for="main-service-date" class="mb-2 block text-sm font-medium text-gray-300"
									>Service Date</label
								>
								<input
									id="main-service-date"
									type="date"
									bind:value={mainService.time.date}
									class="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white"
								/>
							</div>
							<div>
								<label for="main-service-time" class="mb-2 block text-sm font-medium text-gray-300"
									>Start Time</label
								>
								<input
									id="main-service-time"
									type="time"
									bind:value={mainService.time.time}
									class="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white"
								/>
							</div>
						</div>
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
								bind:value={mainService.hours}
								class="gold-slider w-full"
							/>
							<div class="mt-1 flex justify-between text-sm text-gray-400">
								<span>1 hour</span>
								<span class="font-medium text-amber-400">{mainService.hours} hours</span>
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
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</label>

							{#if additionalLocation.enabled}
								<div class="space-y-4">
									<div class="grid grid-cols-2 gap-4">
										<div>
											<label
												for="additional-location-date"
												class="mb-2 block text-sm font-medium text-gray-300">Date</label
											>
											<input
												id="additional-location-date"
												type="date"
												bind:value={additionalLocation.time.date}
												class="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white"
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
												class="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white"
											/>
										</div>
									</div>
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
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</label>

							{#if additionalDay.enabled}
								<div class="space-y-4">
									<div class="grid grid-cols-2 gap-4">
										<div>
											<label
												for="additional-day-date"
												class="mb-2 block text-sm font-medium text-gray-300">Date</label
											>
											<input
												id="additional-day-date"
												type="date"
												bind:value={additionalDay.time.date}
												class="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white"
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
												class="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white"
											/>
										</div>
									</div>
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
									bind:checked={addons.photography}
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
									bind:checked={addons.audioVisualSupport}
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
									bind:checked={addons.liveMusician}
									class="h-5 w-5 rounded border-gray-600 bg-gray-700 text-amber-400 focus:ring-amber-500"
								/>
							</div>
						</label>

						<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
							<div class="mb-4 flex items-center justify-between">
								<div>
									<span class="font-medium text-white">Wooden USB Drives</span>
									<p class="text-sm text-gray-400">
										{#if selectedTier === 'legacy'}
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
									bind:value={addons.woodenUsbDrives}
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
