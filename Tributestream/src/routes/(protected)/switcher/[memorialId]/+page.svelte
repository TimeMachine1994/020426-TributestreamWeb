<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { SvelteMap } from 'svelte/reactivity';
	import AddCameraModal from '$lib/components/AddCameraModal.svelte';
	import CompositorCanvas from '$lib/components/CompositorCanvas.svelte';
	import LiveKitDeviceStream from '$lib/components/LiveKitDeviceStream.svelte';
	import { LiveKitRoom, type LiveKitConnectionState } from '$lib/livekit/client';
	import { Track } from 'livekit-client';
	import { SourceManager } from '$lib/compositor/SourceManager.svelte';
	import { Compositor } from '$lib/compositor/Compositor.svelte';
	import { AudioMixer } from '$lib/compositor/AudioMixer';
	import type { TransitionType } from '$lib/compositor/types';

	let { data } = $props();

	// --- Compositor setup ---
	const sourceManager = new SourceManager();
	const compositor = new Compositor(sourceManager);
	const audioMixer = new AudioMixer();
	let livekitRoom: LiveKitRoom | null = null;
	let livekitState = $state<LiveKitConnectionState>('disconnected');
	let egressId: string | null = null;

	let showAddCamera = $state(false);
	let localIdCounter = $state(0);
	let transitionType = $state<TransitionType>('cut');
	let transitionDuration = $state(500);
	// Map of participant identity → MediaStream (from LiveKit track subscriptions)
	let deviceStreams = new SvelteMap<string, MediaStream>();
	let deviceStates = new SvelteMap<string, LiveKitConnectionState>();

	const statusColors: Record<string, string> = {
		draft: 'bg-gray-600',
		scheduled: 'bg-blue-600',
		live: 'bg-red-600 animate-pulse',
		ended: 'bg-gray-600',
		archived: 'bg-gray-600'
	};

	// Derived state
	let selectedSourceId = $derived(sourceManager.activePreview);
	let programSourceId = $derived(sourceManager.activeProgram);
	let allSources = $derived(sourceManager.sourceList);

	function selectSource(id: string) {
		sourceManager.setPreview(id);
	}

	function takeToProgram() {
		compositor.takeToProgram(transitionType, transitionDuration);
	}

	/**
	 * Initialize LiveKit room connection for the switcher.
	 * Subscribes to all remote participant tracks (phone cameras).
	 */
	async function initLiveKit() {
		console.log('[Switcher] Initializing LiveKit connection...');

		// Get a switcher token
		const tokenRes = await fetch('/api/livekit/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				memorialId: data.memorial.id,
				identity: `switcher-${data.memorial.id}`,
				name: 'Switcher',
				role: 'switcher'
			})
		});

		if (!tokenRes.ok) {
			console.error('[Switcher] Failed to get LiveKit token');
			return;
		}

		const { token, url } = await tokenRes.json();

		livekitRoom = new LiveKitRoom({
			onConnectionChange: (state) => {
				console.log('[Switcher] LiveKit state:', state);
				livekitState = state;
			},
			onTrackSubscribed: ({ track, participant }) => {
				console.log('[Switcher] Track subscribed:', track.kind, 'from', participant.identity);
				const identity = participant.identity;

				if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
					// Build or update a MediaStream for this participant
					let mediaStream = deviceStreams.get(identity);
					if (!mediaStream) {
						mediaStream = new MediaStream();
						deviceStreams.set(identity, mediaStream);
					}
					mediaStream.addTrack(track.mediaStreamTrack);

					// Register with SourceManager when we have video
					if (track.kind === Track.Kind.Video) {
						const label = participant.name || identity;
						if (!sourceManager.getSource(identity)) {
							sourceManager.addSource(identity, mediaStream, label, 'webrtc');
						}
						deviceStates.set(identity, 'connected');
						sourceManager.updateConnectionState(identity, true);
					}

					// Connect audio to mixer
					if (track.kind === Track.Kind.Audio) {
						audioMixer.connectSource(identity, mediaStream);
					}
				}
			},
			onTrackUnsubscribed: (track, _pub, participant) => {
				console.log('[Switcher] Track unsubscribed:', track.kind, 'from', participant.identity);
				const identity = participant.identity;
				const mediaStream = deviceStreams.get(identity);
				if (mediaStream) {
					mediaStream.removeTrack(track.mediaStreamTrack);
					// If no tracks left, clean up
					if (mediaStream.getTracks().length === 0) {
						deviceStreams.delete(identity);
						sourceManager.removeSource(identity);
						audioMixer.disconnectSource(identity);
						deviceStates.delete(identity);
					}
				}
			},
			onParticipantDisconnected: (participant) => {
				console.log('[Switcher] Participant left:', participant.identity);
				const identity = participant.identity;
				deviceStreams.delete(identity);
				sourceManager.removeSource(identity);
				audioMixer.disconnectSource(identity);
				deviceStates.set(identity, 'disconnected');
			}
		});

		try {
			await livekitRoom.connect(url, token);
			console.log('[Switcher] Connected to LiveKit room:', livekitRoom.roomName);
		} catch (e) {
			console.error('[Switcher] Failed to connect to LiveKit:', e);
		}
	}

	function handleLocalStream(stream: MediaStream, label: string) {
		const id = `local-${localIdCounter++}`;
		sourceManager.addSource(id, stream, label, 'local');
		audioMixer.connectSource(id, stream);
	}

	async function handleDeviceReady(deviceId: string) {
		console.log('[Switcher] Device ready:', deviceId);
		// Refresh the page data to include the new device
		await invalidateAll();
		showAddCamera = false;
	}

	async function removeDevice(deviceId: string) {
		console.log('[Switcher] Removing device:', deviceId);
		try {
			// Remove from compositor/audio
			sourceManager.removeSource(deviceId);
			audioMixer.disconnectSource(deviceId);
			deviceStates.delete(deviceId);
			deviceStreams.delete(deviceId);

			// Delete from database
			await fetch(`/api/devices/${deviceId}`, { method: 'DELETE' });

			// Refresh device list
			await invalidateAll();
			console.log('[Switcher] Device removed successfully');
		} catch (e) {
			console.error('[Switcher] Failed to remove device:', e);
		}
	}

	function removeLocalSource(sourceId: string) {
		console.log('[Switcher] Removing local source:', sourceId);
		const source = sourceManager.getSource(sourceId);
		if (source) {
			// Stop the media tracks
			source.stream.getTracks().forEach(t => t.stop());
		}
		sourceManager.removeSource(sourceId);
		audioMixer.disconnectSource(sourceId);
	}

	function srcObject(node: HTMLVideoElement, stream: MediaStream) {
		node.srcObject = stream;
		return {
			update(newStream: MediaStream) {
				node.srcObject = newStream;
			},
			destroy() {
				node.srcObject = null;
			}
		};
	}

	// --- Overlay controls ---
	let lowerThirdText = $state('');
	let lowerThirdVisible = $state(false);
	const overlayManager = compositor.getOverlayManager();

	function toggleLowerThird() {
		if (!lowerThirdVisible) {
			overlayManager.addTextOverlay('lower-third', lowerThirdText || 'Lower Third', 50, 620, {
				font: 'bold 28px Arial',
				color: '#ffffff',
				backgroundColor: 'rgba(0, 0, 0, 0.7)'
			});
			overlayManager.show('lower-third');
			lowerThirdVisible = true;
		} else {
			overlayManager.hide('lower-third');
			lowerThirdVisible = false;
		}
	}

	// --- Stream controls ---
	let isStreamLoading = $state(false);
	let streamError = $state<string | null>(null);
	let statusOverride = $state<string | null>(null);
	let currentStatus = $derived(statusOverride ?? data.memorial.status);

	async function goLive() {
		isStreamLoading = true;
		streamError = null;

		try {
			console.log('[Switcher] goLive() called');

			// 1. Create Mux stream (get streamKey for egress)
			console.log('[Switcher] Creating Mux stream...');
			const createResponse = await fetch('/api/streams/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId: data.memorial.id })
			});

			if (!createResponse.ok) {
				const err = await createResponse.json();
				throw new Error(err.message || 'Failed to create stream');
			}

			const createData = await createResponse.json();
			console.log('[Switcher] Mux stream created, key:', createData.streamKey?.substring(0, 8) + '...');

			// 2. Set memorial to live on server
			console.log('[Switcher] Setting memorial to live...');
			const liveResponse = await fetch('/api/streams/go-live', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId: data.memorial.id })
			});

			if (!liveResponse.ok) {
				const err = await liveResponse.json();
				throw new Error(err.message || 'Failed to go live');
			}

			// 3. Initialize audio mixer and get compositor output
			const audioStream = audioMixer.initialize();
			const videoStream = compositor.outputStream;
			console.log('[Switcher] Compositor output:', videoStream ? 'available' : 'NULL');

			if (!videoStream) {
				throw new Error('Compositor output stream not available. Make sure a source is in Program first.');
			}

			// 4. Publish composited video + mixed audio to LiveKit room
			if (!livekitRoom || livekitRoom.state !== 'connected') {
				throw new Error('LiveKit room not connected. Wait for connection before going live.');
			}

			const videoTrack = videoStream.getVideoTracks()[0];
			const audioTrack = audioStream?.getAudioTracks()[0] ?? null;

			if (!videoTrack) throw new Error('No video track from compositor');

			console.log('[Switcher] Publishing composited tracks to LiveKit...');
			await livekitRoom.publishTrack(videoTrack, { name: 'composited-video' });
			let pubAudioSid = '';
			if (audioTrack) {
				await livekitRoom.publishTrack(audioTrack, { name: 'composited-audio' });
				// Get the track SID from the Room's local participant
				for (const pub of livekitRoom.getRoom().localParticipant.trackPublications.values()) {
					if (pub.trackName === 'composited-audio') {
						pubAudioSid = pub.trackSid;
						break;
					}
				}
			}

			// Get video track SID
			let pubVideoSid = '';
			for (const pub of livekitRoom.getRoom().localParticipant.trackPublications.values()) {
				if (pub.trackName === 'composited-video') {
					pubVideoSid = pub.trackSid;
					break;
				}
			}

			console.log('[Switcher] Published. Video SID:', pubVideoSid, 'Audio SID:', pubAudioSid);

			// 5. Start LiveKit Egress → Mux RTMP
			console.log('[Switcher] Starting egress to Mux...');
			const egressResponse = await fetch('/api/livekit/egress/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					roomName: `memorial-${data.memorial.id}`,
					muxStreamKey: createData.streamKey,
					audioTrackId: pubAudioSid,
					videoTrackId: pubVideoSid
				})
			});

			if (!egressResponse.ok) {
				const err = await egressResponse.json();
				throw new Error(err.message || 'Failed to start egress');
			}

			const egressData = await egressResponse.json();
			egressId = egressData.egressId;
			console.log('[Switcher] Egress started! ID:', egressId);

			statusOverride = 'live';
			console.log('[Switcher] Go live complete!');
		} catch (e) {
			console.error('[Switcher] goLive error:', e);
			streamError = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isStreamLoading = false;
		}
	}

	async function endStream() {
		isStreamLoading = true;
		streamError = null;

		try {
			// 1. Stop egress
			if (egressId) {
				console.log('[Switcher] Stopping egress:', egressId);
				await fetch('/api/livekit/egress/stop', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ egressId })
				});
				egressId = null;
			}

			// 2. Unpublish composited tracks from LiveKit
			if (livekitRoom) {
				const room = livekitRoom.getRoom();
				for (const pub of room.localParticipant.trackPublications.values()) {
					if (pub.trackName === 'composited-video' || pub.trackName === 'composited-audio') {
						if (pub.track?.mediaStreamTrack) {
							await livekitRoom.unpublishTrack(pub.track.mediaStreamTrack);
						}
					}
				}
			}

			// 3. End stream on server
			const response = await fetch('/api/streams/end', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId: data.memorial.id })
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || 'Failed to end stream');
			}

			statusOverride = 'ended';
		} catch (e) {
			streamError = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isStreamLoading = false;
		}
	}

	onMount(() => {
		compositor.start();
		initLiveKit();
	});

	onDestroy(() => {
		livekitRoom?.disconnect();
		audioMixer.destroy();
		compositor.destroy();
		sourceManager.destroy();
	});
</script>

<div class="flex h-screen flex-col bg-gray-900 text-white">
	<!-- Header -->
	<header class="flex h-14 shrink-0 items-center justify-between border-b border-gray-700 px-4">
		<div class="flex items-center gap-4">
			<a href="/switcher" class="text-sm text-gray-400 hover:text-white">← Back</a>
			<div>
				<h1 class="text-lg font-semibold">{data.memorial.title}</h1>
				<span class="text-xs text-gray-400">/{data.memorial.slug}</span>
			</div>
		</div>
		<div class="flex items-center gap-4">
			{#if streamError}
				<span class="text-xs text-red-400">{streamError}</span>
			{/if}
			{#if livekitState === 'connecting' || livekitState === 'reconnecting'}
				<span class="flex items-center gap-1 text-xs text-yellow-400">
					<span class="h-2 w-2 animate-pulse rounded-full bg-yellow-400"></span>
					LiveKit {livekitState === 'reconnecting' ? 'Reconnecting' : 'Connecting'}
				</span>
			{:else if livekitState === 'connected'}
				<span class="flex items-center gap-1 text-xs text-green-400">
					<span class="h-2 w-2 rounded-full bg-green-400"></span>
					LiveKit
				</span>
			{:else if livekitState === 'disconnected'}
				<span class="flex items-center gap-1 text-xs text-red-400">
					<span class="h-2 w-2 rounded-full bg-red-400"></span>
					LiveKit Off
				</span>
			{/if}
			<span class="rounded px-2 py-1 text-xs font-medium {statusColors[currentStatus]}">
				{currentStatus.toUpperCase()}
			</span>
			{#if currentStatus === 'live'}
				<button
					type="button"
					onclick={endStream}
					disabled={isStreamLoading}
					class="rounded bg-gray-600 px-4 py-1.5 text-sm font-semibold hover:bg-gray-500 disabled:opacity-50"
				>
					{isStreamLoading ? 'ENDING...' : 'END STREAM'}
				</button>
			{:else if currentStatus !== 'ended'}
				<button
					type="button"
					onclick={goLive}
					disabled={isStreamLoading}
					class="rounded bg-red-600 px-4 py-1.5 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
				>
					{isStreamLoading ? 'STARTING...' : 'GO LIVE'}
				</button>
			{/if}
		</div>
	</header>

	<!-- Main Content -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Multiviewer Area -->
		<div class="flex flex-1 flex-col p-4">
			<!-- Program/Preview Monitors -->
			<div class="grid flex-1 grid-cols-2 gap-4">
				<!-- Preview Monitor -->
				<div class="flex flex-col">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs font-medium uppercase tracking-wider text-gray-400">Preview</span>
						<div class="flex items-center gap-2">
							<select
								bind:value={transitionType}
								class="rounded bg-gray-700 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
							>
								<option value="cut">CUT</option>
								<option value="fade">FADE</option>
							</select>
							<button
								onclick={takeToProgram}
								disabled={!selectedSourceId}
								class="rounded bg-indigo-600 px-3 py-1 text-xs font-medium hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
							>
								TAKE →
							</button>
						</div>
					</div>
					<div class="relative flex-1 rounded-lg border-2 border-green-500 bg-black">
						<CompositorCanvas {compositor} mode="preview" />
						{#if !selectedSourceId}
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="text-sm text-gray-500">Select a source</span>
							</div>
						{/if}
						<div class="absolute bottom-2 left-2 rounded bg-green-600 px-2 py-0.5 text-xs font-medium">
							PVW
						</div>
					</div>
				</div>

				<!-- Program Monitor -->
				<div class="flex flex-col">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs font-medium uppercase tracking-wider text-gray-400">Program</span>
						{#if currentStatus === 'live'}
							<span class="flex items-center gap-1 text-xs text-red-500">
								<span class="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
								LIVE
							</span>
						{/if}
					</div>
					<div class="relative flex-1 rounded-lg border-2 border-red-500 bg-black">
						<CompositorCanvas {compositor} mode="program" showFps={true} />
						{#if !programSourceId}
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="text-sm text-gray-500">No program source</span>
							</div>
						{/if}
						<div class="absolute bottom-2 left-2 rounded bg-red-600 px-2 py-0.5 text-xs font-medium">
							PGM
						</div>
					</div>
				</div>
			</div>

			<!-- Source Thumbnails (Multiviewer) -->
			<div class="mt-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs font-medium uppercase tracking-wider text-gray-400">Sources ({allSources.length})</span>
					{#if compositor.isRunning}
						<span class="text-xs text-gray-500">{compositor.measuredFps} fps</span>
					{/if}
				</div>
				<div class="grid grid-cols-4 gap-2">
					<!-- LiveKit Device Sources -->
					{#each data.devices as device (device.id)}
						<div class="relative aspect-video overflow-hidden rounded border-2 bg-gray-800 transition {selectedSourceId === device.id
								? 'border-green-500'
								: programSourceId === device.id
									? 'border-red-500'
									: 'border-gray-600 hover:border-gray-500'}">
							<button
								onclick={() => selectSource(device.id)}
								class="h-full w-full"
								aria-label="Select {device.name ?? 'Camera'}"
							>
								<LiveKitDeviceStream
									deviceName={device.name ?? 'Camera'}
									stream={deviceStreams.get(device.id) ?? null}
									connectionState={deviceStates.get(device.id) ?? 'disconnected'}
								/>
							</button>
							{#if device.batteryLevel !== null}
								<div class="absolute bottom-1 right-1 rounded bg-gray-900/80 px-1.5 py-0.5 text-xs">
									{device.batteryLevel}%
								</div>
							{/if}
							<button
								onclick={(e) => { e.stopPropagation(); removeDevice(device.id); }}
								class="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600/80 text-xs text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100 [div:hover>&]:opacity-100"
								title="Remove device"
							>
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					{/each}

					<!-- Local Camera Sources (from SourceManager) -->
					{#each allSources.filter(s => s.type === 'local') as source (source.id)}
						<div class="relative aspect-video overflow-hidden rounded border-2 bg-gray-800 transition {selectedSourceId === source.id
								? 'border-green-500'
								: programSourceId === source.id
									? 'border-red-500'
									: 'border-gray-600 hover:border-gray-500'}">
							<button
								onclick={() => selectSource(source.id)}
								class="h-full w-full"
								aria-label="Select {source.label}"
							>
								<video
									autoplay
									playsinline
									muted
									class="h-full w-full object-cover"
									use:srcObject={source.stream}
								></video>
							</button>
							<div class="absolute bottom-1 left-1 rounded bg-gray-900/80 px-1.5 py-0.5 text-xs">
								{source.label}
							</div>
							<div class="absolute top-1 right-1 rounded bg-indigo-600/80 px-1.5 py-0.5 text-xs">
								Local
							</div>
							<button
								onclick={(e) => { e.stopPropagation(); removeLocalSource(source.id); }}
								class="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600/80 text-xs text-white opacity-0 transition hover:bg-red-500 [div:hover>&]:opacity-100"
								title="Remove source"
							>
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					{/each}

					<!-- Add Device Slot -->
					<button
						onclick={() => (showAddCamera = true)}
						class="flex aspect-video items-center justify-center rounded border-2 border-dashed border-gray-600 bg-gray-800/50 transition hover:border-gray-500 hover:bg-gray-800"
					>
						<div class="text-center">
							<svg class="mx-auto h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							<span class="mt-1 block text-xs text-gray-500">Add Camera</span>
						</div>
					</button>
				</div>
			</div>
		</div>

		<!-- Right Sidebar -->
		<aside class="w-72 shrink-0 overflow-y-auto border-l border-gray-700 bg-gray-800">
			<!-- Devices Panel -->
			<div class="border-b border-gray-700 p-4">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">
					Connected Devices ({data.devices.length})
				</h2>
				<div class="mt-3 space-y-2">
					{#if data.devices.length === 0}
						<p class="text-sm text-gray-500">No devices connected.</p>
						<button
							onclick={() => (showAddCamera = true)}
							class="mt-2 w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500"
						>
							Add Camera
						</button>
					{:else}
						{#each data.devices as device (device.id)}
							<div class="flex items-center justify-between rounded bg-gray-700 px-3 py-2">
								<div class="flex items-center gap-2">
									<span class="h-2 w-2 rounded-full {device.status === 'connected' ? 'bg-green-500' : 'bg-gray-500'}"></span>
									<span class="text-sm">{device.name ?? 'Camera'}</span>
								</div>
								{#if device.batteryLevel !== null}
									<span class="text-xs text-gray-400">{device.batteryLevel}%</span>
								{/if}
							</div>
						{/each}
						<button
							onclick={() => (showAddCamera = true)}
							class="w-full rounded border border-gray-600 px-3 py-2 text-sm hover:bg-gray-700"
						>
							+ Add Another
						</button>
					{/if}
				</div>
			</div>

			<!-- Stream Info -->
			<div class="border-b border-gray-700 p-4">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Stream Info</h2>
				<div class="mt-3 space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-400">Status</span>
						<span class="font-medium">{data.memorial.status}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-400">Chat</span>
						<span class="font-medium">{data.memorial.chatEnabled ? 'Enabled' : 'Disabled'}</span>
					</div>
					{#if data.memorial.scheduledAt}
						<div class="flex justify-between">
							<span class="text-gray-400">Scheduled</span>
							<span class="font-medium text-xs">
								{new Date(data.memorial.scheduledAt).toLocaleString()}
							</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Overlay Controls -->
			<div class="border-b border-gray-700 p-4">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Overlays</h2>
				<div class="mt-3 space-y-3">
					<!-- Lower Third -->
					<div>
						<label for="lower-third-text" class="mb-1 block text-xs text-gray-400">Lower Third</label>
						<input
							id="lower-third-text"
							type="text"
							placeholder="Enter text..."
							bind:value={lowerThirdText}
							class="w-full rounded bg-gray-700 px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
						/>
						<div class="mt-2 flex gap-2">
							<button
								onclick={toggleLowerThird}
								class="flex-1 rounded px-2 py-1 text-xs font-medium {lowerThirdVisible
									? 'bg-green-600 hover:bg-green-500'
									: 'bg-gray-600 hover:bg-gray-500'}"
							>
								{lowerThirdVisible ? 'HIDE' : 'SHOW'}
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="p-4">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Actions</h2>
				<div class="mt-3 space-y-2">
					<a
						href="/{data.memorial.slug}"
						target="_blank"
						class="block w-full rounded bg-gray-700 px-3 py-2 text-center text-sm hover:bg-gray-600"
					>
						View Public Page
					</a>
					<a
						href="/admin/memorials/{data.memorial.id}"
						class="block w-full rounded bg-gray-700 px-3 py-2 text-center text-sm hover:bg-gray-600"
					>
						Edit Memorial
					</a>
				</div>
			</div>
		</aside>
	</div>
</div>

{#if showAddCamera}
	<AddCameraModal
		memorialId={data.memorial.id}
		onClose={() => (showAddCamera = false)}
		onLocalStream={handleLocalStream}
		onDeviceReady={handleDeviceReady}
	/>
{/if}
