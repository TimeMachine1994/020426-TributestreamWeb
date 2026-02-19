/**
 * Email Audit Logs - Detail API
 * 
 * GET /api/admin/email-logs/[id]
 * Returns full email audit log entry
 */

import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	const { id } = params;

	try {
		const doc = await adminDb.collection('email_audit_logs').doc(id).get();

		if (!doc.exists) {
			throw error(404, 'Email log not found');
		}

		const data = doc.data()!;

		return json({
			log: {
				id: doc.id,
				type: data.type,
				templateId: data.templateId || null,
				templateName: data.templateName || null,
				to: data.to,
				cc: data.cc || [],
				from: data.from,
				subject: data.subject || null,
				templateData: data.templateData || {},
				sentAt: data.sentAt?.toDate?.()?.toISOString() || new Date().toISOString(),
				triggeredBy: data.triggeredBy,
				triggeredByUserId: data.triggeredByUserId || null,
				triggeredByAdminId: data.triggeredByAdminId || null,
				memorialId: data.memorialId || null,
				userId: data.userId || null,
				invoiceId: data.invoiceId || null,
				streamId: data.streamId || null,
				status: data.status,
				error: data.error || null,
				sendgridMessageId: data.sendgridMessageId || null,
				environment: data.environment || 'unknown'
			}
		});
	} catch (err: any) {
		if (err?.status === 404) throw err;
		console.error('Failed to fetch email log detail:', err);
		throw error(500, 'Failed to fetch email log');
	}
};
