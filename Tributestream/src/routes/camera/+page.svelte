<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { LiveKitRoom } from '$lib/livekit/client';

	let videoElement: HTMLVideoElement | undefined = $state();
	let stream: MediaStream | null = $state.raw(null);
	let error: string | null = $state(null);
	let connectionStatus: 'idle' | 'validating' | 'connecting' | 'connected' | 'disconnected' =
		$state('idle');
	let batteryLevel: number | null = $state(null);
	let deviceId: string | null = $state(null);
	let memorial: { id: string; title: string; slug: string } | null = $state.raw(null);
	let facingMode: 'environment' | 'user' = $state('environment');
	let livekitRoom: LiveKitRoom | null = null;
	let livekitCreds: { token: string; url: string; roomName: string } | null = null;

	const token = $derived(page.url.searchParams.get('token'));

	// Reactive effect to attach stream to video element when both are available
	$effect(() => {
		if (videoElement && stream) {
			console.log('[CameraPage] $effect: Attaching stream to video element');
			videoElement.srcObject = stream;
		}
	});

	async function validateToken() {
		console.log('[CameraPage] validateToken() called, token:', token?.substring(0, 8) + '...');
		if (!token) {
			error = 'No session token provided. Scan the QR code from the Switcher console.';
			return false;
		}

		connectionStatus = 'validating';

		try {
			console.log('[CameraPage] Fetching /api/devices/validate...');
			const response = await fetch('/api/devices/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			if (!response.ok) {
				const data = await response.json();
				error = data.message || 'Invalid or expired token. Please scan a new QR code.';
				return false;
			}

			const data = await response.json();
			console.log('[CameraPage] Validation successful!');
			console.log('[CameraPage] Device ID:', data.deviceId);
			console.log('[CameraPage] Memorial:', data.memorial?.title);
			deviceId = data.deviceId;
			memorial = data.memorial;
			livekitCreds = data.livekit;
			if (!livekitCreds) {
				console.warn('[CameraPage] No LiveKit credentials returned — check server config');
			}
			return true;
		} catch (e) {
			console.error('[CameraPage] Validation error:', e);
			error = 'Failed to validate token. Check your internet connection.';
			return false;
		}
	}

	async function syncStatusToDb(status: 'connected' | 'disconnected') {
		if (!deviceId) return;
		try {
			console.log('[CameraPage] Syncing status to DB:', status);
			await fetch(`/api/devices/${deviceId}/status`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});
			console.log('[CameraPage] Status synced successfully');
		} catch (e) {
			console.error('[CameraPage] Failed to sync status:', e);
		}
	}

	async function initCamera() {
		console.log('[CameraPage] initCamera() called');
		try {
			console.log('[CameraPage] Requesting camera with facingMode:', facingMode);
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode,
					width: { ideal: 1920 },
					height: { ideal: 1080 }
				},
				audio: true
			});

			console.log('[CameraPage] Camera stream acquired:', stream.id);
			console.log('[CameraPage] Video tracks:', stream.getVideoTracks().map(t => t.label));
			console.log('[CameraPage] Audio tracks:', stream.getAudioTracks().map(t => t.label));

			// Stream will be attached via $effect when videoElement becomes available
			console.log('[CameraPage] Stream ready, will attach via $effect');

			// Connect to LiveKit and publish tracks
			if (deviceId && memorial && livekitCreds) {
				console.log('[CameraPage] Connecting to LiveKit room');
				console.log('[CameraPage] deviceId:', deviceId, 'memorialId:', memorial.id);
				connectionStatus = 'connecting';

				livekitRoom = new LiveKitRoom({
					onConnectionChange: async (state) => {
						console.log('[CameraPage] LiveKit state changed:', state);
						if (state === 'connected') {
							connectionStatus = 'connected';
							await syncStatusToDb('connected');
						} else if (state === 'disconnected') {
							connectionStatus = 'disconnected';
							await syncStatusToDb('disconnected');
						} else if (state === 'connecting' || state === 'reconnecting') {
							connectionStatus = 'connecting';
						}
					}
				});

				try {
					await livekitRoom.connect(livekitCreds.url, livekitCreds.token);

					// Publish video and audio tracks
					for (const track of stream.getTracks()) {
						console.log('[CameraPage] Publishing track:', track.kind, track.label);
						await livekitRoom.publishTrack(track, { name: `${deviceId}-${track.kind}` });
					}

					console.log('[CameraPage] All tracks published to LiveKit');
				} catch (e) {
					console.error('[CameraPage] LiveKit connection error:', e);
					connectionStatus = 'disconnected';
					await syncStatusToDb('disconnected');
				}
			}

			// Try to get battery level
			if ('getBattery' in navigator) {
				const battery = await (navigator as unknown as { getBattery: () => Promise<{ level: number; addEventListener: (event: string, cb: () => void) => void }> }).getBattery();
				batteryLevel = Math.round(battery.level * 100);
				battery.addEventListener('levelchange', () => {
					batteryLevel = Math.round(battery.level * 100);
				});
			}
		} catch (e) {
			console.error('[CameraPage] Camera/WebRTC error:', e);
			const errorMessage = e instanceof Error ? e.message : String(e);
			if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
				error = 'Camera permission denied. Please allow camera access in your browser settings and tap Retry.';
			} else if (errorMessage.includes('NotFoundError')) {
				error = 'No camera found. Please ensure your device has a working camera.';
			} else {
				error = `Camera error: ${errorMessage}. Tap Retry to try again.`;
			}
		}
	}

	async function retryCamera() {
		console.log('[CameraPage] retryCamera() called');
		error = null;
		await initCamera();
	}

	async function flipCamera() {
		console.log('[CameraPage] flipCamera() called');

		// Unpublish old tracks from LiveKit before stopping them
		if (livekitRoom && stream) {
			for (const track of stream.getTracks()) {
				await livekitRoom.unpublishTrack(track);
			}
		}

		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}
		facingMode = facingMode === 'environment' ? 'user' : 'environment';
		console.log('[CameraPage] New facingMode:', facingMode);
		await initCamera();
	}

	onMount(() => {
		console.log('[CameraPage] onMount triggered');
		const init = async () => {
			console.log('[CameraPage] Starting initialization...');
			const valid = await validateToken();
			if (valid) {
				console.log('[CameraPage] Token valid, initializing camera...');
				await initCamera();
			} else {
				console.log('[CameraPage] Token invalid, not initializing camera');
			}
		};

		init();

		return () => {
			if (livekitRoom) {
				livekitRoom.disconnect();
			}
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
				<svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<p class="mt-4 text-lg font-semibold">Connection Error</p>
				<p class="mt-2 text-sm text-red-200">{error}</p>
				<button
					onclick={retryCamera}
					class="mt-4 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium hover:bg-indigo-700"
				>
					Retry Camera
				</button>
				<p class="mt-3 text-xs text-gray-400">If permission was denied, check your browser settings first.</p>
			</div>
		</div>
	{:else if connectionStatus === 'validating' || connectionStatus === 'idle'}
		<div class="flex h-full items-center justify-center p-4">
			<div class="text-center text-white">
				<svg class="mx-auto h-10 w-10 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<p class="mt-4 text-sm text-gray-400">Validating connection...</p>
			</div>
		</div>
	{:else}
		<!-- Video Preview -->
		<video
			bind:this={videoElement}
			autoplay
			playsinline
			muted
			class="h-full w-full object-cover {facingMode === 'user' ? 'scale-x-[-1]' : ''}"
		></video>

		<!-- Top Bar -->
		<div class="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-4">
			<div class="flex items-center justify-between">
				<!-- Status -->
				<div class="flex items-center gap-2">
					<div
						class="h-3 w-3 rounded-full {connectionStatus === 'connected'
							? 'bg-green-500'
							: connectionStatus === 'connecting'
								? 'bg-yellow-500 animate-pulse'
								: 'bg-red-500'}"
					></div>
					<span class="text-sm font-medium text-white">
						{connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
					</span>
				</div>

				<!-- Battery -->
				{#if batteryLevel !== null}
					<div class="flex items-center gap-1 text-sm text-white">
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M17 6H22V18H17V20H7V18H2V6H7V4H17V6ZM4 8V16H20V8H4Z" />
						</svg>
						{batteryLevel}%
					</div>
				{/if}
			</div>

			<!-- Memorial Info -->
			{#if memorial}
				<div class="mt-2 text-center">
					<p class="text-sm font-medium text-white">{memorial.title}</p>
				</div>
			{/if}
		</div>

		<!-- Bottom Controls -->
		<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
			<div class="flex items-center justify-center gap-6">
				<button
					type="button"
					onclick={flipCamera}
					class="rounded-full bg-white/20 p-4 text-white backdrop-blur transition hover:bg-white/30"
					aria-label="Flip camera"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>
