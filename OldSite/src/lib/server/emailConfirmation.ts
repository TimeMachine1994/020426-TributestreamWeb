import { adminDb } from './firebase';
import { sendEmailChangeConfirmation as sendEmailViaSendGrid } from './email';

/**
 * Generate a confirmation token for email change
 */
export function generateEmailChangeToken(uid: string, newEmail: string, requestedAt: Date): string {
	return Buffer.from(`${uid}:${newEmail}:${requestedAt.toISOString()}`).toString('base64');
}

/**
 * Generate confirmation URL for email change
 */
export function generateConfirmationUrl(uid: string, newEmail: string, requestedAt: Date): string {
	const token = generateEmailChangeToken(uid, newEmail, requestedAt);
	const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
	return `${baseUrl}/api/confirm-email-change?token=${encodeURIComponent(token)}&uid=${uid}`;
}

/**
 * Send email change confirmation email using SendGrid
 */
export async function sendEmailChangeConfirmation(uid: string, newEmail: string, userName: string): Promise<void> {
	try {
		// Get user document to get the requestedAt timestamp
		const userDoc = await adminDb.collection('users').doc(uid).get();
		const userData = userDoc.data();
		
		if (!userData?.pendingEmailChange) {
			throw new Error('No pending email change found');
		}

		const requestedAt = userData.pendingEmailChange.requestedAt.toDate();
		const confirmationUrl = generateConfirmationUrl(uid, newEmail, requestedAt);

		console.log('📧 [EMAIL-CONFIRM] Generated confirmation URL:', confirmationUrl);
		console.log('📧 [EMAIL-CONFIRM] Sending email to:', newEmail);
		console.log('📧 [EMAIL-CONFIRM] For user:', userName);

		// Send email using your existing SendGrid service
		await sendEmailViaSendGrid({
			to: newEmail,
			userName: userName,
			confirmationUrl: confirmationUrl
		});

		console.log('✅ [EMAIL-CONFIRM] Email confirmation sent successfully via SendGrid');
	} catch (error) {
		console.error('❌ [EMAIL-CONFIRM] Error sending confirmation email:', error);
		throw error;
	}
}
