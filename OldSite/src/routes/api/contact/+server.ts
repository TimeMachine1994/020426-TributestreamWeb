import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyRecaptcha, RECAPTCHA_ACTIONS, getScoreThreshold } from '$lib/utils/recaptcha';

import { sendContactFormEmails } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	console.log('\n\n');
	console.log('╔═══════════════════════════════════════════════════════════╗');
	console.log('[CONTACT_API] 📨 NEW CONTACT FORM SUBMISSION RECEIVED');
	console.log('╚═══════════════════════════════════════════════════════════╝');
	try {
		console.log('[CONTACT_API] 📝 Step 1: Parsing request body...');
		const { name, email, subject, message, recaptchaToken, honeypot } = await request.json();
		console.log('[CONTACT_API] ✅ Request parsed successfully');
		console.log('[CONTACT_API] Form data:', { name, email, subject, messageLength: message?.length });
		console.log('[CONTACT_API] Has reCAPTCHA token:', !!recaptchaToken);
		console.log('[CONTACT_API] Honeypot value:', honeypot ? 'FILLED (bot detected!)' : 'empty (good)');

		// Honeypot check - if filled, it's a bot
		console.log('[CONTACT_API] 🤖 Step 2: Honeypot check...');
		if (honeypot) {
			console.warn('[CONTACT_API] ⚠️ Honeypot field filled, rejecting bot submission');
			// Return fake success to fool bots
			return json({ success: true, message: 'Message sent successfully.' }, { status: 200 });
		}
		console.log('[CONTACT_API] ✅ Honeypot check passed');

		// Validate required fields
		console.log('[CONTACT_API] ✔️ Step 3: Validating required fields...');
		if (!name || !email || !subject || !message) {
			console.error('[CONTACT_API] ❌ Validation failed: missing fields');
			return json({ error: 'All fields are required' }, { status: 400 });
		}
		console.log('[CONTACT_API] ✅ All required fields present');

		// Validate email format
		console.log('[CONTACT_API] 📧 Step 4: Validating email format...');
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			console.error('[CONTACT_API] ❌ Invalid email format:', email);
			return json({ error: 'Please enter a valid email address' }, { status: 400 });
		}
		console.log('[CONTACT_API] ✅ Email format valid');

		console.log('[CONTACT_API] 🔐 Step 5: Checking reCAPTCHA configuration...');
		const isDev = process.env.NODE_ENV === 'development';
		const isRecaptchaConfigured = process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'your_recaptcha_secret_key_here';
		console.log('[CONTACT_API] Environment:', isDev ? 'DEVELOPMENT' : 'PRODUCTION');
		console.log('[CONTACT_API] reCAPTCHA configured:', isRecaptchaConfigured);
		console.log('[CONTACT_API] reCAPTCHA token provided:', !!recaptchaToken);

		// Verify reCAPTCHA
		console.log('[CONTACT_API] 🔐 Step 6: Verifying reCAPTCHA...');
		if (recaptchaToken && isRecaptchaConfigured) {
			try {
				const recaptchaResult = await verifyRecaptcha(
					recaptchaToken,
					RECAPTCHA_ACTIONS.CONTACT_FORM,
					getScoreThreshold(RECAPTCHA_ACTIONS.CONTACT_FORM)
				);

				if (!recaptchaResult.success) {
					console.error('[CONTACT_API] reCAPTCHA verification failed:', recaptchaResult.error);
					console.error('[CONTACT_API] Full reCAPTCHA result:', JSON.stringify(recaptchaResult, null, 2));
					console.error('[CONTACT_API] Score:', recaptchaResult.score);
					console.error('[CONTACT_API] Action:', recaptchaResult.action);
					console.error('[CONTACT_API] Expected action:', RECAPTCHA_ACTIONS.CONTACT_FORM);
					console.error('[CONTACT_API] Score threshold:', getScoreThreshold(RECAPTCHA_ACTIONS.CONTACT_FORM));
					if (!isDev) {
						console.error('[CONTACT_API] ❌ reCAPTCHA verification FAILED in production');
						return json({ error: 'Security verification failed. Please try again.' }, { status: 400 });
					} else {
						console.warn('[CONTACT_API] ⚠️ reCAPTCHA failed in dev mode, proceeding anyway');
					}
				} else {
					console.log(`[CONTACT_API] ✅ reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
				}
			} catch (error) {
				console.warn('[CONTACT_API] reCAPTCHA verification error:', error);
				if (!isDev) {
					return json({ error: 'Security verification error. Please try again.' }, { status: 400 });
				}
			}
		} else if (!isRecaptchaConfigured) {
			console.warn('[CONTACT_API] ⚠️ reCAPTCHA not configured, skipping verification');
		} else if (!recaptchaToken && !isDev) {
			// Only require reCAPTCHA in production when it's configured
			console.warn('[CONTACT_API] ❌ No reCAPTCHA token provided in production');
			return json({ error: 'Security verification required. Please refresh and try again.' }, { status: 400 });
		} else {
			console.log('[CONTACT_API] ✅ reCAPTCHA skipped in development mode');
		}

		// Send contact form emails using dynamic templates
		console.log('═══════════════════════════════════════════════════════════');
		console.log('[CONTACT_API] 📧 Step 7: Attempting to send emails via sendContactFormEmails()...');
		console.log('[CONTACT_API] Email will be sent to support AND to user:', email);
		let emailsSent = false;
		let emailError: any = null;
		
		try {
			console.log('[CONTACT_API] 🔄 Calling sendContactFormEmails function...');
			await sendContactFormEmails({
				name,
				email,
				subject,
				message,
				timestamp: new Date()
			});
			console.log('[CONTACT_API] ✅✅ SUCCESS! Both emails sent successfully');
			console.log('[CONTACT_API] ✅ Support email sent to: austinbryanfilm@gmail.com');
			console.log('[CONTACT_API] ✅ Confirmation email sent to:', email);
			emailsSent = true;
		} catch (err) {
			emailError = err;
			console.error('[CONTACT_API] ❌❌ Email sending FAILED');
			console.error('[CONTACT_API] Error object:', err);
			
			// Log detailed error information
			if (err && typeof err === 'object' && 'response' in err) {
				const sgError = err as any;
				console.error('[CONTACT_API] SendGrid error details:', {
					body: sgError.response?.body,
					status: sgError.response?.statusCode,
					headers: sgError.response?.headers
				});
			}
			
			console.warn('[CONTACT_API] ⚠️ Email delivery failed but form submission will still be acknowledged');
		}
		console.log('═══════════════════════════════════════════════════════════');

		// Return appropriate message based on email success
		console.log('[CONTACT_API] 📤 Step 8: Preparing response...');
		if (emailsSent) {
			console.log('[CONTACT_API] ✅ Returning SUCCESS response (both emails sent)');
			return json(
				{
					success: true,
					message: 'Message sent successfully. Confirmation email sent to your inbox.'
				},
				{ status: 200 }
			);
		} else {
			// Email failed but we still received the submission
			console.log('[CONTACT_API] ⚠️ Returning SUCCESS response (but email delivery may have failed)');
			return json(
				{
					success: true,
					message: 'Message received. We\'ll respond within 24 hours. (Note: Email confirmation may be delayed)'
				},
				{ status: 200 }
			);
		}
	} catch (error) {
		console.error('Contact form error:', error);

		// Handle SendGrid specific errors
		if (error && typeof error === 'object' && 'response' in error) {
			const sgError = error as any;
			console.error('SendGrid error:', sgError.response?.body);

			return json(
				{ error: 'Failed to send email. Please try again or contact us directly.' },
				{ status: 500 }
			);
		}

		return json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
	}
};
