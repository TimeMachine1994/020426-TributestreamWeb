<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let whepUrl = $state<string | null>(null);
	let error = $state<string | null>(null);
	let pc: RTCPeerConnection | null = null;
	let videoElement: HTMLVideoElement | undefined = $state();
	let connectionStatus = $state<'connecting' | 'connected' | 'error' | 'retrying'>('connecting');
	let retryCount = $state(0);
	const maxRetries = 3;

	onMount(async () => {
		const streamId = $page.params.streamId;
		console.log('🎬 [WHEP] Starting WHEP client for stream:', streamId);

		// Validate stream ID before proceeding
		if (!streamId || streamId === 'undefined' || streamId === 'null') {
			console.error('❌ [WHEP] Invalid stream ID:', streamId);
			error = 'Invalid stream ID. Please check the stream URL.';
			connectionStatus = 'error';
			return;
		}

		await fetchWHEPUrl(streamId);
		if (whepUrl && videoElement) {
			await connectStream();
		}
	});

	async function fetchWHEPUrl(streamId: string) {
		try {
			// Additional validation in fetch function
			if (!streamId || streamId === 'undefined' || streamId === 'null') {
				throw new Error('Invalid stream ID provided');
			}

			console.log('🔍 [WHEP] Fetching WHEP URL for stream:', streamId);
			const response = await fetch(`/api/streams/${streamId}/whep`);
			const data = await response.json();

			if (data.success) {
				whepUrl = data.whepUrl;
				console.log('✅ [WHEP] Got WHEP URL:', whepUrl);
			} else {
				throw new Error(data.error || 'Failed to get WHEP URL');
			}
		} catch (err) {
			console.error('❌ [WHEP] Failed to fetch WHEP URL:', err);
			error = err instanceof Error ? err.message : 'Failed to get WHEP URL';
			connectionStatus = 'error';
		}
	}

	async function connectStream() {
		if (!whepUrl || !videoElement) {
			console.log('⚠️ [WHEP] Missing whepUrl or videoElement');
			return;
		}

		try {
			console.log('🔗 [WHEP] Starting WebRTC connection...');
			connectionStatus = retryCount > 0 ? 'retrying' : 'connecting';

			// Clean up existing connection
			if (pc) {
				pc.close();
				pc = null;
			}

			pc = new RTCPeerConnection({
				iceServers: [
					{ urls: 'stun:stun.cloudflare.com:3478' },
					{ urls: 'stun:stun.l.google.com:19302' }
				]
			});

			pc.ontrack = (event) => {
				console.log('📺 [WHEP] Received track:', event.track.kind);
				if (event.streams && event.streams[0] && videoElement) {
					videoElement.srcObject = event.streams[0];
					connectionStatus = 'connected';
					retryCount = 0; // Reset retry count on success
					console.log('✅ [WHEP] Video stream connected successfully');
				}
			};

			pc.onconnectionstatechange = () => {
				console.log('🔄 [WHEP] Connection state:', pc?.connectionState);

				if (pc?.connectionState === 'connected') {
					connectionStatus = 'connected';
				} else if (pc?.connectionState === 'failed' || pc?.connectionState === 'disconnected') {
					console.log('❌ [WHEP] Connection failed/disconnected');

					// Only retry if it's not a 409 conflict and we haven't exceeded max retries
					if (!error?.includes('already in use') && retryCount < maxRetries) {
						retryCount++;
						console.log(`🔄 [WHEP] Retrying connection (${retryCount}/${maxRetries})...`);
						setTimeout(() => {
							if (whepUrl) connectStream();
						}, 2000 * retryCount); // Exponential backoff
					} else {
						connectionStatus = 'error';
					}
				}
			};

			pc.onicecandidateError = (event) => {
				console.error('❌ [WHEP] ICE candidate error:', event);
			};

			// Add transceivers for receiving video and audio
			pc.addTransceiver('video', { direction: 'recvonly' });
			pc.addTransceiver('audio', { direction: 'recvonly' });

			// Create and set local description
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);
			console.log('📤 [WHEP] Sending offer to:', whepUrl);

			// Send offer to WHEP endpoint
			const response = await fetch(whepUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/sdp' },
				body: offer.sdp
			});

			if (!response.ok) {
				if (response.status === 409) {
					throw new Error(
						'Stream already in use by another viewer. Only one WHEP connection allowed at a time.'
					);
				} else {
					const errorText = await response.text();
					throw new Error(
						`WHEP request failed: ${response.status} ${response.statusText} - ${errorText}`
					);
				}
			}

			// Set remote description from response
			const answerSdp = await response.text();
			await pc.setRemoteDescription({
				type: 'answer',
				sdp: answerSdp
			});

			console.log('✅ [WHEP] SDP exchange completed, waiting for media...');
		} catch (err) {
			console.error('❌ [WHEP] Connection error:', err);
			error = err instanceof Error ? err.message : 'Connection failed';
			connectionStatus = 'error';

			// Don't retry on 409 conflicts
			if (error?.includes('already in use')) {
				retryCount = maxRetries; // Prevent further retries
			}
		}
	}

	function retry() {
		error = null;
		retryCount = 0;
		connectStream();
	}
</script>

<svelte:head>
	<title>WHEP Stream for OBS</title>
	<style>
		body {
			margin: 0;
			padding: 0;
			background: #000;
		}
	</style>
</svelte:head>

<div class="whep-container">
	{#if connectionStatus === 'connecting'}
		<div class="status-overlay">
			<div class="spinner"></div>
			<p>Connecting to stream...</p>
		</div>
	{:else if connectionStatus === 'retrying'}
		<div class="status-overlay">
			<div class="spinner"></div>
			<p>Retrying connection... ({retryCount}/{maxRetries})</p>
		</div>
	{:else if connectionStatus === 'error'}
		<div class="status-overlay error">
			<p>❌ Connection Error</p>
			{#if error}
				<p class="error-text">{error}</p>
				{#if error.includes('already in use')}
					<p class="help-text">
						💡 Try using the HLS Media Source URL instead for multiple viewers
					</p>
				{:else if retryCount >= maxRetries}
					<button class="retry-button" onclick={retry}> 🔄 Retry Connection </button>
				{/if}
			{/if}
		</div>
	{/if}

	<video
		bind:this={videoElement}
		autoplay
		muted
		class="video-player"
		class:connected={connectionStatus === 'connected'}
	></video>

	{#if connectionStatus === 'connected'}
		<div class="live-indicator">🔴 LIVE</div>
	{/if}
</div>

<style>
	.whep-container {
		width: 100vw;
		height: 100vh;
		position: relative;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
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
	}

	.help-text {
		font-size: 0.8em;
		color: #ffd700;
		margin-top: 15px;
		background: rgba(0, 0, 0, 0.7);
		padding: 10px;
		border-radius: 5px;
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
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	p {
		margin: 0;
		font-family: Arial, sans-serif;
	}
</style>
