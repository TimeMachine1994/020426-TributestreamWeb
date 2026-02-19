import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Update stream title
 */
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	console.log('✏️ [TITLE API] PATCH - Updating stream title:', params.streamId);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [TITLE API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const streamId = params.streamId;

	try {
		// Parse request body
		const { title } = await request.json();

		if (!title || typeof title !== 'string' || !title.trim()) {
			throw SvelteKitError(400, 'Title is required');
		}

		const sanitizedTitle = title.trim();

		if (sanitizedTitle.length > 200) {
			throw SvelteKitError(400, 'Title must be 200 characters or less');
		}

		console.log('✏️ [TITLE API] New title:', sanitizedTitle);

		// Get stream document
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [TITLE API] Stream not found:', streamId);
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data()!;

		// Verify permissions
		const memorialDoc = await adminDb.collection('memorials').doc(streamData.memorialId).get();
		if (!memorialDoc.exists) {
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [TITLE API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Update stream title
		await streamDoc.ref.update({
			title: sanitizedTitle,
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [TITLE API] Stream title updated');

		return json({
			success: true,
			streamId,
			title: sanitizedTitle
		});
	} catch (err: any) {
		console.error('❌ [TITLE API] Error updating title:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw SvelteKitError(500, `Failed to update title: ${err?.message || 'Unknown error'}`);
	}
};
