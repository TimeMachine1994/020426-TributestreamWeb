import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const token = url.searchParams.get('token');
	const uid = url.searchParams.get('uid');

	if (!token || !uid) {
		return json({ success: false, error: 'Missing token or uid' }, { status: 400 });
	}

	try {
		console.log('📧 [EMAIL-CONFIRM] Processing email change confirmation for UID:', uid);

		// Get user document
		const userDoc = await adminDb.collection('users').doc(uid).get();
		if (!userDoc.exists) {
			return json({ success: false, error: 'User not found' }, { status: 404 });
		}

		const userData = userDoc.data()!;
		const pendingChange = userData.pendingEmailChange;

		if (!pendingChange) {
			return json({ success: false, error: 'No pending email change found' }, { status: 400 });
		}

		// Check if token matches (simple token generation for now)
		const expectedToken = Buffer.from(`${uid}:${pendingChange.newEmail}:${pendingChange.requestedAt.toISOString()}`).toString('base64');
		if (token !== expectedToken) {
			return json({ success: false, error: 'Invalid token' }, { status: 400 });
		}

		// Check if expired (24 hours)
		const now = new Date();
		const expiresAt = pendingChange.expiresAt.toDate ? pendingChange.expiresAt.toDate() : new Date(pendingChange.expiresAt);
		if (now > expiresAt) {
			// Clean up expired request
			await adminDb.collection('users').doc(uid).update({
				pendingEmailChange: null
			});
			return json({ success: false, error: 'Email change request has expired' }, { status: 400 });
		}

		// Update Firebase Auth email
		const auth = getAuth();
		await auth.updateUser(uid, { email: pendingChange.newEmail });

		// Update user document
		await adminDb.collection('users').doc(uid).update({
			email: pendingChange.newEmail,
			pendingEmailChange: null,
			emailChangedAt: new Date()
		});

		console.log('✅ [EMAIL-CONFIRM] Email successfully changed to:', pendingChange.newEmail);

		// Redirect to success page instead of returning JSON
		throw redirect(302, '/email-confirmed');

	} catch (error) {
		console.error('❌ [EMAIL-CONFIRM] Error confirming email change:', error);
		return json({ 
			success: false, 
			error: 'Failed to confirm email change' 
		}, { status: 500 });
	}
};
