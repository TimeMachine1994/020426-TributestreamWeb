import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createLiveStream } from '$lib/server/mux';

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

	// Check if stream already exists
	const livekitRoomName = `memorial-${memorialId}`;

	if (memorial.muxStreamKey) {
		return json({
			streamKey: memorial.muxStreamKey,
			playbackId: memorial.muxPlaybackId,
			livekitRoomName,
			alreadyExists: true
		});
	}

	// Create new Mux live stream
	const result = await createLiveStream(memorial.slug);

	if (!result) {
		throw error(500, 'Failed to create live stream. Check Mux API credentials.');
	}

	// Update memorial with stream details
	await db
		.update(table.memorial)
		.set({
			muxStreamKey: result.streamKey,
			muxPlaybackId: result.playbackId,
			muxAssetId: result.liveStreamId,
			livekitRoomName,
			updatedAt: new Date()
		})
		.where(eq(table.memorial.id, memorialId));

	return json({
		streamKey: result.streamKey,
		playbackId: result.playbackId,
		livekitRoomName,
		alreadyExists: false
	});
};
