import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, lt, or, and, isNull } from 'drizzle-orm';
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

	// Clean up stale devices for this memorial
	const cleanupTime = new Date();
	const oneHourAgo = new Date(cleanupTime.getTime() - 60 * 60 * 1000);
	
	const staleDevices = await db
		.select({ id: table.device.id, status: table.device.status })
		.from(table.device)
		.where(
			and(
				eq(table.device.memorialId, params.memorialId),
				or(
					// Pending devices with expired tokens
					and(
						eq(table.device.status, 'pending'),
						lt(table.device.tokenExpiresAt, cleanupTime)
					),
					// Connecting devices not seen in over an hour with expired tokens
					and(
						eq(table.device.status, 'connecting'),
						lt(table.device.tokenExpiresAt, cleanupTime),
						or(
							lt(table.device.lastSeen, oneHourAgo),
							isNull(table.device.lastSeen)
						)
					)
				)
			)
		);

	if (staleDevices.length > 0) {
		console.log('[Switcher] Cleaning up', staleDevices.length, 'stale devices');
		for (const d of staleDevices) {
			await db.delete(table.signalingMessage).where(eq(table.signalingMessage.deviceId, d.id));
			await db.delete(table.device).where(eq(table.device.id, d.id));
		}
		console.log('[Switcher] Cleanup complete');
	}

	// Fetch active devices for this memorial (connecting or connected, not stale pending)
	const devices = await db
		.select()
		.from(table.device)
		.where(
			eq(table.device.memorialId, params.memorialId)
		);
	
	// Filter to only show devices that are:
	// 1. Status is 'connecting' or 'connected'
	// 2. Have been seen in the last 5 minutes (if connecting) or 30 minutes (if connected)
	const now = new Date();
	const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
	const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
	
	const activeDevices = devices.filter(d => {
		if (d.status === 'connected') {
			// Connected devices: show if seen in last 30 minutes
			return d.lastSeen && d.lastSeen > thirtyMinutesAgo;
		} else if (d.status === 'connecting') {
			// Connecting devices: show if seen in last 5 minutes OR token not expired
			const tokenValid = d.tokenExpiresAt && d.tokenExpiresAt > now;
			const recentlySeen = d.lastSeen && d.lastSeen > fiveMinutesAgo;
			return tokenValid || recentlySeen;
		}
		return false;
	});
	console.log('[Switcher] Memorial:', params.memorialId);
	console.log('[Switcher] Total devices:', devices.length, 'Active devices:', activeDevices.length);
	devices.forEach(d => console.log('[Switcher]   -', d.id.substring(0, 8) + '...', d.status));

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
		devices: activeDevices.map((d) => ({
			id: d.id,
			name: d.name,
			type: d.type,
			status: d.status,
			batteryLevel: d.batteryLevel,
			lastSeen: d.lastSeen?.toISOString() ?? null
		}))
	};
};
