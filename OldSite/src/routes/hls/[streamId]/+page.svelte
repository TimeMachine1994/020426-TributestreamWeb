<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Hls from 'hls.js';

	let hlsUrl = $state<string | null>(null);
	let error = $state<string | null>(null);
	let videoElement: HTMLVideoElement | undefined = $state();
	let hls: Hls | null = null;
	let connectionStatus = $state<'loading' | 'connected' | 'error' | 'buffering'>('loading');
	let retryCount = $state(0);
	const maxRetries = 3;

	onMount(async () => {
		const streamId = $page.params.streamId;
		console.log('📺 [HLS] Starting HLS player for stream:', streamId);

		await fetchHLSUrl(streamId);
		if (hlsUrl && videoElement) {
			setupVideoEvents();
			await initializePlayer();
		}
	});

	async function fetchHLSUrl(streamId: string) {
		try {
			console.log('🔍 [HLS] Fetching HLS URL for stream:', streamId);
			const response = await fetch(`/api/streams/${streamId}/hls`);
			const data = await response.json();

			if (data.success) {
				hlsUrl = data.hlsUrl;
				console.log('✅ [HLS] Got HLS URL:', hlsUrl);
			} else {
				throw new Error(data.error || 'Failed to get HLS URL');
			}
		} catch (err) {
			console.error('❌ [HLS] Failed to fetch HLS URL:', err);
			error = err instanceof Error ? err.message : 'Failed to get HLS URL';
			connectionStatus = 'error';
		}
	}

	async function initializePlayer() {
		if (!hlsUrl || !videoElement) {
			console.log('⚠️ [HLS] Missing hlsUrl or videoElement');
			return;
		}

		try {
			console.log('🔗 [HLS] Initializing HLS player...');
			connectionStatus = 'loading';

			// Clean up existing HLS instance
			if (hls) {
				hls.destroy();
				hls = null;
			}

			if (Hls.isSupported()) {
				hls = new Hls({
					enableWorker: true,
					lowLatencyMode: false, // Prioritize stability over latency for OBS
					backBufferLength: 90,
					maxBufferLength: 30,
					maxMaxBufferLength: 600,
					maxBufferSize: 60 * 1000 * 1000,
					maxBufferHole: 0.5,
					highBufferWatchdogPeriod: 2,
					nudgeOffset: 0.1,
					nudgeMaxRetry: 3,
					maxFragLookUpTolerance: 0.25,
					liveSyncDurationCount: 3,
					liveMaxLatencyDurationCount: 10
				});

				hls.loadSource(hlsUrl);
				hls.attachMedia(videoElement);

				hls.on(Hls.Events.MEDIA_ATTACHED, () => {
					console.log('📺 [HLS] Media attached');
				});

				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					console.log('✅ [HLS] Manifest parsed, starting playback');
					videoElement?.play().catch(console.error);
				});

				hls.on(Hls.Events.FRAG_LOADED, () => {
					if (connectionStatus !== 'connected') {
						connectionStatus = 'connected';
						retryCount = 0;
					}
				});

				hls.on(Hls.Events.ERROR, (event, data) => {
					console.error('❌ [HLS] Error:', data);

					if (data.fatal) {
						switch (data.type) {
							case Hls.ErrorTypes.NETWORK_ERROR:
								console.log('🔄 [HLS] Network error, attempting recovery...');
								if (retryCount < maxRetries) {
									retryCount++;
									setTimeout(() => {
										hls?.startLoad();
									}, 1000 * retryCount);
								} else {
									error = 'Network error - stream may be offline';
									connectionStatus = 'error';
								}
								break;
							case Hls.ErrorTypes.MEDIA_ERROR:
								console.log('🔄 [HLS] Media error, attempting recovery...');
								hls.recoverMediaError();
								break;
							default:
								error = `Playback error: ${data.details}`;
								connectionStatus = 'error';
								break;
						}
					}
				});
			} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
				// Native HLS support (Safari)
				videoElement.src = hlsUrl;
				videoElement.addEventListener('loadedmetadata', () => {
					connectionStatus = 'connected';
				});
				videoElement.addEventListener('error', () => {
					error = 'Playback error';
					connectionStatus = 'error';
				});
			} else {
				throw new Error('HLS is not supported in this browser');
			}
		} catch (err) {
			console.error('❌ [HLS] Player initialization error:', err);
			error = err instanceof Error ? err.message : 'Player initialization failed';
			connectionStatus = 'error';
		}
	}

	function retry() {
		error = null;
		retryCount = 0;
		connectionStatus = 'loading';
		initializePlayer();
	}

	// Handle video events - called from onMount to avoid timeout issues
	function setupVideoEvents() {
		if (!videoElement) return;

		videoElement.addEventListener('waiting', () => {
			if (connectionStatus === 'connected') {
				connectionStatus = 'buffering';
			}
		});

		videoElement.addEventListener('playing', () => {
			connectionStatus = 'connected';
		});

		videoElement.addEventListener('ended', () => {
			console.log('📺 [HLS] Stream ended');
		});
	}
</script>

<svelte:head>
	<title>HLS Stream for OBS</title>
	<style>
		body {
			margin: 0;
			padding: 0;
			background: #000;
			overflow: hidden;
		}
	</style>
</svelte:head>

<div class="hls-container">
	{#if connectionStatus === 'loading'}
		<div class="status-overlay">
			<div class="spinner"></div>
			<p>Loading stream...</p>
		</div>
	{:else if connectionStatus === 'buffering'}
		<div class="status-overlay">
			<div class="spinner"></div>
			<p>Buffering...</p>
		</div>
	{:else if connectionStatus === 'error'}
		<div class="status-overlay error">
			<p>❌ Stream Error</p>
			{#if error}
				<p class="error-text">{error}</p>
				<button class="retry-button" onclick={retry}> 🔄 Retry </button>
			{/if}
		</div>
	{/if}

	<video
		bind:this={videoElement}
		autoplay
		muted
		playsinline
		class="video-player"
		class:connected={connectionStatus === 'connected'}
	></video>

	{#if connectionStatus === 'connected'}
		<div class="live-indicator">🔴 LIVE</div>
	{/if}
</div>

<style>
	.hls-container {
		width: 100vw;
		height: 100vh;
		position: relative;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.video-player {
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: #000;
	}

	.video-player.connected {
		display: block;
	}

	.status-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: white;
		z-index: 10;
		max-width: 80%;
	}

	.status-overlay.error {
		color: #ff6b6b;
	}

	.error-text {
		font-size: 0.9em;
		opacity: 0.8;
		margin-top: 10px;
		word-wrap: break-word;
	}

	.retry-button {
		background: #007bff;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 5px;
		cursor: pointer;
		margin-top: 15px;
		font-size: 0.9em;
	}

	.retry-button:hover {
		background: #0056b3;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #333;
		border-top: 4px solid #fff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 20px;
	}

	.live-indicator {
		position: absolute;
		top: 20px;
		left: 20px;
		background: rgba(255, 0, 0, 0.9);
		color: white;
		padding: 8px 16px;
		border-radius: 20px;
		font-weight: bold;
		font-size: 14px;
		z-index: 10;
		animation: pulse 2s infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	p {
		margin: 0;
		font-family: Arial, sans-serif;
	}
</style>
