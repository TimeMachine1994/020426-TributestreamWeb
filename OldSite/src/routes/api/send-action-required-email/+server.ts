import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPaymentActionRequiredEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { memorialId, paymentIntentId, customerEmail, lovedOneName, nextActionUrl } =
			await request.json();

		if (!memorialId || !paymentIntentId || !customerEmail || !lovedOneName) {
			return json({ error: 'Missing required data' }, { status: 400 });
		}

		console.log('📧 Sending action required email to:', customerEmail);

		// Send email using dynamic template
		await sendPaymentActionRequiredEmail({
			memorialId,
			paymentIntentId,
			customerEmail,
			lovedOneName,
			nextActionUrl
		});

		return json({
			success: true,
			message: 'Action required email sent successfully'
		});
	} catch (error) {
		console.error('Failed to send action required email:', error);
		return json(
			{
				error: 'Failed to send action required email',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

