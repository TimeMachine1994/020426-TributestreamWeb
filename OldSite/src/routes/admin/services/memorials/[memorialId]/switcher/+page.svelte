<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Card, Badge } from '$lib/components/minimal-modern';
	import { 
		Mic, MicOff, Video as VideoIcon, VideoOff, 
		Monitor, Smartphone, Share2, QrCode, 
		Radio, Power
	} from 'lucide-svelte';
	
	let { data } = $props();

	// --- State ---
	let isLive = $state(false);
	let liveDuration = $state(0);
	let activeSpeakerId = $state<string | null>(null);
	let daily: any = null; // DailyIframe instance
	let participants = $state<any[]>([]);
	let hlsUrl = $state<string | null>(null);
	let liveTimer: ReturnType<typeof setInterval> | null = null;
	let isLoading = $state(false);
	
	// Derived - Filter out blocked/duplicate participants
	let validParticipants = $derived(participants.filter(p => {
		// Show all participants EXCEPT those with explicitly blocked tracks
		// This allows cameras to appear even if tracks haven't started yet
		// Only filter out if we know both video AND audio are blocked (duplicate sessions)
		const videoBlocked = p.videoTrack === null && !p.hasVideo && !p.local;
		const audioBlocked = p.audioTrack === null && !p.hasAudio && !p.local;
		
		// Keep everyone except confirmed blocked duplicates
		// (Blocked duplicates have no tracks AND aren't local admin AND are named the same as another participant)
		return !(videoBlocked && audioBlocked && participants.filter(other => other.name === p.name).length > 1);
	}));
	let participantCount = $derived(validParticipants.length);
	
	// Program monitor video element
	let programVideoEl: HTMLVideoElement;
	
	// Debug state
	let showDebug = $state(false);
	let debugLogs = $state<string[]>([]);
	
	// QR Code modal state
	let showQRModal = $state(false);
	let qrCodeUrl = $state<string | null>(null);
	let cameraJoinUrl = $state<string | null>(null);
	let cameraLabel = $state<string>('');

	function debugLog(message: string, data?: any) {
		const timestamp = new Date().toLocaleTimeString();
		const logEntry = data 
			? `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}`
			: `[${timestamp}] ${message}`;
		debugLogs = [...debugLogs.slice(-50), logEntry]; // Keep last 50 logs
		console.log(`🔧 ${message}`, data || '');
	}
	
	// Svelte action to attach video track to element
	function attachTrack(node: HTMLVideoElement, participant: any) {
		function update(p: any) {
			if (p?.videoTrack) {
				const stream = new MediaStream([p.videoTrack]);
				node.srcObject = stream;
				node.play().catch(err => console.log('Autoplay blocked:', err));
			} else {
				node.srcObject = null;
			}
		}
		update(participant);
		return { update };
	}

	onMount(async () => {
		// Check if Daily is configured
		if (!data.dailyConfig?.configured) {
			console.warn('⚠️ Daily.co is not configured. Add PRIVATE_DAILY_API_KEY to .env');
			return;
		}

		// Dynamically import DailyIframe
		const DailyIframe = (await import('@daily-co/daily-js')).default;
		
		if (!data.dailyConfig?.roomUrl) {
			console.error('No Daily Room URL found');
			return;
		}

		// Initialize Daily Call Object (Headless)
		// We use createCallObject because we are rendering custom video elements
		daily = DailyIframe.createCallObject({
			url: data.dailyConfig.roomUrl,
			token: data.dailyConfig.token,
			subscribeToTracksAutomatically: true
		});

		// Event Listeners
		daily
			.on('joined-meeting', (e: any) => {
				debugLog('✅ Joined meeting', { participants: Object.keys(daily.participants()).length });
				updateParticipants();
			})
			.on('participant-joined', (e: any) => {
				debugLog('👤 Participant joined', { 
					name: e.participant?.user_name, 
					id: e.participant?.session_id 
				});
				updateParticipants();
			})
			.on('participant-updated', (e: any) => {
				debugLog('🔄 Participant updated', { 
					name: e.participant?.user_name,
					video: e.participant?.tracks?.video?.state,
					audio: e.participant?.tracks?.audio?.state
				});
				updateParticipants();
			})
			.on('participant-left', (e: any) => {
				debugLog('👋 Participant left', { name: e.participant?.user_name });
				updateParticipants();
			})
			.on('track-started', (e: any) => {
				debugLog('🎥 Track started', { 
					participant: e.participant?.user_name,
					kind: e.track?.kind,
					state: e.participant?.tracks?.[e.track?.kind]?.state
				});
				updateParticipants();
			})
			.on('track-stopped', (e: any) => {
				debugLog('⏹️ Track stopped', { 
					participant: e.participant?.user_name,
					kind: e.track?.kind 
				});
				updateParticipants();
			})
			.on('active-speaker-change', (e: any) => {
				// If we haven't manually overridden, follow the active speaker
				// activeSpeakerId = e.activeSpeaker.peerId; 
				// actually we want to control it manually usually
			})
			.on('error', (e: any) => {
				debugLog('❌ Daily Error', e);
				console.error('Daily Error:', e);
			});

		// Join the room
		await daily.join();
		console.log('Joined Daily room as Admin');
	});

	function updateParticipants() {
		if (!daily) return;
		const p = daily.participants();
		
		debugLog('📊 Raw participants', Object.keys(p).map(key => ({
			id: p[key].session_id,
			name: p[key].user_name,
			videoState: p[key].tracks?.video?.state,
			audioState: p[key].tracks?.audio?.state,
			hasTrack: !!p[key].tracks?.video?.persistentTrack
		})));
		
		participants = Object.values(p).map((participant: any) => {
			const videoTrackInfo = participant.tracks?.video;
			const audioTrackInfo = participant.tracks?.audio;
			
			return {
				id: participant.session_id,
				name: participant.user_name || 'Guest',
				type: participant.local ? 'admin' : 'camera',
				hasVideo: videoTrackInfo?.state === 'playable',
				hasAudio: audioTrackInfo?.state === 'playable',
				local: participant.local,
				// Only use track if it's playable
				videoTrack: videoTrackInfo?.state === 'playable' ? videoTrackInfo.persistentTrack : null,
				audioTrack: audioTrackInfo?.state === 'playable' ? audioTrackInfo.persistentTrack : null
			};
		});
		
		debugLog('✅ Processed participants', participants.map(p => ({
			name: p.name,
			hasVideo: p.hasVideo,
			hasTrack: !!p.videoTrack
		})));
		
		// Update program monitor if active speaker has new track
		requestAnimationFrame(() => updateProgramMonitor());
	}
	
	function updateProgramMonitor() {
		if (!programVideoEl || !activeSpeakerId) return;
		const activeParticipant = participants.find(p => p.id === activeSpeakerId);
		if (activeParticipant?.videoTrack) {
			const currentTrack = (programVideoEl.srcObject as MediaStream)?.getVideoTracks()[0];
			if (currentTrack?.id !== activeParticipant.videoTrack.id) {
				programVideoEl.srcObject = new MediaStream([activeParticipant.videoTrack]);
			}
		}
	}
	
	// --- Actions ---
	/**
	 * Per Daily.co docs: Use client SDK callFrame.startLiveStreaming() 
	 * The caller must have "streaming admin" or room-owner privileges (is_owner: true in token)
	 * 
	 * For RTMP: provide rtmpUrl
	 * For HLS: requires streaming_endpoints configured on room, then use endpoint param
	 * 
	 * Since HLS requires S3 bucket config, we'll use RTMP to a service OR
	 * Daily's built-in HLS which returns an hls_url in the response
	 */
	async function toggleBroadcast() {
		if (isLoading || !daily) return;
		isLoading = true;

		try {
			if (!isLive) {
				// START streaming using Daily client SDK
				// Per docs: callFrame.startLiveStreaming({ layout: { preset: 'active-participant' } })
				const streamResult = await daily.startLiveStreaming({
					layout: {
						preset: 'active-participant' // Shows active speaker with others in sidebar
					}
					// Note: Without rtmpUrl or endpoint, Daily may not produce output
					// For production, configure streaming_endpoints on room for HLS
					// OR provide rtmpUrl to stream to YouTube/Twitch/etc
				});
				
				console.log('🔴 startLiveStreaming result:', streamResult);
				
				isLive = true;
				liveDuration = 0;
				liveTimer = setInterval(() => {
					liveDuration++;
				}, 1000);

				// Update Firestore via API
				await fetch('/api/admin/switcher/broadcast', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						memorialId: data.memorial.id, 
						action: 'start',
						hlsUrl: streamResult?.hls_url || null
					})
				});

				if (streamResult?.hls_url) {
					hlsUrl = streamResult.hls_url;
				}

			} else {
				// STOP streaming using Daily client SDK
				await daily.stopLiveStreaming();
				console.log('⚪ Stream stopped');
				
				isLive = false;
				hlsUrl = null;
				if (liveTimer) {
					clearInterval(liveTimer);
					liveTimer = null;
				}

				// Update Firestore via API
				await fetch('/api/admin/switcher/broadcast', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						memorialId: data.memorial.id, 
						action: 'stop'
					})
				});
			}
		} catch (err) {
			console.error('Broadcast toggle error:', err);
			alert('Failed to toggle broadcast: ' + (err as Error).message);
		} finally {
			isLoading = false;
		}
	}

	// --- Layout Helpers ---
	function formatDuration(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function switchCamera(id: string) {
		console.log('Switching to camera:', id);
		activeSpeakerId = id;
		
		// Update program monitor video
		requestAnimationFrame(() => updateProgramMonitor());
		
		// Per Daily docs: Use updateLiveStreaming to change layout mid-stream
		// preset: 'single-participant' focuses on one participant
		if (daily && isLive) {
			daily.updateLiveStreaming({
				layout: {
					preset: 'single-participant',
					session_id: id // Focus on this participant
				}
			}).then(() => {
				console.log('✅ Layout updated to focus on:', id);
			}).catch((err: Error) => {
				console.error('Failed to update layout:', err);
			});
		}
	}

	async function generateInvite(label: string) {
		const res = await fetch('/api/admin/switcher/invite', {
			method: 'POST',
			body: JSON.stringify({ 
				memorialId: data.memorial.id, 
				cameraLabel: label 
			})
		});
		const json = await res.json();
		if (json.joinUrl) {
			// Generate QR code URL using QR code API
			const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(json.joinUrl)}`;
			
			// Set state and show modal
			cameraJoinUrl = json.joinUrl;
			qrCodeUrl = qrApiUrl;
			cameraLabel = label;
			showQRModal = true;
		}
	}
	
	function copyToClipboard() {
		if (cameraJoinUrl) {
			navigator.clipboard.writeText(cameraJoinUrl);
			alert('Link copied to clipboard!');
		}
	}
	
	function closeQRModal() {
		showQRModal = false;
		qrCodeUrl = null;
		cameraJoinUrl = null;
		cameraLabel = '';
	}

</script>

<div class="min-h-screen bg-gray-900 text-white flex flex-col">
	
	<!-- Configuration Warning -->
	{#if !data.dailyConfig?.configured}
		<div class="bg-yellow-900/50 border-b border-yellow-700 px-4 py-3 flex items-center gap-3">
			<span class="text-yellow-400 text-xl">⚠️</span>
			<div>
				<p class="text-yellow-300 font-medium">Daily.co Not Configured</p>
				<p class="text-yellow-400/70 text-sm">Add <code class="bg-black/30 px-1 rounded">PRIVATE_DAILY_API_KEY</code> to your .env file to enable livestreaming.</p>
			</div>
		</div>
	{/if}

	<!-- 1. HEADER -->
	<header class="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
		<div class="flex items-center gap-4">
			<div class="bg-gray-700 p-2 rounded">
				<Monitor size={20} class="text-gray-400" />
			</div>
			<div>
				<h1 class="font-bold text-lg">{data.memorial.name}</h1>
				<div class="text-xs text-gray-400 flex items-center gap-2">
					<span class="w-2 h-2 rounded-full {isLive ? 'bg-red-500' : 'bg-gray-500'}"></span>
					{isLive ? 'LIVE BROADCAST' : 'OFFLINE'}
					{#if isLive}
						<span class="font-mono ml-2">{formatDuration(liveDuration)}</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
				<Smartphone size={16} class="text-gray-400" />
				<span class="text-sm font-medium">{participantCount} Sources</span>
			</div>
			
			<button 
				class="flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all
				{isLive 
					? 'bg-red-500/10 text-red-500 border border-red-500 hover:bg-red-500 hover:text-white' 
					: 'bg-red-600 text-white hover:bg-red-700'}
				{isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
				onclick={toggleBroadcast}
				disabled={isLoading}
			>
				{#if isLoading}
					<span class="animate-spin">⏳</span> {isLive ? 'STOPPING...' : 'STARTING...'}
				{:else if isLive}
					<Power size={18} /> END STREAM
				{:else}
					<Radio size={18} /> GO LIVE
				{/if}
			</button>
		</div>
	</header>

	<!-- HLS URL Banner (when live) -->
	{#if isLive && hlsUrl}
		<div class="bg-green-900/50 border-b border-green-700 px-4 py-2 flex items-center justify-between">
			<div class="flex items-center gap-2 text-green-400 text-sm">
				<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
				<span>HLS Stream Active</span>
			</div>
			<div class="flex items-center gap-2">
				<code class="text-xs bg-black/30 px-2 py-1 rounded text-green-300 max-w-md truncate">{hlsUrl}</code>
				<button 
					class="text-xs bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-white"
					onclick={() => {
						navigator.clipboard.writeText(hlsUrl || '');
						alert('HLS URL copied!');
					}}
				>
					Copy
				</button>
			</div>
		</div>
	{/if}

	<!-- 2. MAIN CONTENT (Program & Previews) -->
	<main class="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
		
		<!-- PROGRAM MONITOR (Top) -->
		<div class="flex-1 flex justify-center min-h-0">
			<div class="aspect-video bg-black rounded-lg border border-gray-800 shadow-2xl relative w-full max-w-5xl overflow-hidden group">
				<!-- Active Video Feed -->
				<video 
					bind:this={programVideoEl}
					autoplay 
					playsinline
					muted
					class="absolute inset-0 w-full h-full object-contain bg-black"
				></video>
				
				<!-- Placeholder when no source selected -->
				{#if !activeSpeakerId}
					<div class="absolute inset-0 flex items-center justify-center text-gray-600">
						<p>Select a source below to preview</p>
					</div>
				{/if}
				
				<!-- Program Badge -->
				<div class="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
					PROGRAM OUT
				</div>
				
				<!-- Active Source Name -->
				{#if activeSpeakerId}
					<div class="absolute bottom-4 left-4 bg-black/70 text-white text-sm px-3 py-1 rounded">
						{participants.find(p => p.id === activeSpeakerId)?.name || 'Unknown'}
					</div>
				{/if}
			</div>
		</div>

		<!-- SOURCE TRAY (Bottom) -->
		<div class="h-48 flex gap-4 overflow-x-auto pb-2 px-2">
			
			<!-- ADD SOURCE CARD -->
			<button 
				class="flex-shrink-0 w-64 bg-gray-800 rounded-lg border border-dashed border-gray-600 hover:border-gray-400 hover:bg-gray-750 flex flex-col items-center justify-center gap-2 transition-all text-gray-400 hover:text-white group"
				onclick={() => generateInvite('Camera ' + (participants.length + 1))}
			>
				<div class="p-3 rounded-full bg-gray-700 group-hover:bg-gray-600">
					<QrCode size={24} />
				</div>
				<span class="text-sm font-medium">Connect Camera</span>
				<span class="text-xs text-gray-500">Scan QR or Copy Link</span>
			</button>

			<!-- CAMERA PREVIEWS -->
			{#each validParticipants as p (p.id)}
				<button 
					class="flex-shrink-0 w-64 bg-black rounded-lg border-2 overflow-hidden relative transition-all
					{activeSpeakerId === p.id 
						? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
						: 'border-gray-700 hover:border-gray-500'}"
					onclick={() => switchCamera(p.id)}
				>
					<!-- Real Video Feed -->
					<video 
						use:attachTrack={p}
						autoplay 
						playsinline
						muted
						class="absolute inset-0 w-full h-full object-cover"
					></video>
					
					<!-- Fallback if no video -->
					{#if !p.hasVideo}
						<div class="absolute inset-0 bg-gray-800 flex items-center justify-center">
							<VideoOff size={32} class="text-gray-600" />
						</div>
					{/if}

					<!-- Label Overlay -->
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 flex justify-between items-end">
						<div class="text-left">
							<div class="text-sm font-bold truncate">{p.name}</div>
							<div class="text-xs text-gray-400 flex items-center gap-1">
								{#if p.hasAudio} <Mic size={10} /> {:else} <MicOff size={10} class="text-red-400" /> {/if}
								{p.type}
							</div>
						</div>
						{#if activeSpeakerId === p.id}
							<div class="text-[10px] bg-red-600 px-1.5 py-0.5 rounded font-bold">LIVE</div>
						{/if}
					</div>
				</button>
			{/each}

		</div>

	</main>
	
	<!-- QR CODE MODAL -->
	{#if showQRModal}
		<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onclick={closeQRModal}>
			<div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700" onclick={(e) => e.stopPropagation()}>
				<!-- Header -->
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-xl font-bold text-white">Connect {cameraLabel}</h3>
					<button onclick={closeQRModal} class="text-gray-400 hover:text-white text-2xl leading-none">×</button>
				</div>
				
				<!-- QR Code -->
				<div class="bg-white p-4 rounded-lg mb-4 flex justify-center">
					{#if qrCodeUrl}
						<img src={qrCodeUrl} alt="QR Code" class="w-64 h-64" />
					{:else}
						<div class="w-64 h-64 flex items-center justify-center text-gray-400">Loading...</div>
					{/if}
				</div>
				
				<!-- Instructions -->
				<div class="mb-4">
					<p class="text-sm text-gray-300 mb-2">📱 Scan with your phone camera to join</p>
					<p class="text-xs text-gray-400">Or copy the link below and open in a mobile browser</p>
				</div>
				
				<!-- Link -->
				<div class="bg-gray-900 rounded p-3 mb-4">
					<p class="text-xs text-gray-400 mb-1">Join URL:</p>
					<p class="text-sm text-green-400 break-all font-mono">{cameraJoinUrl}</p>
				</div>
				
				<!-- Actions -->
				<div class="flex gap-2">
					<button 
						onclick={copyToClipboard}
						class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
					>
						📋 Copy Link
					</button>
					<button 
						onclick={closeQRModal}
						class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- DEBUG PANEL -->
	<div class="fixed bottom-20 right-4 z-50">
		<button 
			class="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-mono hover:bg-gray-700 transition-colors"
			onclick={() => showDebug = !showDebug}
		>
			🔧 Debug {showDebug ? '▼' : '▲'}
		</button>
		
		{#if showDebug}
			<div class="absolute bottom-12 right-0 w-96 max-h-96 bg-gray-900 text-green-400 rounded-lg shadow-2xl overflow-hidden">
				<div class="p-2 bg-gray-800 text-white text-xs font-bold flex justify-between items-center">
					<span>Debug Console ({debugLogs.length} logs)</span>
					<button 
						onclick={() => debugLogs = []} 
						class="text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors"
					>
						Clear
					</button>
				</div>
				<div class="p-2 overflow-y-auto max-h-64 font-mono text-xs">
					{#each debugLogs as log}
						<pre class="whitespace-pre-wrap mb-1 border-b border-gray-700 pb-1 text-green-300">{log}</pre>
					{/each}
					{#if debugLogs.length === 0}
						<p class="text-gray-500">No logs yet...</p>
					{/if}
				</div>
				<div class="p-2 bg-gray-800 text-xs space-y-1">
					<div class="text-white flex justify-between">
						<span>Valid Sources:</span>
						<span class="font-bold">{validParticipants.length}</span>
					</div>
					<div class="text-white flex justify-between">
						<span>Total Participants:</span>
						<span class="font-bold text-gray-400">{participants.length}</span>
					</div>
					<div class="text-white flex justify-between">
						<span>Active:</span>
						<span class="font-bold">{activeSpeakerId ? participants.find(p => p.id === activeSpeakerId)?.name || 'Unknown' : 'None'}</span>
					</div>
					<div class="text-white flex justify-between">
						<span>Live:</span>
						<span class="font-bold {isLive ? 'text-red-400' : 'text-gray-400'}">{isLive ? 'YES' : 'NO'}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Custom Scrollbar for Tray */
	::-webkit-scrollbar {
		height: 8px;
	}
	::-webkit-scrollbar-track {
		background: #1f2937; 
	}
	::-webkit-scrollbar-thumb {
		background: #374151; 
		border-radius: 4px;
	}
	::-webkit-scrollbar-thumb:hover {
		background: #4b5563; 
	}
</style>
