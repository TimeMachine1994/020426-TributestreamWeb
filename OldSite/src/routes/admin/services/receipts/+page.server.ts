import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params for filtering/sorting
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const searchQuery = (url.searchParams.get('q') || '').trim().toLowerCase();

	try {
		// Query memorials that have payment data
		const snapshot = await adminDb
			.collection('memorials')
			.where('isPaid', '==', true)
			.orderBy('paidAt', 'desc')
			.limit(limit)
			.get();

		const receipts = snapshot.docs.map((doc) => {
			const data = doc.data();
			
			// Get the most recent successful payment from history
			const paymentHistory = data.paymentHistory || [];
			const successfulPayment = paymentHistory.find((p: any) => p.status === 'succeeded') || {};

			return {
				id: doc.id,
				memorialId: doc.id,
				lovedOneName: data.lovedOneName || 'Unknown',
				ownerEmail: data.creatorEmail || data.ownerEmail || '',
				ownerName: data.creatorName || data.ownerName || '',
				amount: successfulPayment.amount || data.calculatorConfig?.totalPrice || 0,
				paidAt: data.paidAt?.toDate?.()?.toISOString() || successfulPayment.paidAt?.toDate?.()?.toISOString() || null,
				paymentIntentId: data.calculatorConfig?.paymentIntentId || successfulPayment.paymentIntentId || null,
				checkoutSessionId: data.calculatorConfig?.checkoutSessionId || successfulPayment.checkoutSessionId || null,
				status: data.calculatorConfig?.status || 'paid',
				fullSlug: data.fullSlug || ''
			};
		});

		// In-memory search
		const filteredReceipts = searchQuery
			? receipts.filter((receipt) => {
					const haystack = [
						receipt.lovedOneName,
						receipt.ownerEmail,
						receipt.ownerName,
						receipt.paymentIntentId,
						receipt.checkoutSessionId
					]
						.filter(Boolean)
						.join(' ')
						.toLowerCase();
					return haystack.includes(searchQuery);
				})
			: receipts;

		return {
			receipts: filteredReceipts,
			searchQuery,
			pagination: {
				page,
				limit,
				total: filteredReceipts.length
			}
		};
	} catch (error) {
		console.error('Error loading receipts:', error);
		
		// Fallback: query all memorials and filter for paid ones
		const snapshot = await adminDb.collection('memorials').limit(200).get();
		
		const receipts = snapshot.docs
			.filter((doc) => {
				const data = doc.data();
				return data.isPaid === true || data.calculatorConfig?.status === 'paid';
			})
			.map((doc) => {
				const data = doc.data();
				const paymentHistory = data.paymentHistory || [];
				const successfulPayment = paymentHistory.find((p: any) => p.status === 'succeeded') || {};

				return {
					id: doc.id,
					memorialId: doc.id,
					lovedOneName: data.lovedOneName || 'Unknown',
					ownerEmail: data.creatorEmail || data.ownerEmail || '',
					ownerName: data.creatorName || data.ownerName || '',
					amount: successfulPayment.amount || data.calculatorConfig?.totalPrice || 0,
					paidAt: data.paidAt?.toDate?.()?.toISOString() || successfulPayment.paidAt?.toDate?.()?.toISOString() || null,
					paymentIntentId: data.calculatorConfig?.paymentIntentId || successfulPayment.paymentIntentId || null,
					checkoutSessionId: data.calculatorConfig?.checkoutSessionId || successfulPayment.checkoutSessionId || null,
					status: data.calculatorConfig?.status || 'paid',
					fullSlug: data.fullSlug || ''
				};
			})
			.sort((a, b) => {
				if (!a.paidAt) return 1;
				if (!b.paidAt) return -1;
				return new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime();
			});

		return {
			receipts,
			searchQuery,
			pagination: {
				page,
				limit,
				total: receipts.length
			}
		};
	}
};
