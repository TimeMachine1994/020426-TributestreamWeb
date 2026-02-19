import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { logAuditEvent } from '$lib/server/auditLogger';

export const GET: RequestHandler = async ({ request, locals, getClientAddress }) => {
	// Verify admin access
	if (!locals.user?.isAdmin) {
		await logAuditEvent({
			uid: locals.user?.uid || 'anonymous',
			action: 'api_access_denied',
			userEmail: locals.user?.email || 'anonymous',
			userRole: (locals.user?.role as 'admin' | 'owner' | 'funeral_director') || 'admin',
			resourceType: 'audit_logs',
			resourceId: 'audit_logs_access',
			details: { reason: 'Admin access required' },
			success: false,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	try {
		const url = new URL(request.url);
		const action = url.searchParams.get('action');
		const userEmail = url.searchParams.get('userEmail');
		const resourceType = url.searchParams.get('resourceType');
		const dateFrom = url.searchParams.get('dateFrom');
		const dateTo = url.searchParams.get('dateTo');
		const limit = parseInt(url.searchParams.get('limit') || '50');

		console.log('🔍 [ADMIN API] Loading audit logs with filters:', {
			action,
			userEmail,
			resourceType,
			dateFrom,
			dateTo,
			limit
		});

		// Build Firestore query
		let query = adminDb.collection('audit_logs').orderBy('timestamp', 'desc');

		// Apply filters
		if (action) {
			query = query.where('action', '==', action);
		}
		if (userEmail) {
			query = query.where('userEmail', '==', userEmail);
		}
		if (resourceType) {
			query = query.where('resourceType', '==', resourceType);
		}
		if (dateFrom) {
			const fromDate = new Date(dateFrom);
			fromDate.setHours(0, 0, 0, 0);
			query = query.where('timestamp', '>=', fromDate);
		}
		if (dateTo) {
			const toDate = new Date(dateTo);
			toDate.setHours(23, 59, 59, 999);
			query = query.where('timestamp', '<=', toDate);
		}

		// Apply limit
		query = query.limit(Math.min(limit, 1000)); // Cap at 1000 for performance

		// Execute query
		const snapshot = await query.get();
		const logs = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));

		console.log('✅ [ADMIN API] Retrieved audit logs:', logs.length);

		// Log the audit log access
		await logAuditEvent({
			uid: locals.user.uid,
			action: 'admin_audit_logs_accessed',
			userEmail: locals.user.email,
			userRole: (locals.user.role as 'admin' | 'owner' | 'funeral_director') || 'admin',
			resourceType: 'audit_logs',
			resourceId: 'audit_logs_query',
			details: {
				filters: { action, userEmail, resourceType, dateFrom, dateTo, limit },
				resultCount: logs.length
			},
			success: true,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});

		return json({
			success: true,
			logs,
			count: logs.length,
			filters: { action, userEmail, resourceType, dateFrom, dateTo, limit }
		});
	} catch (error) {
		console.error('❌ [ADMIN API] Error loading audit logs:', error);

		// Log the error
		await logAuditEvent({
			uid: locals.user?.uid || 'unknown',
			action: 'admin_audit_logs_error',
			userEmail: locals.user?.email || 'unknown',
			userRole: (locals.user?.role as 'admin' | 'owner' | 'funeral_director') || 'admin',
			resourceType: 'audit_logs',
			resourceId: 'audit_logs_error',
			details: { error: error instanceof Error ? error.message : 'Unknown error' },
			success: false,
			ipAddress: getClientAddress(),
			userAgent: request.headers.get('user-agent') || undefined
		});

		return json(
			{
				error: 'Failed to load audit logs',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
