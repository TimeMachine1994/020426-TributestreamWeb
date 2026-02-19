import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { stripe } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { paymentIntentId, bookingData, customerInfo } = await request.json();
		const memorialId = bookingData?.memorialId;

		if (!paymentIntentId || !bookingData || !customerInfo || !memorialId) {
			return json({ error: 'Missing required data' }, { status: 400 });
		}

		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		console.log('🔒 Locking schedule for payment:', paymentIntentId);

		// 1. Verify the payment intent status with Stripe
		const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

		if (paymentIntent.status !== 'succeeded') {
			console.error('Payment not successful:', paymentIntent.status);
			return json({ error: 'Payment not successful. Please complete payment.' }, { status: 402 });
		}

		// 2. Update the memorial document in Firestore
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const updatePayload = {
			'calculatorConfig.status': 'paid',
			'calculatorConfig.paidAt': Timestamp.now(),
			'calculatorConfig.paymentIntentId': paymentIntent.id,
			'calculatorConfig.customerInfo': customerInfo, // Save customer info with the booking
			'calculatorConfig.bookingItems': bookingData.items, // Save final booking items
			'calculatorConfig.total': bookingData.total, // Save final total
			paymentHistory: {
				paymentIntentId: paymentIntent.id,
				status: 'succeeded',
				amount: paymentIntent.amount / 100,
				paidAt: Timestamp.now(),
				createdBy: locals.user.uid
			}
		};

		await memorialRef.update(updatePayload);

		console.log('✅ Schedule locked and memorial updated successfully for:', memorialId);

		return json({
			success: true,
			message: 'Schedule locked successfully',
			bookingId: `booking_${memorialId}`
		});
	} catch (error) {
		console.error('Failed to lock schedule:', error);
		return json(
			{
				error: 'Failed to lock schedule',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
