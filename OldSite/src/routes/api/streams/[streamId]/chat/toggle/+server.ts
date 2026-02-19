/**
 * Chat Toggle API - Mux Integration
 * 
 * Created: January 22, 2026
 * Enable or disable chat for a stream
 * 
 * Endpoints:
 * - PATCH: Toggle chat enabled/disabled state
 */

import { adminDb } from '$lib/server/firebase';
import { error as svelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

console.log('💬 [CHAT TOGGLE API] Chat toggle endpoint loaded');

/**
 * PATCH - Enable or disable chat for a stream
 * Requires admin, owner, or funeral director permissions
 * 
 * Request body:
 * - enabled: boolean
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { streamId } = params;
	
	console.log('💬 [CHAT TOGGLE API] PATCH - Toggling chat for stream:', streamId);

	// Require authentication
	if (!locals.user) {
		console.log('❌ [CHAT TOGGLE API] User not authenticated');
		throw svelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	console.log('💬 [CHAT TOGGLE API] User ID:', userId);
	console.log('💬 [CHAT TOGGLE API] User role:', locals.user.role);

	try {
		// Parse request body
		const body = await request.json();
		const { enabled } = body;

		console.log('💬 [CHAT TOGGLE API] New enabled state:', enabled);

		if (typeof enabled !== 'boolean') {
			console.log('❌ [CHAT TOGGLE API] Invalid enabled value:', enabled);
			throw svelteKitError(400, 'enabled must be a boolean value');
		}

		// Get stream document
		console.log('🔍 [CHAT TOGGLE API] Fetching stream document...');
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		
		if (!streamDoc.exists) {
			console.log('❌ [CHAT TOGGLE API] Stream not found:', streamId);
			throw svelteKitError(404, 'Stream not found');
		}

		const stream = streamDoc.data();
		console.log('✅ [CHAT TOGGLE API] Stream found, current chat enabled:', stream?.chat?.enabled);

		// Get memorial to check permissions
		console.log('🔍 [CHAT TOGGLE API] Fetching memorial document...');
		const memorialDoc = await adminDb.collection('memorials').doc(stream?.memorialId).get();
		
		if (!memorialDoc.exists) {
			console.log('❌ [CHAT TOGGLE API] Memorial not found');
			throw svelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();

		// Check permissions
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [CHAT TOGGLE API] User lacks permission:', userId);
			throw svelteKitError(403, 'Permission denied');
		}

		console.log('✅ [CHAT TOGGLE API] User has permission to toggle chat');

		// Log current chat state for debugging
		console.log('💬 [CHAT TOGGLE API] Current chat config:', {
			enabled: stream?.chat?.enabled,
			archived: stream?.chat?.archived,
			messageCount: stream?.chat?.messageCount
		});

		// Update chat enabled status
		console.log('💾 [CHAT TOGGLE API] Updating chat enabled status to:', enabled);
		await streamDoc.ref.update({
			'chat.enabled': enabled,
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [CHAT TOGGLE API] Chat enabled status updated successfully');

		return json({
			success: true,
			enabled,
			message: `Chat ${enabled ? 'enabled' : 'disabled'} successfully`
		});

	} catch (error: any) {
		console.error('❌ [CHAT TOGGLE API] Error toggling chat:', error);
		console.error('❌ [CHAT TOGGLE API] Error details:', {
			message: error?.message,
			stack: error?.stack
		});

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteKitError(500, 'Failed to toggle chat');
	}
};
