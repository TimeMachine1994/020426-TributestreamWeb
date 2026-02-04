<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let videoElement: HTMLVideoElement | undefined = $state();
	let stream: MediaStream | null = $state(null);
	let error: string | null = $state(null);
	let connectionStatus: 'connecting' | 'connected' | 'disconnected' = $state('disconnected');
	let batteryLevel: number | null = $state(null);

	const token = $derived($page.url.searchParams.get('token'));

	onMount(() => {
		if (!token) {
			error = 'No session token provided. Scan the QR code from the Switcher console.';
			return;
		}

		const initCamera = async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: 'environment',
						width: { ideal: 1920 },
						height: { ideal: 1080 }
					},
					audio: true
				});

				if (videoElement) {
					videoElement.srcObject = stream;
				}

				connectionStatus = 'connecting';

				// TODO: Establish WebRTC connection to switcher
				setTimeout(() => {
					connectionStatus = 'connected';
				}, 1000);

				// Try to get battery level
				if ('getBattery' in navigator) {
					const battery = await (navigator as any).getBattery();
					batteryLevel = Math.round(battery.level * 100);
					battery.addEventListener('levelchange', () => {
						batteryLevel = Math.round(battery.level * 100);
					});
				}
			} catch (e) {
				error = 'Camera access denied. Please allow camera permissions and refresh.';
			}
		};

		initCamera();

		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	});
</script>

<svelte:head>
	<title>Camera - Tributestream</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</svelte:head>

<div class="fixed inset-0 bg-black">
	{#if error}
		<div class="flex h-full items-center justify-center p-4">
			<div class="rounded-lg bg-red-900/50 p-6 text-center text-white">
				<p class="text-lg font-semibold">Connection Error</p>
				<p class="mt-2 text-sm text-red-200">{error}</p>
			</div>
		</div>
	{:else}
		<!-- Video Preview -->
		<video
			bind:this={videoElement}
			autoplay
			playsinline
			muted
			class="h-full w-full object-cover"
		></video>

		<!-- Status Overlay -->
		<div class="absolute left-4 top-4 flex items-center gap-2">
			<div
				class="h-3 w-3 rounded-full {connectionStatus === 'connected'
					? 'bg-green-500'
					: connectionStatus === 'connecting'
						? 'bg-yellow-500 animate-pulse'
						: 'bg-red-500'}"
			></div>
			<span class="text-sm font-medium text-white drop-shadow">
				{connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
			</span>
		</div>

		<!-- Battery Level -->
		{#if batteryLevel !== null}
			<div class="absolute right-4 top-4 text-sm text-white drop-shadow">
				{batteryLevel}%
			</div>
		{/if}

		<!-- Bottom Controls -->
		<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
			<div class="flex items-center justify-center gap-4">
				<button
					type="button"
					class="rounded-full bg-white/20 p-4 text-white backdrop-blur hover:bg-white/30"
				>
					<!-- Flip camera icon placeholder -->
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>
