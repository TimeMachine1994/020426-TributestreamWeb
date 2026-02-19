import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
import type { CreateInvoiceRequest, Invoice, InvoiceItem } from '$lib/types/invoice';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication - must be admin
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		const body: CreateInvoiceRequest = await request.json();
		const { items, customerEmail, customerName, memorialId, sendEmail } = body;

		// Validate required fields
		if (!items || items.length === 0) {
			return json({ error: 'At least one item is required' }, { status: 400 });
		}

		if (!customerEmail) {
			return json({ error: 'Customer email is required' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(customerEmail)) {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}

		// Generate unique invoice ID
		const invoiceId = `inv_${nanoid(12)}`;

		// Calculate totals for each item and overall
		const invoiceItems: InvoiceItem[] = items.map((item) => ({
			name: item.name,
			quantity: item.quantity,
			price: Math.round(item.price), // Ensure cents
			total: Math.round(item.price * item.quantity)
		}));

		const total = invoiceItems.reduce((sum, item) => sum + item.total, 0);

		// Create invoice document
		const invoice: Omit<Invoice, 'id'> & { id: string } = {
			id: invoiceId,
			items: invoiceItems,
			total,
			customerEmail: customerEmail.toLowerCase().trim(),
			customerName: customerName?.trim() || undefined,
			status: 'pending',
			createdAt: Timestamp.now(),
			createdBy: locals.user.uid,
			memorialId: memorialId || undefined
		};

		// Save to Firestore
		await adminDb.collection('invoices').doc(invoiceId).set(invoice);

		console.log(`✅ Invoice created: ${invoiceId} for ${customerEmail} - $${(total / 100).toFixed(2)}`);

		// Generate payment URL
		const origin = request.headers.get('origin') || 'https://tributestream.com';
		const paymentUrl = `${origin}/pay/${invoiceId}`;

		// Send invoice email if requested
		if (sendEmail) {
			try {
				const { sendInvoiceEmail } = await import('$lib/server/email');
				await sendInvoiceEmail({
					customerEmail: invoice.customerEmail,
					customerName: invoice.customerName,
					invoiceId,
					items: invoiceItems,
					total,
					paymentUrl
				});
				console.log(`📧 Invoice email sent to ${customerEmail}`);
			} catch (emailError) {
				console.error('Failed to send invoice email:', emailError);
				// Don't fail the request if email fails
			}
		}

		return json({
			invoiceId,
			paymentUrl,
			total,
			emailSent: sendEmail || false
		});
	} catch (error) {
		console.error('Failed to create invoice:', error);
		return json(
			{
				error: 'Failed to create invoice',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// GET - List all invoices for admin
export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		const status = url.searchParams.get('status');
		const limit = parseInt(url.searchParams.get('limit') || '50');

		let query = adminDb.collection('invoices').orderBy('createdAt', 'desc').limit(limit);

		if (status) {
			query = query.where('status', '==', status);
		}

		const snapshot = await query.get();
		const invoices = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				...data,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
				paidAt: data.paidAt?.toDate?.()?.toISOString() || null
			};
		});

		return json({ invoices });
	} catch (error) {
		console.error('Failed to list invoices:', error);
		return json({ error: 'Failed to list invoices' }, { status: 500 });
	}
};
