/**
 * Dev Mode API: Seed Test Users
 * 
 * Creates test accounts for development.
 * Only accessible in development mode.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isDevelopment } from '$lib/utils/environment';
import { adminAuth, adminDb } from '$lib/server/firebase';
import { DEV_TEST_ACCOUNTS } from '$lib/config/dev-mode';

export const POST: RequestHandler = async () => {
	// Only allow in development
	if (!isDevelopment) {
		return json({ error: 'Not available in production' }, { status: 403 });
	}

	try {
		let successCount = 0;
		let skippedCount = 0;
		const errors: string[] = [];

		for (const account of DEV_TEST_ACCOUNTS) {
			try {
				// Check if user exists
				let userRecord;
				try {
					userRecord = await adminAuth.getUserByEmail(account.email);
					skippedCount++;
				} catch (error: any) {
					if (error.code === 'auth/user-not-found') {
						// Create user
						userRecord = await adminAuth.createUser({
							email: account.email,
							password: account.password,
							displayName: account.displayName,
							emailVerified: true
						});
					} else {
						throw error;
					}
				}

				// Set custom claims
				await adminAuth.setCustomUserClaims(userRecord.uid, {
					role: account.role,
					isAdmin: account.role === 'admin',
					isOwner: account.role === 'owner',
					isFuneralDirector: account.role === 'funeral_director',
					isViewer: account.role === 'viewer'
				});

				// Create/update Firestore profile
				const userProfile: any = {
					email: account.email,
					displayName: account.displayName,
					role: account.role,
					updatedAt: new Date()
				};

				if (account.companyName) {
					userProfile.companyName = account.companyName;
				}

				const userDocRef = adminDb.collection('users').doc(userRecord.uid);
				const userDoc = await userDocRef.get();

				if (!userDoc.exists) {
					userProfile.createdAt = new Date();
					userProfile.memorialCount = 0;
				}

				await userDocRef.set(userProfile, { merge: true });

				// Create funeral director profile if needed
				if (account.role === 'funeral_director' && account.companyName) {
					await adminDb.collection('funeral_directors').doc(userRecord.uid).set({
						userId: userRecord.uid,
						email: account.email,
						displayName: account.displayName,
						companyName: account.companyName,
						status: 'approved',
						createdAt: new Date(),
						updatedAt: new Date()
					}, { merge: true });
				}

				successCount++;
			} catch (error: any) {
				errors.push(`${account.email}: ${error.message}`);
			}
		}

		return json({
			success: true,
			message: `Seeded ${successCount} users, skipped ${skippedCount} existing`,
			details: {
				created: successCount,
				skipped: skippedCount,
				errors: errors.length > 0 ? errors : undefined
			}
		});
	} catch (error: any) {
		console.error('Failed to seed users:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
