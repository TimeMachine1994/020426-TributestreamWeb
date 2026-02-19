// frontend/src/routes/api/set-admin-claim/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';
import { adminAuth } from '$lib/server/firebase';

/**
 * Sets a custom claim on a Firebase user to grant them admin privileges.
 * This endpoint must be secured in a production environment.
 *
 * @expects a JSON body with the user's email: { "email": "user@example.com" }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	// IMPORTANT: In a real app, you'd add security here to ensure
	// only existing admins can call this function.
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { email } = await request.json();
		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		const user = await adminAuth.getUserByEmail(email);
		const existingClaims = (await adminAuth.getUser(user.uid)).customClaims;
		await adminAuth.setCustomUserClaims(user.uid, {
			...existingClaims,
			admin: true,
			role: 'admin'
		});

		return json({ success: true, message: `Admin claim set for ${email}` });
	} catch (error: any) {
		console.error('Error setting custom claim:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
