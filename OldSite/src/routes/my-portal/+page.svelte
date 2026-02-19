<!-- This page should never be rendered as it redirects in +page.server.ts -->
<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Fallback client-side redirect if server redirect fails
		goto('/profile');
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-amber-600"></div>
		<p class="text-gray-600">Redirecting to your profile...</p>
	</div>
</div>
