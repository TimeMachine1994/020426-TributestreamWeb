<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';

	let { data } = $props();
	let error: string | null = $state(data?.error || null);
	let isLoading = $state(true);
	let currentStep = $state('Initializing...');
	let progress = $state(0);

	const theme = getTheme('minimal');

	// Process custom token client-side with progress tracking
	onMount(async () => {
		if (data?.token) {
			console.log('🔄 Processing custom token client-side...');
			console.log('🔄 Token:', data.token.substring(0, 20) + '...');
			console.log('🔄 FullSlug:', data.fullSlug);

			try {
				// Step 1: Initialize Firebase
				currentStep = 'Connecting to Firebase...';
				progress = 20;
				const { auth } = await import('$lib/firebase');
				const { signInWithCustomToken } = await import('firebase/auth');

				// Step 2: Sign in with custom token
				currentStep = 'Authenticating your account...';
				progress = 40;
				console.log('🔄 Attempting signInWithCustomToken...');

				// Add timeout to prevent hanging
				const signInPromise = signInWithCustomToken(auth, data.token);
				const timeoutPromise = new Promise((_, reject) =>
					setTimeout(() => reject(new Error('Authentication timeout')), 10000)
				);

				const userCredential = (await Promise.race([signInPromise, timeoutPromise])) as any;
				console.log('✅ Custom token sign-in successful, user:', userCredential.user.uid);

				// Step 3: Get ID token
				currentStep = 'Securing your session...';
				progress = 60;
				console.log('🔄 Getting ID token...');
				const idToken = await userCredential.user.getIdToken();
				console.log('✅ ID token obtained, length:', idToken.length);

				// Step 4: Create session
				currentStep = 'Creating secure session...';
				progress = 80;
				console.log('🔄 Calling /api/session...');
				const response = await fetch('/api/session', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ idToken, fullSlug: data.fullSlug })
				});

				console.log('🔄 Session API response status:', response.status);
				const result = await response.json();
				console.log('🔄 Session API response:', result);

				if (response.ok) {
					console.log('✅ Session created successfully!');
					
					// Set login timestamp for booking banner tracking
					const { setLoginTimestamp } = await import('$lib/utils/bookingBanner');
					setLoginTimestamp();
					
					// Step 5: Redirect
					currentStep = 'Redirecting...';
					progress = 100;
					
					// Use SvelteKit navigation for better UX
					let redirectPath = '/profile'; // Default redirect
					
					if (data.fullSlug) {
						redirectPath = `/${data.fullSlug}`;
						console.log('🔄 Redirecting to memorial:', data.fullSlug);
					} else if (data.redirect) {
						redirectPath = `/${data.redirect}`;
						console.log('🔄 Redirecting to:', data.redirect);
					} else {
						console.log('🔄 Redirecting to profile');
					}
					
					await goto(redirectPath, { replaceState: true });
				} else {
					error = result.message || 'Failed to create session.';
					console.error('❌ Session creation failed:', result);
				}
			} catch (e: any) {
				console.error('❌ Client-side auth failed:', e);
				console.error('❌ Error details:', {
					name: e.name,
					message: e.message,
					code: e.code,
					stack: e.stack
				});

				// Provide more specific error messages
				if (e.code === 'auth/network-request-failed') {
					error =
						'Network connection failed. Please check if Firebase emulators are running properly.';
				} else if (e.code === 'auth/invalid-custom-token') {
					error = 'Invalid authentication token. Please try registering again.';
				} else if (e.message?.includes('timeout')) {
					error = 'Authentication timed out. Please check your network connection and try again.';
				} else {
					error = 'Authentication failed. Please try logging in manually.';
				}
			}
		} else if (data?.error === 'missing-token') {
			error = 'No authentication token provided.';
		} else {
			error = 'Invalid authentication data.';
		}

		isLoading = false;
	});
</script>

<div class="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100" style="font-family: {theme.font.body}">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-xl shadow-lg p-8 text-center">
			<!-- Logo/Icon -->
			<div class="mx-auto w-16 h-16 bg-gradient-to-br from-[#D5BA7F] to-[#C5AA6F] rounded-full flex items-center justify-center mb-6">
				{#if isLoading}
					<div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
				{:else if error}
					<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
					</svg>
				{:else}
					<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
					</svg>
				{/if}
			</div>

			<!-- Title -->
			<h1 class="text-2xl font-bold text-slate-900 mb-2" style="font-family: {theme.font.heading}">
				{#if error}
					Authentication Failed
				{:else if isLoading}
					Signing You In
				{:else}
					Success!
				{/if}
			</h1>

			{#if error}
				<p class="text-red-600 mb-6">{error}</p>
				<button 
					class="px-4 py-2 bg-[#D5BA7F] text-white rounded-lg hover:bg-[#C5AA6F] transition-colors"
					onclick={() => window.location.href = '/register'}
				>
					Try Again
				</button>
			{:else if isLoading}
				<!-- Progress indicator -->
				<div class="mb-6">
					<p class="text-slate-600 mb-4">{currentStep}</p>
					
					<!-- Progress bar -->
					<div class="w-full bg-slate-200 rounded-full h-2 mb-4">
						<div 
							class="bg-gradient-to-r from-[#D5BA7F] to-[#C5AA6F] h-2 rounded-full transition-all duration-500 ease-out"
							style="width: {progress}%"
						></div>
					</div>
					
					<p class="text-sm text-slate-500">Please wait while we securely authenticate your account...</p>
				</div>
			{:else}
				<p class="text-slate-600 mb-4">You're all set! Redirecting you now...</p>
			{/if}
		</div>
	</div>
</div>
