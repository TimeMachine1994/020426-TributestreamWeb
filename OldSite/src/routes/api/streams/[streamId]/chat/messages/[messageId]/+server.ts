/**
 * Chat Message Moderation API - Firestore-based
 * 
 * Created: January 22, 2026
 * Handles deletion of individual chat messages for moderation
 * 
 * Endpoints:
 * - DELETE: Remove a chat message (admin/owner/funeral director only)
 */

import { adminDb } from '$lib/server/firebase';
import { error as svelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

console.log('💬 [CHAT MODERATION API] Message moderation endpoint loaded - Firestore-based');

/**
 * DELETE - Remove a chat message (soft delete + Mux deletion)
 * Requires admin, owner, or funeral director permissions
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { streamId, messageId } = params;
	
	console.log('💬 [CHAT MODERATION API] DELETE - Removing message:', messageId);
	console.log('💬 [CHAT MODERATION API] Stream:', streamId);

	// Require authentication
	if (!locals.user) {
		console.log('❌ [CHAT MODERATION API] User not authenticated');
		throw svelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	console.log('💬 [CHAT MODERATION API] User ID:', userId);
	console.log('💬 [CHAT MODERATION API] User role:', locals.user.role);

	try {
		// Get stream document to check permissions
		console.log('🔍 [CHAT MODERATION API] Fetching stream document...');
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		
		if (!streamDoc.exists) {
			console.log('❌ [CHAT MODERATION API] Stream not found:', streamId);
			throw svelteKitError(404, 'Stream not found');
		}

		const stream = streamDoc.data();

		// Get memorial to check ownership
		console.log('🔍 [CHAT MODERATION API] Fetching memorial document...');
		const memorialDoc = await adminDb.collection('memorials').doc(stream?.memorialId).get();
		
		if (!memorialDoc.exists) {
			console.log('❌ [CHAT MODERATION API] Memorial not found');
			throw svelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();

		// Check permissions (admin, owner, or funeral director)
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [CHAT MODERATION API] User lacks permission:', userId);
			throw svelteKitError(403, 'Permission denied - only admins and memorial owners can moderate chat');
		}

		console.log('✅ [CHAT MODERATION API] User has moderation permission');

		// Get the message document
		console.log('🔍 [CHAT MODERATION API] Fetching message document...');
		const messageDoc = await adminDb
			.collection('streams')
			.doc(streamId)
			.collection('chat_messages')
			.doc(messageId)
			.get();

		if (!messageDoc.exists) {
			console.log('❌ [CHAT MODERATION API] Message not found:', messageId);
			throw svelteKitError(404, 'Message not found');
		}

		const messageData = messageDoc.data();
		console.log('✅ [CHAT MODERATION API] Message found');

		// Check if already deleted
		if (messageData?.deleted) {
			console.log('⚠️ [CHAT MODERATION API] Message already deleted');
			return json({
				success: true,
				message: 'Message already deleted'
			});
		}

		// Soft delete in Firestore
		console.log('💾 [CHAT MODERATION API] Marking message as deleted in Firestore...');
		await messageDoc.ref.update({
			deleted: true,
			deletedBy: userId,
			deletedAt: new Date().toISOString()
		});

		console.log('✅ [CHAT MODERATION API] Message marked as deleted successfully');

		return json({
			success: true,
			message: 'Message deleted successfully'
		});

	} catch (error: any) {
		console.error('❌ [CHAT MODERATION API] Error deleting message:', error);
		console.error('❌ [CHAT MODERATION API] Error details:', {
			message: error?.message,
			stack: error?.stack
		});

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteKitError(500, 'Failed to delete message');
	}
};
