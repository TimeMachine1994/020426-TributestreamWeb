import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const sortBy = url.searchParams.get('sortBy') || 'createdAt';
	const sortDir = url.searchParams.get('sortDir') || 'desc';

	// Load users with role 'owner'
	let snapshot;
	try {
		// Try with compound query (requires Firestore index)
		let query = adminDb
			.collection('users')
			.where('role', '==', 'owner')
			.orderBy(sortBy, sortDir as any)
			.limit(limit);
		snapshot = await query.get();
	} catch (error) {
		console.error('Error loading memorial owners with sorting:', error);
		// Fallback: just filter by role without sorting
		let query = adminDb.collection('users').where('role', '==', 'owner').limit(limit);
		snapshot = await query.get();
	}

	const users = snapshot.docs.map((doc) => {
		const data = doc.data();

		return {
			id: doc.id,
			email: data.email || '',
			displayName: data.displayName || data.name || 'Unknown',
			memorialCount: data.memorialCount || 0,
			hasPaidForMemorial: data.hasPaidForMemorial || false,
			suspended: data.suspended || false,
			createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
			lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null,
			phone: data.phone || null,
			photoURL: data.photoURL || null
		};
	});

	return {
		users,
		pagination: {
			page,
			limit,
			total: users.length
		}
	};
};
