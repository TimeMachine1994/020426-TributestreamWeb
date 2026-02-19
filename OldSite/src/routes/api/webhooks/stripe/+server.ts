import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { adminDb, FieldValue } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { env } from '$env/dynamic/private';

const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_WEBHOOK_SECRET) {
	console.error('⚠️ STRIPE_WEBHOOK_SECRET is not configured - webhook signature verification will fail');
}

if (!STRIPE_SECRET_KEY) {
	console.error('⚠️ STRIPE_SECRET_KEY is not configured - Stripe webhooks will fail');
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2025-08-27.basil'
}) : null;

export const POST: RequestHandler = async ({ request }) => {
	if (!stripe) {
		console.error('Stripe not configured - STRIPE_SECRET_KEY missing');
		return json({ error: 'Stripe not configured' }, { status: 500 });
	}

	try {
		const body = await request.text();
		const signature = request.headers.get('stripe-signature');

		if (!signature) {
			console.error('Missing Stripe signature');
			return json({ error: 'Missing signature' }, { status: 400 });
		}

		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET!);
		} catch (err) {
			console.error('Webhook signature verification failed:', err);
			return json({ error: 'Invalid signature' }, { status: 400 });
		}

		console.log(`🎯 [WEBHOOK] Received event: ${event.type}`);

		switch (event.type) {
			// Checkout Session events (primary payment flow)
			case 'checkout.session.completed':
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutSuccess(session);
				break;

			case 'checkout.session.async_payment_succeeded':
				const asyncSession = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutSuccess(asyncSession);
				break;

			case 'checkout.session.async_payment_failed':
				const failedSession = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutFailure(failedSession);
				break;

			case 'checkout.session.expired':
				const expiredSession = event.data.object as Stripe.Checkout.Session;
				console.log(`⏱️ [WEBHOOK] Checkout session expired: ${expiredSession.id}`);
				break;

			// Payment Intent events (for direct payment flows)
			case 'payment_intent.succeeded':
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				await handlePaymentSuccess(paymentIntent);
				break;

			case 'payment_intent.payment_failed':
				const failedPayment = event.data.object as Stripe.PaymentIntent;
				await handlePaymentFailure(failedPayment);
				break;

			case 'payment_intent.requires_action':
				const actionRequired = event.data.object as Stripe.PaymentIntent;
				await handlePaymentActionRequired(actionRequired);
				break;

			default:
				console.log(`ℹ️ [WEBHOOK] Unhandled event type: ${event.type}`);
		}

		return json({ received: true });
	} catch (error) {
		console.error('Webhook processing failed:', error);
		return json({ error: 'Webhook processing failed' }, { status: 500 });
	}
};

// NEW: Handle Checkout Session completion (primary payment flow)
async function handleCheckoutSuccess(session: Stripe.Checkout.Session) {
	try {
		console.log('💳 [WEBHOOK] Processing checkout session:', session.id);

		// Check if this is an invoice payment
		if (session.metadata?.type === 'invoice') {
			await handleInvoicePaymentSuccess(session);
			return;
		}

		const memorialId = session.metadata?.memorialId;
		const uid = session.metadata?.uid;

		if (!memorialId || !uid) {
			console.error('❌ [WEBHOOK] Missing metadata in checkout session:', { memorialId, uid });
			return;
		}

		// Extract payment intent ID from session
		const paymentIntentId =
			typeof session.payment_intent === 'string'
				? session.payment_intent
				: session.payment_intent?.id;

		// 1. Update Memorial - SET isPaid flag for payment restrictions
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		await memorialRef.update({
			isPaid: true, // ✅ CRITICAL: Enable payment restrictions
			paidAt: Timestamp.now(),
			'calculatorConfig.status': 'paid',
			'calculatorConfig.paidAt': Timestamp.now(),
			'calculatorConfig.checkoutSessionId': session.id,
			'calculatorConfig.paymentIntentId': paymentIntentId,
			'calculatorConfig.lastModified': Timestamp.now(),
			paymentHistory: FieldValue.arrayUnion({
				checkoutSessionId: session.id,
				paymentIntentId: paymentIntentId,
				status: 'succeeded',
				amount: session.amount_total ? session.amount_total / 100 : 0,
				paidAt: Timestamp.now(),
				createdBy: uid
			})
		});

		console.log('✅ [WEBHOOK] Memorial updated:', memorialId);

		// 2. Update User - SET hasPaidForMemorial flag ✅
		const userRef = adminDb.collection('users').doc(uid);
		await userRef.update({
			hasPaidForMemorial: true, // ✅ CRITICAL: Allow creating additional memorials
			lastPaymentDate: Timestamp.now()
		});

		console.log('✅ [WEBHOOK] User payment status updated:', uid);

		// 3. Send confirmation email
		await sendConfirmationEmail({
			memorialId,
			checkoutSessionId: session.id,
			paymentIntentId: paymentIntentId,
			customerEmail: session.customer_details?.email || session.metadata?.customerEmail,
			lovedOneName: session.metadata?.lovedOneName,
			amount: session.amount_total ? session.amount_total / 100 : 0
		});

		console.log('✅ [WEBHOOK] Confirmation email sent');
	} catch (error) {
		console.error('❌ [WEBHOOK] Failed to handle checkout success:', error);
		throw error; // Re-throw to trigger Stripe retry
	}
}

// NEW: Handle Checkout Session failure
async function handleCheckoutFailure(session: Stripe.Checkout.Session) {
	try {
		console.log('❌ [WEBHOOK] Processing failed checkout session:', session.id);

		const memorialId = session.metadata?.memorialId;
		const uid = session.metadata?.uid;

		if (!memorialId) {
			console.error('❌ [WEBHOOK] Missing memorialId in failed checkout session');
			return;
		}

		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		await memorialRef.update({
			'calculatorConfig.status': 'payment_failed',
			'calculatorConfig.paymentFailedAt': Timestamp.now(),
			'calculatorConfig.checkoutSessionId': session.id,
			'calculatorConfig.lastModified': Timestamp.now(),
			paymentHistory: FieldValue.arrayUnion({
				checkoutSessionId: session.id,
				status: 'failed',
				amount: session.amount_total ? session.amount_total / 100 : 0,
				failedAt: Timestamp.now(),
				failureReason: 'Checkout session payment failed',
				createdBy: uid
			})
		});

		// Send failure notification email
		await sendPaymentFailureEmail({
			memorialId,
			checkoutSessionId: session.id,
			customerEmail: session.customer_details?.email || session.metadata?.customerEmail,
			lovedOneName: session.metadata?.lovedOneName,
			failureReason: 'Payment was not completed successfully'
		});

		console.log('✅ [WEBHOOK] Failure handling complete');
	} catch (error) {
		console.error('❌ [WEBHOOK] Failed to handle checkout failure:', error);
	}
}

// EXISTING: Handle Payment Intent success (for direct payment flows)
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
	try {
		console.log('💳 [WEBHOOK] Processing payment intent:', paymentIntent.id);

		const memorialId = paymentIntent.metadata.memorialId;
		const uid = paymentIntent.metadata.uid;

		if (!memorialId) {
			console.error('Missing memorialId in payment intent metadata');
			return;
		}

		const memorialRef = adminDb.collection('memorials').doc(memorialId);

		await memorialRef.update({
			isPaid: true, // ✅ Also set isPaid for payment intent flows
			paidAt: Timestamp.now(),
			'calculatorConfig.status': 'paid',
			'calculatorConfig.paidAt': Timestamp.now(),
			'calculatorConfig.paymentIntentId': paymentIntent.id,
			'calculatorConfig.lastModified': Timestamp.now(),
			paymentHistory: FieldValue.arrayUnion({
				paymentIntentId: paymentIntent.id,
				status: 'succeeded',
				amount: paymentIntent.amount / 100,
				paidAt: Timestamp.now(),
				createdBy: uid
			})
		});

		// Update user payment status
		if (uid) {
			const userRef = adminDb.collection('users').doc(uid);
			await userRef.update({
				hasPaidForMemorial: true,
				lastPaymentDate: Timestamp.now()
			});
		}

		await sendConfirmationEmail({
			memorialId,
			paymentIntentId: paymentIntent.id,
			customerEmail: paymentIntent.metadata.customerEmail,
			lovedOneName: paymentIntent.metadata.lovedOneName,
			amount: paymentIntent.amount / 100
		});
	} catch (error) {
		console.error('Failed to handle payment success:', error);
	}
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
	try {
		const memorialId = paymentIntent.metadata.memorialId;
		const uid = paymentIntent.metadata.uid;

		if (!memorialId) {
			console.error('Missing memorialId in payment intent metadata');
			return;
		}

		const memorialRef = adminDb.collection('memorials').doc(memorialId);

		await memorialRef.update({
			'calculatorConfig.status': 'payment_failed',
			'calculatorConfig.paymentFailedAt': Timestamp.now(),
			'calculatorConfig.paymentIntentId': paymentIntent.id,
			'calculatorConfig.lastModified': Timestamp.now(),
			paymentHistory: FieldValue.arrayUnion({
				paymentIntentId: paymentIntent.id,
				status: 'failed',
				amount: paymentIntent.amount / 100,
				failedAt: Timestamp.now(),
				failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
				createdBy: uid
			})
		});

		await sendPaymentFailureEmail({
			memorialId,
			paymentIntentId: paymentIntent.id,
			customerEmail: paymentIntent.metadata.customerEmail,
			lovedOneName: paymentIntent.metadata.lovedOneName,
			failureReason: paymentIntent.last_payment_error?.message || 'Payment failed'
		});
	} catch (error) {
		console.error('Failed to handle payment failure:', error);
	}
}

async function handlePaymentActionRequired(paymentIntent: Stripe.PaymentIntent) {
	try {
		const memorialId = paymentIntent.metadata.memorialId;
		const uid = paymentIntent.metadata.uid;

		if (!memorialId) {
			console.error('Missing memorialId in payment intent metadata');
			return;
		}

		const memorialRef = adminDb.collection('memorials').doc(memorialId);

		await memorialRef.update({
			'calculatorConfig.status': 'action_required',
			'calculatorConfig.actionRequiredAt': Timestamp.now(),
			'calculatorConfig.paymentIntentId': paymentIntent.id,
			'calculatorConfig.lastModified': Timestamp.now(),
			paymentHistory: FieldValue.arrayUnion({
				paymentIntentId: paymentIntent.id,
				status: 'action_required',
				amount: paymentIntent.amount / 100,
				actionRequiredAt: Timestamp.now(),
				createdBy: uid
			})
		});

		await sendActionRequiredEmail({
			memorialId,
			paymentIntentId: paymentIntent.id,
			customerEmail: paymentIntent.metadata.customerEmail,
			lovedOneName: paymentIntent.metadata.lovedOneName,
			nextActionUrl: paymentIntent.next_action?.redirect_to_url?.url
		});
	} catch (error) {
		console.error('Failed to handle payment action required:', error);
	}
}

async function sendConfirmationEmail(data: any) {
	try {
		const response = await fetch('/api/send-confirmation-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			throw new Error(`Email service failed: ${response.statusText}`);
		}
	} catch (error) {
		console.error('Failed to send confirmation email:', error);
	}
}

async function sendPaymentFailureEmail(data: any) {
	try {
		const response = await fetch('/api/send-failure-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			throw new Error(`Email service failed: ${response.statusText}`);
		}
	} catch (error) {
		console.error('Failed to send payment failure email:', error);
	}
}

async function sendActionRequiredEmail(data: any) {
	try {
		const response = await fetch('/api/send-action-required-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			throw new Error(`Email service failed: ${response.statusText}`);
		}
	} catch (error) {
		console.error('Failed to send action required email:', error);
	}
}

// ============================================================
// INVOICE PAYMENT HANDLING
// ============================================================

async function handleInvoicePaymentSuccess(session: Stripe.Checkout.Session) {
	try {
		const invoiceId = session.metadata?.invoiceId;
		const customerEmail = session.metadata?.customerEmail;

		if (!invoiceId) {
			console.error('❌ [WEBHOOK] Missing invoiceId in invoice checkout session');
			return;
		}

		console.log(`💳 [WEBHOOK] Processing invoice payment: ${invoiceId}`);

		// Extract payment intent ID
		const paymentIntentId =
			typeof session.payment_intent === 'string'
				? session.payment_intent
				: session.payment_intent?.id;

		// Update invoice status in Firestore
		const invoiceRef = adminDb.collection('invoices').doc(invoiceId);
		const invoiceDoc = await invoiceRef.get();

		if (!invoiceDoc.exists) {
			console.error(`❌ [WEBHOOK] Invoice not found: ${invoiceId}`);
			return;
		}

		const invoice = invoiceDoc.data();

		await invoiceRef.update({
			status: 'paid',
			paidAt: Timestamp.now(),
			paymentIntentId: paymentIntentId,
			stripeSessionId: session.id
		});

		console.log(`✅ [WEBHOOK] Invoice marked as paid: ${invoiceId}`);

		// Send receipt email
		try {
			const { sendInvoiceReceiptEmail } = await import('$lib/server/email');
			
			const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
			const receiptUrl = `${baseUrl}/pay/${invoiceId}/receipt`;

			await sendInvoiceReceiptEmail({
				customerEmail: customerEmail || invoice?.customerEmail,
				customerName: invoice?.customerName,
				invoiceId: invoiceId,
				items: invoice?.items || [],
				total: invoice?.total || 0,
				paidAt: new Date(),
				paymentIntentId: paymentIntentId || 'N/A',
				receiptUrl: receiptUrl
			});

			console.log(`📧 [WEBHOOK] Invoice receipt email sent to: ${customerEmail || invoice?.customerEmail}`);
		} catch (emailError) {
			console.error('❌ [WEBHOOK] Failed to send invoice receipt email:', emailError);
			// Don't fail the webhook if email fails
		}
	} catch (error) {
		console.error('❌ [WEBHOOK] Failed to handle invoice payment success:', error);
		throw error; // Re-throw to trigger Stripe retry
	}
}
