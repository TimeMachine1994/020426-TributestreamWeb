import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { token } = await request.json();

		if (!token) {
			return json({ valid: false, error: 'Token is required' }, { status: 400 });
		}

		// Check if token exists and is valid
		const tokenDoc = await adminDb.collection('passwordResetTokens').doc(token).get();

		if (!tokenDoc.exists) {
			return json({ valid: false, error: 'Invalid token' });
		}

		const tokenData = tokenDoc.data();
		const now = new Date();

		// Check if token is expired or already used
		if (tokenData.expiresAt.toDate() < now) {
			return json({ valid: false, error: 'Token has expired' });
		}

		if (tokenData.used) {
			return json({ valid: false, error: 'Token has already been used' });
		}

		return json({ valid: true });

	} catch (error) {
		console.error('💥 Token validation error:', error);
		return json({ valid: false, error: 'Error validating token' }, { status: 500 });
	}
};
