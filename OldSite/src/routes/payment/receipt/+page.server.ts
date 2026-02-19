import { adminDb } from '$lib/server/firebase';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { stripe } from '$lib/server/stripe';

export const load: PageServerLoad = async ({ url }) => {
	// Don't require auth - receipt page can be accessed by anyone with session_id
	const sessionId = url.searchParams.get('session_id');

	if (!sessionId) {
		throw error(400, 'Missing session ID');
	}

	try {
		console.log('📄 [RECEIPT] Loading receipt for session:', sessionId);

		// Retrieve session from Stripe
		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ['line_items', 'customer', 'payment_intent']
		});

		console.log('✅ [RECEIPT] Stripe session retrieved');

		// Get memorial data
		const memorialId = session.metadata?.memorialId;
		if (!memorialId) {
			throw error(400, 'Missing memorial ID in session metadata');
		}

		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();
		const config = memorial?.calculatorConfig;

		console.log('✅ [RECEIPT] Memorial data retrieved');

		// Build receipt data matching existing component structure
		const receiptData = {
			paymentDate: new Date().toISOString(),
			paymentIntentId: typeof session.payment_intent === 'string' 
				? session.payment_intent 
				: session.payment_intent?.id || sessionId,
			checkoutSessionId: sessionId,
			customerInfo: {
				firstName: session.customer_details?.name?.split(' ')[0] || 'Customer',
				lastName: session.customer_details?.name?.split(' ').slice(1).join(' ') || '',
				email: session.customer_details?.email || session.metadata?.customerEmail || '',
				phone: session.customer_details?.phone || null,
				address: session.customer_details?.address || {
					line1: '',
					line2: '',
					city: '',
					state: '',
					postal_code: ''
				}
			},
			bookingData: {
				items: config?.bookingItems || [],
				total: config?.total || (session.amount_total ? session.amount_total / 100 : 0)
			},
			memorial: {
				id: memorialId,
				lovedOneName: memorial?.lovedOneName || session.metadata?.lovedOneName || ''
			}
		};

		console.log('✅ [RECEIPT] Receipt data prepared');

		return {
			receiptData
		};
	} catch (err) {
		console.error('❌ [RECEIPT] Failed to load receipt data:', err);
		throw error(500, 'Failed to load receipt information');
	}
};
