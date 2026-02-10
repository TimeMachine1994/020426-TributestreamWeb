<script lang="ts">
	import type { LiveKitConnectionState } from '$lib/livekit/client';

	interface Props {
		deviceName?: string;
		stream: MediaStream | null;
		connectionState?: LiveKitConnectionState;
	}

	let { deviceName = 'Camera', stream = null, connectionState = 'disconnected' }: Props = $props();

	let videoElement: HTMLVideoElement | undefined = $state();

	// Attach stream to video element reactively
	$effect(() => {
		if (videoElement && stream) {
			videoElement.srcObject = stream;
		} else if (videoElement && !stream) {
			videoElement.srcObject = null;
		}
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
	{#if connectionState !== 'connected' || !stream}
		<div class="absolute inset-0 flex items-center justify-center bg-gray-900/80">
			{#if connectionState === 'connecting' || connectionState === 'reconnecting'}
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
					<p class="mt-2 text-sm text-gray-400">
						{connectionState === 'reconnecting' ? 'Reconnecting...' : 'Connecting...'}
					</p>
				</div>
			{:else if connectionState === 'connected' && !stream}
				<div class="text-center">
					<svg class="mx-auto h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
					<p class="mt-2 text-sm text-yellow-400">Waiting for video...</p>
				</div>
			{:else}
				<div class="text-center">
					<svg class="mx-auto h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
					<p class="mt-2 text-sm text-gray-500">No signal</p>
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
				: connectionState === 'connecting' || connectionState === 'reconnecting'
					? 'bg-yellow-500 animate-pulse'
					: 'bg-red-500'}"
		></div>
	</div>
</div>
