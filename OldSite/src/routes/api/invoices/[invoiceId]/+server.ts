import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { InvoicePublicData } from '$lib/types/invoice';

// GET - Public endpoint to fetch invoice details for checkout
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { invoiceId } = params;

		if (!invoiceId) {
			return json({ error: 'Invoice ID is required' }, { status: 400 });
		}

		const invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();

		if (!invoiceDoc.exists) {
			return json({ error: 'Invoice not found' }, { status: 404 });
		}

		const data = invoiceDoc.data();

		if (!data) {
			return json({ error: 'Invoice data not found' }, { status: 404 });
		}

		// Return only public-safe data
		const publicData: InvoicePublicData = {
			id: data.id,
			items: data.items,
			total: data.total,
			customerEmail: data.customerEmail,
			customerName: data.customerName,
			status: data.status,
			createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
		};

		return json(publicData);
	} catch (error) {
		console.error('Failed to fetch invoice:', error);
		return json(
			{
				error: 'Failed to fetch invoice',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
