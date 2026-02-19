import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPaymentFailureEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { memorialId, paymentIntentId, customerEmail, lovedOneName, failureReason } =
			await request.json();

		if (!memorialId || !paymentIntentId || !customerEmail || !lovedOneName || !failureReason) {
			return json({ error: 'Missing required data' }, { status: 400 });
		}

		console.log('📧 Sending payment failure email to:', customerEmail);

		// Send email using dynamic template
		await sendPaymentFailureEmail({
			memorialId,
			paymentIntentId,
			customerEmail,
			lovedOneName,
			failureReason
		});

		return json({
			success: true,
			message: 'Payment failure email sent successfully'
		});
	} catch (error) {
		console.error('Failed to send payment failure email:', error);
		return json(
			{
				error: 'Failed to send payment failure email',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

