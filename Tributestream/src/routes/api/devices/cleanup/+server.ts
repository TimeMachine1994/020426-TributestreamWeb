import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, lt, or, and, isNull } from 'drizzle-orm';

// Clean up old/stale devices
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Only admins can clean up devices
	if (locals.user.role !== 'admin') {
		throw error(403, 'Only admins can clean up devices');
	}

	const now = new Date();
	const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

	// Delete devices that are:
	// 1. Still 'pending' with expired tokens
	// 2. 'connecting' but haven't been seen in over an hour
	// 3. 'disconnected' and haven't been seen in over an hour
	
	// First, get count of devices to be deleted
	const staleDevices = await db
		.select({ id: table.device.id, status: table.device.status })
		.from(table.device)
		.where(
			or(
				// Pending devices with expired tokens
				and(
					eq(table.device.status, 'pending'),
					lt(table.device.tokenExpiresAt, now)
				),
				// Connecting devices not seen in over an hour
				and(
					eq(table.device.status, 'connecting'),
					or(
						lt(table.device.lastSeen, oneHourAgo),
						isNull(table.device.lastSeen)
					)
				),
				// Disconnected devices
				eq(table.device.status, 'disconnected')
			)
		);

	console.log('[API /devices/cleanup] Found', staleDevices.length, 'stale devices to delete');
	staleDevices.forEach(d => console.log('[API /devices/cleanup]   -', d.id.substring(0, 8) + '...', d.status));

	// Delete stale devices
	if (staleDevices.length > 0) {
		const staleIds = staleDevices.map(d => d.id);
		
		// First delete related signaling messages
		for (const id of staleIds) {
			await db
				.delete(table.signalingMessage)
				.where(eq(table.signalingMessage.deviceId, id));
		}
		
		// Then delete the devices
		for (const id of staleIds) {
			await db
				.delete(table.device)
				.where(eq(table.device.id, id));
		}
	}

	console.log('[API /devices/cleanup] Deleted', staleDevices.length, 'stale devices');

	return json({
		deleted: staleDevices.length,
		message: `Cleaned up ${staleDevices.length} stale devices`
	});
};
