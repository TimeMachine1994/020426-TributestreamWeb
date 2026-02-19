import { redirect, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, params }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	const { receiptId } = params;
	console.log('🧾 [RECEIPT] Loading receipt for memorial:', receiptId);

	try {
		// Get memorial document
		const memorialDoc = await adminDb.collection('memorials').doc(receiptId).get();

		if (!memorialDoc.exists) {
			console.error('🧾 [RECEIPT] Memorial not found:', receiptId);
			throw error(404, 'Receipt not found');
		}

		const data = memorialDoc.data()!;
		console.log('🧾 [RECEIPT] Memorial data keys:', Object.keys(data));
		console.log('🧾 [RECEIPT] isPaid:', data.isPaid, 'calculatorConfig?.status:', data.calculatorConfig?.status);

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

		// Get user info if available
		let ownerInfo = null;
		if (data.ownerUid) {
			try {
				const userDoc = await adminDb.collection('users').doc(data.ownerUid).get();
				if (userDoc.exists) {
					const userData = userDoc.data()!;
					ownerInfo = {
						uid: data.ownerUid,
						email: userData.email || data.creatorEmail,
						displayName: userData.displayName || data.creatorName,
						phone: userData.phone || null
					};
				}
			} catch (e) {
				console.error('🧾 [RECEIPT] Error fetching owner info:', e);
			}
		}

		// Determine payment amount from various sources
		const amount = 
			latestPayment.amount ||
			data.calculatorConfig?.totalPrice ||
			data.calculatorConfig?.total ||
			data.amount ||
			0;

		// Build receipt data
		const receipt = {
			id: memorialDoc.id,
			memorialId: memorialDoc.id,
			
			// Memorial info
			lovedOneName: data.lovedOneName || 'Unknown',
			fullSlug: data.fullSlug || '',
			memorialDate: data.memorialDate || data.services?.main?.time?.date || null,
			memorialTime: data.memorialTime || data.services?.main?.time?.time || null,
			memorialLocationName: data.memorialLocationName || data.services?.main?.location?.name || null,
			memorialLocationAddress: data.memorialLocationAddress || data.services?.main?.location?.address || null,

			// Customer info
			ownerEmail: ownerInfo?.email || data.creatorEmail || data.ownerEmail || '',
			ownerName: ownerInfo?.displayName || data.creatorName || data.ownerName || '',
			ownerPhone: ownerInfo?.phone || null,
			ownerUid: data.ownerUid || null,

			// Payment info
			amount: amount,
			paidAt: safeToISOString(data.paidAt) || safeToISOString(latestPayment.paidAt) || null,
			paymentIntentId: data.calculatorConfig?.paymentIntentId || latestPayment.paymentIntentId || null,
			checkoutSessionId: data.calculatorConfig?.checkoutSessionId || latestPayment.checkoutSessionId || null,
			status: data.calculatorConfig?.status || (data.isPaid ? 'paid' : 'unknown'),

			// Calculator config (line items) - extract bookingItems if available
			calculatorConfig: data.calculatorConfig ? {
				status: data.calculatorConfig.status || null,
				totalPrice: data.calculatorConfig.totalPrice || data.calculatorConfig.total || null,
				selectedTier: data.calculatorConfig.selectedTier || null,
				// Use bookingItems (new format) or items (old format)
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
			
			// Admin notes for this receipt
			receiptNote: data.receiptNote ? {
				content: data.receiptNote.content || '',
				updatedAt: safeToISOString(data.receiptNote.updatedAt),
				updatedBy: data.receiptNote.updatedBy || null,
				updatedByEmail: data.receiptNote.updatedByEmail || null
			} : null,
			
			// Services breakdown - extract only what we need
			services: null, // Skip complex services object to avoid serialization issues

			// Payment history - convert timestamps and extract only serializable fields
			paymentHistory: paymentHistory.map((p: any) => ({
				status: p.status || null,
				amount: p.amount || 0,
				paymentIntentId: p.paymentIntentId || null,
				checkoutSessionId: p.checkoutSessionId || null,
				failureReason: p.failureReason || null,
				paidAt: safeToISOString(p.paidAt),
				failedAt: safeToISOString(p.failedAt),
				actionRequiredAt: safeToISOString(p.actionRequiredAt)
			})),

			// Timestamps
			createdAt: safeToISOString(data.createdAt)
		};

		console.log('🧾 [RECEIPT] Built receipt:', receipt.id, 'amount:', receipt.amount);
		return { receipt };
	} catch (e: any) {
		if (e.status === 404 || e.status === 302) throw e;
		console.error('🧾 [RECEIPT] Error loading receipt:', e);
		throw error(500, `Failed to load receipt: ${e.message || 'Unknown error'}`);
	}
};
