<script lang="ts">
	import { enhance } from '$app/forms';
	import { Building2, User, Mail, Phone, MapPin, Save, ArrowLeft, Video, Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: any } = $props();

	// Debug logging
	console.log('Dashboard data:', data);

	// Form state
	let formData = $state({
		companyName: data.funeralDirector?.companyName || '',
		contactPerson: data.funeralDirector?.contactPerson || '',
		email: data.funeralDirector?.email || '',
		phone: data.funeralDirector?.phone || '',
		street: data.funeralDirector?.address?.street || '',
		city: data.funeralDirector?.address?.city || '',
		state: data.funeralDirector?.address?.state || '',
		zipCode: data.funeralDirector?.address?.zipCode || ''
	});

	let isSubmitting = $state(false);
	let showProfileForm = $state(false);
	let expandedMemorials = $state<Set<string>>(new Set());

	function toggleMemorialExpand(id: string) {
		if (expandedMemorials.has(id)) {
			expandedMemorials.delete(id);
		} else {
			expandedMemorials.add(id);
		}
		expandedMemorials = expandedMemorials;
	}

	function getStreamStatusBadge(status?: string) {
		switch (status) {
			case 'live':
				return { class: 'bg-red-100 text-red-800', label: '🔴 LIVE' };
			case 'completed':
				return { class: 'bg-green-100 text-green-800', label: '✅ Completed' };
			default:
				return { class: 'bg-gray-100 text-gray-600', label: '⚫ Offline' };
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
	<div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-4 flex items-center">
				<a
					href="/profile"
					class="mr-4 flex items-center text-amber-600 transition-colors hover:text-amber-700"
				>
					<ArrowLeft class="mr-2 h-5 w-5" />
					Back to Profile
				</a>
			</div>
			<h1 class="flex items-center text-3xl font-bold text-gray-900">
				<Building2 class="mr-3 h-8 w-8 text-amber-600" />
				Funeral Director Dashboard
			</h1>
			<p class="mt-2 text-gray-600">Manage your memorials, streaming, and business information</p>
		</div>

		<!-- Debug/Error Info -->
		{#if data.error}
			<div class="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
				<p class="font-medium text-yellow-800">Debug Info: {data.error}</p>
			</div>
		{/if}

		<!-- My Memorials Section -->
		<div class="mb-8">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="flex items-center text-xl font-semibold text-gray-900">
					<Video class="mr-2 h-6 w-6 text-amber-600" />
					My Memorials
				</h2>
				<span class="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
					{data.memorials?.length || 0} memorials
				</span>
			</div>

			{#if !data.memorials || data.memorials.length === 0}
				<div class="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
					<div class="mb-4 text-5xl">🕊️</div>
					<h3 class="mb-2 text-lg font-medium text-gray-900">No Memorials Yet</h3>
					<p class="mb-4 text-gray-600">You haven't been assigned to any memorials yet.</p>
					<a
						href="/app/calculator"
						class="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
					>
						Create Memorial
					</a>
				</div>
			{:else}
				<div class="space-y-4">
					{#each data.memorials as memorial (memorial.id)}
						{@const isExpanded = expandedMemorials.has(memorial.id)}
						{@const statusBadge = getStreamStatusBadge(memorial.encoderConfig?.streamStatus)}
						<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all">
							<!-- Memorial Header (always visible) -->
							<div class="p-4">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-4">
										<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-xl font-bold text-white">
											{memorial.lovedOneName?.charAt(0) || 'M'}
										</div>
										<div>
											<h3 class="text-lg font-semibold text-gray-900">{memorial.lovedOneName}</h3>
											<div class="flex items-center gap-3 text-sm text-gray-500">
												{#if memorial.serviceDate}
													<span class="flex items-center">
														<Calendar class="mr-1 h-4 w-4" />
														{new Date(memorial.serviceDate).toLocaleDateString()}
														{#if memorial.serviceTime}
															at {memorial.serviceTime}
														{/if}
													</span>
												{:else}
													<span>Date TBD</span>
												{/if}
											</div>
										</div>
									</div>

									<div class="flex items-center gap-3">
										<!-- Stream Status Badge -->
										<span class="rounded-full px-3 py-1 text-xs font-medium {statusBadge.class}">
											{statusBadge.label}
										</span>

										<!-- View Memorial Link -->
										{#if memorial.fullSlug}
											<a
												href="/{memorial.fullSlug}"
												target="_blank"
												class="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
											>
												<ExternalLink class="h-4 w-4" />
												View
											</a>
										{/if}

										<!-- Expand/Collapse Button -->
										<button
											class="flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-200"
											onclick={() => toggleMemorialExpand(memorial.id)}
										>
											{#if isExpanded}
												<ChevronUp class="h-4 w-4" />
												Hide Streaming
											{:else}
												<ChevronDown class="h-4 w-4" />
												Streaming
											{/if}
										</button>
									</div>
								</div>
							</div>

							<!-- Expanded Streaming Controls -->
							{#if isExpanded}
								<div class="border-t border-gray-100 bg-gray-50 p-4">
									<div class="grid gap-4 md:grid-cols-2">
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Profile Settings Section (Collapsible) -->
		<div class="mb-8">
			<button
				class="mb-4 flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-lg transition-all hover:shadow-xl"
				onclick={() => (showProfileForm = !showProfileForm)}
			>
				<h2 class="flex items-center text-xl font-semibold text-gray-900">
					<Building2 class="mr-2 h-6 w-6 text-amber-600" />
					Business Profile Settings
				</h2>
				{#if showProfileForm}
					<ChevronUp class="h-5 w-5 text-gray-500" />
				{:else}
					<ChevronDown class="h-5 w-5 text-gray-500" />
				{/if}
			</button>

			{#if showProfileForm}
		<!-- Main Form -->
		<div class="rounded-3xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-xl">
			<form
				method="POST"
				action="?/updateProfile"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update({ reset: false }); // Don't reset the form
						isSubmitting = false;
					};
				}}
				class="space-y-8"
			>
				<!-- Company Information -->
				<div class="space-y-6">
					<h2
						class="flex items-center border-b border-gray-200 pb-3 text-xl font-semibold text-gray-900"
					>
						<Building2 class="mr-3 h-6 w-6 text-amber-600" />
						Company Information
					</h2>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<label for="companyName" class="mb-2 block text-sm font-medium text-gray-700">
								Company Name *
							</label>
							<input
								type="text"
								id="companyName"
								name="companyName"
								bind:value={formData.companyName}
								required
								class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
								placeholder="Smith & Sons Funeral Home"
							/>
						</div>

						<div>
							<label for="contactPerson" class="mb-2 block text-sm font-medium text-gray-700">
								Contact Person *
							</label>
							<input
								type="text"
								id="contactPerson"
								name="contactPerson"
								bind:value={formData.contactPerson}
								required
								class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
								placeholder="John Director"
							/>
						</div>
					</div>
				</div>

				<!-- Contact Information -->
				<div class="space-y-6">
					<h2
						class="flex items-center border-b border-gray-200 pb-3 text-xl font-semibold text-gray-900"
					>
						<Mail class="mr-3 h-6 w-6 text-amber-600" />
						Contact Information
					</h2>

					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div>
							<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
								Email Address *
							</label>
							<input
								type="email"
								id="email"
								name="email"
								bind:value={formData.email}
								required
								class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
								placeholder="director@funeral-home.com"
							/>
						</div>

						<div>
							<label for="phone" class="mb-2 block text-sm font-medium text-gray-700">
								Phone Number *
							</label>
							<input
								type="tel"
								id="phone"
								name="phone"
								bind:value={formData.phone}
								required
								class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
								placeholder="(555) 123-4567"
							/>
						</div>
					</div>
				</div>

				<!-- Address Information -->
				<div class="space-y-6">
					<h2
						class="flex items-center border-b border-gray-200 pb-3 text-xl font-semibold text-gray-900"
					>
						<MapPin class="mr-3 h-6 w-6 text-amber-600" />
						Business Address
					</h2>

					<div class="space-y-4">
						<div>
							<label for="street" class="mb-2 block text-sm font-medium text-gray-700">
								Street Address
							</label>
							<input
								type="text"
								id="street"
								name="street"
								bind:value={formData.street}
								class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
								placeholder="123 Memorial Drive"
							/>
						</div>

						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div>
								<label for="city" class="mb-2 block text-sm font-medium text-gray-700">
									City
								</label>
								<input
									type="text"
									id="city"
									name="city"
									bind:value={formData.city}
									class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
									placeholder="Orlando"
								/>
							</div>

							<div>
								<label for="state" class="mb-2 block text-sm font-medium text-gray-700">
									State
								</label>
								<input
									type="text"
									id="state"
									name="state"
									bind:value={formData.state}
									class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
									placeholder="FL"
								/>
							</div>

							<div>
								<label for="zipCode" class="mb-2 block text-sm font-medium text-gray-700">
									ZIP Code
								</label>
								<input
									type="text"
									id="zipCode"
									name="zipCode"
									bind:value={formData.zipCode}
									class="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-amber-500"
									placeholder="32801"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Form Messages -->
				{#if form?.error}
					<div class="rounded-xl border border-red-200 bg-red-50 p-4">
						<p class="font-medium text-red-800">{form.error}</p>
					</div>
				{/if}

				{#if form?.success}
					<div class="rounded-xl border border-green-200 bg-green-50 p-4">
						<p class="font-medium text-green-800">{form.message}</p>
					</div>
				{/if}

				<!-- Submit Button -->
				<div class="flex justify-end border-t border-gray-200 pt-6">
					<button
						type="submit"
						disabled={isSubmitting}
						class="flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
					>
						<Save class="mr-2 h-5 w-5" />
						{isSubmitting ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>
			{/if}
		</div>
	</div>
</div>
