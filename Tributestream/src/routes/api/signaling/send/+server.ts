import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

function generateId(): string {
	const bytes = new Uint8Array(15);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export const POST: RequestHandler = async ({ request }) => {
	const { deviceId, memorialId, fromDevice, type, payload } = await request.json();

	if (!deviceId || !memorialId || fromDevice === undefined || !type || !payload) {
		throw error(400, 'Missing required fields');
	}

	if (!['offer', 'answer', 'ice-candidate'].includes(type)) {
		throw error(400, 'Invalid message type');
	}

	// Verify device exists and belongs to this memorial
	const [device] = await db
		.select()
		.from(table.device)
		.where(and(eq(table.device.id, deviceId), eq(table.device.memorialId, memorialId)));

	if (!device) {
		throw error(404, 'Device not found');
	}

	await db.insert(table.signalingMessage).values({
		id: generateId(),
		deviceId,
		memorialId,
		fromDevice,
		type,
		payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
		consumed: false,
		createdAt: new Date()
	});

	// Update device last seen
	await db
		.update(table.device)
		.set({ lastSeen: new Date() })
		.where(eq(table.device.id, deviceId));

	return json({ success: true });
};
