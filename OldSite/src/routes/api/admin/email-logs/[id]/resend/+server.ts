/**
 * Email Audit Logs - Resend API
 * 
 * POST /api/admin/email-logs/[id]/resend
 * Resend an email using the original template data, optionally overriding the recipient.
 */

import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';
import type { EmailType } from '$lib/types/email-audit';

// Dynamic import map: email type → send function
// We import lazily to avoid circular dependencies
async function resendByType(type: EmailType, originalData: Record<string, any>, overrideTo?: string) {
	const email = await import('$lib/server/email');

	const data = { ...originalData };
	if (overrideTo) {
		// Override recipient fields based on email type
		if ('email' in data) data.email = overrideTo;
		if ('to' in data) data.to = overrideTo;
		if ('customerEmail' in data) data.customerEmail = overrideTo;
	}

	const sendMap: Record<string, () => Promise<void>> = {
		'enhanced_registration': () => email.sendEnhancedRegistrationEmail(data as any),
		'basic_registration': () => email.sendRegistrationEmail(data as any),
		'funeral_director_registration': () => email.sendFuneralDirectorRegistrationEmail(data as any),
		'invitation': () => email.sendInvitationEmail(data as any),
		'email_change_confirmation': () => email.sendEmailChangeConfirmation(data as any),
		'payment_confirmation': () => email.sendPaymentConfirmationEmail(data as any),
		'payment_action_required': () => email.sendPaymentActionRequiredEmail(data as any),
		'payment_failure': () => email.sendPaymentFailureEmail(data as any),
		'password_reset': () => email.sendPasswordResetEmail(data as any),
		'owner_welcome': () => email.sendOwnerWelcomeEmail(data as any),
		'funeral_director_welcome': () => email.sendFuneralDirectorWelcomeEmail(data as any),
		'contact_form_support': () => email.sendContactFormEmails(data as any),
		'contact_form_confirmation': () => email.sendContactFormEmails(data as any),
		'invoice': () => email.sendInvoiceEmail(data as any),
		'invoice_receipt': () => email.sendInvoiceReceiptEmail(data as any)
	};

	const sendFn = sendMap[type];
	if (!sendFn) {
		throw new Error(`No send function mapped for email type: ${type}`);
	}

	await sendFn();
}

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	const { id } = params;

	try {
		// Parse optional request body
		let modifyData: { email?: string } = {};
		try {
			const body = await request.json();
			modifyData = body.modifyData || {};
		} catch {
			// No body or invalid JSON — that's fine, use defaults
		}

		// Fetch original log
		const doc = await adminDb.collection('email_audit_logs').doc(id).get();
		if (!doc.exists) {
			throw error(404, 'Email log not found');
		}

		const logData = doc.data()!;
		const emailType = logData.type as EmailType;

		// Reconstruct the original email data from templateData
		// templateData contains the sanitized version — passwords are masked
		// This is intentional: resent emails won't contain the original password
		const templateData = logData.templateData || {};

		// Add back recipient info that may not be in templateData
		const reconstructedData: Record<string, any> = {
			...templateData,
			email: modifyData.email || logData.to,
			to: modifyData.email || logData.to,
			customerEmail: modifyData.email || logData.to
		};

		await resendByType(emailType, reconstructedData, modifyData.email);

		// Log the admin action
		await adminDb.collection('admin_audit_logs').add({
			adminId: locals.user.uid,
			adminEmail: locals.user.email,
			action: 'resend_email',
			resourceType: 'email_log',
			resourceId: id,
			details: {
				originalType: emailType,
				originalTo: logData.to,
				newTo: modifyData.email || logData.to,
				originalSentAt: logData.sentAt?.toDate?.()?.toISOString()
			},
			timestamp: new Date()
		});

		return json({
			success: true,
			message: `Email resent successfully to ${modifyData.email || logData.to}`
		});
	} catch (err: any) {
		if (err?.status === 404) throw err;
		console.error('Failed to resend email:', err);
		throw error(500, `Failed to resend email: ${err.message || 'Unknown error'}`);
	}
};
