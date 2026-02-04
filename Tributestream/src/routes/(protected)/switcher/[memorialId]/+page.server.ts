import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();

	const [memorial] = await db
		.select()
		.from(table.memorial)
		.where(eq(table.memorial.id, params.memorialId));

	if (!memorial) {
		throw error(404, 'Memorial not found');
	}

	// Check if user has access (admin or assigned videographer)
	if (user.role !== 'admin' && memorial.assignedVideographerId !== user.id) {
		throw error(403, 'You do not have access to this memorial');
	}

	// Fetch connected devices for this memorial
	const devices = await db
		.select()
		.from(table.device)
		.where(eq(table.device.memorialId, params.memorialId));

	return {
		memorial: {
			id: memorial.id,
			slug: memorial.slug,
			title: memorial.title,
			description: memorial.description,
			status: memorial.status,
			scheduledAt: memorial.scheduledAt?.toISOString() ?? null,
			chatEnabled: memorial.chatEnabled,
			muxStreamKey: memorial.muxStreamKey,
			muxPlaybackId: memorial.muxPlaybackId
		},
		devices: devices.map((d) => ({
			id: d.id,
			name: d.name,
			type: d.type,
			status: d.status,
			batteryLevel: d.batteryLevel,
			lastSeen: d.lastSeen?.toISOString() ?? null
		}))
	};
};
