<script lang="ts">
	import { WHIPClient, type WHIPClientState } from '$lib/utils/whip-client';
	import { onDestroy } from 'svelte';

	interface Props {
		streamId: string;
		whipUrl: string;
		onStreamStart?: () => void;
		onStreamStop?: () => void;
	}

	let { streamId, whipUrl, onStreamStart, onStreamStop }: Props = $props();

	let videoElement: HTMLVideoElement;
	let whipClient: WHIPClient | null = null;
	let clientState = $state<WHIPClientState>('idle');
	let errorMessage = $state<string | null>(null);

	onDestroy(() => {
		if (whipClient?.isStreaming()) {
			whipClient.stop();
		}
	});

	async function startStreaming() {
		if (!videoElement) return;

		try {
			errorMessage = null;
			whipClient = new WHIPClient({
				whipUrl,
				videoElement,
				onStateChange: (state) => {
					clientState = state;
					if (state === 'streaming') onStreamStart?.();
				},
				onError: (error) => {
					errorMessage = error.message;
				}
			});

			await whipClient.start();
		} catch (error) {
			console.error('Failed to start streaming:', error);
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		}
	}

	function stopStreaming() {
		if (whipClient) {
			whipClient.stop();
			onStreamStop?.();
		}
	}

	const isIdle = $derived(clientState === 'idle' || clientState === 'stopped');
	const isLoading = $derived(clientState === 'requesting-media' || clientState === 'connecting');
	const isStreaming = $derived(clientState === 'streaming');
	const hasError = $derived(clientState === 'error' || errorMessage !== null);
</script>

<div class="browser-streamer">
	<div class="video-container">
		<video
			bind:this={videoElement}
			autoplay
			muted
			playsinline
			class="video-preview"
			class:streaming={isStreaming}
		></video>

		{#if !isStreaming}
			<div class="status-overlay">
				{#if isIdle}
					<div class="status-icon">📹</div>
					<p>Ready to stream</p>
				{:else if isLoading}
					<div class="status-icon spinning">⚙️</div>
					<p>
						{clientState === 'requesting-media' ? 'Requesting camera access...' : 'Connecting...'}
					</p>
				{/if}
			</div>
		{/if}

		{#if isStreaming}
			<div class="live-indicator">
				<span class="live-dot"></span>
				<span>LIVE</span>
			</div>
		{/if}
	</div>

	{#if hasError}
		<div class="error-message">
			<strong>⚠️ Error:</strong>
			{errorMessage || 'Streaming failed'}
		</div>
	{/if}

	<div class="controls">
		{#if isIdle}
			<button class="btn btn-primary" onclick={startStreaming}>📹 Start Streaming</button>
		{:else if isLoading}
			<button class="btn btn-disabled" disabled>
				⏳ {clientState === 'requesting-media' ? 'Requesting Access...' : 'Connecting...'}
			</button>
		{:else if isStreaming}
			<button class="btn btn-danger" onclick={stopStreaming}>⏹️ Stop Streaming</button>
		{:else if hasError}
			<button class="btn btn-secondary" onclick={() => (errorMessage = null)}>🔄 Try Again</button>
		{/if}
	</div>
</div>

<style>
	.browser-streamer {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}

	.video-container {
		position: relative;
		background: #000;
		border-radius: 8px;
		overflow: hidden;
		aspect-ratio: 16 / 9;
	}

	.video-preview {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.status-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.7);
		color: white;
	}

	.status-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.spinning {
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.live-indicator {
		position: absolute;
		top: 1rem;
		left: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 0, 0, 0.9);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-weight: bold;
	}

	.live-dot {
		width: 12px;
		height: 12px;
		background: white;
		border-radius: 50%;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.error-message {
		margin-top: 1rem;
		padding: 1rem;
		background: #fee;
		border: 1px solid #fcc;
		border-radius: 4px;
		color: #c00;
	}

	.controls {
		margin-top: 1rem;
		display: flex;
		justify-content: center;
	}

	.btn {
		padding: 0.75rem 2rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #d5ba7f;
		color: white;
	}

	.btn-primary:hover {
		background: #c5aa6f;
	}

	.btn-danger {
		background: #dc3545;
		color: white;
	}

	.btn-danger:hover {
		background: #c82333;
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
	}

	.btn-disabled {
		background: #ccc;
		color: #666;
		cursor: not-allowed;
	}
</style>
