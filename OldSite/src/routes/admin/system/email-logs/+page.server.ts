/**
 * Email Audit Logs - Admin Page Server Load
 * 
 * Loads email logs with filters and computes inline stats.
 */

import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { EmailType, EmailStatus } from '$lib/types/email-audit';

export const load = async ({ locals, url }: any) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Parse query params
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
	const type = url.searchParams.get('type') as EmailType | null;
	const status = url.searchParams.get('status') as EmailStatus | null;
	const to = url.searchParams.get('to') as string | null;
	const memorialId = url.searchParams.get('memorialId') as string | null;
	const startDate = url.searchParams.get('startDate') as string | null;
	const endDate = url.searchParams.get('endDate') as string | null;

	try {
		// Build filtered query
		let query: FirebaseFirestore.Query = adminDb.collection('email_audit_logs');

		if (type) query = query.where('type', '==', type);
		if (status) query = query.where('status', '==', status);
		if (to) query = query.where('to', '==', to);
		if (memorialId) query = query.where('memorialId', '==', memorialId);
		if (startDate) query = query.where('sentAt', '>=', new Date(startDate));
		if (endDate) query = query.where('sentAt', '<=', new Date(endDate));

		query = query.orderBy('sentAt', 'desc');

		// Offset pagination
		const offset = (page - 1) * limit;
		if (offset > 0) query = query.offset(offset);
		query = query.limit(limit + 1);

		const snapshot = await query.get();
		const hasMore = snapshot.docs.length > limit;
		const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;

		const logs = docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				type: data.type,
				to: data.to,
				templateName: data.templateName || null,
				subject: data.subject || null,
				sentAt: data.sentAt?.toDate?.()?.toISOString() || new Date().toISOString(),
				status: data.status,
				memorialId: data.memorialId || null,
				error: data.error || null
			};
		});

		// Compute stats (unfiltered counts)
		let stats = { total: 0, sent: 0, failed: 0, mocked: 0 };
		try {
			const [totalSnap, sentSnap, failedSnap, mockedSnap] = await Promise.all([
				adminDb.collection('email_audit_logs').count().get(),
				adminDb.collection('email_audit_logs').where('status', '==', 'sent').count().get(),
				adminDb.collection('email_audit_logs').where('status', '==', 'failed').count().get(),
				adminDb.collection('email_audit_logs').where('status', '==', 'mocked').count().get()
			]);
			stats = {
				total: totalSnap.data().count,
				sent: sentSnap.data().count,
				failed: failedSnap.data().count,
				mocked: mockedSnap.data().count
			};
		} catch {
			// count() aggregation may not be available — fall back to log length
			stats.total = logs.length;
		}

		return {
			logs,
			stats,
			pagination: {
				page,
				limit,
				total: stats.total,
				hasMore
			},
			filters: {
				type: type || '',
				status: status || '',
				to: to || '',
				memorialId: memorialId || '',
				startDate: startDate || '',
				endDate: endDate || ''
			}
		};
	} catch (err) {
		console.error('Failed to load email audit logs:', err);
		return {
			logs: [],
			stats: { total: 0, sent: 0, failed: 0, mocked: 0 },
			pagination: { page: 1, limit: 50, total: 0, hasMore: false },
			filters: { type: '', status: '', to: '', memorialId: '', startDate: '', endDate: '' }
		};
	}
};
