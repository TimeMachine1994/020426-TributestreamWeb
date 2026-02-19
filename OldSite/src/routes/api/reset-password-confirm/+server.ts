import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { token, newPassword } = await request.json();

		if (!token || !newPassword) {
			return json({ error: 'Token and new password are required' }, { status: 400 });
		}

		if (newPassword.length < 6) {
			return json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
		}

		// Validate token
		const tokenDoc = await adminDb.collection('passwordResetTokens').doc(token).get();

		if (!tokenDoc.exists) {
			return json({ error: 'Invalid token' }, { status: 400 });
		}

		const tokenData = tokenDoc.data();
		const now = new Date();

		if (tokenData.expiresAt.toDate() < now) {
			return json({ error: 'Token has expired' }, { status: 400 });
		}

		if (tokenData.used) {
			return json({ error: 'Token has already been used' }, { status: 400 });
		}

		// Update password in Firebase Auth
		const auth = getAuth();
		await auth.updateUser(tokenData.userId, {
			password: newPassword
		});

		// Mark token as used
		await adminDb.collection('passwordResetTokens').doc(token).update({
			used: true,
			usedAt: new Date()
		});

		// Update user document
		await adminDb.collection('users').doc(tokenData.userId).update({
			passwordChangedAt: new Date(),
			updatedAt: new Date()
		});

		console.log(`✅ Password reset completed for user: ${tokenData.userId}`);

		return json({ message: 'Password reset successful' });

	} catch (error) {
		console.error('💥 Password reset confirmation error:', error);
		return json({ error: 'Failed to reset password' }, { status: 500 });
	}
};
