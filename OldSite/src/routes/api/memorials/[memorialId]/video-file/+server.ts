// DEPRECATED: This API is no longer called by the admin UI.
// Video files are replaced by embed blocks in the block editor.
// Retained for backward compatibility until all memorials are migrated.

import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Video File API
 * Allows admins to add a video file (from Google Cloud Storage) to a memorial
 * This displays as an embedded video player with a download button
 */

export const POST: RequestHandler = async ({ locals, params, request }) => {
	console.log('📁 [VIDEO FILE] POST - Adding video file for memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [VIDEO FILE] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId } = params;

	try {
		const { url, title } = await request.json();

		// URL is required
		if (!url || !url.trim()) {
			throw svelteError(400, 'Video URL is required');
		}

		// Basic URL validation
		const trimmedUrl = url.trim();
		if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
			throw svelteError(400, 'Invalid URL format - must start with http:// or https://');
		}

		// Get memorial document
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		// Create video file object
		const videoFile = {
			url: trimmedUrl,
			title: (title && title.trim()) || 'Video Recording',
			createdAt: new Date().toISOString(),
			createdBy: locals.user.uid,
			createdByEmail: locals.user.email
		};

		// Update memorial with video file
		await memorialDoc.ref.update({
			videoFile,
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [VIDEO FILE] Video file added successfully:', videoFile.title);

		return json({
			success: true,
			videoFile
		});
	} catch (err: any) {
		console.error('❌ [VIDEO FILE] Error adding video file:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to add video file: ${err?.message || 'Unknown error'}`);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	console.log('📁 [VIDEO FILE] DELETE - Removing video file for memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [VIDEO FILE] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId } = params;

	try {
		// Get memorial document
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		// Remove video file
		await memorialDoc.ref.update({
			videoFile: null,
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [VIDEO FILE] Video file removed successfully');

		return json({
			success: true
		});
	} catch (err: any) {
		console.error('❌ [VIDEO FILE] Error removing video file:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to remove video file: ${err?.message || 'Unknown error'}`);
	}
};
