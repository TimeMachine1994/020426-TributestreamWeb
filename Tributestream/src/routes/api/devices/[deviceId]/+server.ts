import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// DELETE - Remove a device
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { deviceId } = params;
	console.log('[API /devices/delete] Deleting device:', deviceId?.substring(0, 8) + '...');

	if (!deviceId) {
		throw error(400, 'Device ID is required');
	}

	const [device] = await db
		.select({ id: table.device.id, memorialId: table.device.memorialId })
		.from(table.device)
		.where(eq(table.device.id, deviceId));

	if (!device) {
		console.log('[API /devices/delete] Device not found');
		throw error(404, 'Device not found');
	}

	// Delete the device
	await db
		.delete(table.device)
		.where(eq(table.device.id, deviceId));

	console.log('[API /devices/delete] Device deleted successfully');
	return json({ success: true });
};
