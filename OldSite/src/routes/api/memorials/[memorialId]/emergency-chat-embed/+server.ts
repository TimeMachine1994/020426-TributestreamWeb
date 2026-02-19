// DEPRECATED: This API is no longer called by the admin UI.
// Emergency chat embeds are replaced by embed blocks (type: chat) in the block editor.
// Retained for backward compatibility until all memorials are migrated.

import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

/**
 * Emergency Chat Embed API
 * 
 * POST - Create/update emergency chat embed for a memorial
 * DELETE - Remove emergency chat embed
 * 
 * This allows admins to quickly override the normal chat with
 * an external chat service (e.g., YouTube live chat, Vimeo chat, etc.)
 */

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { memorialId } = params;

	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Only admins can set emergency chat embeds
	if (locals.user.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	try {
		const { embedCode, title } = await request.json();

		if (!embedCode || typeof embedCode !== 'string') {
			return json({ error: 'embedCode is required' }, { status: 400 });
		}

		// Validate memorial exists
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		// Sanitize embed code - allow iframes and common embed patterns
		const sanitizedEmbedCode = embedCode.trim();

		// Create emergency chat embed object
		const emergencyChatEmbed = {
			embedCode: sanitizedEmbedCode,
			title: (title && title.trim()) || 'Live Chat',
			createdAt: new Date().toISOString(),
			createdBy: locals.user.uid,
			createdByEmail: locals.user.email || 'unknown'
		};

		// Update memorial with emergency chat embed
		await memorialDoc.ref.update({
			emergencyChatEmbed,
			updatedAt: new Date().toISOString()
		});

		console.log('💬 [EMERGENCY CHAT] Created emergency chat embed for memorial:', memorialId);

		return json({
			success: true,
			emergencyChatEmbed
		});
	} catch (err: any) {
		console.error('❌ [EMERGENCY CHAT] Error creating emergency chat embed:', err);
		return json({
			error: 'Failed to create emergency chat embed',
			message: err?.message
		}, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { memorialId } = params;

	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Only admins can remove emergency chat embeds
	if (locals.user.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	try {
		// Validate memorial exists
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		// Remove emergency chat embed
		await memorialDoc.ref.update({
			emergencyChatEmbed: null,
			updatedAt: new Date().toISOString()
		});

		console.log('💬 [EMERGENCY CHAT] Removed emergency chat embed from memorial:', memorialId);

		return json({ success: true });
	} catch (err: any) {
		console.error('❌ [EMERGENCY CHAT] Error removing emergency chat embed:', err);
		return json({
			error: 'Failed to remove emergency chat embed',
			message: err?.message
		}, { status: 500 });
	}
};
