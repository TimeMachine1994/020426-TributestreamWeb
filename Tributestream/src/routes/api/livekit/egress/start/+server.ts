import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { startMuxEgress } from '$lib/livekit/egress';

/**
 * POST /api/livekit/egress/start
 * Start a Track Composite Egress → Mux RTMP.
 *
 * Body: { roomName, muxStreamKey, audioTrackId, videoTrackId }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { roomName, muxStreamKey, audioTrackId, videoTrackId } = body;

	if (!roomName || !muxStreamKey || !audioTrackId || !videoTrackId) {
		throw error(400, 'Missing required fields: roomName, muxStreamKey, audioTrackId, videoTrackId');
	}

	try {
		const result = await startMuxEgress(roomName, muxStreamKey, audioTrackId, videoTrackId);
		return json(result);
	} catch (e) {
		console.error('[API] Failed to start egress:', e);
		throw error(500, e instanceof Error ? e.message : 'Failed to start egress');
	}
};
