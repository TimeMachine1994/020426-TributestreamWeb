<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button, Input, Card, Toast } from '$lib/components/minimal-modern';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-svelte';

	const theme = getTheme('minimal');
	
	let token = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);
	let tokenValid = $state(false);
	let checkingToken = $state(true);

	onMount(async () => {
		token = $page.url.searchParams.get('token') || '';
		
		if (!token) {
			error = 'Invalid or missing reset token.';
			checkingToken = false;
			return;
		}

		// Validate token
		try {
			const response = await fetch('/api/validate-reset-token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			const result = await response.json();
			
			if (response.ok && result.valid) {
				tokenValid = true;
			} else {
				error = result.error || 'Invalid or expired reset token.';
			}
		} catch (e) {
			error = 'Error validating reset token.';
		}
		
		checkingToken = false;
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		
		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		if (newPassword.length < 6) {
			error = 'Password must be at least 6 characters long.';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/reset-password-confirm', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					token, 
					newPassword 
				})
			});

			const result = await response.json();

			if (response.ok) {
				success = true;
				setTimeout(() => {
					goto('/login');
				}, 3000);
			} else {
				error = result.error || 'Failed to reset password.';
			}
		} catch (e) {
			error = 'An error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - Tributestream</title>
</svelte:head>

<div class="{theme.root} min-h-screen flex items-center justify-center py-12 px-4" style="font-family: {theme.font.body}">
	<div class="max-w-md w-full">
		<Card title="Reset Password" theme="minimal" class="p-8">
			{#if checkingToken}
				<div class="text-center">
					<p class="text-gray-600">Validating reset token...</p>
				</div>
			{:else if !tokenValid}
				<div class="text-center">
					<h2 class="text-2xl font-bold text-red-600 mb-4">Invalid Token</h2>
					<p class="text-gray-600 mb-6">{error}</p>
					<Button theme="minimal" onclick={() => goto('/login')}>
						Back to Login
					</Button>
				</div>
			{:else if success}
				<div class="text-center">
					<CheckCircle class="h-16 w-16 text-green-500 mx-auto mb-4" />
					<h2 class="text-2xl font-bold text-green-600 mb-4">Password Reset Successful!</h2>
					<p class="text-gray-600 mb-6">Your password has been updated. Redirecting to login...</p>
				</div>
			{:else}
				<div class="text-center mb-6">
					<h2 class="text-2xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
						Create New Password
					</h2>
					<p class="mt-2 text-sm {theme.hero.sub}">
						Enter your new password below
					</p>
				</div>

				{#if error}
					<Toast theme="minimal" message={error} type="error" class="mb-6" />
				{/if}

				<form onsubmit={handleSubmit} class="space-y-6">
					<div>
						<label for="newPassword" class="block text-sm font-medium {theme.text} mb-2">
							New Password
						</label>
						<div class="relative">
							<Input
								id="newPassword"
								type={showNewPassword ? 'text' : 'password'}
								bind:value={newPassword}
								required
								placeholder="Enter new password"
								theme="minimal"
								class="pl-10 pr-10"
							/>
							<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 {theme.hero.sub}" />
							<button
								type="button"
								onclick={() => showNewPassword = !showNewPassword}
								class="absolute right-3 top-1/2 transform -translate-y-1/2 {theme.hero.sub} hover:text-[#D5BA7F]"
							>
								{#if showNewPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-medium {theme.text} mb-2">
							Confirm New Password
						</label>
						<div class="relative">
							<Input
								id="confirmPassword"
								type={showConfirmPassword ? 'text' : 'password'}
								bind:value={confirmPassword}
								required
								placeholder="Confirm new password"
								theme="minimal"
								class="pl-10 pr-10"
							/>
							<Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 {theme.hero.sub}" />
							<button
								type="button"
								onclick={() => showConfirmPassword = !showConfirmPassword}
								class="absolute right-3 top-1/2 transform -translate-y-1/2 {theme.hero.sub} hover:text-[#D5BA7F]"
							>
								{#if showConfirmPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<Button
						type="submit"
						theme="minimal"
						class="w-full"
						disabled={loading}
					>
						{#if loading}
							Updating Password...
						{:else}
							Update Password
						{/if}
					</Button>
				</form>
			{/if}
		</Card>
	</div>
</div>
