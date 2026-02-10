import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const { deviceId } = params;
	console.log('[API /devices/status] Checking status for device:', deviceId?.substring(0, 8) + '...');

	if (!deviceId) {
		throw error(400, 'Device ID is required');
	}

	const [device] = await db
		.select({
			id: table.device.id,
			status: table.device.status,
			name: table.device.name
		})
		.from(table.device)
		.where(eq(table.device.id, deviceId));

	if (!device) {
		console.log('[API /devices/status] Device not found');
		throw error(404, 'Device not found');
	}

	console.log('[API /devices/status] Device status:', device.status);
	return json({
		id: device.id,
		status: device.status,
		name: device.name
	});
};

// PATCH - Update device status (for WebRTC state sync)
export const PATCH: RequestHandler = async ({ params, request }) => {
	const { deviceId } = params;
	console.log('[API /devices/status] PATCH for device:', deviceId?.substring(0, 8) + '...');

	if (!deviceId) {
		throw error(400, 'Device ID is required');
	}

	const body = await request.json();
	const { status } = body;

	if (!status || !['connecting', 'connected', 'disconnected'].includes(status)) {
		console.log('[API /devices/status] Invalid status:', status);
		throw error(400, 'Valid status required: connecting, connected, or disconnected');
	}

	const [device] = await db
		.select({ id: table.device.id })
		.from(table.device)
		.where(eq(table.device.id, deviceId));

	if (!device) {
		console.log('[API /devices/status] Device not found');
		throw error(404, 'Device not found');
	}

	// Update status and lastSeen
	await db
		.update(table.device)
		.set({ 
			status,
			lastSeen: new Date()
		})
		.where(eq(table.device.id, deviceId));

	console.log('[API /devices/status] Updated to:', status);
	return json({ success: true, status });
};
