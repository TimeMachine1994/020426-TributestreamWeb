// DEPRECATED: This API is no longer called by the admin UI.
// Emergency embeds are replaced by embed blocks in the block editor.
// Retained for backward compatibility until all memorials are migrated.

import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Emergency Embed Override API
 * Allows admins to quickly embed external streams (Vimeo, YouTube, etc.)
 * that override normal stream display on memorial pages
 */

export const POST: RequestHandler = async ({ locals, params, request }) => {
	console.log('🚨 [EMERGENCY EMBED] POST - Creating emergency embed for memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [EMERGENCY EMBED] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId } = params;

	try {
		const { embedCode, title } = await request.json();

		// Only embedCode is required, title is optional
		if (!embedCode || !embedCode.trim()) {
			throw svelteError(400, 'Embed code is required');
		}

		// Get memorial document
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		// Sanitize and prepare embed code
		let sanitizedEmbedCode = embedCode.trim();

		// If it's just a URL, wrap it in an iframe
		if (sanitizedEmbedCode.startsWith('http') && !sanitizedEmbedCode.includes('<iframe')) {
			// Extract video platform and ID if possible
			sanitizedEmbedCode = `<iframe src="${sanitizedEmbedCode}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
		}

		// Create emergency embed object - title is optional
		const emergencyEmbed = {
			embedCode: sanitizedEmbedCode,
			title: (title && title.trim()) || 'Emergency Embed',
			createdAt: new Date().toISOString(),
			createdBy: locals.user.uid,
			createdByEmail: locals.user.email
		};

		// Update memorial with emergency embed
		await memorialDoc.ref.update({
			emergencyEmbed,
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [EMERGENCY EMBED] Emergency embed created successfully');

		return json({
			success: true,
			emergencyEmbed
		});
	} catch (err: any) {
		console.error('❌ [EMERGENCY EMBED] Error creating emergency embed:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to create emergency embed: ${err?.message || 'Unknown error'}`);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	console.log('🚨 [EMERGENCY EMBED] DELETE - Removing emergency embed for memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [EMERGENCY EMBED] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId } = params;

	try {
		// Get memorial document
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		// Remove emergency embed
		await memorialDoc.ref.update({
			emergencyEmbed: null,
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [EMERGENCY EMBED] Emergency embed removed successfully');

		return json({
			success: true
		});
	} catch (err: any) {
		console.error('❌ [EMERGENCY EMBED] Error removing emergency embed:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to remove emergency embed: ${err?.message || 'Unknown error'}`);
	}
};
