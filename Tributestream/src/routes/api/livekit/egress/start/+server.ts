import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { startMuxEgress, startRoomCompositeEgress } from '$lib/livekit/egress';
import { env } from '$env/dynamic/private';

/**
 * POST /api/livekit/egress/start
 *
 * Supports two modes:
 *   mode: 'track-composite' (default/legacy) — requires audioTrackId, videoTrackId
 *   mode: 'room-composite' — uses custom egress template, no track IDs needed
 *
 * Body: { roomName, muxStreamKey, mode?, audioTrackId?, videoTrackId?, layout? }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { roomName, muxStreamKey, mode, audioTrackId, videoTrackId, layout } = body;

	if (!roomName || !muxStreamKey) {
		throw error(400, 'Missing required fields: roomName, muxStreamKey');
	}

	try {
		if (mode === 'room-composite') {
			const customBaseUrl = env.EGRESS_TEMPLATE_URL;
			if (!customBaseUrl) {
				throw new Error('EGRESS_TEMPLATE_URL environment variable not set');
			}
			const result = await startRoomCompositeEgress(roomName, muxStreamKey, customBaseUrl, layout || 'single');
			return json(result);
		} else {
			// Legacy track-composite mode
			if (!videoTrackId) {
				throw error(400, 'Missing required field: videoTrackId (for track-composite mode)');
			}
			const result = await startMuxEgress(roomName, muxStreamKey, audioTrackId || '', videoTrackId);
			return json(result);
		}
	} catch (e) {
		console.error('[API] Failed to start egress:', e);
		throw error(500, e instanceof Error ? e.message : 'Failed to start egress');
	}
};
