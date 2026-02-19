// frontend/src/routes/api/set-role-claim/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';
import { adminAuth } from '$lib/server/firebase';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Sets a custom 'role' claim on a Firebase user.
 * This endpoint must be secured in a production environment.
 *
 * @expects a JSON body with the user's uid and the role: { "uid": "some-uid", "role": "owner" }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	// IMPORTANT: In a real app, you'd add security here to ensure
	// only existing admins can call this function.
	// We'll check for the admin custom claim on the logged-in user.
	const sessionCookie = request.headers.get('Cookie')?.match(/session=([^;]+)/)?.[1];
	if (!sessionCookie) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
		if (!decodedClaims.admin) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const { uid, role } = await request.json();
		if (!uid || !role) {
			return json({ error: 'UID and role are required' }, { status: 400 });
		}

		// Set the custom claim
		await adminAuth.setCustomUserClaims(uid, { role: role });

		// Also update the user's document in Firestore
		const db = getFirestore();
		await db.collection('users').doc(uid).update({ role: role });

		return json({ success: true, message: `Role '${role}' set for user ${uid}` });
	} catch (error: any) {
		console.error('Error setting custom claim:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
