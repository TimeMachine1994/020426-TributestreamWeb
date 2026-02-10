import { EgressClient, StreamOutput, StreamProtocol, EncodingOptionsPreset } from 'livekit-server-sdk';
import { env } from '$env/dynamic/private';

if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
	console.warn('LiveKit env vars not set. Egress features will be disabled.');
}

function getEgressClient(): EgressClient | null {
	if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
		return null;
	}
	// EgressClient needs the HTTP URL (not ws://)
	const httpUrl = env.LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');
	return new EgressClient(httpUrl, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
}

/**
 * Start a Track Composite Egress that forwards the switcher's composited
 * video + audio tracks to Mux via RTMP.
 *
 * Uses the `mux://<stream_key>` shorthand supported by LiveKit.
 */
export async function startMuxEgress(
	roomName: string,
	muxStreamKey: string,
	audioTrackId: string,
	videoTrackId: string
) {
	const client = getEgressClient();
	if (!client) {
		throw new Error('Egress client not configured');
	}

	const streamOutput = new StreamOutput({
		protocol: StreamProtocol.RTMP,
		urls: [`mux://${muxStreamKey}`]
	});

	console.log('[Egress] Starting track composite egress:', {
		roomName,
		audioTrackId: audioTrackId || '(none)',
		videoTrackId,
		muxUrl: `mux://${muxStreamKey}`
	});

	const info = await client.startTrackCompositeEgress(
		roomName,
		streamOutput,
		audioTrackId || undefined,
		videoTrackId,
		EncodingOptionsPreset.H264_720P_30
	);

	console.log('[Egress] Started. Egress ID:', info.egressId);
	return {
		egressId: info.egressId,
		status: info.status
	};
}

/**
 * Start a Room Composite Egress that renders all room participants
 * via a custom web template (headless Chrome) and forwards to Mux via RTMP.
 *
 * The template URL is loaded by LiveKit's headless Chrome with query params:
 *   ?url={livekit_wss}&token={recorder_token}&layout={layout}
 */
export async function startRoomCompositeEgress(
	roomName: string,
	muxStreamKey: string,
	customBaseUrl: string,
	layout: string = 'single'
) {
	const client = getEgressClient();
	if (!client) {
		throw new Error('Egress client not configured');
	}

	const streamOutput = new StreamOutput({
		protocol: StreamProtocol.RTMP,
		urls: [`mux://${muxStreamKey}`]
	});

	console.log('[Egress] Starting room composite egress:', {
		roomName,
		customBaseUrl,
		layout,
		muxUrl: `mux://${muxStreamKey}`
	});

	const info = await client.startRoomCompositeEgress(
		roomName,
		streamOutput,
		{
			layout,
			customBaseUrl,
			encodingOptions: EncodingOptionsPreset.H264_720P_30
		}
	);

	console.log('[Egress] Room composite started. Egress ID:', info.egressId);
	return {
		egressId: info.egressId,
		status: info.status
	};
}

/**
 * Stop an active egress by ID.
 */
export async function stopEgress(egressId: string) {
	const client = getEgressClient();
	if (!client) {
		throw new Error('Egress client not configured');
	}

	console.log('[Egress] Stopping egress:', egressId);
	const info = await client.stopEgress(egressId);
	console.log('[Egress] Stopped. Status:', info.status);
	return {
		egressId: info.egressId,
		status: info.status
	};
}

/**
 * List active egresses for a room.
 */
export async function listRoomEgresses(roomName: string) {
	const client = getEgressClient();
	if (!client) {
		throw new Error('Egress client not configured');
	}

	const egresses = await client.listEgress({ roomName });
	return egresses;
}
