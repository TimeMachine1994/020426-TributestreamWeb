<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import QRCode from 'qrcode';

	type Mode = 'choose' | 'qr' | 'local';

	interface Props {
		memorialId: string;
		onClose: () => void;
		onLocalStream: (stream: MediaStream, label: string) => void;
	}

	let { memorialId, onClose, onLocalStream }: Props = $props();

	let mode = $state<Mode>('choose');

	// --- QR Code state ---
	let qrCodeDataUrl = $state<string | null>(null);
	let token = $state<string | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(false);
	let expiresAt = $state<Date | null>(null);
	let timeRemaining = $state<number>(0);
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	// --- Local camera state ---
	let localStream = $state<MediaStream | null>(null);
	let localError = $state<string | null>(null);
	let localLoading = $state(false);
	let videoDevices = $state<MediaDeviceInfo[]>([]);
	let selectedDeviceId = $state<string>('');
	let videoEl: HTMLVideoElement | undefined = $state();
	let cameraLabel = $state('Local Camera');

	// --- QR Code functions ---
	async function generateToken() {
		loading = true;
		error = null;

		try {
			const response = await fetch('/api/devices/create-token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to generate token');
			}

			const data = await response.json();
			token = data.token;
			expiresAt = new Date(data.expiresAt);

			const cameraUrl = `${window.location.origin}/camera?token=${token}`;
			qrCodeDataUrl = await QRCode.toDataURL(cameraUrl, {
				width: 256,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#ffffff'
				}
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function updateTimeRemaining() {
		if (!expiresAt) return;
		const now = new Date();
		const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
		timeRemaining = diff;

		if (diff === 0) {
			generateToken();
		}
	}

	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(updateTimeRemaining, 1000);
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	// --- Local camera functions ---
	async function enumerateVideoDevices() {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			videoDevices = devices.filter((d) => d.kind === 'videoinput');
			if (videoDevices.length > 0 && !selectedDeviceId) {
				selectedDeviceId = videoDevices[0].deviceId;
			}
		} catch {
			// ignore enumeration errors
		}
	}

	async function startLocalCamera() {
		localLoading = true;
		localError = null;

		try {
			// Request permission first to get device labels
			const constraints: MediaStreamConstraints = {
				video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
				audio: false
			};

			if (localStream) {
				localStream.getTracks().forEach((t) => t.stop());
			}

			localStream = await navigator.mediaDevices.getUserMedia(constraints);

			// Re-enumerate to get labels (available after permission granted)
			await enumerateVideoDevices();

			// Update label from device info
			const activeTrack = localStream.getVideoTracks()[0];
			if (activeTrack) {
				cameraLabel = activeTrack.label || 'Local Camera';
				// Update selected device to match
				const settings = activeTrack.getSettings();
				if (settings.deviceId) {
					selectedDeviceId = settings.deviceId;
				}
			}

			// Attach to video element
			if (videoEl) {
				videoEl.srcObject = localStream;
			}
		} catch (e) {
			localError = e instanceof Error ? e.message : 'Could not access camera';
		} finally {
			localLoading = false;
		}
	}

	async function switchCamera(deviceId: string) {
		selectedDeviceId = deviceId;
		await startLocalCamera();
	}

	function confirmLocalCamera() {
		if (localStream) {
			onLocalStream(localStream, cameraLabel);
			onClose();
		}
	}

	function stopLocalStream() {
		if (localStream) {
			localStream.getTracks().forEach((t) => t.stop());
			localStream = null;
		}
	}

	// --- Mode transitions ---
	function selectQR() {
		mode = 'qr';
		generateToken();
		startTimer();
	}

	function selectLocal() {
		mode = 'local';
		startLocalCamera();
	}

	function goBack() {
		stopLocalStream();
		if (timerInterval) clearInterval(timerInterval);
		mode = 'choose';
		// Reset QR state
		qrCodeDataUrl = null;
		token = null;
		error = null;
		loading = false;
		expiresAt = null;
		timeRemaining = 0;
		// Reset local state
		localError = null;
		localLoading = false;
	}

	function handleClose() {
		stopLocalStream();
		if (timerInterval) clearInterval(timerInterval);
		onClose();
	}

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
		// Don't stop stream here — it may have been handed off via onLocalStream
	});
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
	<div class="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				{#if mode !== 'choose'}
					<button onclick={goBack} class="text-gray-400 hover:text-white" aria-label="Go back">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
				{/if}
				<h2 class="text-lg font-semibold text-white">
					{#if mode === 'choose'}Add Camera{:else if mode === 'qr'}Scan QR Code{:else}Local Camera{/if}
				</h2>
			</div>
			<button onclick={handleClose} class="text-gray-400 hover:text-white" aria-label="Close modal">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- CHOOSE MODE -->
		{#if mode === 'choose'}
			<p class="mt-2 text-sm text-gray-400">How would you like to add a camera source?</p>

			<div class="mt-6 grid grid-cols-2 gap-4">
				<button
					onclick={selectQR}
					class="group flex flex-col items-center gap-3 rounded-lg border-2 border-gray-600 p-6 transition hover:border-indigo-500 hover:bg-gray-700/50"
				>
					<svg class="h-10 w-10 text-gray-400 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
							d="M3 3h5v5H3V3zm0 13h5v5H3v-5zm13-13h5v5h-5V3zm0 13h5v5h-5v-5zM10 3h1v2h-1V3zm0 5h1v1h-1V8zm4-5h1v1h-1V3zm-4 8h1v5h-1v-5zm4 0h1v1h-1v-1zm0 3h1v3h-1v-3zm4-3h1v1h-1v-1zm-8 4h1v1h-1v-1zm-4-4h1v1H6v-1z" />
					</svg>
					<span class="text-sm font-medium text-white">Scan QR Code</span>
					<span class="text-xs text-gray-400">Pair a remote phone</span>
				</button>

				<button
					onclick={selectLocal}
					class="group flex flex-col items-center gap-3 rounded-lg border-2 border-gray-600 p-6 transition hover:border-indigo-500 hover:bg-gray-700/50"
				>
					<svg class="h-10 w-10 text-gray-400 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
							d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
					<span class="text-sm font-medium text-white">Use Local Camera</span>
					<span class="text-xs text-gray-400">This device's camera</span>
				</button>
			</div>

		<!-- QR MODE -->
		{:else if mode === 'qr'}
			<p class="mt-2 text-sm text-gray-400">
				Scan this QR code with a phone to add it as a camera source.
			</p>

			<div class="mt-6 flex justify-center">
				{#if loading}
					<div class="flex h-64 w-64 items-center justify-center rounded-lg bg-gray-700">
						<div class="text-center">
							<svg class="mx-auto h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span class="mt-2 block text-sm text-gray-400">Generating...</span>
						</div>
					</div>
				{:else if error}
					<div class="flex h-64 w-64 flex-col items-center justify-center rounded-lg bg-gray-700">
						<svg class="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<span class="mt-2 text-sm text-red-400">{error}</span>
						<button onclick={generateToken} class="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500">
							Retry
						</button>
					</div>
				{:else if qrCodeDataUrl}
					<div class="rounded-lg bg-white p-2">
						<img src={qrCodeDataUrl} alt="QR Code" class="h-60 w-60" />
					</div>
				{/if}
			</div>

			{#if !loading && !error && timeRemaining > 0}
				<div class="mt-4 text-center">
					<p class="text-xs text-gray-500">
						Code expires in <span class="font-mono text-gray-400">{formatTime(timeRemaining)}</span>
					</p>
				</div>
			{/if}

			<div class="mt-4 rounded-lg bg-gray-700/50 p-3">
				<p class="text-xs text-gray-400">
					<strong class="text-gray-300">Tip:</strong> Open the camera app on your phone and point it at
					this QR code, or use a QR scanner app.
				</p>
			</div>

			<div class="mt-6 flex justify-between">
				<button
					onclick={generateToken}
					disabled={loading}
					class="rounded bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600 disabled:opacity-50"
				>
					New Code
				</button>
				<button onclick={handleClose} class="rounded bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600">
					Cancel
				</button>
			</div>

		<!-- LOCAL CAMERA MODE -->
		{:else if mode === 'local'}
			<p class="mt-2 text-sm text-gray-400">
				Use this device's built-in or connected camera as a source.
			</p>

			<div class="mt-4">
				<!-- Camera preview -->
				<div class="relative overflow-hidden rounded-lg bg-black">
					{#if localLoading}
						<div class="flex h-52 items-center justify-center">
							<div class="text-center">
								<svg class="mx-auto h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<span class="mt-2 block text-sm text-gray-400">Accessing camera...</span>
							</div>
						</div>
					{:else if localError}
						<div class="flex h-52 flex-col items-center justify-center">
							<svg class="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
							<span class="mt-2 text-sm text-red-400">{localError}</span>
							<button onclick={startLocalCamera} class="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500">
								Retry
							</button>
						</div>
					{:else}
						<!-- svelte-ignore element_invalid_self_closing_tag -->
						<video
							bind:this={videoEl}
							autoplay
							playsinline
							muted
							class="h-52 w-full object-cover"
						/>
					{/if}
				</div>

				<!-- Device selector -->
				{#if videoDevices.length > 1}
					<div class="mt-3">
						<label for="camera-select" class="block text-xs font-medium text-gray-400">Camera</label>
						<select
							id="camera-select"
							value={selectedDeviceId}
							onchange={(e) => switchCamera(e.currentTarget.value)}
							class="mt-1 w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							{#each videoDevices as device, i}
								<option value={device.deviceId}>
									{device.label || `Camera ${i + 1}`}
								</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>

			<div class="mt-6 flex justify-between">
				<button onclick={goBack} class="rounded bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600">
					Back
				</button>
				<button
					onclick={confirmLocalCamera}
					disabled={!localStream || localLoading}
					class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
				>
					Use This Camera
				</button>
			</div>
		{/if}
	</div>
</div>
