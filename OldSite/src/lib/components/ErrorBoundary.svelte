<script lang="ts">
	import { onMount } from 'svelte';
	import { AlertTriangle, RefreshCw, Home } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	interface Props {
		fallback?: boolean;
		showRetry?: boolean;
		showHome?: boolean;
		errorTitle?: string;
		errorMessage?: string;
	}

	let {
		fallback = false,
		showRetry = true,
		showHome = true,
		errorTitle = 'Something went wrong',
		errorMessage = 'An unexpected error occurred. Please try again.'
	}: Props = $props();

	let error = $state<Error | null>(null);
	let errorInfo = $state<string>('');
	let retrying = $state(false);

	// Global error handler
	onMount(() => {
		const handleError = (event: ErrorEvent) => {
			console.error('Global error caught:', event.error);
			error = event.error;
			errorInfo = event.error?.stack || 'No stack trace available';
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			console.error('Unhandled promise rejection:', event.reason);
			error = new Error(event.reason?.message || 'Unhandled promise rejection');
			errorInfo = event.reason?.stack || 'No stack trace available';
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});

	async function retry() {
		retrying = true;
		try {
			// Clear error state
			error = null;
			errorInfo = '';

			// Reload the page
			window.location.reload();
		} catch (err) {
			console.error('Retry failed:', err);
		} finally {
			retrying = false;
		}
	}

	function goHome() {
		goto('/');
	}

	// Log error for monitoring
	$effect(() => {
		if (error) {
			// In production, send to error monitoring service
			console.error('Error boundary caught:', {
				error: error.message,
				stack: errorInfo,
				timestamp: new Date().toISOString(),
				userAgent: navigator.userAgent,
				url: window.location.href
			});
		}
	});
</script>

{#if error || fallback}
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4"
	>
		<div class="w-full max-w-md">
			<div class="rounded-2xl bg-white p-8 text-center shadow-xl">
				<!-- Error Icon -->
				<div
					class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100"
				>
					<AlertTriangle class="h-8 w-8 text-red-600" />
				</div>

				<!-- Error Title -->
				<h1 class="mb-4 text-2xl font-bold text-gray-900">
					{errorTitle}
				</h1>

				<!-- Error Message -->
				<p class="mb-8 text-gray-600">
					{errorMessage}
				</p>

				<!-- Error Details (Development) -->
				{#if error && import.meta.env.DEV}
					<details class="mb-6 text-left">
						<summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
							Technical Details
						</summary>
						<div
							class="mt-2 max-h-32 overflow-auto rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-700"
						>
							<div class="mb-1 font-semibold">{error.message}</div>
							<div class="whitespace-pre-wrap">{errorInfo}</div>
						</div>
					</details>
				{/if}

				<!-- Action Buttons -->
				<div class="flex flex-col gap-3 sm:flex-row">
					{#if showRetry}
						<button
							onclick={retry}
							disabled={retrying}
							class="inline-flex flex-1 items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<RefreshCw class="mr-2 h-4 w-4 {retrying ? 'animate-spin' : ''}" />
							{retrying ? 'Retrying...' : 'Try Again'}
						</button>
					{/if}

					{#if showHome}
						<button
							onclick={goHome}
							class="inline-flex flex-1 items-center justify-center rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
						>
							<Home class="mr-2 h-4 w-4" />
							Go Home
						</button>
					{/if}
				</div>

				<!-- Help Text -->
				<p class="mt-6 text-xs text-gray-500">
					If this problem persists, please contact support with the error details above.
				</p>
			</div>
		</div>
	</div>
{:else}
	<slot />
{/if}

<style>
	/* Ensure error boundary takes full height */
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
