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

		const { memorialId } = await request.json();

		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		console.log('🗑️ [ADMIN API] Deleting memorial:', memorialId);

		// Get memorial data before deletion for audit log
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorialData = memorialDoc.data();

		// SOFT DELETE: Mark as deleted instead of permanently removing
		await adminDb.collection('memorials').doc(memorialId).update({
			isDeleted: true,
			deletedAt: new Date(),
			deletedBy: locals.user.uid
		});

		console.log('✅ [ADMIN API] Memorial soft-deleted successfully');
		console.log('ℹ️ [ADMIN API] Memorial will be permanently deleted after 30 days');

		// Log the deletion
		await logAuditEvent({
			uid: locals.user.uid,
			action: 'admin_memorial_soft_deleted',
			userEmail: locals.user.email,
			userRole: locals.user.role as 'admin' | 'owner' | 'funeral_director',
			resourceType: 'memorial',
			resourceId: memorialId,
			details: {
				lovedOneName: memorialData?.lovedOneName,
				creatorEmail: memorialData?.creatorEmail,
				deletedBy: locals.user.email,
				deletionType: 'soft',
				recoverableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
			},
			success: true,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});

		return json({
			success: true,
			message: 'Memorial marked as deleted (recoverable for 30 days)',
			memorialId,
			isSoftDelete: true,
			recoverableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
		});
	} catch (error: any) {
		console.error('❌ [ADMIN API] Error deleting memorial:', error);

		// Log the error
		await logAuditEvent({
			uid: locals.user?.uid || 'unknown',
			action: 'admin_memorial_delete_error',
			userEmail: locals.user?.email || 'unknown',
			userRole: locals.user?.role as 'admin' | 'owner' | 'funeral_director' || 'admin',
			resourceType: 'memorial',
			resourceId: 'unknown',
			details: { error: error.message },
			success: false,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});

		return json(
			{
				error: 'Failed to delete memorial',
				details: error.message
			},
			{ status: 500 }
		);
	}
};
