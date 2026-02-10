import { AccessToken, type VideoGrant } from 'livekit-server-sdk';
import { env } from '$env/dynamic/private';

if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
	console.warn('LIVEKIT_API_KEY or LIVEKIT_API_SECRET not set. LiveKit features will be disabled.');
}

export const LIVEKIT_URL = env.LIVEKIT_URL ?? '';

/**
 * Generate a LiveKit join token for a participant.
 *
 * @param roomName  - LiveKit room name (e.g. `memorial-{memorialId}`)
 * @param identity  - Unique participant identity (e.g. deviceId or 'switcher')
 * @param name      - Human-readable display name
 * @param permissions - Override default permissions
 */
export async function createJoinToken(
	roomName: string,
	identity: string,
	name: string,
	permissions: Partial<VideoGrant> = {}
): Promise<string | null> {
	if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
		console.error('LiveKit credentials not configured');
		return null;
	}

	const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
		identity,
		name,
		ttl: '6h'
	});

	const grant: VideoGrant = {
		room: roomName,
		roomJoin: true,
		canPublish: true,
		canSubscribe: true,
		...permissions
	};

	at.addGrant(grant);

	return await at.toJwt();
}

/**
 * Create a token for a phone camera (publish only, no subscribe).
 */
export async function createCameraToken(
	memorialId: string,
	deviceId: string,
	deviceName: string
): Promise<string | null> {
	return createJoinToken(
		`memorial-${memorialId}`,
		deviceId,
		deviceName,
		{ canPublish: true, canSubscribe: false }
	);
}

/**
 * Create a token for the switcher (publish + subscribe).
 * canPublish is true because the switcher publishes the composited output for egress.
 */
export async function createSwitcherToken(
	memorialId: string,
	userId: string,
	userName: string
): Promise<string | null> {
	return createJoinToken(
		`memorial-${memorialId}`,
		`switcher-${userId}`,
		userName,
		{ canPublish: true, canSubscribe: true }
	);
}
