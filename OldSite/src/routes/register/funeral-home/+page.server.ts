import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * FUNERAL DIRECTOR REGISTRATION SERVER
 *
 * Handles new funeral director applications
 * Creates pending applications for admin approval
 */

export const actions: Actions = {
	default: async ({ request }) => {
		console.log('🏥 [FUNERAL HOME REG] Processing funeral director registration (no documents)');

		try {
			const auth = getAuth();
			const formData = await request.formData();

			// Extract form fields (account + business info)
			const applicationData = {
				companyName: formData.get('companyName')?.toString() || '',
				contactPerson: formData.get('contactPerson')?.toString() || '',
				email: formData.get('email')?.toString() || '',
				password: formData.get('password')?.toString() || '',
				phone: formData.get('phone')?.toString() || '',
				website: formData.get('website')?.toString() || '',
				address: {
					street: formData.get('address.street')?.toString() || '',
					city: formData.get('address.city')?.toString() || '',
					state: formData.get('address.state')?.toString() || '',
					zipCode: formData.get('address.zipCode')?.toString() || '',
					country: formData.get('address.country')?.toString() || 'United States'
				}
			};

			console.log('📋 [FUNERAL HOME REG] Application data (simplified):', {
				companyName: applicationData.companyName,
				email: applicationData.email
			});

			// Validate required fields (first page)
			const requiredFields = [
				'companyName',
				'contactPerson',
				'email',
				'password',
				'phone'
			] as const;
			const missing = requiredFields.filter((f) => {
				const v = applicationData[f];
				return !v || (typeof v === 'string' && v.trim() === '');
			});
			if (missing.length) {
				console.log('❌ [FUNERAL HOME REG] Missing required fields:', missing);
				return fail(400, { error: `Missing required fields: ${missing.join(', ')}` });
			}

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(applicationData.email)) {
				return fail(400, { error: 'Please enter a valid email address' });
			}

			// Create Firebase Auth user (admin SDK)
			let uid: string;
			try {
				const userRecord = await getAuth().createUser({
					email: applicationData.email,
					password: applicationData.password,
					displayName: applicationData.contactPerson
				});
				uid = userRecord.uid;
				console.log('✅ [FUNERAL HOME REG] Created Firebase Auth user:', uid);
			} catch (createErr: any) {
				console.error('❌ [FUNERAL HOME REG] Failed to create auth user:', createErr);
				// Common case: email already exists
				const message =
					createErr?.errorInfo?.message || createErr?.message || 'Failed to create user';
				return fail(400, { error: message });
			}

			// Prepare FD document (auto-approved)
			const fdDoc = {
				status: 'approved' as const,
				verificationStatus: 'auto-approved' as const,
				companyName: applicationData.companyName,
				contactPerson: applicationData.contactPerson,
				email: applicationData.email,
				phone: applicationData.phone,
				website: applicationData.website || null,
				address: applicationData.address,
				permissions: {
					canCreateMemorials: true,
					canManageMemorials: true,
					canLivestream: true,
					maxMemorials: 999 // Effectively unlimited
				},
				streamingConfig: {
					provider: 'custom',
					maxConcurrentStreams: 1,
					streamingEnabled: true
				},
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now(),
				approvedAt: Timestamp.now(),
				approvedBy: 'system_auto_approve',
				userId: uid,
				isActive: true
			};

			await adminDb.collection('funeral_directors').doc(uid).set(fdDoc);
			console.log('💾 [FUNERAL HOME REG] Saved funeral_directors doc with uid:', uid);

			// Set custom claim for funeral director role
			await auth.setCustomUserClaims(uid, { role: 'funeral_director' });
			console.log('✅ [FUNERAL HOME REG] Set custom claim: funeral_director');

			// Log audit
			try {
				await adminDb.collection('admin_actions').add({
					action: 'funeral_director_auto_approved',
					targetId: uid,
					targetType: 'funeral_director',
					timestamp: Timestamp.now(),
					details: {
						companyName: applicationData.companyName,
						email: applicationData.email,
						contactPerson: applicationData.contactPerson
					}
				});
			} catch (auditError) {
				console.error('⚠️ [FUNERAL HOME REG] Failed to create audit log:', auditError);
			}

			// Create a custom token to allow for auto-login on the client
			const customToken = await auth.createCustomToken(uid, {
				role: 'funeral_director',
				email: applicationData.email
			});

			return {
				success: true,
				message: 'Account created and approved! You can now create memorials.',
				directorId: uid,
				customToken
			};
		} catch (error) {
			console.error('💥 [FUNERAL HOME REG] Registration failed:', {
				error: error instanceof Error ? error.message : String(error)
			});
			return fail(500, {
				error: 'An error occurred while processing your registration. Please try again.'
			});
		}
	}
};
