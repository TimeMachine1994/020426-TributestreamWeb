import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { stripe } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { memorialId, customerInfo, bookingData } = await request.json();
		const { items: bookingItems, total: amount } = bookingData;

		if (!amount || !memorialId) {
			return json({ error: 'Missing required data' }, { status: 400 });
		}

		console.log('💳 Creating payment intent:', { amount, memorialId, uid: locals.user.uid });

		// Verify memorial exists and user has permission
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const userRole = locals.user.role;
		const uid = locals.user.uid;

		// Check if user owns this memorial
		const isOwner = memorial.ownerUid === locals.user.uid;

		const hasPermission =
			userRole === 'admin' || memorial?.ownerUid === uid || memorial?.funeralDirectorUid === uid;

		if (!hasPermission) {
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Create a Stripe Checkout Session
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: bookingItems.map((item: any) => ({
				price_data: {
					currency: 'usd',
					product_data: {
						name: item.name
					},
					unit_amount: Math.round((item.total / item.quantity) * 100)
				},
				quantity: item.quantity
			})),
			mode: 'payment',
			success_url: `${request.headers.get('origin')}/payment/receipt?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${request.headers.get('origin')}/schedule/${memorialId}`,
			metadata: {
				memorialId,
				uid: locals.user.uid,
				customerEmail: customerInfo?.email || locals.user.email || '',
				lovedOneName: memorial?.lovedOneName || ''
			},
			customer_email: customerInfo?.email || locals.user.email || ''
		});

		// Save checkout session info AND booking details to memorial
		await memorialRef.update({
			'calculatorConfig.status': 'pending_payment',
			'calculatorConfig.checkoutSessionId': session.id,
			'calculatorConfig.bookingItems': bookingItems, // Save line item breakdown
			'calculatorConfig.totalPrice': amount, // Save total price
			'calculatorConfig.lastModified': Timestamp.now(),
			'calculatorConfig.lastModifiedBy': locals.user.uid
		});

		console.log('✅ Checkout session created successfully:', session.id);

		return json({
			url: session.url
		});
	} catch (error) {
		console.error('Failed to create payment intent:', error);
		return json(
			{
				error: 'Failed to create payment intent',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
