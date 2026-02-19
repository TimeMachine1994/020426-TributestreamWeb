import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Get all memorials managed by this funeral director
		const memorialsQuery = adminDb
			.collection('memorials')
			.where('funeralDirector.id', '==', locals.user.uid)
			.orderBy('createdAt', 'desc');

		const snapshot = await memorialsQuery.get();
		const memorials = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));

		return json({ memorials });
	} catch (error) {
		console.error('Error fetching funeral director memorials:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
