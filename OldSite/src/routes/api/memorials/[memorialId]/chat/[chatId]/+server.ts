import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { UpdateChatMessageInput } from '$lib/types/chat';

/**
 * PUT /api/memorials/[memorialId]/chat/[chatId]
 * Edit an existing chat message
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { memorialId, chatId } = params;
	
	// Require authentication
	if (!locals.user) {
		throw error(401, 'You must be signed in to edit messages');
	}
	
	try {
		const body = await request.json() as UpdateChatMessageInput;
		const { message } = body;
		
		// Validate message
		if (!message || typeof message !== 'string') {
			throw error(400, 'Message is required');
		}
		
		const trimmedMessage = message.trim();
		
		if (trimmedMessage.length === 0) {
			throw error(400, 'Message cannot be empty');
		}
		
		if (trimmedMessage.length > 500) {
			throw error(400, 'Message cannot exceed 500 characters');
		}
		
		// Get the existing message
		const messageRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('chat')
			.doc(chatId);
		
		const messageDoc = await messageRef.get();
		
		if (!messageDoc.exists) {
			throw error(404, 'Message not found');
		}
		
		const messageData = messageDoc.data();
		
		// Check if user owns the message
		if (messageData?.userId !== locals.user.uid) {
			throw error(403, 'You can only edit your own messages');
		}
		
		// Check if message is already deleted
		if (messageData?.isDeleted) {
			throw error(400, 'Cannot edit a deleted message');
		}
		
		// Update message
		await messageRef.update({
			message: trimmedMessage,
			isEdited: true,
			editedAt: new Date()
		});
		
		// Return updated message
		return json({
			id: chatId,
			message: trimmedMessage,
			isEdited: true,
			editedAt: new Date().toISOString()
		});
		
	} catch (err: any) {
		console.error('[Chat API] Error editing message:', err);
		
		if (err.status) {
			throw err;
		}
		
		throw error(500, 'Failed to edit message');
	}
};

/**
 * DELETE /api/memorials/[memorialId]/chat/[chatId]
 * Delete a chat message (soft delete)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { memorialId, chatId } = params;
	
	// Require authentication
	if (!locals.user) {
		throw error(401, 'You must be signed in to delete messages');
	}
	
	try {
		// Get the message
		const messageRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('chat')
			.doc(chatId);
		
		const messageDoc = await messageRef.get();
		
		if (!messageDoc.exists) {
			throw error(404, 'Message not found');
		}
		
		const messageData = messageDoc.data();
		
		// Get memorial for ownership check
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		const memorialData = memorialDoc.data();
		
		// Check permissions: user owns the message OR user is memorial owner/admin
		const isMessageOwner = messageData?.userId === locals.user.uid;
		const isMemorialOwner = memorialData?.ownerUid === locals.user.uid;
		const isAdmin = locals.user.role === 'admin';
		
		if (!isMessageOwner && !isMemorialOwner && !isAdmin) {
			throw error(403, 'You do not have permission to delete this message');
		}
		
		// Soft delete the message
		await messageRef.update({
			isDeleted: true,
			deletedAt: new Date(),
			message: '[Message deleted]'
		});
		
		return json({ success: true });
		
	} catch (err: any) {
		console.error('[Chat API] Error deleting message:', err);
		
		if (err.status) {
			throw err;
		}
		
		throw error(500, 'Failed to delete message');
	}
};
