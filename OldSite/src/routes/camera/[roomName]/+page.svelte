<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	
	let { data } = $props();
	
	// State
	let daily: any = null;
	let isConnected = $state(false);
	let hasPermissions = $state(false);
	let errorMessage = $state<string | null>(null);
	let cameraLabel = $state('Camera');
	let localVideoEl: HTMLVideoElement;
	let isMuted = $state(false);
	let isVideoOff = $state(false);
	let waitingForUserAction = $state(true); // Show "Start Camera" button
	
	// Debug state
	let showDebug = $state(false);
	let debugLogs = $state<string[]>([]);
	
	function debugLog(message: string, data?: any) {
		const timestamp = new Date().toLocaleTimeString();
		const logEntry = data 
			? `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}`
			: `[${timestamp}] ${message}`;
		debugLogs = [...debugLogs.slice(-30), logEntry]; // Keep last 30 logs
		console.log(`📱 ${message}`, data || '');
	}
	
	async function startCamera() {
		waitingForUserAction = false;
		
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('t');
		
		if (!data.roomUrl) {
			errorMessage = 'Invalid room configuration';
			return;
		}

		try {
			debugLog('🎬 Starting camera setup');
			
			// Create Daily call object - it will handle permissions
			debugLog('🔧 Creating Daily call object');
			const DailyIframe = (await import('@daily-co/daily-js')).default;
			daily = DailyIframe.createCallObject({
				subscribeToTracksAutomatically: false,
			});
			
			// Add event listeners
			daily.on('joined-meeting', (e: any) => {
				debugLog('✅ Joined meeting', { 
					localParticipant: e.participants?.local?.user_name 
				});
			});
			
			daily.on('track-started', (e: any) => {
				debugLog('🎥 Track started', {
					kind: e.track?.kind,
					isLocal: e.participant?.local,
					trackState: e.participant?.tracks?.[e.track?.kind]?.state
				});
			});
			
			daily.on('error', (e: any) => {
				debugLog('❌ Daily error', e);
			});
			
			// Join the room - Daily.co will prompt for camera/mic
			debugLog('🚪 Joining room (Daily.co will request permissions)', { 
				roomUrl: data.roomUrl, 
				label: cameraLabel
			});
			
			await daily.join({
				url: data.roomUrl,
				token: token || undefined,
				userName: cameraLabel,
				startVideoOff: false,
				startAudioOff: false,
			});
			
			hasPermissions = true;
			
			isConnected = true;
			debugLog('✅ Connected successfully');
			
			// Step 4: Verify Daily.co has our tracks
			const localParticipant = daily.participants().local;
			debugLog('📹 Daily.co participant state', {
				video: localParticipant?.video,
				audio: localParticipant?.audio,
				videoTrack: !!localParticipant?.tracks?.video?.persistentTrack,
				audioTrack: !!localParticipant?.tracks?.audio?.persistentTrack,
				videoState: localParticipant?.tracks?.video?.state,
				audioState: localParticipant?.tracks?.audio?.state
			});
			
			// Attach Daily.co's tracks to our video element for local preview
			if (localParticipant?.tracks?.video?.persistentTrack) {
				const dailyStream = new MediaStream([localParticipant.tracks.video.persistentTrack]);
				localVideoEl.srcObject = dailyStream;
				await localVideoEl.play().catch(err => debugLog('⚠️ Play error', err));
				debugLog('✅ Daily.co video preview attached');
			} else {
				// If tracks aren't ready yet, explicitly enable them
				debugLog('⚠️ Daily.co missing tracks - explicitly enabling');
				try {
					await daily.setLocalVideo(true);
					await daily.setLocalAudio(true);
					debugLog('✅ Explicitly enabled in Daily.co');
					
					// Wait for tracks to become available
					setTimeout(async () => {
						const updatedParticipant = daily.participants().local;
						if (updatedParticipant?.tracks?.video?.persistentTrack) {
							const dailyStream = new MediaStream([updatedParticipant.tracks.video.persistentTrack]);
							localVideoEl.srcObject = dailyStream;
							await localVideoEl.play().catch(err => debugLog('⚠️ Play error', err));
							debugLog('✅ Daily.co video preview attached (delayed)');
						}
					}, 500);
				} catch (err) {
					debugLog('❌ Failed to enable in Daily.co', err);
				}
			}
			
			// Monitor for track state changes and attach video when available
			daily.on('participant-updated', async (event: any) => {
				if (event.participant?.local) {
					debugLog('🔄 Local participant updated', {
						video: event.participant?.video,
						audio: event.participant?.audio,
						videoState: event.participant?.tracks?.video?.state,
						audioState: event.participant?.tracks?.audio?.state
					});
					
					// Attach video preview if track just became available
					if (event.participant?.tracks?.video?.persistentTrack && !localVideoEl.srcObject) {
						const dailyStream = new MediaStream([event.participant.tracks.video.persistentTrack]);
						localVideoEl.srcObject = dailyStream;
						await localVideoEl.play().catch(err => debugLog('⚠️ Play error', err));
						debugLog('✅ Video attached via participant-updated');
					}
				}
			});
			
		} catch (err: any) {
			debugLog('❌ Camera setup failed', err);
			console.error('Camera setup error:', err);
			
			// Handle Daily.co specific errors
			if (err.errorMsg?.includes('permission') || err.errorMsg?.includes('devices') || err.action === 'error') {
				errorMessage = 'Camera/microphone permission denied. Please allow access and refresh.';
			} else if (err.errorMsg?.includes('network') || err.errorMsg?.includes('connection')) {
				errorMessage = 'Network connection failed. Please check your connection and try again.';
			} else {
				errorMessage = err.errorMsg || err.message || 'Failed to connect to camera';
			}
			hasPermissions = false;
			waitingForUserAction = true; // Show button again if error
		}
	}
	
	onMount(() => {
		// Get camera label from URL params
		const urlParams = new URLSearchParams(window.location.search);
		cameraLabel = urlParams.get('label') || 'Camera';
	});
	
	onDestroy(() => {
		if (daily) {
			daily.leave();
			daily.destroy();
		}
	});
	
	function toggleCamera() {
		if (daily) {
			const currentState = daily.localVideo();
			const newState = !currentState;
			debugLog('📹 Toggling camera', { from: currentState, to: newState });
			daily.setLocalVideo(newState);
			isVideoOff = !newState;
		}
	}
	
	function toggleMic() {
		if (daily) {
			const currentState = daily.localAudio();
			const newState = !currentState;
			debugLog('🎤 Toggling mic', { from: currentState, to: newState });
			daily.setLocalAudio(newState);
			isMuted = !newState;
		}
	}
</script>

<svelte:head>
	<title>{cameraLabel} - Tributestream Camera</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</svelte:head>

<div class="min-h-screen bg-black text-white flex flex-col">
	
	<!-- Video Preview (Full Screen) -->
	<div class="flex-1 relative">
		<video 
			bind:this={localVideoEl}
			autoplay 
			muted 
			playsinline
			class="absolute inset-0 w-full h-full object-cover"
		></video>
		
		<!-- Status Overlay -->
		<div class="absolute top-4 left-4 right-4 flex justify-between items-start">
			<!-- Connection Status -->
			<div class="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
				<div class="flex items-center gap-2">
					<span class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}"></span>
					<span class="text-sm font-medium">
						{#if isConnected}
							Connected
						{:else if hasPermissions}
							Connecting...
						{:else}
							Waiting for permissions
						{/if}
					</span>
				</div>
			</div>
			
			<!-- Camera Label -->
			<div class="bg-red-600 rounded-lg px-3 py-2">
				<span class="text-sm font-bold">{cameraLabel}</span>
			</div>
		</div>
		
		<!-- Error Message -->
		{#if errorMessage}
			<div class="absolute inset-0 flex items-center justify-center bg-black/80">
				<div class="text-center p-6 max-w-sm">
					<div class="text-4xl mb-4">📵</div>
					<p class="text-red-400 font-medium mb-2">Connection Error</p>
					<p class="text-gray-400 text-sm">{errorMessage}</p>
					<button 
						class="mt-4 px-4 py-2 bg-white text-black rounded-lg font-medium"
						onclick={() => window.location.reload()}
					>
						Try Again
					</button>
				</div>
			</div>
		{/if}
		
		<!-- Start Camera Button -->
		{#if waitingForUserAction && !errorMessage}
			<div class="absolute inset-0 flex items-center justify-center bg-black/80">
				<div class="text-center p-6 max-w-sm">
					<div class="text-6xl mb-4">📷</div>
					<p class="text-xl font-medium mb-4">Ready to Start</p>
					<p class="text-gray-400 text-sm mb-6">Tap the button below to connect your camera and join the stream.</p>
					<button 
						class="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg shadow-lg transition-colors"
						onclick={startCamera}
					>
						Start Camera
					</button>
				</div>
			</div>
		{:else if !hasPermissions && !errorMessage}
			<div class="absolute inset-0 flex items-center justify-center bg-black/80">
				<div class="text-center p-6 max-w-sm">
					<div class="text-6xl mb-4">📷</div>
					<p class="text-xl font-medium mb-2">Requesting Access...</p>
					<p class="text-gray-400 text-sm">Please allow camera and microphone access when prompted.</p>
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Bottom Controls -->
	<div class="bg-gray-900 border-t border-gray-800 p-4 safe-area-bottom">
		<div class="flex justify-center gap-6">
			<!-- Mic Toggle -->
			<button 
				class="w-16 h-16 rounded-full flex items-center justify-center transition-colors
					{!isMuted ? 'bg-gray-700' : 'bg-red-600'}"
				onclick={toggleMic}
				disabled={!isConnected}
			>
				{#if !isMuted}
					<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
					</svg>
				{:else}
					<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
					</svg>
				{/if}
			</button>
			
			<!-- Camera Toggle -->
			<button 
				class="w-16 h-16 rounded-full flex items-center justify-center transition-colors
					{!isVideoOff ? 'bg-gray-700' : 'bg-red-600'}"
				onclick={toggleCamera}
				disabled={!isConnected}
			>
				{#if !isVideoOff}
					<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
				{:else}
					<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
					</svg>
				{/if}
			</button>
		</div>
		
		<!-- Instructions -->
		<p class="text-center text-gray-500 text-xs mt-3">
			Keep this page open • Your video is being sent to the switcher
		</p>
	</div>
	
	<!-- DEBUG PANEL -->
	<div class="fixed bottom-24 right-4 z-50">
		<button 
			class="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-mono hover:bg-gray-700 transition-colors"
			onclick={() => showDebug = !showDebug}
		>
			🔧 {showDebug ? '▼' : '▲'}
		</button>
		
		{#if showDebug}
			<div class="absolute bottom-12 right-0 w-80 max-h-80 bg-gray-900 text-green-400 rounded-lg shadow-2xl overflow-hidden">
				<div class="p-2 bg-gray-800 text-white text-xs font-bold flex justify-between items-center">
					<span>Camera Debug ({debugLogs.length})</span>
					<button 
						onclick={() => debugLogs = []} 
						class="text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors"
					>
						Clear
					</button>
				</div>
				<div class="p-2 overflow-y-auto max-h-56 font-mono text-xs">
					{#each debugLogs as log}
						<pre class="whitespace-pre-wrap mb-1 border-b border-gray-700 pb-1 text-green-300">{log}</pre>
					{/each}
					{#if debugLogs.length === 0}
						<p class="text-gray-500">No logs yet...</p>
					{/if}
				</div>
				<div class="p-2 bg-gray-800 text-xs space-y-1">
					<div class="text-white flex justify-between">
						<span>Connected:</span>
						<span class="font-bold {isConnected ? 'text-green-400' : 'text-gray-400'}">{isConnected ? 'YES' : 'NO'}</span>
					</div>
					<div class="text-white flex justify-between">
						<span>Video:</span>
						<span class="font-bold {!isVideoOff ? 'text-green-400' : 'text-red-400'}">{!isVideoOff ? 'ON' : 'OFF'}</span>
					</div>
					<div class="text-white flex justify-between">
						<span>Audio:</span>
						<span class="font-bold {!isMuted ? 'text-green-400' : 'text-red-400'}">{!isMuted ? 'ON' : 'OFF'}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.safe-area-bottom {
		padding-bottom: max(1rem, env(safe-area-inset-bottom));
	}
</style>
