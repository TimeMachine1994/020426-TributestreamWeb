import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';
import { stripe } from '$lib/server/stripe';

export const load: PageServerLoad = async ({ params, url }) => {
	const { invoiceId } = params;
	const sessionId = url.searchParams.get('session_id');

	if (!invoiceId) {
		return {
			receipt: null,
			error: 'Invoice ID is required'
		};
	}

	try {
		const invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();

		if (!invoiceDoc.exists) {
			return {
				receipt: null,
				error: 'Invoice not found'
			};
		}

		const invoice = invoiceDoc.data();

		if (!invoice) {
			return {
				receipt: null,
				error: 'Invoice data not found'
			};
		}

		// If we have a session_id and invoice is not yet marked paid, verify and update
		if (sessionId && invoice.status !== 'paid') {
			try {
				const session = await stripe.checkout.sessions.retrieve(sessionId);
				
				if (session.payment_status === 'paid') {
					// Update invoice status
					await adminDb.collection('invoices').doc(invoiceId).update({
						status: 'paid',
						paidAt: new Date(),
						paymentIntentId: session.payment_intent
					});
					
					invoice.status = 'paid';
					invoice.paidAt = new Date();
					invoice.paymentIntentId = session.payment_intent;
				}
			} catch (stripeError) {
				console.error('Failed to verify Stripe session:', stripeError);
			}
		}

		// Only show receipt if paid
		if (invoice.status !== 'paid') {
			return {
				receipt: null,
				error: 'Invoice has not been paid yet',
				redirectTo: `/pay/${invoiceId}`
			};
		}

		return {
			receipt: {
				invoiceId: invoice.id,
				items: invoice.items,
				total: invoice.total,
				customerEmail: invoice.customerEmail,
				customerName: invoice.customerName,
				paidAt: invoice.paidAt?.toDate?.()?.toISOString() || new Date().toISOString(),
				paymentIntentId: invoice.paymentIntentId || 'N/A'
			},
			error: null
		};
	} catch (error) {
		console.error('Failed to load receipt:', error);
		return {
			receipt: null,
			error: 'Failed to load receipt'
		};
	}
};
