import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyRecaptcha, RECAPTCHA_ACTIONS, getScoreThreshold } from '$lib/utils/recaptcha';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		
		// Validate required fields
		const { funeralHomeName, contactName, email, phone, recaptchaToken } = data;
		if (!funeralHomeName || !contactName || !email || !phone) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Verify reCAPTCHA (optional in development)
		const isDev = process.env.NODE_ENV === 'development';
		
		if (recaptchaToken) {
			const recaptchaResult = await verifyRecaptcha(
				recaptchaToken,
				RECAPTCHA_ACTIONS.BOOK_DEMO,
				getScoreThreshold(RECAPTCHA_ACTIONS.BOOK_DEMO)
			);

			if (!recaptchaResult.success) {
				console.error('[BOOK_DEMO_API] reCAPTCHA verification failed:', recaptchaResult.error);
				return json({ error: 'Security verification failed. Please try again.' }, { status: 400 });
			}

			console.log(`[BOOK_DEMO_API] reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
		} else if (!isDev) {
			console.warn('[BOOK_DEMO_API] No reCAPTCHA token provided');
			return json({ error: 'Security verification required. Please refresh and try again.' }, { status: 400 });
		} else {
			console.log('[BOOK_DEMO_API] reCAPTCHA skipped in development mode');
		}

		// Here you would typically:
		// 1. Save to database
		// 2. Send notification emails
		// 3. Add to calendar/CRM system
		
		console.log('📅 Demo booking request received:', {
			funeralHomeName: data.funeralHomeName,
			contactName: data.contactName,
			email: data.email,
			phone: data.phone,
			preferredDate: data.preferredDate,
			preferredTime: data.preferredTime,
			address: data.address,
			notes: data.notes,
			wantAdvertising: data.wantAdvertising,
			timestamp: new Date().toISOString()
		});

		// For now, just log the request
		// TODO: Implement actual booking logic
		// - Save to Firestore
		// - Send email notifications
		// - Add to Google Calendar
		// - Create CRM entry

		return json({ 
			success: true, 
			message: 'Demo request submitted successfully' 
		});

	} catch (error) {
		console.error('Error processing demo booking:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
