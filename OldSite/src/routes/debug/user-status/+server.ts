import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ 
			authenticated: false,
			message: 'No user session found'
		});
	}

	try {
		// Get fresh user record from Firebase
		const userRecord = await adminAuth.getUser(locals.user.uid);
		
		return json({
			authenticated: true,
			user: {
				uid: locals.user.uid,
				email: locals.user.email,
				displayName: locals.user.displayName,
				role: locals.user.role
			},
			firebaseCustomClaims: userRecord.customClaims || {},
			sessionData: {
				hasSession: true,
				userFromLocals: !!locals.user
			}
		});
	} catch (error) {
		return json({
			authenticated: true,
			error: 'Failed to fetch user record',
			details: error instanceof Error ? error.message : String(error),
			user: {
				uid: locals.user.uid,
				email: locals.user.email,
				displayName: locals.user.displayName,
				role: locals.user.role
			}
		});
	}
};
