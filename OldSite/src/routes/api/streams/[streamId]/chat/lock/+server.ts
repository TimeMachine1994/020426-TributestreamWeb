/**
 * Chat Lock API - Mux Integration
 * 
 * Created: January 25, 2026
 * Lock or unlock chat for a stream (prevents new messages while allowing reading)
 * 
 * Endpoints:
 * - PATCH: Toggle chat locked/unlocked state
 */

import { adminDb } from '$lib/server/firebase';
import { error as svelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

console.log('🔒 [CHAT LOCK API] Chat lock endpoint loaded');

/**
 * PATCH - Lock or unlock chat for a stream
 * Requires admin, owner, or funeral director permissions
 * 
 * Request body:
 * - locked: boolean
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { streamId } = params;
	
	console.log('🔒 [CHAT LOCK API] PATCH - Toggling chat lock for stream:', streamId);

	// Require authentication
	if (!locals.user) {
		console.log('❌ [CHAT LOCK API] User not authenticated');
		throw svelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	console.log('🔒 [CHAT LOCK API] User ID:', userId);
	console.log('🔒 [CHAT LOCK API] User role:', locals.user.role);

	try {
		// Parse request body
		const body = await request.json();
		const { locked } = body;

		console.log('🔒 [CHAT LOCK API] New locked state:', locked);

		if (typeof locked !== 'boolean') {
			console.log('❌ [CHAT LOCK API] Invalid locked value:', locked);
			throw svelteKitError(400, 'locked must be a boolean value');
		}

		// Get stream document
		console.log('🔍 [CHAT LOCK API] Fetching stream document...');
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		
		if (!streamDoc.exists) {
			console.log('❌ [CHAT LOCK API] Stream not found:', streamId);
			throw svelteKitError(404, 'Stream not found');
		}

		const stream = streamDoc.data();
		console.log('✅ [CHAT LOCK API] Stream found, current chat locked:', stream?.chat?.locked);

		// Get memorial to check permissions
		console.log('🔍 [CHAT LOCK API] Fetching memorial document...');
		const memorialDoc = await adminDb.collection('memorials').doc(stream?.memorialId).get();
		
		if (!memorialDoc.exists) {
			console.log('❌ [CHAT LOCK API] Memorial not found');
			throw svelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();

		// Check permissions
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [CHAT LOCK API] User lacks permission:', userId);
			throw svelteKitError(403, 'Permission denied');
		}

		console.log('✅ [CHAT LOCK API] User has permission to lock/unlock chat');

		// Log current chat state for debugging
		console.log('🔒 [CHAT LOCK API] Current chat config:', {
			enabled: stream?.chat?.enabled,
			locked: stream?.chat?.locked,
			messageCount: stream?.chat?.messageCount
		});

		// Update chat locked status
		console.log('💾 [CHAT LOCK API] Updating chat locked status to:', locked);
		await streamDoc.ref.update({
			'chat.locked': locked,
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [CHAT LOCK API] Chat locked status updated successfully');

		return json({
			success: true,
			locked,
			message: `Chat ${locked ? 'locked' : 'unlocked'} successfully`
		});

	} catch (error: any) {
		console.error('❌ [CHAT LOCK API] Error toggling chat lock:', error);
		console.error('❌ [CHAT LOCK API] Error details:', {
			message: error?.message,
			stack: error?.stack
		});

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteKitError(500, 'Failed to toggle chat lock');
	}
};
