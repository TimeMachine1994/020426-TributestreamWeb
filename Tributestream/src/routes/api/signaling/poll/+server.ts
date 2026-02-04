import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	const { deviceId, memorialId, fromDevice } = await request.json();

	if (!deviceId || !memorialId || fromDevice === undefined) {
		throw error(400, 'Missing required fields');
	}

	// Fetch unconsumed messages for this device
	// If fromDevice=true (phone polling), get messages where fromDevice=false (from switcher)
	// If fromDevice=false (switcher polling), get messages where fromDevice=true (from phone)
	const messages = await db
		.select({
			id: table.signalingMessage.id,
			type: table.signalingMessage.type,
			payload: table.signalingMessage.payload,
			createdAt: table.signalingMessage.createdAt
		})
		.from(table.signalingMessage)
		.where(
			and(
				eq(table.signalingMessage.deviceId, deviceId),
				eq(table.signalingMessage.memorialId, memorialId),
				eq(table.signalingMessage.fromDevice, !fromDevice),
				eq(table.signalingMessage.consumed, false)
			)
		)
		.orderBy(table.signalingMessage.createdAt);

	// Mark messages as consumed
	if (messages.length > 0) {
		const messageIds = messages.map((m) => m.id);
		await db
			.update(table.signalingMessage)
			.set({ consumed: true })
			.where(inArray(table.signalingMessage.id, messageIds));
	}

	// Update device last seen
	await db
		.update(table.device)
		.set({ lastSeen: new Date() })
		.where(eq(table.device.id, deviceId));

	return json({
		messages: messages.map((m) => ({
			id: m.id,
			type: m.type,
			payload: m.payload,
			createdAt: m.createdAt.toISOString()
		}))
	});
};
