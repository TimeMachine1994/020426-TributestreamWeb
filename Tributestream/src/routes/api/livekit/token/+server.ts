import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCameraToken, createSwitcherToken, LIVEKIT_URL } from '$lib/livekit/token';

/**
 * POST /api/livekit/token
 * Generate a LiveKit join token.
 *
 * Body: { memorialId, identity, name, role: 'camera' | 'switcher' }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const { memorialId, identity, name, role } = body;

	if (!memorialId || !identity || !name || !role) {
		throw error(400, 'Missing required fields: memorialId, identity, name, role');
	}

	let token: string | null = null;

	if (role === 'camera') {
		token = await createCameraToken(memorialId, identity, name);
	} else if (role === 'switcher') {
		if (!locals.user) {
			throw error(401, 'Unauthorized');
		}
		token = await createSwitcherToken(memorialId, locals.user.id, name);
	} else {
		throw error(400, 'Invalid role. Must be "camera" or "switcher".');
	}

	if (!token) {
		throw error(500, 'Failed to generate LiveKit token. Check server credentials.');
	}

	return json({
		token,
		url: LIVEKIT_URL
	});
};
