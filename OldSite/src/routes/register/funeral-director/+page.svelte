<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import {
		Heart,
		User,
		Mail,
		Calendar,
		Clock,
		CheckCircle,
		Building2,
		Users,
		AlertCircle
	} from 'lucide-svelte';
	import { Button } from '$lib/ui';
	import type { PageData } from './$types';

	let {
		data,
		form
	}: { 
		data: PageData;
		form?: { error?: any; success?: boolean; message?: string; memorialSlug?: string; familyEmail?: string } 
	} = $props();

	// Form state using Svelte 5 runes - with prepopulation
	let lovedOneName = $state('');
	let familyContactName = $state('');
	let familyContactEmail = $state('');
	let familyContactPhone = $state('');
	let directorName = $state(data.prepopulatedData?.directorName || '');
	let directorEmail = $state(data.prepopulatedData?.directorEmail || '');
	let funeralHomeName = $state(data.prepopulatedData?.funeralHomeName || '');
	let locationName = $state('');
	let locationAddress = $state('');
	let memorialDate = $state('');
	let memorialTime = $state('');
	let contactPreference = $state('email');
	let additionalNotes = $state('');

	// UI states
	let isSubmitting = $state(false);

	// Get today's date for minimum date input
	const today = new Date().toISOString().split('T')[0];

	// Form validation
	function validateForm() {
		if (!lovedOneName.trim()) return 'Loved one\'s name is required';
		if (!directorName.trim()) return 'Director name is required';
		if (!familyContactEmail.trim()) return 'Family contact email is required';
		if (!familyContactPhone.trim()) return 'Family contact phone is required';
		if (!funeralHomeName.trim()) return 'Funeral home name is required';
		
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(familyContactEmail)) return 'Family contact email must be valid';
		if (directorEmail && !emailRegex.test(directorEmail)) return 'Director email must be valid';
		
		return null;
	}

	// Handle form submission
	function handleSubmit(event: SubmitEvent) {
		// Prevent double submission
		if (isSubmitting) {
			event.preventDefault();
			return;
		}
		
		const error = validateForm();
		if (error) {
			event.preventDefault();
			alert(error);
			return;
		}
	}
</script>

<svelte:head>
	<title>Quick Family Registration - Tributestream</title>
	<meta
		name="description"
		content="Quickly register families and create memorial pages for funeral services. Professional tools for funeral directors."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 to-white">
	<div class="container mx-auto px-4 py-12">
		<!-- Header -->
		<div class="mb-12 text-center">
			<div
				class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-yellow-600 to-amber-600"
			>
				<Heart class="h-8 w-8 text-white" />
			</div>
			<h1 class="mb-4 text-4xl font-bold text-gray-900">Quick Family Registration</h1>
			<p class="mx-auto max-w-2xl text-xl text-gray-600">
				Quickly register families and create memorial pages for their loved ones. This will create their account, memorial page, and send them login credentials via email.
			</p>
			
			<!-- User Info Display -->
			{#if data.user}
				<div class="mt-6 inline-flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">
					{#if data.user.role === 'funeral_director'}
						<Building2 class="h-4 w-4" />
						<span>Logged in as: {data.funeralDirectorProfile?.companyName || 'Funeral Director'}</span>
					{:else if data.user.role === 'admin'}
						<Users class="h-4 w-4" />
						<span>Logged in as: Administrator</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Form -->
		<div class="mx-auto max-w-4xl">
			<div class="rounded-2xl bg-white p-8 shadow-xl">
				<!-- Success Message -->
				{#if form?.success}
					<div class="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
						<div class="flex items-center gap-3">
							<CheckCircle class="h-6 w-6 text-green-600" />
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-green-800">Memorial Created Successfully!</h3>
								<p class="text-sm text-green-700 mt-1">{form.message}</p>
								{#if form.memorialSlug}
									<div class="mt-3 space-y-2">
										<p class="text-sm text-green-700">
											<strong>Memorial URL:</strong> 
											<a href="/{form.memorialSlug}" target="_blank" class="underline hover:text-green-800">
												tributestream.com/{form.memorialSlug}
											</a>
										</p>
										{#if form.familyContactEmail}
											<p class="text-sm text-green-700">
												<strong>Family Email:</strong> {form.familyContactEmail}
											</p>
										{/if}
										<p class="text-sm text-green-700 font-medium mt-3">
											Redirecting to your profile in 3 seconds...
										</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<form
					method="POST"
					onsubmit={handleSubmit}
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							await update({ reset: false });
							isSubmitting = false;
							
							// If successful, redirect to profile after showing success message
							if (result.type === 'success' && result.data?.success) {
								setTimeout(() => {
									window.location.href = '/profile';
								}, 3000);
							}
						};
					}}
				>
					<div class="space-y-6">
						<div class="mb-8 text-center">
							<h2 class="mb-2 text-2xl font-bold text-gray-900">Enhanced Memorial Registration</h2>
							<p class="text-gray-600">Complete memorial setup with family contact, director, and service information.</p>
						</div>

						<!-- Memorial Information -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
								<Heart class="h-5 w-5" />
								Memorial Information
							</h3>
							<div class="grid grid-cols-1 gap-4">
								<div>
									<label for="lovedOneName" class="mb-2 block text-sm font-medium text-gray-700">
										Loved One's Name *
									</label>
									<input
										type="text"
										id="lovedOneName"
										name="lovedOneName"
										bind:value={lovedOneName}
										required
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="John Smith"
									/>
								</div>
							</div>
						</div>

						<!-- Family Contact Information -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
								<User class="h-5 w-5" />
								Family Contact Information
							</h3>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<label for="familyContactName" class="mb-2 block text-sm font-medium text-gray-700">
										Family Contact Name
									</label>
									<input
										type="text"
										id="familyContactName"
										name="familyContactName"
										bind:value={familyContactName}
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="Jane Smith"
									/>
								</div>
								<div>
									<label for="familyContactEmail" class="mb-2 block text-sm font-medium text-gray-700">
										Family Contact Email *
									</label>
									<input
										type="email"
										id="familyContactEmail"
										name="familyContactEmail"
										bind:value={familyContactEmail}
										required
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="family@email.com"
									/>
								</div>
								<div>
									<label for="familyContactPhone" class="mb-2 block text-sm font-medium text-gray-700">
										Family Contact Phone *
									</label>
									<input
										type="tel"
										id="familyContactPhone"
										name="familyContactPhone"
										bind:value={familyContactPhone}
										required
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="(555) 123-4567"
									/>
								</div>
								<div>
									<label for="contactPreference" class="mb-2 block text-sm font-medium text-gray-700">
										Preferred Contact Method
									</label>
									<select
										id="contactPreference"
										name="contactPreference"
										bind:value={contactPreference}
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									>
										<option value="email">Email</option>
										<option value="phone">Phone</option>
									</select>
								</div>
							</div>
						</div>

						<!-- Director Information -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
								<Building2 class="h-5 w-5" />
								Director & Funeral Home Information
							</h3>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<label for="directorName" class="mb-2 block text-sm font-medium text-gray-700">
										Director Name *
									</label>
									<input
										type="text"
										id="directorName"
										name="directorName"
										bind:value={directorName}
										required
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="Director Name"
									/>
								</div>
								<div>
									<label for="directorEmail" class="mb-2 block text-sm font-medium text-gray-700">
										Director Email
									</label>
									<input
										type="email"
										id="directorEmail"
										name="directorEmail"
										bind:value={directorEmail}
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="director@funeralhome.com"
									/>
								</div>
								<div class="md:col-span-2">
									<label for="funeralHomeName" class="mb-2 block text-sm font-medium text-gray-700">
										Funeral Home Name *
									</label>
									<input
										type="text"
										id="funeralHomeName"
										name="funeralHomeName"
										bind:value={funeralHomeName}
										required
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="Smith & Sons Funeral Home"
									/>
								</div>
							</div>
						</div>

						<!-- Service Information -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
								<Calendar class="h-5 w-5" />
								Service Information (Optional)
							</h3>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<label for="memorialDate" class="mb-2 block text-sm font-medium text-gray-700">
										Memorial Date
									</label>
									<input
										type="date"
										id="memorialDate"
										name="memorialDate"
										bind:value={memorialDate}
										min={today}
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									/>
								</div>
								<div>
									<label for="memorialTime" class="mb-2 block text-sm font-medium text-gray-700">
										Memorial Time
									</label>
									<input
										type="time"
										id="memorialTime"
										name="memorialTime"
										bind:value={memorialTime}
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									/>
								</div>
								<div>
									<label for="locationName" class="mb-2 block text-sm font-medium text-gray-700">
										Location Name
									</label>
									<input
										type="text"
										id="locationName"
										name="locationName"
										bind:value={locationName}
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="Chapel Name or Venue"
									/>
								</div>
								<div>
									<label for="locationAddress" class="mb-2 block text-sm font-medium text-gray-700">
										Location Address
									</label>
									<input
										type="text"
										id="locationAddress"
										name="locationAddress"
										bind:value={locationAddress}
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="123 Main St, City, State"
									/>
								</div>
							</div>
						</div>

						<!-- Additional Notes -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-gray-900">Additional Notes</h3>
							<div>
								<label for="additionalNotes" class="mb-2 block text-sm font-medium text-gray-700">
									Special Instructions or Notes
								</label>
								<textarea
									id="additionalNotes"
									name="additionalNotes"
									bind:value={additionalNotes}
									rows="3"
									class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									placeholder="Any special instructions or additional information..."
								></textarea>
							</div>
						</div>

						<!-- Information Box -->
						<div class="border-t pt-6">
							<div class="rounded-lg bg-blue-50 p-4">
								<div class="flex items-start gap-3">
									<AlertCircle class="h-5 w-5 text-blue-600 mt-0.5" />
									<div class="flex-1">
										<h3 class="text-sm font-semibold text-blue-800">What happens next?</h3>
										<ul class="mt-2 text-sm text-blue-700 space-y-1">
											<li>• Family account will be created with temporary password</li>
											<li>• Memorial page will be set up with the loved one's information</li>
											<li>• Welcome email with login credentials will be sent to the family</li>
											<li>• Family will have full control to customize their memorial</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</div>

					{#if form?.error}
						<div class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
							<div class="flex items-center gap-3">
								<AlertCircle class="h-5 w-5 text-red-600" />
								<p class="text-red-800">{form.error}</p>
							</div>
						</div>
					{/if}

					<!-- Submit Button -->
					<div class="mt-8 flex justify-center border-t pt-6">
						<Button
							type="submit"
							variant="role"
							role="funeral_director"
							size="lg"
							rounded="lg"
							disabled={isSubmitting}
							loading={isSubmitting}
						>
							{isSubmitting ? 'Creating Memorial...' : 'Create Family Memorial'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
