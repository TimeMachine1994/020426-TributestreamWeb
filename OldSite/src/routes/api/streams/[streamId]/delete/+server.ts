import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * DELETE /api/streams/[streamId]/delete
 * 
 * Delete a livestream
 * 
 * Authorization: Admin, memorial owner, or funeral director
 */
export const DELETE: RequestHandler = async ({ locals, params }) => {
	console.log('🗑️ [STREAM DELETE] DELETE request for stream:', params.streamId);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [STREAM DELETE] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const userRole = locals.user.role;
	const streamId = params.streamId;

	if (!streamId) {
		throw SvelteKitError(400, 'Stream ID is required');
	}

	try {
		// Get the stream document
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [STREAM DELETE] Stream not found:', streamId);
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data()!;
		const memorialId = streamData.memorialId;

		// Get memorial to check permissions
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [STREAM DELETE] Memorial not found:', memorialId);
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;

		// Check permissions
		const hasPermission =
			userRole === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [STREAM DELETE] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied. Only admins, memorial owners, and funeral directors can delete streams.');
		}

		// Log stream details before deletion
		console.log('📝 [STREAM DELETE] Stream details:', {
			id: streamId,
			title: streamData.title,
			memorialId,
			status: streamData.status,
			createdBy: streamData.createdBy
		});

		// SOFT DELETE: Mark as deleted instead of permanently removing
		await streamDoc.ref.update({
			isDeleted: true,
			deletedAt: new Date(),
			deletedBy: userId
		});
		console.log('✅ [STREAM DELETE] Stream soft-deleted successfully:', streamId);
		console.log('ℹ️ [STREAM DELETE] Stream will be permanently deleted after 30 days');

		// Disable the Mux liveStream to prevent webhooks from reactivating this stream
		if (streamData.mux?.liveStreamId) {
			try {
				const { deleteMuxLiveStream } = await import('$lib/server/mux');
				await deleteMuxLiveStream(streamData.mux.liveStreamId);
				console.log('✅ [STREAM DELETE] Mux liveStream disabled:', streamData.mux.liveStreamId);
			} catch (muxError: any) {
				// Non-fatal - stream is still soft-deleted in Firestore
				console.warn('⚠️ [STREAM DELETE] Failed to disable Mux liveStream (non-fatal):', muxError?.message);
			}
		}

		// NOTE: Cloudflare cleanup will happen during permanent deletion
		// This preserves the ability to restore streams within 30 days

		// Optional: Create audit log for deletion
		try {
			await adminDb.collection('auditLogs').add({
				action: 'stream_soft_deleted',
				resourceType: 'stream',
				resourceId: streamId,
				memorialId,
				performedBy: userId,
				performedByEmail: locals.user.email,
				performedByRole: userRole,
				timestamp: new Date().toISOString(),
				details: {
					streamTitle: streamData.title,
					streamStatus: streamData.status,
					memorialName: memorial.lovedOneName,
					deletionType: 'soft',
					recoverableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
				}
			});
			console.log('📋 [STREAM DELETE] Audit log created');
		} catch (auditError: any) {
			console.warn('⚠️ [STREAM DELETE] Failed to create audit log (non-fatal):', auditError.message);
		}

		return json({
			success: true,
			message: 'Stream marked as deleted (recoverable for 30 days)',
			streamId,
			deletedAt: new Date().toISOString(),
			isSoftDelete: true,
			recoverableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
		});
	} catch (error: any) {
		console.error('❌ [STREAM DELETE] Error deleting stream:', error);
		console.error('❌ [STREAM DELETE] Error details:', {
			message: error?.message,
			stack: error?.stack,
			streamId
		});

		// If it's already a SvelteKit error, re-throw it
		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, `Failed to delete stream: ${error?.message || 'Unknown error'}`);
	}
};

/**
 * POST handler (alternative to DELETE for form submissions)
 * Some clients may not support DELETE method
 */
export const POST: RequestHandler = DELETE;
