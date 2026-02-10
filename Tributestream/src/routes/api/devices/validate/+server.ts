import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { createCameraToken, LIVEKIT_URL } from '$lib/livekit/token';

export const POST: RequestHandler = async ({ request }) => {
	console.log('[API /devices/validate] Request received');
	const { token } = await request.json();
	console.log('[API /devices/validate] Token:', token?.substring(0, 8) + '...');

	if (!token) {
		console.log('[API /devices/validate] ERROR: No token provided');
		throw error(400, 'Token is required');
	}

	const now = new Date();

	// Find device with valid, non-expired token
	const [device] = await db
		.select({
			id: table.device.id,
			memorialId: table.device.memorialId,
			status: table.device.status,
			tokenExpiresAt: table.device.tokenExpiresAt
		})
		.from(table.device)
		.where(
			and(
				eq(table.device.token, token),
				gt(table.device.tokenExpiresAt, now)
			)
		);

	if (!device) {
		console.log('[API /devices/validate] ERROR: Invalid or expired token');
		throw error(400, 'Invalid or expired token');
	}

	console.log('[API /devices/validate] Device found:', device.id);
	console.log('[API /devices/validate] Device status:', device.status);

	// Allow re-validation if status is 'pending' or 'connecting' (user might refresh after permission denied)
	if (device.status !== 'pending' && device.status !== 'connecting') {
		console.log('[API /devices/validate] ERROR: Token already used (status:', device.status + ')');
		throw error(400, 'Token has already been used');
	}

	// Get memorial info
	const [memorial] = await db
		.select({
			id: table.memorial.id,
			title: table.memorial.title,
			slug: table.memorial.slug
		})
		.from(table.memorial)
		.where(eq(table.memorial.id, device.memorialId));

	if (!memorial) {
		console.log('[API /devices/validate] ERROR: Memorial not found');
		throw error(404, 'Memorial not found');
	}

	console.log('[API /devices/validate] Memorial:', memorial.title);

	// Update device status to connecting
	console.log('[API /devices/validate] Updating status to connecting');
	await db
		.update(table.device)
		.set({ status: 'connecting' })
		.where(eq(table.device.id, device.id));

	// Generate LiveKit token for this camera device
	const livekitRoomName = `memorial-${memorial.id}`;
	const livekitToken = await createCameraToken(memorial.id, device.id, `Camera ${device.id.substring(0, 6)}`);

	console.log('[API /devices/validate] SUCCESS - Device validated');
	return json({
		deviceId: device.id,
		memorial: {
			id: memorial.id,
			title: memorial.title,
			slug: memorial.slug
		},
		livekit: livekitToken ? {
			token: livekitToken,
			url: LIVEKIT_URL,
			roomName: livekitRoomName
		} : null
	});
};
