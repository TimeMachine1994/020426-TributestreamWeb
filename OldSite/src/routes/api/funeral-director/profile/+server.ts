import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { FuneralDirector } from '$lib/types/funeral-director';
import { Timestamp } from 'firebase-admin/firestore';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const docRef = adminDb.collection('funeral_directors').doc(locals.user.uid);
		const doc = await docRef.get();

		if (!doc.exists) {
			return json({ error: 'Funeral director profile not found' }, { status: 404 });
		}

		const funeralDirector = { id: doc.id, ...doc.data() } as FuneralDirector;
		return json(funeralDirector);
	} catch (error) {
		console.error('Error fetching funeral director profile:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const updates = await request.json();

		// Remove fields that shouldn't be updated directly
		delete updates.id;
		delete updates.createdAt;
		delete updates.status;
		delete updates.verificationStatus;
		delete updates.permissions;

		// Add updated timestamp
		updates.updatedAt = Timestamp.now();

		const docRef = adminDb.collection('funeral_directors').doc(locals.user.uid);
		await docRef.update(updates);

		return json({ success: true, message: 'Profile updated successfully' });
	} catch (error) {
		console.error('Error updating funeral director profile:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
