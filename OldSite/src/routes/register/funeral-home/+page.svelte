<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/firebase';
	import { signInWithCustomToken, getIdToken } from 'firebase/auth';
	import {
		Building2,
		User,
		Mail,
		Phone,
		MapPin,
		FileText,
		Shield,
		Award,
		CheckCircle,
		Save,
		ArrowRight,
		Sparkles
	} from 'lucide-svelte';
	import { useFormAutoSave } from '$lib/composables/useFormAutoSave';
	import { Button } from '$lib/ui';

	let {
		form
	}: { form?: { error?: any; success?: boolean; message?: string; applicationId?: string } } =
		$props();

	// Form state using Svelte 5 runes
	let companyName = $state('');
	let contactPerson = $state('');
	let email = $state('');
	let password = $state('');
	let phone = $state('');
	let address = $state({
		street: '',
		city: '',
		state: '',
		zipCode: '',
		country: 'United States'
	});
	let website = $state('');

	// UI states
	let isSubmitting = $state(false);

	// Initialize auto-save functionality
	const autoSave = useFormAutoSave({
		storageKey: 'funeral-home-registration',
		debounceMs: 3000,
		useLocalStorage: false, // Use cookies for better persistence
		cookieExpireDays: 30,
		onSave: (data) => console.log('🏥 [AUTO-SAVE] Funeral home form data saved'),
		onLoad: (data) => {
			if (data) {
				console.log('🏥 [AUTO-SAVE] Loading saved funeral home data');
				// Restore form fields from saved data
				companyName = data.companyName || '';
				contactPerson = data.contactPerson || '';
				email = data.email || '';
				password = data.password || '';
				phone = data.phone || '';
				address = data.address || {
					street: '',
					city: '',
					state: '',
					zipCode: '',
					country: 'United States'
				};
				website = data.website || '';
			}
		}
	});

	// Auto-save form data when fields change
	$effect(() => {
		const formData = {
			companyName,
			contactPerson,
			email,
			password,
			phone,
			address,
			website
		};

		// Only auto-save if we have some meaningful data
		if (companyName || contactPerson || email) {
			autoSave.triggerAutoSave(formData);
		}
	});

	// Load saved data on component mount
	$effect(() => {
		autoSave.loadFromStorage();
	});

	// Check if form was successfully submitted and handle auto-login
	$effect(() => {
		if (form?.success && form?.customToken) {
			const performAutoLogin = async () => {
				isSubmitting = true;
				try {
					console.log('Custom token received, attempting auto-login...');
					const userCredential = await signInWithCustomToken(auth, form.customToken);
					const idToken = await getIdToken(userCredential.user);

					// Post the ID token to the login action to create a session
					const loginFormData = new FormData();
					loginFormData.append('idToken', idToken);

					const loginResponse = await fetch('/login?/login', {
						method: 'POST',
						body: loginFormData
					});

					if (!loginResponse.ok) {
						throw new Error('Session creation failed.');
					}

					console.log('Auto-login successful, redirecting to profile...');
					autoSave.clearStorage(); // Clear data before navigating
					window.location.href = '/profile'; // Use full page reload
				} catch (error) {
					console.error('Auto-login process failed:', error);
					// If auto-login fails, send user to the manual login page as a fallback
					alert(
						'Your account was created, but we could not log you in automatically. Please log in manually.'
					);
					await goto('/login');
				} finally {
					isSubmitting = false;
				}
			};
			performAutoLogin();
		}
	});
</script>

<svelte:head>
	<title>Register Your Funeral Home - Tributestream</title>
	<meta
		name="description"
		content="Join Tributestream's network of professional funeral directors and provide families with beautiful memorial experiences."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 to-white">
	<div class="container mx-auto px-4 py-12">
		<!-- Header -->
		<div class="mb-12 text-center">
			<div
				class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-yellow-600 to-amber-600"
			>
				<Building2 class="h-8 w-8 text-white" />
			</div>
			<h1 class="mb-4 text-4xl font-bold text-gray-900">Register Your Funeral Home</h1>
			<p class="mx-auto max-w-2xl text-xl text-gray-600">
				Join Tributestream's network of professional funeral directors and provide families with
				beautiful, lasting memorial experiences.
			</p>
		</div>

		<!-- Form -->
		<div class="mx-auto max-w-4xl">
			<div class="rounded-2xl bg-white p-8 shadow-xl">
				<!-- Auto-save Status Indicator -->
				{#if autoSave.hasSavedData()}
					<div
						class="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3"
					>
						<Save class="h-4 w-4 text-green-600" />
						<div class="flex-1">
							<p class="text-sm font-medium text-green-800">Form data auto-saved</p>
							<p class="text-xs text-green-600">
								Last saved: {autoSave.getLastSaveTime()?.toLocaleString() || 'Recently'}
							</p>
						</div>
						<button
							type="button"
							onclick={() => autoSave.clearStorage()}
							class="text-xs text-green-600 underline hover:text-green-800"
						>
							Clear saved data
						</button>
					</div>
				{/if}
				<form
					method="POST"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update({ reset: false });
							isSubmitting = false;
						};
					}}
				>
					<div class="space-y-6">
						<div class="mb-8 text-center">
							<h2 class="mb-2 text-2xl font-bold text-gray-900">Account & Business Information</h2>
							<p class="text-gray-600">Create your account and tell us about your funeral home.</p>
						</div>

						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div>
								<label for="companyName" class="mb-2 block text-sm font-medium text-gray-700">
									<Building2 class="mr-1 inline h-4 w-4" />
									Funeral Home Name *
								</label>
								<input
									type="text"
									id="companyName"
									name="companyName"
									bind:value={companyName}
									onchange={(e) => (companyName = e.currentTarget.value)}
									required
									class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									placeholder="Smith & Sons Funeral Home"
								/>
							</div>

							<div>
								<label for="password" class="mb-2 block text-sm font-medium text-gray-700">
									<Shield class="mr-1 inline h-4 w-4" />
									Password *
								</label>
								<input
									type="password"
									id="password"
									name="password"
									bind:value={password}
									onchange={(e) => (password = e.currentTarget.value)}
									required
									minlength="6"
									class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									placeholder="Choose a secure password"
								/>
							</div>

							<div>
								<label for="contactPerson" class="mb-2 block text-sm font-medium text-gray-700">
									<User class="mr-1 inline h-4 w-4" />
									Primary Contact Name *
								</label>
								<input
									type="text"
									id="contactPerson"
									name="contactPerson"
									bind:value={contactPerson}
									onchange={(e) => (contactPerson = e.currentTarget.value)}
									required
									class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									placeholder="John Smith"
								/>
							</div>

							<div>
								<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
									<Mail class="mr-1 inline h-4 w-4" />
									Email Address *
								</label>
								<input
									type="email"
									id="email"
									name="email"
									bind:value={email}
									onchange={(e) => (email = e.currentTarget.value)}
									required
									class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									placeholder="john@smithfuneralhome.com"
								/>
							</div>

							<div>
								<label for="phone" class="mb-2 block text-sm font-medium text-gray-700">
									<Phone class="mr-1 inline h-4 w-4" />
									Phone Number *
								</label>
								<input
									type="tel"
									id="phone"
									name="phone"
									bind:value={phone}
									onchange={(e) => (phone = e.currentTarget.value)}
									required
									class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
									placeholder="(555) 123-4567"
								/>
							</div>
						</div>

						<!-- Address Section -->
						<div class="border-t pt-6">
							<h3 class="mb-4 flex items-center text-lg font-semibold text-gray-900">
								<MapPin class="mr-2 h-5 w-5" />
								Business Address
							</h3>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="md:col-span-2">
									<input
										type="text"
										name="address.street"
										bind:value={address.street}
										onchange={(e) => (address.street = e.currentTarget.value)}
										required
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="Street Address"
									/>
								</div>
								<div>
									<input
										type="text"
										name="address.city"
										bind:value={address.city}
										onchange={(e) => (address.city = e.currentTarget.value)}
										required
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="City"
									/>
								</div>
								<div>
									<input
										type="text"
										name="address.state"
										bind:value={address.state}
										onchange={(e) => (address.state = e.currentTarget.value)}
										required
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="State"
									/>
								</div>
								<div>
									<input
										type="text"
										name="address.zipCode"
										bind:value={address.zipCode}
										onchange={(e) => (address.zipCode = e.currentTarget.value)}
										required
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="ZIP Code"
									/>
								</div>
								<div>
									<input
										type="text"
										name="address.country"
										bind:value={address.country}
										onchange={(e) => (address.country = e.currentTarget.value)}
										class="w-full rounded-xl border border-gray-200 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-yellow-500"
										placeholder="Country"
									/>
								</div>
							</div>
						</div>
					</div>

					{#if form?.error}
						<div class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
							<p class="text-red-800">❌ {form.error}</p>
						</div>
					{/if}

					<!-- Navigation Buttons -->
					<div class="mt-8 flex justify-end border-t pt-6">
						<Button
							type="submit"
							variant="role"
							role="funeral_director"
							size="lg"
							rounded="lg"
							disabled={isSubmitting}
							loading={isSubmitting}
						>
							{isSubmitting ? 'Creating Account...' : 'Create Account & Get Started'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div>
