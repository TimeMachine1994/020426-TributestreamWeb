/**
 * Email Audit Logs - List API
 * 
 * GET /api/admin/email-logs
 * Query params: page, limit, type, status, to, memorialId, startDate, endDate
 */

import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';
import type { EmailType, EmailStatus } from '$lib/types/email-audit';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	// Parse query params
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
	const type = url.searchParams.get('type') as EmailType | null;
	const status = url.searchParams.get('status') as EmailStatus | null;
	const to = url.searchParams.get('to');
	const memorialId = url.searchParams.get('memorialId');
	const startDate = url.searchParams.get('startDate');
	const endDate = url.searchParams.get('endDate');

	try {
		let query: FirebaseFirestore.Query = adminDb.collection('email_audit_logs');

		// Apply filters
		if (type) {
			query = query.where('type', '==', type);
		}
		if (status) {
			query = query.where('status', '==', status);
		}
		if (to) {
			query = query.where('to', '==', to);
		}
		if (memorialId) {
			query = query.where('memorialId', '==', memorialId);
		}
		if (startDate) {
			query = query.where('sentAt', '>=', new Date(startDate));
		}
		if (endDate) {
			query = query.where('sentAt', '<=', new Date(endDate));
		}

		// Order and paginate
		query = query.orderBy('sentAt', 'desc');

		// For offset-based pagination, skip previous pages
		const offset = (page - 1) * limit;
		if (offset > 0) {
			query = query.offset(offset);
		}
		query = query.limit(limit + 1); // Fetch one extra to check hasMore

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

		// Get total count (separate query — cached by Firestore)
		let total = 0;
		try {
			let countQuery: FirebaseFirestore.Query = adminDb.collection('email_audit_logs');
			if (type) countQuery = countQuery.where('type', '==', type);
			if (status) countQuery = countQuery.where('status', '==', status);
			if (to) countQuery = countQuery.where('to', '==', to);
			if (memorialId) countQuery = countQuery.where('memorialId', '==', memorialId);
			const countSnap = await countQuery.count().get();
			total = countSnap.data().count;
		} catch {
			// count() may not be available; estimate from hasMore
			total = offset + logs.length + (hasMore ? 1 : 0);
		}

		return json({
			logs,
			pagination: {
				page,
				limit,
				total,
				hasMore
			}
		});
	} catch (err) {
		console.error('Failed to fetch email audit logs:', err);
		throw error(500, 'Failed to fetch email logs');
	}
};
