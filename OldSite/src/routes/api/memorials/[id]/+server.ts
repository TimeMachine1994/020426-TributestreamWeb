import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const memorialId = params.id;

		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();

		// Return essential memorial data including fullSlug
		return json({
			id: memorialDoc.id,
			lovedOneName: memorial?.lovedOneName,
			fullSlug: memorial?.fullSlug,
			isPublic: memorial?.isPublic,
			createdAt: memorial?.createdAt?.toDate?.()?.toISOString() || memorial?.createdAt
		});
	} catch (error) {
		console.error('Error fetching memorial:', error);
		return json({ error: 'Failed to fetch memorial' }, { status: 500 });
	}
};
