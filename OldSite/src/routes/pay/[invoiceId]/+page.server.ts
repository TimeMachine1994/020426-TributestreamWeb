import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { InvoicePublicData } from '$lib/types/invoice';

export const load: PageServerLoad = async ({ params }) => {
	const { invoiceId } = params;

	if (!invoiceId) {
		return {
			invoice: null,
			error: 'Invoice ID is required'
		};
	}

	try {
		const invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();

		if (!invoiceDoc.exists) {
			return {
				invoice: null,
				error: 'Invoice not found'
			};
		}

		const data = invoiceDoc.data();

		if (!data) {
			return {
				invoice: null,
				error: 'Invoice data not found'
			};
		}

		const invoice: InvoicePublicData = {
			id: data.id,
			items: data.items,
			total: data.total,
			customerEmail: data.customerEmail,
			customerName: data.customerName,
			status: data.status,
			createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
		};

		return {
			invoice,
			error: null
		};
	} catch (error) {
		console.error('Failed to load invoice:', error);
		return {
			invoice: null,
			error: 'Failed to load invoice'
		};
	}
};
