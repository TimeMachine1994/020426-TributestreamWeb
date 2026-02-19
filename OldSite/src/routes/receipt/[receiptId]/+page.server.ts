import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ params }: any) => {
	const { receiptId } = params;
	console.log('🧾 [PUBLIC RECEIPT] Loading receipt for memorial:', receiptId);

	try {
		// Get memorial document
		const memorialDoc = await adminDb.collection('memorials').doc(receiptId).get();

		if (!memorialDoc.exists) {
			console.error('🧾 [PUBLIC RECEIPT] Memorial not found:', receiptId);
			throw error(404, 'Receipt not found');
		}

		const data = memorialDoc.data()!;
		
		// Only show receipt if the memorial has been paid
		if (!data.isPaid && data.calculatorConfig?.status !== 'paid') {
			console.error('🧾 [PUBLIC RECEIPT] Receipt not available - payment not completed');
			throw error(404, 'Receipt not found');
		}

		// Get payment history - handle various formats
		const paymentHistory = Array.isArray(data.paymentHistory) ? data.paymentHistory : [];
		const successfulPayments = paymentHistory.filter((p: any) => p.status === 'succeeded');
		const latestPayment = successfulPayments.length > 0 ? successfulPayments[successfulPayments.length - 1] : {};

		// Safely convert timestamps
		const safeToISOString = (timestamp: any): string | null => {
			if (!timestamp) return null;
			if (typeof timestamp === 'string') return timestamp;
			if (timestamp.toDate && typeof timestamp.toDate === 'function') {
				return timestamp.toDate().toISOString();
			}
			if (timestamp instanceof Date) {
				return timestamp.toISOString();
			}
			return null;
		};

		// Determine payment amount from various sources
		const amount = 
			latestPayment.amount ||
			data.calculatorConfig?.totalPrice ||
			data.calculatorConfig?.total ||
			data.amount ||
			0;

		// Build receipt data (public version - no sensitive admin data)
		const receipt = {
			id: memorialDoc.id,
			
			// Memorial info
			lovedOneName: data.lovedOneName || 'Unknown',
			memorialDate: data.memorialDate || data.services?.main?.time?.date || null,
			memorialTime: data.memorialTime || data.services?.main?.time?.time || null,
			memorialLocationName: data.memorialLocationName || data.services?.main?.location?.name || null,
			memorialLocationAddress: data.memorialLocationAddress || data.services?.main?.location?.address || null,

			// Customer info (limited for public view)
			ownerName: data.creatorName || data.ownerName || '',
			ownerEmail: data.creatorEmail || data.ownerEmail || '',

			// Payment info
			amount: amount,
			paidAt: safeToISOString(data.paidAt) || safeToISOString(latestPayment.paidAt) || null,
			paymentIntentId: data.calculatorConfig?.paymentIntentId || latestPayment.paymentIntentId || null,
			checkoutSessionId: data.calculatorConfig?.checkoutSessionId || latestPayment.checkoutSessionId || null,
			status: data.calculatorConfig?.status || (data.isPaid ? 'paid' : 'unknown'),

			// Calculator config (line items)
			calculatorConfig: data.calculatorConfig ? {
				totalPrice: data.calculatorConfig.totalPrice || data.calculatorConfig.total || null,
				bookingItems: Array.isArray(data.calculatorConfig.bookingItems) 
					? data.calculatorConfig.bookingItems.map((item: any) => ({
						name: item.name || item.description || 'Service',
						price: item.price || 0,
						quantity: item.quantity || 1,
						total: item.total || item.price || 0
					}))
					: Array.isArray(data.calculatorConfig.items) 
						? data.calculatorConfig.items.map((item: any) => ({
							name: item.name || item.description || 'Service',
							price: item.price || item.amount || 0,
							quantity: item.quantity || 1,
							total: item.total || item.price || item.amount || 0
						}))
						: []
			} : null,
			
			// Include receipt note if it exists (for client reference)
			receiptNote: data.receiptNote?.content || null,

			// Timestamps
			createdAt: safeToISOString(data.createdAt)
		};

		console.log('🧾 [PUBLIC RECEIPT] Built receipt:', receipt.id, 'amount:', receipt.amount);
		return { receipt };
	} catch (e: any) {
		if (e.status === 404) throw e;
		console.error('🧾 [PUBLIC RECEIPT] Error loading receipt:', e);
		throw error(500, `Failed to load receipt`);
	}
};
