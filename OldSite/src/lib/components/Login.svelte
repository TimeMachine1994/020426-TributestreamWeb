<script lang="ts">
	import {
		signInWithEmailAndPassword,
		signInWithPopup,
		GoogleAuthProvider
	} from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-svelte';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Toast } from '$lib/components/minimal-modern';

	let email = $state('');
	let password = $state('');
	let error: string | null = $state(null);
	let loading = $state(false);
	let showPassword = $state(false);
	let showPasswordReset = $state(false);
	let resetEmail = $state('');
	let resetSuccess = $state(false);
	let resetLoading = $state(false);

	const theme = getTheme('minimal');

	async function createSession(idToken: string) {
		const response = await fetch('/api/session', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ idToken })
		});

		if (response.ok) {
			// Set login timestamp for booking banner tracking
			const { setLoginTimestamp } = await import('$lib/utils/bookingBanner');
			setLoginTimestamp();
			
			const result = await response.json();
			if (result.redirectTo) {
				// Use window.location.href to avoid race condition with session cookie
				window.location.href = result.redirectTo;
			} else {
				window.location.href = '/';
			}
		} else {
			throw new Error('Failed to create session.');
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		loading = true;
		error = null;

		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const idToken = await userCredential.user.getIdToken();
			await createSession(idToken);
		} catch (e: any) {
			error = e.message;
			console.error('[Login.svelte] An error occurred during login:', e);
		} finally {
			loading = false;
		}
	}

	async function handleGoogleSignIn() {
		loading = true;
		error = null;

		try {
			const provider = new GoogleAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			const idToken = await userCredential.user.getIdToken();
			await createSession(idToken);
		} catch (e: any) {
			error = e.message;
			console.error('[Login.svelte] An error occurred during Google sign-in:', e);
		} finally {
			loading = false;
		}
	}

	async function handlePasswordReset(event: SubmitEvent) {
		event.preventDefault();
		resetLoading = true;
		error = null;

		try {
			console.log('[Login.svelte] Attempting password reset for:', resetEmail);
			
			// Use custom SendGrid-based password reset API
			const response = await fetch('/api/password-reset', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email: resetEmail })
			});

			const result = await response.json();

			if (response.ok) {
				console.log('[Login.svelte] Password reset email sent successfully');
				resetSuccess = true;
			} else {
				error = result.error || 'Failed to send password reset email.';
			}
		} catch (e: any) {
			console.error('[Login.svelte] Password reset error:', e);
			error = 'An error occurred while sending the password reset email. Please try again.';
		} finally {
			resetLoading = false;
		}
	}

	function showResetForm() {
		showPasswordReset = true;
		resetEmail = email; // Pre-fill with login email if available
		error = null;
		resetSuccess = false;
	}

	function hideResetForm() {
		showPasswordReset = false;
		resetEmail = '';
		error = null;
		resetSuccess = false;
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
</script>

<svelte:head>
	<title>Sign In - Tributestream</title>
	<meta name="description" content="Sign in to your Tributestream account to manage memorial services and connect with families." />
</svelte:head>

<div class="{theme.root} min-h-screen flex items-center justify-center py-12 px-4" style="font-family: {theme.font.body}">
	<div class="max-w-md w-full">
		{#if !showPasswordReset}
			<!-- Main Login Form -->
			<Card title="Welcome Back" theme="minimal" class="p-8">
				<div class="text-center mb-6">
					<h2 class="text-2xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
						Sign In to Tributestream
					</h2>
					<p class="mt-2 text-sm {theme.hero.sub}">
						Access your memorial services and connect with families
					</p>
				</div>

				{#if error}
					<Toast theme="minimal" message={error} type="error" class="mb-6" />
				{/if}

				<form onsubmit={handleSubmit} class="space-y-6">
					<div>
						<label for="email" class="block text-sm font-medium {theme.text} mb-2">
							Email Address
						</label>
						<div class="relative">
							<Input
								id="email"
								type="email"
								bind:value={email}
								required
								placeholder="your@email.com"
								theme="minimal"
								class="pl-10"
							/>
							<Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 {theme.hero.sub}" />
						</div>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium {theme.text} mb-2">
							Password
						</label>
						<div class="relative">
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								required
								placeholder="Enter your password"
								theme="minimal"
								class="pl-10 pr-10"
							/>
							<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 {theme.hero.sub}" />
							<button
								type="button"
								onclick={togglePasswordVisibility}
								class="absolute right-3 top-1/2 transform -translate-y-1/2 {theme.hero.sub} hover:text-[#D5BA7F]"
							>
								{#if showPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<label class="flex items-center">
							<input type="checkbox" class="h-4 w-4 text-[#D5BA7F] focus:ring-[#D5BA7F] border-gray-300 rounded" />
							<span class="ml-2 text-sm {theme.hero.sub}">Remember me</span>
						</label>
						<button
							type="button"
							onclick={() => showPasswordReset = true}
							class="text-sm text-[#D5BA7F] hover:underline"
						>
							Forgot password?
						</button>
					</div>

					<!-- Sign In Button -->
					<Button
						type="submit"
						theme="minimal"
						class="w-full flex items-center justify-center"
						disabled={loading}
					>
						{#if loading}
							<span>Signing In...</span>
						{:else}
							<LogIn class="h-4 w-4 mr-2 inline-block" />
							<span>Sign In</span>
						{/if}
					</Button>
				</form>

				<!-- Divider -->
				<div class="mt-6">
					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-gray-300"></div>
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="px-2 bg-white {theme.hero.sub}">Or continue with</span>
						</div>
					</div>

					<!-- Google Sign In Button -->
					<Button
						type="button"
						variant="secondary"
						theme="minimal"
						class="w-full mt-4 flex items-center justify-center"
						onclick={handleGoogleSignIn}
						disabled={loading}
					>
						<svg class="h-4 w-4 mr-2 inline-block" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						<span>Sign in with Google</span>
					</Button>
				</div>

				<div class="mt-6 text-center">
					<p class="text-sm {theme.hero.sub}">
						Don't have an account?
						<a href="/register" class="font-medium text-[#D5BA7F] hover:underline">
							Create Account
						</a>
					</p>
				</div>
			</Card>
		{:else}
			<!-- Password Reset Form -->
			<Card title="Reset Password" theme="minimal" class="p-8">
				<div class="text-center mb-6">
					<button
						onclick={() => showPasswordReset = false}
						class="inline-flex items-center text-sm text-[#D5BA7F] hover:underline mb-4"
					>
						<ArrowLeft class="h-4 w-4 mr-1" />
						Back to Sign In
					</button>
					<h2 class="text-2xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
						Reset Your Password
					</h2>
					<p class="mt-2 text-sm {theme.hero.sub}">
						Enter your email address and we'll send you a link to reset your password
					</p>
				</div>

				{#if error}
					<Toast theme="minimal" message={error} type="error" class="mb-6" />
				{/if}

				{#if resetSuccess}
					<Toast theme="minimal" message="Password reset email sent! Check your inbox." type="success" class="mb-6" />
				{/if}

				<form onsubmit={handlePasswordReset} class="space-y-6">
					<div>
						<label for="reset-email" class="block text-sm font-medium {theme.text} mb-2">
							Email Address
						</label>
						<div class="relative">
							<Input
								id="reset-email"
								type="email"
								bind:value={resetEmail}
								required
								placeholder="your@email.com"
								theme="minimal"
								class="pl-10"
							/>
							<Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 {theme.hero.sub}" />
						</div>
					</div>

					<Button
						type="submit"
						theme="minimal"
						class="w-full"
						disabled={resetLoading}
					>
						{#if resetLoading}
							Sending Reset Email...
						{:else}
							Send Reset Email
						{/if}
					</Button>
				</form>
			</Card>
		{/if}
	</div>
</div>
