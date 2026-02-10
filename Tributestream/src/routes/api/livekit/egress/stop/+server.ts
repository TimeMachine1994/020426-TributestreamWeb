import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stopEgress } from '$lib/livekit/egress';

/**
 * POST /api/livekit/egress/stop
 * Stop an active egress.
 *
 * Body: { egressId }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { egressId } = body;

	if (!egressId) {
		throw error(400, 'Missing required field: egressId');
	}

	try {
		const result = await stopEgress(egressId);
		return json(result);
	} catch (e) {
		console.error('[API] Failed to stop egress:', e);
		throw error(500, e instanceof Error ? e.message : 'Failed to stop egress');
	}
};
