import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '100');
	const sortBy = url.searchParams.get('sortBy') || 'timestamp';
	const sortDir = url.searchParams.get('sortDir') || 'desc';

	// Load audit logs from both collections
	const adminAuditLogsPromise = adminDb
		.collection('admin_audit_logs')
		.orderBy(sortBy, sortDir as any)
		.limit(limit)
		.get();

	const auditLogsPromise = adminDb
		.collection('audit_logs')
		.orderBy(sortBy === 'timestamp' ? 'createdAt' : sortBy, sortDir as any)
		.limit(limit)
		.get();

	const [adminAuditSnapshot, auditSnapshot] = await Promise.all([
		adminAuditLogsPromise,
		auditLogsPromise
	]);

	// Process admin audit logs
	const adminLogs = adminAuditSnapshot.docs.map((doc) => {
		const data = doc.data();

		return {
			id: doc.id,
			timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
			action: data.action || 'unknown',
			adminId: data.adminId || 'system',
			adminEmail: data.adminEmail || 'system',
			resourceType: data.resourceType || data.targetType || 'unknown',
			resourceId: data.resourceId || data.targetId || '-',
			status: data.status || 'success',
			details: data.details || data.metadata || null,
			source: 'admin_audit_logs'
		};
	});

	// Process general audit logs
	const generalLogs = auditSnapshot.docs.map((doc) => {
		const data = doc.data();

		return {
			id: doc.id,
			timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
			action: data.action || 'unknown',
			adminId: data.userId || 'system',
			adminEmail: data.userEmail || 'system',
			resourceType: data.resourceType || 'unknown',
			resourceId: data.resourceId || '-',
			status: 'success',
			details: data.details || data.metadata || null,
			source: 'audit_logs'
		};
	});

	// Combine and sort by timestamp
	const allLogs = [...adminLogs, ...generalLogs].sort((a, b) => {
		const aTime = new Date(a.timestamp).getTime();
		const bTime = new Date(b.timestamp).getTime();
		return sortDir === 'desc' ? bTime - aTime : aTime - bTime;
	});

	// Limit to requested amount
	const logs = allLogs.slice(0, limit);

	return {
		logs,
		pagination: {
			page,
			limit,
			total: logs.length
		}
	};
};
