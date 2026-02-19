import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { sendPasswordResetEmail } from '$lib/server/email';
import crypto from 'crypto';

interface PasswordResetRequest {
	email: string;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email }: PasswordResetRequest = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}

		// Check if user exists in Firestore
		const usersSnapshot = await adminDb.collection('users')
			.where('email', '==', email)
			.limit(1)
			.get();

		if (usersSnapshot.empty) {
			// For security, don't reveal if email exists or not
			return json({ 
				message: 'If an account with that email exists, a password reset link has been sent.' 
			});
		}

		const userDoc = usersSnapshot.docs[0];
		const userData = userDoc.data();
		const userId = userDoc.id;

		// Generate secure reset token
		const resetToken = crypto.randomBytes(32).toString('hex');
		const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

		// Store reset token in Firestore
		await adminDb.collection('passwordResetTokens').doc(resetToken).set({
			userId: userId,
			email: email,
			createdAt: new Date(),
			expiresAt: resetTokenExpiry,
			used: false
		});

		// Generate reset link
		const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
		const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

		// Send password reset email via SendGrid
		await sendPasswordResetEmail({
			email: email,
			displayName: userData.displayName || userData.name || 'User',
			resetLink: resetLink
		});

		console.log(`✅ Password reset email sent to: ${email}`);

		return json({ 
			message: 'If an account with that email exists, a password reset link has been sent.' 
		});

	} catch (error) {
		console.error('💥 Password reset error:', error);
		return json({ 
			error: 'An error occurred while processing your request. Please try again.' 
		}, { status: 500 });
	}
};
