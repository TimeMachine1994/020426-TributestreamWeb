import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { logAuditEvent } from '$lib/server/auditLogger';

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Check admin privileges
		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		const { memorialIds, isComplete } = await request.json();

		if (!memorialIds || !Array.isArray(memorialIds) || memorialIds.length === 0) {
			return json({ error: 'Memorial IDs array is required' }, { status: 400 });
		}

		if (typeof isComplete !== 'boolean') {
			return json({ error: 'isComplete must be a boolean' }, { status: 400 });
		}

		console.log(`🔄 [ADMIN API] Toggling ${memorialIds.length} memorials to isComplete: ${isComplete}`);

		// Update all memorials in batch
		const batch = adminDb.batch();
		const updatedMemorials = [];

		for (const memorialId of memorialIds) {
			const memorialRef = adminDb.collection('memorials').doc(memorialId);
			
			// Get memorial data for audit logging
			const memorialDoc = await memorialRef.get();
			if (memorialDoc.exists) {
				const memorialData = memorialDoc.data();
				
				batch.update(memorialRef, {
					isComplete: isComplete,
					updatedAt: new Date()
				});

				updatedMemorials.push({
					id: memorialId,
					lovedOneName: memorialData?.lovedOneName || 'Unknown',
					previousStatus: memorialData?.isComplete || false
				});
			}
		}

		// Commit the batch
		await batch.commit();

		// Log audit events for each memorial
		try {
			for (const memorial of updatedMemorials) {
				await logAuditEvent({
					action: 'memorial_status_toggle',
					resourceType: 'memorial',
					resourceId: memorial.id,
					userId: locals.user.uid,
					userEmail: locals.user.email || 'unknown',
					ipAddress: getClientAddress(),
					details: {
						lovedOneName: memorial.lovedOneName,
						previousStatus: memorial.previousStatus,
						newStatus: isComplete,
						batchOperation: true,
						totalMemorials: memorialIds.length
					}
				});
			}
		} catch (auditError) {
			console.error('⚠️ [ADMIN API] Failed to create audit logs:', auditError);
		}

		const statusText = isComplete ? 'completed' : 'scheduled';
		console.log(`✅ [ADMIN API] Successfully marked ${updatedMemorials.length} memorials as ${statusText}`);

		return json({
			success: true,
			message: `Successfully marked ${updatedMemorials.length} memorials as ${statusText}`,
			updatedCount: updatedMemorials.length,
			memorials: updatedMemorials
		});

	} catch (error: any) {
		console.error('❌ [ADMIN API] Error toggling memorial status:', error);
		return json({
			error: error.message || 'Failed to toggle memorial status',
			code: error.code
		}, { status: 500 });
	}
};
