<script lang="ts">
	import type {
		CalculatorFormData,
		MemorialServices,
		ServiceDetails,
		AdditionalService
	} from '$lib/features/booking/types';
	import type { PricingConfig } from '$lib/config/pricing';
	import { DEFAULT_PRICING } from '$lib/config/pricing';

	let {
		services = $bindable(),
		calculatorData = $bindable(),
		lovedOneName = $bindable(''),
		funeralDirectorName = $bindable(''),
		funeralHome = $bindable(''),
		pricing = DEFAULT_PRICING
	}: {
		services: MemorialServices;
		calculatorData: CalculatorFormData;
		lovedOneName: string;
		funeralDirectorName: string;
		funeralHome: string;
		pricing?: PricingConfig;
	} = $props();

	function getAdditionalLocation(): AdditionalService {
		return (
			services.additional.find((s) => s.type === 'location') ?? {
				type: 'location' as const,
				location: { name: '', address: '', isUnknown: false },
				time: { date: null, time: null, isUnknown: false },
				hours: 2
			}
		);
	}

	function getAdditionalDay(): AdditionalService {
		return (
			services.additional.find((s) => s.type === 'day') ?? {
				type: 'day' as const,
				location: { name: '', address: '', isUnknown: false },
				time: { date: null, time: null, isUnknown: false },
				hours: 2
			}
		);
	}

	function toggleAdditionalLocation(enabled: boolean) {
		if (enabled) {
			const existing = services.additional.find((s) => s.type === 'location');
			if (!existing) {
				services.additional = [
					...services.additional,
					{
						type: 'location',
						location: { name: '', address: '', isUnknown: false },
						time: { date: null, time: null, isUnknown: false },
						hours: 2
					}
				];
			}
		} else {
			services.additional = services.additional.filter((s) => s.type !== 'location');
		}
	}

	function toggleAdditionalDay(enabled: boolean) {
		if (enabled) {
			const existing = services.additional.find((s) => s.type === 'day');
			if (!existing) {
				services.additional = [
					...services.additional,
					{
						type: 'day',
						location: { name: '', address: '', isUnknown: false },
						time: { date: null, time: null, isUnknown: false },
						hours: 2
					}
				];
			}
		} else {
			services.additional = services.additional.filter((s) => s.type !== 'day');
		}
	}

	let hasAdditionalLocation = $derived(services.additional.some((s) => s.type === 'location'));
	let hasAdditionalDay = $derived(services.additional.some((s) => s.type === 'day'));
	let additionalLocation = $derived(getAdditionalLocation());
	let additionalDay = $derived(getAdditionalDay());
</script>

<div class="space-y-6">
	<!-- Loved One's Name -->
	<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h3 class="mb-4 text-lg font-bold text-gray-900">In Loving Memory Of</h3>
		<label class="block">
			<span class="text-sm font-medium text-gray-700">Your Loved One's Name</span>
			<input
				class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
				type="text"
				bind:value={lovedOneName}
				placeholder="e.g., Jane Doe"
			/>
		</label>
	</div>

	<!-- Main Service Details -->
	<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h3 class="mb-4 text-lg font-bold text-gray-900">Main Service Details</h3>
		<div class="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
			<label class="block">
				<span class="text-sm font-medium text-gray-700">Date of Service</span>
				<input
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-gray-100"
					type="date"
					bind:value={services.main.time.date}
					disabled={services.main.time.isUnknown}
				/>
			</label>
			<label class="block">
				<span class="text-sm font-medium text-gray-700">Time of Livestream</span>
				<input
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-gray-100"
					type="time"
					bind:value={services.main.time.time}
					disabled={services.main.time.isUnknown}
				/>
			</label>
			<button
				class="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors {services.main.time
					.isUnknown
					? 'bg-amber-500 text-white'
					: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
				onclick={() => (services.main.time.isUnknown = !services.main.time.isUnknown)}
			>
				Date/Time Unknown
			</button>
		</div>

		<label class="mt-4 block">
			<span class="text-sm font-medium text-gray-700"
				>Number of Hours (Main Location): <strong class="text-amber-600"
					>{services.main.hours}</strong
				></span
			>
			<input
				type="range"
				bind:value={services.main.hours}
				min="1"
				max="8"
				step="1"
				class="mt-2 w-full accent-amber-500"
			/>
			<div class="mt-1 flex justify-between text-xs text-gray-400">
				<span>1hr</span>
				<span>8hrs</span>
			</div>
		</label>

		<div class="mt-4 grid grid-cols-1 items-end gap-4 md:grid-cols-3">
			<label class="block md:col-span-2">
				<span class="text-sm font-medium text-gray-700">Location Name</span>
				<input
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-gray-100"
					type="text"
					bind:value={services.main.location.name}
					disabled={services.main.location.isUnknown}
					placeholder="e.g., St. Mary's Church"
				/>
			</label>
			<button
				class="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors {services.main
					.location.isUnknown
					? 'bg-amber-500 text-white'
					: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
				onclick={() =>
					(services.main.location.isUnknown = !services.main.location.isUnknown)}
			>
				Location Unknown
			</button>
		</div>
		<label class="mt-4 block">
			<span class="text-sm font-medium text-gray-700">Location Address</span>
			<input
				class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-gray-100"
				type="text"
				bind:value={services.main.location.address}
				disabled={services.main.location.isUnknown}
				placeholder="123 Main St, Anytown, USA"
			/>
		</label>
	</div>

	<!-- Funeral Professional Information -->
	<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h3 class="mb-4 text-lg font-bold text-gray-900">Funeral Professional Information</h3>
		<p class="mb-4 text-sm text-gray-500">Optional</p>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<label class="block">
				<span class="text-sm font-medium text-gray-700">Funeral Director Name</span>
				<input
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
					type="text"
					bind:value={funeralDirectorName}
				/>
			</label>
			<label class="block">
				<span class="text-sm font-medium text-gray-700">Funeral Home</span>
				<input
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
					type="text"
					bind:value={funeralHome}
				/>
			</label>
		</div>
	</div>

	<!-- Additional Services -->
	<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h3 class="mb-4 text-lg font-bold text-gray-900">Additional Services</h3>

		<!-- Additional Location Toggle -->
		<div class="flex items-center justify-between border-b border-gray-100 pb-4">
			<span class="text-gray-700">Add a second location for the same day?</span>
			<div class="flex gap-2">
				<button
					class="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors {hasAdditionalLocation
						? 'bg-amber-500 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
					onclick={() => toggleAdditionalLocation(true)}
				>
					Yes
				</button>
				<button
					class="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors {!hasAdditionalLocation
						? 'bg-gray-200 text-gray-700'
						: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
					onclick={() => toggleAdditionalLocation(false)}
				>
					No
				</button>
			</div>
		</div>

		{#if hasAdditionalLocation}
			<div class="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
				<h4 class="mb-3 font-semibold text-gray-900">Additional Location Details</h4>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<label class="block">
						<span class="text-sm font-medium text-gray-700">Location Name</span>
						<input
							class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
							type="text"
							bind:value={additionalLocation.location.name}
						/>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-gray-700">Location Address</span>
						<input
							class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
							type="text"
							bind:value={additionalLocation.location.address}
						/>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-gray-700">Start Time</span>
						<input
							class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
							type="time"
							bind:value={additionalLocation.time.time}
						/>
					</label>
				</div>
				<label class="mt-4 block">
					<span class="text-sm font-medium text-gray-700"
						>Number of Hours: <strong class="text-amber-600"
							>{additionalLocation.hours}</strong
						></span
					>
					<input
						type="range"
						bind:value={additionalLocation.hours}
						min="1"
						max="8"
						step="1"
						class="mt-2 w-full accent-amber-500"
					/>
				</label>
			</div>
		{/if}

		<!-- Additional Day Toggle -->
		<div class="mt-4 flex items-center justify-between border-b border-gray-100 pb-4">
			<span class="text-gray-700">Add another day of service?</span>
			<div class="flex gap-2">
				<button
					class="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors {hasAdditionalDay
						? 'bg-amber-500 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
					onclick={() => toggleAdditionalDay(true)}
				>
					Yes
				</button>
				<button
					class="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors {!hasAdditionalDay
						? 'bg-gray-200 text-gray-700'
						: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
					onclick={() => toggleAdditionalDay(false)}
				>
					No
				</button>
			</div>
		</div>

		{#if hasAdditionalDay}
			<div class="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
				<h4 class="mb-3 font-semibold text-gray-900">Additional Day Details</h4>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<label class="block">
						<span class="text-sm font-medium text-gray-700">Location Name</span>
						<input
							class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
							type="text"
							bind:value={additionalDay.location.name}
						/>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-gray-700">Location Address</span>
						<input
							class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
							type="text"
							bind:value={additionalDay.location.address}
						/>
					</label>
					<label class="block">
						<span class="text-sm font-medium text-gray-700">Date of Service</span>
						<input
							class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
							type="date"
							bind:value={additionalDay.time.date}
						/>
					</label>
				</div>
				<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
					<label class="block">
						<span class="text-sm font-medium text-gray-700">Start Time</span>
						<input
							class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
							type="time"
							bind:value={additionalDay.time.time}
						/>
					</label>
				</div>
				<label class="mt-4 block">
					<span class="text-sm font-medium text-gray-700"
						>Number of Hours: <strong class="text-amber-600"
							>{additionalDay.hours}</strong
						></span
					>
					<input
						type="range"
						bind:value={additionalDay.hours}
						min="1"
						max="8"
						step="1"
						class="mt-2 w-full accent-amber-500"
					/>
				</label>
			</div>
		{/if}
	</div>

	<!-- Add-ons -->
	<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
		<h3 class="mb-4 text-lg font-bold text-gray-900">Add-ons</h3>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<label
				class="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors {calculatorData
					.addons.photography
					? 'border-amber-300 bg-amber-50'
					: 'border-gray-200 hover:border-gray-300'}"
			>
				<input
					class="h-5 w-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
					type="checkbox"
					bind:checked={calculatorData.addons.photography}
				/>
				<div class="flex-1">
					<span class="font-medium text-gray-900">Photography</span>
					<span class="block text-sm text-gray-500">${pricing.addons.photography}</span>
				</div>
			</label>

			<label
				class="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors {calculatorData
					.addons.audioVisualSupport
					? 'border-amber-300 bg-amber-50'
					: 'border-gray-200 hover:border-gray-300'}"
			>
				<input
					class="h-5 w-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
					type="checkbox"
					bind:checked={calculatorData.addons.audioVisualSupport}
				/>
				<div class="flex-1">
					<span class="font-medium text-gray-900">Audio/Visual Support</span>
					<span class="block text-sm text-gray-500"
						>${pricing.addons.audioVisualSupport}</span
					>
				</div>
			</label>

			<label
				class="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors {calculatorData
					.addons.liveMusician
					? 'border-amber-300 bg-amber-50'
					: 'border-gray-200 hover:border-gray-300'}"
			>
				<input
					class="h-5 w-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
					type="checkbox"
					bind:checked={calculatorData.addons.liveMusician}
				/>
				<div class="flex-1">
					<span class="font-medium text-gray-900">Live Musician</span>
					<span class="block text-sm text-gray-500">${pricing.addons.liveMusician}</span>
				</div>
			</label>

			<div
				class="flex items-center gap-4 rounded-lg border p-4 {calculatorData.addons
					.woodenUsbDrives > 0
					? 'border-amber-300 bg-amber-50'
					: 'border-gray-200'}"
			>
				<input
					type="number"
					bind:value={calculatorData.addons.woodenUsbDrives}
					min="0"
					max="10"
					class="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
				/>
				<div class="flex-1">
					<span class="font-medium text-gray-900">Wooden USB Drive(s)</span>
					<span class="block text-sm text-gray-500">$300 (first) / $100 (each add'l)</span
					>
				</div>
			</div>
		</div>
	</div>
</div>
