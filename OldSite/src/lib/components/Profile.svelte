<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import {
		User,
		Mail,
		Edit3,
		LogOut,
		Heart,
		Calendar,
		MapPin,
		Clock,
		Plus,
		Building2,
		Shield,
		Users,
		Crown,
		Video,
		Settings,
		Sparkles,
		Eye,
		Play,
		Camera
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Toast, Badge, Stats } from '$lib/components/minimal-modern';
	import { executeRecaptcha, RECAPTCHA_ACTIONS } from '$lib/utils/recaptcha';
	import { dev } from '$app/environment';

	let { data, form } = $props();
	let displayName = $state(data.profile?.displayName || '');
	let isEditing = $state(false);
	let showCreateMemorialModal = $state(false);
	let lovedOneName = $state('');
	let isCreatingMemorial = $state(false);
	let showScheduleModal = $state(false);
	let selectedMemorial = $state(null);
	let showPaymentNotification = $state(false);
	let paymentMemorialId = $state('');
	let scheduleForm = $state({
		serviceDate: '',
		serviceTime: '',
		duration: 2,
		location: {
			name: '',
			address: '',
			isUnknown: false
		},
		timeIsUnknown: false
	});
	let mounted = $state(false);

	// Get user role from locals or profile data
	const userRole = data.user?.role || 'owner';
	const theme = getTheme('minimal');

	onMount(() => {
		mounted = true;
	});

	function getRoleInfo(role: string) {
		switch (role) {
			case 'admin':
				return {
					title: 'Admin',
					icon: Crown,
					gradient: 'from-red-600 via-pink-600 to-purple-600',
					bgGradient: 'from-red-50 to-pink-50',
					accentColor: 'red'
				};
			case 'funeral_director':
				return {
					title: 'Funeral Director',
					icon: Building2,
					gradient: 'from-yellow-600 via-amber-600 to-orange-600',
					bgGradient: 'from-yellow-50 to-amber-50',
					accentColor: 'amber'
				};
			case 'owner':
				return {
					title: 'Memorial Owner',
					icon: Crown,
					gradient: 'from-amber-500 via-orange-500 to-red-500',
					bgGradient: 'from-amber-50 to-orange-50',
					accentColor: 'amber'
				};
			default:
				return {
					title: 'User',
					icon: User,
					gradient: 'from-gray-600 to-gray-800',
					bgGradient: 'from-gray-50 to-gray-100',
					accentColor: 'gray'
				};
		}
	}

	const roleInfo = getRoleInfo(userRole);

	function openScheduleModal(memorial: any) {
		selectedMemorial = memorial;
		// Pre-fill with existing data if available
		scheduleForm.serviceDate = memorial.serviceDate
			? new Date(memorial.serviceDate).toISOString().split('T')[0]
			: '';
		scheduleForm.serviceTime = memorial.serviceTime || '';
		scheduleForm.duration = memorial.duration || 2;
		scheduleForm.location.name = memorial.location?.name || '';
		scheduleForm.location.address = memorial.location?.address || '';
		scheduleForm.location.isUnknown = memorial.location?.isUnknown || false;
		scheduleForm.timeIsUnknown = memorial.timeIsUnknown || false;
		showScheduleModal = true;
	}

	async function updateSchedule() {
		if (!selectedMemorial) return;

		try {
			const response = await fetch(`/api/memorials/${selectedMemorial.id}/schedule`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(scheduleForm)
			});

			if (response.ok) {
				showScheduleModal = false;
				// Refresh the page to show updated data
				location.reload();
			} else {
				const error = await response.json();
				alert('Error updating schedule: ' + error.message);
			}
		} catch (err) {
			alert('Network error occurred');
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br {roleInfo.bgGradient} relative overflow-hidden">
	<!-- Animated background elements -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl"
		></div>
		<div
			class="absolute -bottom-40 -left-40 h-96 w-96 animate-pulse rounded-full bg-gradient-to-tr from-white/5 to-transparent blur-3xl delay-1000"
		></div>
		<div
			class="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 transform animate-spin rounded-full bg-gradient-to-r from-white/5 to-transparent blur-2xl"
			style="animation-duration: 20s;"
		></div>
	</div>

	<div class="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
		{#if data.profile}
			<!-- Header Section -->
			<div
				class="mb-12 text-center {mounted ? 'animate-fade-in-up' : 'opacity-0'}"
				style="animation-delay: 0.1s;"
			>
				<div class="relative mb-6 inline-block">
					<div
						class="mx-auto h-32 w-32 rounded-full bg-gradient-to-r {roleInfo.gradient} p-1 shadow-2xl"
					>
						<div class="flex h-full w-full items-center justify-center rounded-full bg-white">
							{#if roleInfo.icon}
								{@const IconComponent = roleInfo.icon}
								<IconComponent class="h-16 w-16 text-gray-700" />
							{/if}
						</div>
					</div>
					<div
						class="absolute -top-2 -right-2 h-8 w-8 bg-gradient-to-r {roleInfo.gradient} flex items-center justify-center rounded-full shadow-lg"
					>
						<Sparkles class="h-4 w-4 text-white" />
					</div>
				</div>

				<h1 class="mb-2 text-4xl font-bold text-gray-900">
					{displayName || 'Welcome'}
				</h1>
				<div
					class="inline-flex items-center rounded-full bg-gradient-to-r px-4 py-2 {roleInfo.gradient} font-medium text-white shadow-lg"
				>
					{#if roleInfo.icon}
						{@const IconComponent = roleInfo.icon}
						<IconComponent class="mr-2 h-4 w-4" />
					{/if}
					{roleInfo.title}
				</div>
			</div>

			<!-- Main Content Grid -->
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<!-- Account Settings Card (moved up) -->
				<div
					class="lg:col-span-1 {mounted ? 'animate-fade-in-up' : 'opacity-0'}"
					style="animation-delay: 0.2s;"
				>
					<a href="/profile/settings" class="block">
						<div
							class="hover:shadow-3xl rounded-3xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:scale-105 cursor-pointer"
						>
							<div class="mb-6 flex items-center justify-between">
								<h2 class="flex items-center text-2xl font-bold text-gray-900">
									<Settings class="mr-3 h-6 w-6 text-{roleInfo.accentColor}-600" />
									Account Settings
								</h2>
							</div>

							<div class="space-y-4">
								<p class="text-gray-600">Manage your account information and preferences</p>
								
								<div class="space-y-3">
									<div class="flex items-center space-x-3 text-sm text-gray-500">
										<User class="h-4 w-4" />
										<span>Edit name and display preferences</span>
									</div>
									<div class="flex items-center space-x-3 text-sm text-gray-500">
										<Mail class="h-4 w-4" />
										<span>Update email address</span>
									</div>
									<div class="flex items-center space-x-3 text-sm text-gray-500">
										<MapPin class="h-4 w-4" />
										<span>Manage address information</span>
									</div>
									<div class="flex items-center space-x-3 text-sm text-gray-500">
										<Shield class="h-4 w-4" />
										<span>Change password</span>
									</div>
								</div>

								<div class="mt-6 pt-4 border-t border-gray-200">
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium text-gray-700">Click to manage</span>
										<div class="w-6 h-6 rounded-full bg-{roleInfo.accentColor}-100 flex items-center justify-center">
											<svg class="w-3 h-3 text-{roleInfo.accentColor}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
											</svg>
										</div>
									</div>
								</div>
							</div>
						</div>
					</a>
				</div>

				<!-- Memorials/Dashboard Card -->
				<div
					class="lg:col-span-2 {mounted ? 'animate-fade-in-up' : 'opacity-0'}"
					style="animation-delay: 0.3s;"
				>
					<div
						class="hover:shadow-3xl rounded-3xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500"
					>
						<div class="mb-8 flex items-center justify-between">
							<h2 class="flex items-center text-2xl font-bold text-gray-900">
								<Heart class="mr-3 h-6 w-6 text-{roleInfo.accentColor}-600" />
								{userRole === 'funeral_director' ? 'Managed Memorials' : 'Your Memorials'}
							</h2>
							<div class="flex items-center space-x-2">
								<span
									class="rounded-full px-3 py-1 bg-{roleInfo.accentColor}-100 text-{roleInfo.accentColor}-800 text-sm font-medium"
								>
									{data.memorials?.length || 0} Total
								</span>
							</div>
						</div>

						{#if data.memorials && data.memorials.length > 0}
							<div class="grid gap-4">
								{#each data.memorials as memorial, index}
									<div
										class="group rounded-2xl border border-white/30 bg-gradient-to-r from-white/80 to-white/60 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl {mounted
											? 'animate-fade-in-up'
											: 'opacity-0'}"
										style="animation-delay: {0.4 + index * 0.1}s;"
									>
										<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
											<div class="flex items-center space-x-4">
												<div
													class="h-12 w-12 rounded-full bg-gradient-to-r {roleInfo.gradient} flex items-center justify-center shadow-lg"
												>
													<span class="text-lg font-bold text-white">
														{memorial.lovedOneName?.charAt(0) || memorial.title?.charAt(0) || 'M'}
													</span>
												</div>
												<div>
													<h3
														class="font-bold text-gray-900 group-hover:text-{roleInfo.accentColor}-600 transition-colors"
													>
														{memorial.lovedOneName || memorial.title}
													</h3>
													<div class="flex items-center space-x-4 text-sm text-gray-500">
														<span class="flex items-center">
															<Calendar class="mr-1 h-4 w-4" />
															{new Date(memorial.createdAt).toLocaleDateString()}
														</span>
													</div>
												</div>
											</div>
											<div
												class="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100"
											>
												<a
													href={`/${memorial.fullSlug}`}
													target="_blank"
													class="flex items-center justify-center rounded-xl bg-green-600 px-4 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg min-h-[44px]"
												>
													<Eye class="mr-1 h-3 w-3" />
													View
												</a>
												{#if userRole === 'owner'}
													<a
														href={`/slideshow-generator?memorialId=${memorial.id}`}
														class="flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg min-h-[44px]"
													>
														<Camera class="mr-1 h-3 w-3" />
														Slideshow
													</a>
												{/if}
												<a
													href={`/schedule/${memorial.id}`}
													class="flex items-center justify-center rounded-xl bg-amber-600 px-4 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg min-h-[44px]"
												>
													<Clock class="mr-1 h-3 w-3" />
													Schedule
												</a>
												{#if userRole === 'funeral_director' || userRole === 'admin'}
													<a
														href={`/memorials/${memorial.id}/streams`}
														class="flex items-center justify-center rounded-xl bg-purple-600 px-4 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg min-h-[44px]"
													>
														<Play class="mr-1 h-3 w-3" />
														Manage Streams
													</a>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="py-12 text-center">
								<div
									class="mx-auto h-24 w-24 rounded-full bg-gradient-to-r {roleInfo.gradient} mb-4 animate-spin"
								></div>
								<h3 class="mb-2 text-xl font-semibold text-gray-900">No memorials yet</h3>
								<p class="mb-6 text-gray-500">Create your first memorial to get started</p>
								{#if userRole === 'funeral_director'}
									<a
										href="/register/funeral-director"
										class="inline-flex items-center rounded-xl bg-gradient-to-r px-6 py-3 {roleInfo.gradient} font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
									>
										<Heart class="mr-2 h-4 w-4" />
										Create Memorial
									</a>
								{:else if userRole === 'owner'}
									<div class="space-y-4">
										<Button
											onclick={() => showCreateMemorialModal = true}
											variant="role"
											role="owner"
											size="lg"
											rounded="lg"
										>
											<Heart class="w-4 h-4 mr-2" />
											Create Memorial
										</Button>
										
										<!-- Debug Test Button -->
										<form method="POST" action="?/testAction" class="inline">
											<Button
												type="submit"
												variant="primary"
												size="sm"
												rounded="lg"
											>
												🧪 Test Server Action
											</Button>
										</form>
									</div>
								{:else}
									<p class="text-gray-500">
										Please contact your funeral director to create a new memorial.
									</p>
								{/if}
							</div>
						{/if}

						<!-- Create Memorial Button for Owners with existing memorials -->
						{#if userRole === 'owner' && data.memorials && data.memorials.length > 0}
							<div class="mt-6 text-center">
								{#if data.profile?.memorialCount > 0 && !data.profile?.hasPaidForMemorial}
									<div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
										<p class="text-sm text-amber-800">
											<strong>Payment Required:</strong> Please complete payment for your existing memorial
											before creating a new one.
										</p>
										<a href="/schedule/{data.memorials?.[0]?.id}" class="inline-block">
											<Button
												variant="role"
												role="owner"
												size="md"
												rounded="lg"
											>
												Complete Payment
											</Button>
										</a>
									</div>
								{:else}
									<Button
										onclick={() => (showCreateMemorialModal = true)}
										variant="outline"
										role="owner"
										size="lg"
										rounded="lg"
										class="flex items-center justify-center gap-2 whitespace-nowrap"
									>
										<Heart class="h-4 w-4 flex-shrink-0" />
										<span>Create Another Memorial</span>
									</Button>
								{/if}
							</div>
						{/if}
					</div>
				</div>

				{#if userRole === 'admin'}
					<!-- Admin Dashboard Link -->
					<div
						class="mt-8 {mounted ? 'animate-fade-in-up' : 'opacity-0'}"
						style="animation-delay: 0.5s;"
					>
						<div
							class="rounded-3xl border border-white/20 bg-white/70 p-6 shadow-2xl backdrop-blur-xl"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-4">
									<Crown class="h-6 w-6 text-red-600" />
									<div>
										<h3 class="font-semibold text-gray-900">Site Admin</h3>
										<p class="text-sm text-gray-500">Administrative dashboard and controls</p>
									</div>
								</div>
								<a
									href="/admin"
									class="rounded-xl bg-gradient-to-r from-red-500 to-pink-600 px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
								>
									Admin Dashboard
								</a>
							</div>
						</div>
					</div>
				{/if}

				{#if userRole === 'funeral_director'}
					<!-- Funeral Director Dashboard Link -->
					<div
						class="mt-8 {mounted ? 'animate-fade-in-up' : 'opacity-0'}"
						style="animation-delay: 0.5s;"
					>
						<div
							class="rounded-3xl border border-white/20 bg-white/70 p-6 shadow-2xl backdrop-blur-xl"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-4">
									<Building2 class="h-6 w-6 text-amber-600" />
									<div>
										<h3 class="font-semibold text-gray-900">Director Dashboard</h3>
										<p class="text-sm text-gray-500">Professional tools and management</p>
									</div>
								</div>
								<a
									href="/funeral-director/dashboard"
									class="rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
								>
									Director Dashboard
								</a>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex min-h-[60vh] items-center justify-center">
				<div class="text-center">
					<div
						class="mx-auto h-16 w-16 rounded-full bg-gradient-to-r {roleInfo.gradient} mb-4 animate-spin"
					></div>
					<p class="font-medium text-gray-600">Loading your profile...</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Schedule Editing Modal -->
{#if showScheduleModal && selectedMemorial}
	<div class="bg-opacity-50 fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600">
		<div
			class="relative top-20 mx-auto w-96 rounded-3xl border bg-white/90 p-5 shadow-lg backdrop-blur-xl"
		>
			<div class="mt-3">
				<div class="mb-6 flex items-center justify-between">
					<h3 class="flex items-center text-xl font-bold text-gray-900">
						<Clock class="mr-3 h-6 w-6 text-amber-600" />
						Edit Schedule
					</h3>
					<button
						onclick={() => (showScheduleModal = false)}
						class="text-gray-400 transition-colors hover:text-gray-600"
						aria-label="Close modal"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>

				<div
					class="mb-4 rounded-2xl bg-gradient-to-r p-4 {roleInfo.bgGradient} border border-white/20"
				>
					<p class="font-semibold text-gray-900">
						{selectedMemorial.lovedOneName || selectedMemorial.title}
					</p>
					<p class="text-sm text-gray-600">Memorial Service Schedule</p>
				</div>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						updateSchedule();
					}}
					class="space-y-6"
				>
					<!-- Date and Time Section -->
					<div
						class="rounded-2xl border border-yellow-100 bg-gradient-to-r from-yellow-50 to-amber-50 p-4"
					>
						<h4 class="mb-4 flex items-center font-semibold text-gray-900">
							<Calendar class="mr-2 h-4 w-4 text-amber-600" />
							Service Date & Time
						</h4>
						<div class="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
							<div>
								<label for="serviceDate" class="mb-2 block text-sm font-medium text-gray-700"
									>Date of Service</label
								>
								<input
									type="date"
									id="serviceDate"
									bind:value={scheduleForm.serviceDate}
									disabled={scheduleForm.timeIsUnknown}
									class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-500"
								/>
							</div>
							<div>
								<label for="serviceTime" class="mb-2 block text-sm font-medium text-gray-700"
									>Time of Service</label
								>
								<input
									type="time"
									id="serviceTime"
									bind:value={scheduleForm.serviceTime}
									disabled={scheduleForm.timeIsUnknown}
									class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-500"
								/>
							</div>
							<Button
								variant={scheduleForm.timeIsUnknown ? "role" : "secondary"}
								role={scheduleForm.timeIsUnknown ? "owner" : undefined}
								size="md"
								onclick={() => (scheduleForm.timeIsUnknown = !scheduleForm.timeIsUnknown)}
								rounded="lg"
							>
								Unknown
							</Button>
						</div>
					</div>

					<!-- Duration Section -->
					<div
						class="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4"
					>
						<h4 class="mb-4 flex items-center font-semibold text-gray-900">
							<Clock class="mr-2 h-4 w-4 text-green-600" />
							Service Duration
						</h4>
						<div class="space-y-3">
							<div class="block text-sm font-medium text-gray-700">
								Service Duration: {scheduleForm.duration}
								{scheduleForm.duration === 1 ? 'hour' : 'hours'}
							</div>
							<div class="relative">
								<input
									type="range"
									bind:value={scheduleForm.duration}
									min="0.5"
									max="8"
									step="0.5"
									class="slider h-3 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-yellow-200 to-amber-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
									style="background: linear-gradient(to right, #f59e0b 0%, #d97706 {((scheduleForm.duration -
										0.5) /
										7.5) *
										100}%, #e5e7eb {((scheduleForm.duration - 0.5) / 7.5) * 100}%, #e5e7eb 100%)"
								/>
								<div class="mt-1 flex justify-between text-xs text-gray-500">
									<span>30 min</span>
									<span>4 hrs</span>
									<span>8 hrs</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Location Section -->
					<div
						class="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-red-50 p-4"
					>
						<h4 class="mb-4 flex items-center font-semibold text-gray-900">
							<Building2 class="mr-2 h-4 w-4 text-orange-600" />
							Service Location
						</h4>
						<div class="space-y-4">
							<div class="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
								<div class="md:col-span-2">
									<label for="locationName" class="mb-2 block text-sm font-medium text-gray-700"
										>Location Name</label
									>
									<input
										type="text"
										id="locationName"
										bind:value={scheduleForm.location.name}
										disabled={scheduleForm.location.isUnknown}
										placeholder="e.g., St. Mary's Church"
										class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
									/>
								</div>
								<Button
									variant={scheduleForm.location.isUnknown ? "role" : "secondary"}
									role={scheduleForm.location.isUnknown ? "owner" : undefined}
									size="md"
									onclick={() =>
										(scheduleForm.location.isUnknown = !scheduleForm.location.isUnknown)}
									rounded="lg"
								>
									Unknown
								</Button>
							</div>
							<div>
								<label for="locationAddress" class="mb-2 block text-sm font-medium text-gray-700"
									>Location Address</label
								>
								<input
									type="text"
									id="locationAddress"
									bind:value={scheduleForm.location.address}
									disabled={scheduleForm.location.isUnknown}
									placeholder="123 Main St, Anytown, USA"
									class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
								/>
							</div>
						</div>
					</div>

					<div class="flex justify-end space-x-3 pt-4">
						<Button
							variant="secondary"
							size="md"
							onclick={() => (showScheduleModal = false)}
							rounded="lg"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="role"
							role="owner"
							size="md"
							rounded="lg"
						>
							Update Schedule
						</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Create Memorial Modal -->
{#if showCreateMemorialModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600">
		<div
			class="relative top-20 mx-auto w-96 rounded-3xl border bg-white/90 p-5 shadow-lg backdrop-blur-xl"
		>
			<div class="mt-3">
				<div class="mb-6 flex items-center justify-between">
					<h3 class="flex items-center text-xl font-bold text-gray-900">
						<Heart class="mr-3 h-6 w-6 text-amber-600" />
						Create Memorial
					</h3>
					<button
						onclick={() => (showCreateMemorialModal = false)}
						class="text-gray-400 transition-colors hover:text-gray-600"
						aria-label="Close modal"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>

				<form
					method="POST"
					action="?/createMemorial"
					class="space-y-6"
					use:enhance={async ({ formData }) => {
						console.log('🎯 [PROFILE] Form submitting...');
						isCreatingMemorial = true;

						// Execute reCAPTCHA (skip in development mode)
						if (dev) {
							console.log('🎯 [PROFILE] Development mode: skipping reCAPTCHA');
							formData.append('recaptchaToken', 'dev-bypass');
						} else {
							const recaptchaToken = await executeRecaptcha(RECAPTCHA_ACTIONS.CREATE_MEMORIAL);
							
							if (!recaptchaToken) {
								console.error('🎯 [PROFILE] reCAPTCHA failed');
								isCreatingMemorial = false;
								return;
							}

							// Add reCAPTCHA token to form data
							formData.append('recaptchaToken', recaptchaToken);
						}

						return async ({ result, update }) => {
							isCreatingMemorial = false;
							
							// Check if payment is needed
							if (result.type === 'failure' && result.data?.needsPayment) {
								showCreateMemorialModal = false;
								paymentMemorialId = result.data.memorialId || '';
								showPaymentNotification = true;
							} else {
								await update();
							}
						};
					}}
				>
					<div
						class="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4"
					>
						<label for="lovedOneName" class="mb-2 block text-sm font-medium text-gray-700">
							Loved One's Name *
						</label>
						<input
							type="text"
							id="lovedOneName"
							name="lovedOneName"
							bind:value={lovedOneName}
							placeholder="Enter the name of your loved one"
							required
							class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
						/>
						<p class="mt-2 text-xs text-gray-500">
							This will be the main name displayed on the memorial page.
						</p>
					</div>

					{#if form?.message}
						<div class="p-4 rounded-xl {form.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
							<p class="text-sm {form.success ? 'text-green-600' : 'text-red-600'}">{form.message}</p>
							{#if form.success && form.memorialUrl}
								<a 
									href={form.memorialUrl} 
									target="_blank"
									class="mt-2 inline-flex items-center text-sm font-medium text-green-700 hover:text-green-800"
								>
									View Memorial →
								</a>
							{/if}
						</div>
					{/if}

					<div class="rounded-xl border border-blue-200 bg-blue-50 p-4">
						<h4 class="mb-2 font-semibold text-blue-900">What happens next?</h4>
						<ul class="space-y-1 text-sm text-blue-800">
							<li>• Your memorial will be created and immediately accessible</li>
							<li>• You can customize it with photos, stories, and service details</li>
							<li>• You'll get a unique URL to share with family and friends</li>
							<li>• You can only create one memorial until payment is completed</li>
						</ul>
					</div>

					<div class="flex justify-end space-x-3 pt-4">
						<Button
							variant="secondary"
							size="md"
							onclick={() => (showCreateMemorialModal = false)}
							rounded="lg"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="role"
							role="owner"
							size="md"
							disabled={isCreatingMemorial}
							loading={isCreatingMemorial}
							rounded="lg"
						>
							{#if isCreatingMemorial}
								Creating...
							{:else}
								Create Memorial
							{/if}
						</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Payment Notification Modal -->
{#if showPaymentNotification}
	<div class="bg-opacity-50 fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600">
		<div
			class="relative top-20 mx-auto w-96 rounded-3xl border bg-white/90 p-5 shadow-lg backdrop-blur-xl"
		>
			<div class="mt-3">
				<div class="mb-6 flex items-center justify-between">
					<h3 class="flex items-center text-xl font-bold text-gray-900">
						<Heart class="mr-3 h-6 w-6 text-amber-600" />
						Complete Payment Required
					</h3>
					<button
						onclick={() => (showPaymentNotification = false)}
						class="text-gray-400 transition-colors hover:text-gray-600"
						aria-label="Close modal"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>

				<div class="space-y-6">
					<div class="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
						<div class="mb-4 flex items-center justify-center">
							<div class="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
								<Clock class="h-8 w-8 text-amber-600" />
							</div>
						</div>
						<h4 class="mb-3 text-center text-lg font-semibold text-gray-900">
							Finish Setting Up Your First Memorial
						</h4>
						<p class="text-center text-gray-700">
							Before you can create another memorial, please complete the checkout process for your first memorial.
						</p>
					</div>

					<div class="rounded-xl border border-blue-200 bg-blue-50 p-4">
						<h4 class="mb-2 font-semibold text-blue-900">What you'll do next:</h4>
						<ul class="space-y-1 text-sm text-blue-800">
							<li>• Review your service details and schedule</li>
							<li>• Choose your memorial package</li>
							<li>• Complete the checkout process</li>
							<li>• Then you can create additional memorials</li>
						</ul>
					</div>

					<div class="flex justify-end space-x-3 pt-4">
						<Button
							variant="secondary"
							size="md"
							onclick={() => (showPaymentNotification = false)}
							rounded="lg"
						>
							Cancel
						</Button>
						<a href={`/schedule/${paymentMemorialId}`}>
							<Button
								variant="role"
								role="owner"
								size="md"
								rounded="lg"
							>
								Go to Schedule & Payment
							</Button>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in-up {
		animation: fade-in-up 0.8s ease-out forwards;
	}

	.shadow-3xl {
		box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
	}
</style>
