<script lang="ts">
	import { signInWithCustomToken } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let error: string | null = null;
	let loading = false;

	const handleRegister: SubmitFunction = () => {
		loading = true;
		error = null;

		return async ({ result, update }) => {
			if (result.type === 'success' && result.data?.customToken) {
				try {
					// Step 2: Sign in with the custom token
					const userCredential = await signInWithCustomToken(auth, result.data.customToken);
					const user = userCredential.user;

					// Step 3: Get the ID token
					const idToken = await user.getIdToken();

					// Step 4: Call the session API endpoint
					const sessionResponse = await fetch('/api/session', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ idToken })
					});

					if (!sessionResponse.ok) {
						throw new Error('Failed to create session');
					}

					// Step 5: Redirect to the home page
					await goto('/');
				} catch (err: any) {
					error = err.message;
				}
			} else if (result.type === 'failure') {
				error = result.data?.message ?? 'Registration failed.';
			} else if (result.type === 'error') {
				error = result.error.message;
			}

			loading = false;
			// We call update to avoid a full-page reload and apply the action result.
			// Since we handle navigation manually with `goto`, we don't need SvelteKit to do anything else.
			await update({ reset: false });
		};
	};
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
		</div>
		<form class="mt-8 space-y-6" method="POST" action="?/register" use:enhance={handleRegister}>
			<div class="-space-y-px rounded-md shadow-sm">
				<div>
					<label for="email-address" class="sr-only">Email address</label>
					<input
						id="email-address"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="Email address"
					/>
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						class="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="Password"
					/>
				</div>
			</div>

			{#if error}
				<p class="text-sm text-red-500">{error}</p>
			{/if}

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				>
					{loading ? 'Registering...' : 'Register'}
				</button>
			</div>
		</form>
	</div>
</div>
