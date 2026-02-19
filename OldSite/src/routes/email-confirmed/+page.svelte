<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { CheckCircle, ArrowRight } from 'lucide-svelte';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		// Redirect to profile settings after 5 seconds
		setTimeout(() => {
			goto('/profile/settings');
		}, 5000);
	});
</script>

<svelte:head>
	<title>Email Confirmed | Tributestream</title>
	<meta name="description" content="Your email change has been confirmed successfully" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
	<div class="max-w-md w-full">
		<div class="bg-white rounded-3xl shadow-2xl p-8 text-center {mounted ? 'animate-fade-in-up' : 'opacity-0'}">
			<!-- Success Icon -->
			<div class="mb-6">
				<div class="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
					<CheckCircle class="w-10 h-10 text-green-600" />
				</div>
			</div>

			<!-- Success Message -->
			<h1 class="text-2xl font-bold text-gray-900 mb-4">Email Confirmed!</h1>
			<p class="text-gray-600 mb-6">
				Your email address has been successfully updated. You can now use your new email address to log in.
			</p>

			<!-- Action Button -->
			<a 
				href="/profile/settings"
				class="inline-flex items-center justify-center w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium py-3 px-6 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 hover:scale-105 hover:shadow-lg"
			>
				Return to Settings
				<ArrowRight class="ml-2 h-4 w-4" />
			</a>

			<!-- Auto-redirect notice -->
			<p class="text-sm text-gray-500 mt-4">
				You'll be automatically redirected in 5 seconds...
			</p>
		</div>
	</div>
</div>

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
</style>
