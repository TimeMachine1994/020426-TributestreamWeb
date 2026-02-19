import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPaymentConfirmationEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { memorialId, paymentIntentId, customerEmail, lovedOneName, amount } =
			await request.json();

		if (!memorialId || !paymentIntentId || !customerEmail || !lovedOneName || !amount) {
			return json({ error: 'Missing required data' }, { status: 400 });
		}

		console.log('📧 Sending confirmation email to:', customerEmail);

		// Send email using dynamic template
		await sendPaymentConfirmationEmail({
			memorialId,
			paymentIntentId,
			customerEmail,
			lovedOneName,
			amount,
			paymentDate: new Date()
		});

		return json({
			success: true,
			message: 'Confirmation email sent successfully'
		});
	} catch (error) {
		console.error('Failed to send confirmation email:', error);
		return json(
			{
				error: 'Failed to send confirmation email',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

