<script lang="ts">
	import { signInWithCustomToken } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Toast } from '$lib/components/minimal-modern';
	import { executeRecaptcha, RECAPTCHA_ACTIONS } from '$lib/utils/recaptcha';

	// Props to receive form data from server
	interface Props {
		form?: {
			message?: string;
			field?: string;
		};
	}
	
	let { form }: Props = $props();

	// Reactive state using Svelte 5 runes
	let error = $state<string | null>(null);
	let fieldErrors = $state<Record<string, string>>({});
	let loading = $state(false);
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let selectedRole = $state<'owner' | 'funeral_director'>('owner');
	let currentStep = $state('');
	let progress = $state(0);

	// Non-reactive constant
	const theme = getTheme('minimal');

	// Derived values using $derived() for computed properties
	const formAction = $derived(
		selectedRole === 'owner' ? '?/registerOwner' : '?/registerFuneralDirector'
	);
	
	const nameInputClass = $derived(
		fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
	);
	
	const emailInputClass = $derived(
		fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
	);
	
	const passwordInputClass = $derived(
		fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
	);

	// Handle server-side validation errors
	$effect(() => {
		if (form?.message) {
			if (form.field) {
				// Field-specific error
				fieldErrors = { [form.field]: form.message };
				error = null;
			} else {
				// General error
				error = form.message;
				fieldErrors = {};
			}
		}
	});

	const handleRegister: SubmitFunction = async ({ formData, cancel }) => {
		// Prevent double submission
		if (loading) {
			cancel();
			return;
		}
		
		loading = true;
		error = null;
		fieldErrors = {}; // Clear field errors on new submission
		currentStep = 'Verifying security...';
		progress = 10;

		// Execute reCAPTCHA BEFORE form submission
		const recaptchaAction = selectedRole === 'owner' 
			? RECAPTCHA_ACTIONS.REGISTER_OWNER 
			: RECAPTCHA_ACTIONS.REGISTER_FUNERAL_DIRECTOR;
		
		try {
			const recaptchaToken = await executeRecaptcha(recaptchaAction);
			
			if (!recaptchaToken) {
				error = 'Security verification failed. Please try again.';
				loading = false;
				currentStep = '';
				progress = 0;
				cancel();
				return;
			}

			// Add reCAPTCHA token to form data
			formData.append('recaptchaToken', recaptchaToken);
			
			currentStep = 'Creating your account...';
			progress = 30;
		} catch (err) {
			error = 'Security verification failed. Please try again.';
			loading = false;
			currentStep = '';
			progress = 0;
			cancel();
			return;
		}

		return async ({ result, update }) => {
			if (result.type === 'success' && result.data?.customToken) {
				try {
					// Navigate to session page with token for better UX
					currentStep = 'Setting up your account...';
					progress = 80;
					
					// Use SvelteKit navigation to session page
					// Funeral directors go to complete their profile, owners go directly to profile
					const redirectUrl = selectedRole === 'owner' 
						? `/auth/session?token=${result.data.customToken}&redirect=profile`
						: `/auth/session?token=${result.data.customToken}&redirect=register/funeral-director`;
					
					currentStep = 'Redirecting...';
					progress = 100;
					
					// Small delay for visual feedback
					setTimeout(async () => {
						await goto(redirectUrl, { replaceState: true });
					}, 500);
					
				} catch (err: any) {
					error = err.message;
					loading = false;
					currentStep = '';
					progress = 0;
				}
			} else if (result.type === 'failure') {
				// Handle field-specific errors
				if (result.data?.field && result.data?.message) {
					fieldErrors = { [result.data.field]: result.data.message };
					error = null;
				} else {
					error = result.data?.message ?? 'Registration failed.';
					fieldErrors = {};
				}
				loading = false;
				currentStep = '';
				progress = 0;
			} else if (result.type === 'error') {
				error = result.error.message;
				loading = false;
				currentStep = '';
				progress = 0;
			}
			// We call update to avoid a full-page reload and apply the action result.
			// Since we handle navigation manually with `goto`, we don't need SvelteKit to do anything else.
			await update({ reset: false });
		};
	};
</script>

<div class="{theme.root} min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style="font-family: {theme.font.body}">
	<!-- Background decoration -->
	<div class="{theme.hero.decoration}" aria-hidden="true"></div>
	
	<div class="relative z-10 w-full max-w-md">
		<div class="text-center mb-8">
			<h2 class="text-3xl font-extrabold {theme.hero.heading}" style="font-family: {theme.font.heading}">
				Create your account
			</h2>
			<p class="mt-2 text-sm {theme.hero.sub}">
				Join Tributestream to create meaningful memorial experiences
			</p>
		</div>

		<Card theme="minimal" class="p-8">
			<form class="space-y-6" method="POST" action={formAction} use:enhance={handleRegister}>
				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium {theme.text} mb-1">
							Full Name
						</label>
						<Input
							id="name"
							name="name"
							type="text"
							autocomplete="name"
							required
							placeholder="Enter your full name"
							theme="minimal"
							bind:value={name}
							class={nameInputClass}
						/>
						{#if fieldErrors.name}
							<p class="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
						{/if}
					</div>

					<div>
						<label for="email-address" class="block text-sm font-medium {theme.text} mb-1">
							Email address
						</label>
						<Input
							id="email-address"
							name="email"
							type="email"
							autocomplete="email"
							required
							placeholder="Enter your email"
							theme="minimal"
							bind:value={email}
							class={emailInputClass}
						/>
						{#if fieldErrors.email}
							<p class="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
						{/if}
					</div>
					
					<div>
						<label for="password" class="block text-sm font-medium {theme.text} mb-1">
							Password
						</label>
						<Input
							id="password"
							name="password"
							type="password"
							autocomplete="new-password"
							required
							placeholder="Create a secure password"
							theme="minimal"
							bind:value={password}
							class={passwordInputClass}
						/>
						{#if fieldErrors.password}
							<p class="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
						{/if}
					</div>

					<!-- Role Selection -->
					<div>
						<label class="block text-sm font-medium {theme.text} mb-3">
							I want to:
						</label>
						<div class="space-y-3">
							<label 
								class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedRole === 'owner' ? 'border-[#D5BA7F] bg-[#D5BA7F]/5' : 'border-gray-300'}"
							>
								<input
									type="radio"
									name="role"
									value="owner"
									bind:group={selectedRole}
									class="sr-only"
								/>
								<div class="flex items-center space-x-3">
									<div class="w-4 h-4 rounded-full border-2 flex items-center justify-center {selectedRole === 'owner' ? 'border-[#D5BA7F] bg-[#D5BA7F]' : 'border-gray-300'}">
										{#if selectedRole === 'owner'}
											<div class="w-2 h-2 rounded-full bg-white"></div>
										{/if}
									</div>
									<div>
										<div class="font-medium text-gray-900">Create a memorial for my loved one</div>
										<div class="text-sm text-gray-600">Register as memorial owner</div>
									</div>
								</div>
							</label>
							
							<label 
								class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors {selectedRole === 'funeral_director' ? 'border-[#D5BA7F] bg-[#D5BA7F]/5' : 'border-gray-300'}"
							>
								<input
									type="radio"
									name="role"
									value="funeral_director"
									bind:group={selectedRole}
									class="sr-only"
								/>
								<div class="flex items-center space-x-3">
									<div class="w-4 h-4 rounded-full border-2 flex items-center justify-center {selectedRole === 'funeral_director' ? 'border-[#D5BA7F] bg-[#D5BA7F]' : 'border-gray-300'}">
										{#if selectedRole === 'funeral_director'}
											<div class="w-2 h-2 rounded-full bg-white"></div>
										{/if}
									</div>
									<div>
										<div class="font-medium text-gray-900">Create and manage memorials</div>
										<div class="text-sm text-gray-600">Register as funeral director</div>
									</div>
								</div>
							</label>
						</div>
					</div>
				</div>

				{#if error}
					<Toast theme="minimal" message={error} type="error" />
				{/if}

				<div class="pt-4">
					{#if loading && currentStep}
						<!-- Progress indicator -->
						<div class="mb-4">
							<p class="text-sm text-slate-600 mb-2">{currentStep}</p>
							<div class="w-full bg-slate-200 rounded-full h-2">
								<div 
									class="bg-gradient-to-r from-[#D5BA7F] to-[#C5AA6F] h-2 rounded-full transition-all duration-500 ease-out"
									style="width: {progress}%"
								></div>
							</div>
						</div>
					{/if}
					
					<Button
						type="submit"
						disabled={loading}
						theme="minimal"
						class="w-full {loading ? 'opacity-75' : ''}"
					>
						{#if loading}
							<div class="flex items-center justify-center">
								<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
								{currentStep || 'Creating Account...'}
							</div>
						{:else}
							Create Account
						{/if}
					</Button>
				</div>

				<div class="text-center">
					<p class="text-sm {theme.hero.sub}">
						Already have an account? 
						<a href="/login" class="{theme.link} font-medium">Sign in</a>
					</p>
				</div>
			</form>
		</Card>

		<!-- Additional features section -->
		<div class="mt-8 text-center">
			<div class="grid grid-cols-3 gap-4 text-xs {theme.hero.sub}">
				<div class="flex flex-col items-center">
					<div class="w-8 h-8 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center mb-2">
						🔒
					</div>
					<span>Secure</span>
				</div>
				<div class="flex flex-col items-center">
					<div class="w-8 h-8 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center mb-2">
						📱
					</div>
					<span>Mobile Ready</span>
				</div>
				<div class="flex flex-col items-center">
					<div class="w-8 h-8 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center mb-2">
						💝
					</div>
					<span>Compassionate</span>
				</div>
			</div>
		</div>
	</div>
</div>
