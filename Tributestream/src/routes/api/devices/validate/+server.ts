import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	const { token } = await request.json();

	if (!token) {
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
		throw error(400, 'Invalid or expired token');
	}

	if (device.status !== 'pending') {
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
		throw error(404, 'Memorial not found');
	}

	// Update device status to connecting
	await db
		.update(table.device)
		.set({ status: 'connecting' })
		.where(eq(table.device.id, device.id));

	return json({
		deviceId: device.id,
		memorial: {
			id: memorial.id,
			title: memorial.title,
			slug: memorial.slug
		}
	});
};
