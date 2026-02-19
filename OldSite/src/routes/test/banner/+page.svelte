<script lang="ts">
	import { onMount } from 'svelte';
	import { setLoginTimestamp, clearBannerState, debugBannerState } from '$lib/utils/bookingBanner';

	let testMemorialId = $state('test-memorial-123');
	let debugOutput = $state('');

	function setRecentLogin() {
		setLoginTimestamp();
		updateDebugOutput();
	}

	function clearState() {
		clearBannerState();
		updateDebugOutput();
	}

	function updateDebugOutput() {
		if (typeof window !== 'undefined') {
			const sessionKeys = Object.keys(sessionStorage);
			const bannerKeys = sessionKeys.filter(k => k.includes('banner') || k.includes('login'));
			
			debugOutput = JSON.stringify({
				loginTimestamp: sessionStorage.getItem('login-timestamp'),
				bannerSeen: sessionStorage.getItem(`memorial-booking-banner-seen-${testMemorialId}`),
				allBannerKeys: bannerKeys,
				currentTime: Date.now()
			}, null, 2);
		}
	}

	onMount(() => {
		updateDebugOutput();
	});
</script>

<svelte:head>
	<title>Banner Test - Tributestream</title>
</svelte:head>

<div class="container mx-auto p-8 max-w-4xl">
	<h1 class="text-3xl font-bold mb-6">Booking Banner Test Page</h1>
	
	<div class="grid gap-6 md:grid-cols-2">
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Test Controls</h2>
			
			<div class="space-y-2">
				<label class="block">
					<span class="text-sm font-medium">Memorial ID:</span>
					<input 
						bind:value={testMemorialId}
						class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
						placeholder="test-memorial-123"
					/>
				</label>
			</div>
			
			<div class="space-y-2">
				<button 
					onclick={setRecentLogin}
					class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
				>
					Set Recent Login (Enable Banner)
				</button>
				
				<button 
					onclick={clearState}
					class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
				>
					Clear All Banner State
				</button>
				
				<button 
					onclick={updateDebugOutput}
					class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					Refresh Debug Info
				</button>
			</div>
		</div>
		
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Session Storage Debug</h2>
			<pre class="bg-gray-100 p-4 rounded-md text-sm overflow-auto">{debugOutput}</pre>
		</div>
	</div>
	
	<div class="mt-8 p-4 bg-blue-50 rounded-md">
		<h3 class="font-semibold mb-2">Testing Instructions:</h3>
		<ol class="list-decimal list-inside space-y-1 text-sm">
			<li>Click "Set Recent Login" to simulate a fresh login</li>
			<li>Navigate to a memorial page where you are the owner</li>
			<li>The banner should appear after 3 seconds</li>
			<li>Use "Clear All Banner State" to reset for testing</li>
		</ol>
	</div>
	
	<div class="mt-4 p-4 bg-yellow-50 rounded-md">
		<h3 class="font-semibold mb-2">Banner Display Conditions:</h3>
		<ul class="list-disc list-inside space-y-1 text-sm">
			<li>User must be logged in</li>
			<li>User must be the memorial owner (ownerUid matches user.uid)</li>
			<li>Memorial must not be paid/completed</li>
			<li>Banner must not have been seen in this session</li>
			<li>Login must be recent (within 5 minutes) or no timestamp exists</li>
		</ul>
	</div>
</div>

<style>
	.container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
</style>
