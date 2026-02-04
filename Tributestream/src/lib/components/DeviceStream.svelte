<script lang="ts">
	import { onMount } from 'svelte';
	import { WebRTCPeer, type ConnectionState } from '$lib/webrtc/peer';

	interface Props {
		deviceId: string;
		memorialId: string;
		deviceName?: string;
		onConnectionChange?: (state: ConnectionState) => void;
	}

	let { deviceId, memorialId, deviceName = 'Camera', onConnectionChange }: Props = $props();

	let videoElement: HTMLVideoElement | undefined = $state();
	let connectionState: ConnectionState = $state('new');
	let peer: WebRTCPeer | null = null;

	onMount(() => {
		peer = new WebRTCPeer({
			deviceId,
			memorialId,
			isInitiator: false,
			onStateChange: (state) => {
				connectionState = state;
				onConnectionChange?.(state);
			},
			onTrack: (stream) => {
				if (videoElement) {
					videoElement.srcObject = stream;
				}
			}
		});

		peer.start();

		return () => {
			if (peer) {
				peer.stop();
			}
		};
	});
</script>

<div class="relative h-full w-full overflow-hidden rounded-lg bg-gray-900">
	<video
		bind:this={videoElement}
		autoplay
		playsinline
		muted
		class="h-full w-full object-cover"
	></video>

	<!-- Connection State Overlay -->
	{#if connectionState !== 'connected'}
		<div class="absolute inset-0 flex items-center justify-center bg-gray-900/80">
			{#if connectionState === 'connecting' || connectionState === 'new'}
				<div class="text-center">
					<svg
						class="mx-auto h-8 w-8 animate-spin text-indigo-500"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="mt-2 text-sm text-gray-400">Connecting...</p>
				</div>
			{:else if connectionState === 'disconnected'}
				<div class="text-center">
					<svg class="mx-auto h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					<p class="mt-2 text-sm text-yellow-400">Disconnected</p>
				</div>
			{:else if connectionState === 'failed'}
				<div class="text-center">
					<svg class="mx-auto h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
					<p class="mt-2 text-sm text-red-400">Connection Failed</p>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Device Name Label -->
	<div class="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
		{deviceName}
	</div>

	<!-- Connection Status Indicator -->
	<div class="absolute right-2 top-2">
		<div
			class="h-3 w-3 rounded-full {connectionState === 'connected'
				? 'bg-green-500'
				: connectionState === 'connecting' || connectionState === 'new'
					? 'bg-yellow-500 animate-pulse'
					: 'bg-red-500'}"
		></div>
	</div>
</div>
