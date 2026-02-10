<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Room, RoomEvent, Track, ConnectionState, type RemoteTrack, type RemoteTrackPublication, type RemoteParticipant, type RpcInvocationData } from 'livekit-client';
	import { SourceManager } from '$lib/compositor/SourceManager.svelte';
	import { Compositor } from '$lib/compositor/Compositor.svelte';
	import { AudioMixer } from '$lib/compositor/AudioMixer';
	import {
		RPC_SWITCH_SOURCE,
		RPC_SET_PREVIEW,
		RPC_SET_OVERLAY,
		RPC_GET_STATE,
		TOPIC_COMPOSITOR_STATE,
		TOPIC_COMPOSITOR_IDENTITY,
		type SwitchSourcePayload,
		type SetPreviewPayload,
		type SetOverlayPayload,
		type CompositorState,
		type SourceInfo
	} from '$lib/livekit/rpc-commands';

	let { data } = $props();

	// --- Compositor setup ---
	const sourceManager = new SourceManager();
	const compositor = new Compositor(sourceManager);
	const audioMixer = new AudioMixer();
	let room: Room | null = null;
	let programCanvas: HTMLCanvasElement;
	let hasStartedRecording = false;

	const encoder = new TextEncoder();

	// --- State broadcasting ---
	function broadcastState() {
		if (!room || room.state !== ConnectionState.Connected) return;

		const state = buildState();
		try {
			room.localParticipant.publishData(
				encoder.encode(JSON.stringify(state)),
				{ reliable: true, topic: TOPIC_COMPOSITOR_STATE }
			);
		} catch (e) {
			console.warn('[EgressTemplate] Failed to broadcast state:', e);
		}
	}

	function buildState(): CompositorState {
		const sources: SourceInfo[] = sourceManager.sourceList.map((s) => ({
			id: s.id,
			label: s.label,
			type: s.type,
			connected: true
		}));

		const overlays = compositor.getOverlayManager().getActiveOverlays();

		return {
			compositorIdentity: room?.localParticipant?.identity ?? '',
			programSource: sourceManager.activeProgram,
			previewSource: sourceManager.activePreview,
			sources,
			overlays: overlays.map((o: { id: string; type: string; visible: boolean }) => ({
				id: o.id,
				type: o.type,
				visible: o.visible
			}))
		};
	}

	// --- RPC Handlers ---
	function registerRpcHandlers() {
		if (!room) return;

		room.registerRpcMethod(RPC_SWITCH_SOURCE, async (data: RpcInvocationData) => {
			const payload: SwitchSourcePayload = JSON.parse(data.payload);
			console.log('[EgressTemplate] RPC switchSource:', payload);

			const source = sourceManager.getSource(payload.sourceId);
			if (!source) {
				return JSON.stringify({ ok: false, activeSource: sourceManager.activeProgram });
			}

			// Set as preview first, then take to program
			sourceManager.setPreview(payload.sourceId);
			compositor.takeToProgram(payload.transition, payload.duration);

			broadcastState();
			return JSON.stringify({ ok: true, activeSource: payload.sourceId });
		});

		room.registerRpcMethod(RPC_SET_PREVIEW, async (data: RpcInvocationData) => {
			const payload: SetPreviewPayload = JSON.parse(data.payload);
			console.log('[EgressTemplate] RPC setPreview:', payload);
			sourceManager.setPreview(payload.sourceId);
			broadcastState();
			return JSON.stringify({ ok: true });
		});

		room.registerRpcMethod(RPC_SET_OVERLAY, async (data: RpcInvocationData) => {
			const payload: SetOverlayPayload = JSON.parse(data.payload);
			console.log('[EgressTemplate] RPC setOverlay:', payload);

			const overlayManager = compositor.getOverlayManager();
			if (payload.visible) {
				overlayManager.addTextOverlay(
					payload.id,
					payload.text,
					payload.x ?? 50,
					payload.y ?? 620,
					{
						font: 'bold 28px Arial',
						color: '#ffffff',
						backgroundColor: 'rgba(0, 0, 0, 0.7)'
					}
				);
				overlayManager.show(payload.id);
			} else {
				overlayManager.hide(payload.id);
			}

			broadcastState();
			return JSON.stringify({ ok: true });
		});

		room.registerRpcMethod(RPC_GET_STATE, async (_data: RpcInvocationData) => {
			console.log('[EgressTemplate] RPC getState');
			return JSON.stringify(buildState());
		});
	}

	// --- LiveKit room connection ---
	async function connectToRoom() {
		if (!data.livekitUrl || !data.token) {
			console.error('[EgressTemplate] Missing LiveKit URL or token');
			return;
		}

		room = new Room({
			adaptiveStream: true,
			dynacast: true
		});

		// Register RPC handlers before connecting
		registerRpcHandlers();

		// Track subscribed — add to compositor
		room.on(
			RoomEvent.TrackSubscribed,
			(track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
				console.log('[EgressTemplate] Track subscribed:', track.kind, 'from', participant.identity);
				const identity = participant.identity;

				if (track.kind === Track.Kind.Video) {
					const mediaStream = new MediaStream([track.mediaStreamTrack]);
					const label = participant.name || identity;

					if (!sourceManager.getSource(identity)) {
						sourceManager.addSource(identity, mediaStream, label, 'webrtc');
						console.log('[EgressTemplate] Added source:', identity, label);

						// Auto-select first source as program
						if (!sourceManager.activeProgram) {
							sourceManager.setPreview(identity);
							compositor.takeToProgram('cut', 0);
							console.log('[EgressTemplate] Auto-selected program:', identity);
						}

						broadcastState();
						maybeStartRecording();
					}
				}

				if (track.kind === Track.Kind.Audio) {
					const audioStream = new MediaStream([track.mediaStreamTrack]);
					audioMixer.connectSource(identity, audioStream);
				}
			}
		);

		// Track unsubscribed — remove from compositor
		room.on(
			RoomEvent.TrackUnsubscribed,
			(track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
				console.log('[EgressTemplate] Track unsubscribed:', track.kind, 'from', participant.identity);
				const identity = participant.identity;

				if (track.kind === Track.Kind.Video) {
					const wasProgram = sourceManager.activeProgram === identity;
					sourceManager.removeSource(identity);

					// Auto-switch to next available source if program source left
					if (wasProgram) {
						const remaining = sourceManager.sourceList;
						if (remaining.length > 0) {
							sourceManager.setPreview(remaining[0].id);
							compositor.takeToProgram('cut', 0);
							console.log('[EgressTemplate] Auto-switched program to:', remaining[0].id);
						}
					}

					broadcastState();
				}

				if (track.kind === Track.Kind.Audio) {
					audioMixer.disconnectSource(identity);
				}
			}
		);

		// Participant disconnected — cleanup
		room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
			console.log('[EgressTemplate] Participant disconnected:', participant.identity);
			const identity = participant.identity;
			const wasProgram = sourceManager.activeProgram === identity;

			sourceManager.removeSource(identity);
			audioMixer.disconnectSource(identity);

			if (wasProgram) {
				const remaining = sourceManager.sourceList;
				if (remaining.length > 0) {
					sourceManager.setPreview(remaining[0].id);
					compositor.takeToProgram('cut', 0);
				}
			}

			broadcastState();
		});

		room.on(RoomEvent.Disconnected, () => {
			console.log('[EgressTemplate] Room disconnected');
			console.log('END_RECORDING');
		});

		try {
			console.log('[EgressTemplate] Connecting to:', data.livekitUrl);
			await room.connect(data.livekitUrl, data.token);
			console.log('[EgressTemplate] Connected to room:', room.name, 'as', room.localParticipant.identity);

			// Announce compositor identity so switcher can target RPC calls
			room.localParticipant.publishData(
				encoder.encode(JSON.stringify({ identity: room.localParticipant.identity })),
				{ reliable: true, topic: TOPIC_COMPOSITOR_IDENTITY }
			);

			// Broadcast initial state
			broadcastState();
		} catch (e) {
			console.error('[EgressTemplate] Failed to connect:', e);
		}
	}

	function maybeStartRecording() {
		if (hasStartedRecording) return;
		if (!compositor.isRunning) return;
		if (sourceManager.sourceList.length === 0) return;

		hasStartedRecording = true;
		// LiveKit Egress waits for this console.log to begin capture
		console.log('START_RECORDING');
		console.log('[EgressTemplate] Recording started');
	}

	onMount(() => {
		// Setup compositor with canvas
		if (programCanvas) {
			compositor.setProgramCanvas(programCanvas);
		}
		compositor.start();

		// Connect to LiveKit room
		connectToRoom();
	});

	onDestroy(() => {
		room?.disconnect();
		audioMixer.destroy();
		compositor.destroy();
		sourceManager.destroy();
	});
</script>

<svelte:head>
	<title>Egress Template</title>
	<style>
		html, body {
			margin: 0;
			padding: 0;
			overflow: hidden;
			background: #000;
			width: 100vw;
			height: 100vh;
		}
	</style>
</svelte:head>

<canvas
	bind:this={programCanvas}
	style="width: 100vw; height: 100vh; display: block;"
></canvas>
