import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { memorialId } = await request.json();

	if (!memorialId) {
		throw error(400, 'Memorial ID is required');
	}

	// Verify memorial exists and user has access
	const [memorial] = await db
		.select()
		.from(table.memorial)
		.where(eq(table.memorial.id, memorialId));

	if (!memorial) {
		throw error(404, 'Memorial not found');
	}

	if (locals.user.role !== 'admin' && memorial.assignedVideographerId !== locals.user.id) {
		throw error(403, 'You do not have access to this memorial');
	}

	if (!memorial.muxStreamKey) {
		throw error(400, 'No stream configured. Create a stream first.');
	}

	// Update memorial status to live
	await db
		.update(table.memorial)
		.set({
			status: 'live',
			updatedAt: new Date()
		})
		.where(eq(table.memorial.id, memorialId));

	return json({
		success: true,
		status: 'live',
		playbackId: memorial.muxPlaybackId
	});
};
