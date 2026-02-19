import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';
import { sendEmailChangeConfirmation } from '$lib/server/emailConfirmation';

// Helper function to convert Timestamps and Dates to strings
function sanitizeData(data: any): any {
	if (!data) return data;
	if (Array.isArray(data)) return data.map(sanitizeData);
	if (typeof data === 'object' && data !== null) {
		if (data.toDate && typeof data.toDate === 'function') return data.toDate().toISOString(); // Firestore Timestamp
		if (data instanceof Date) return data.toISOString(); // JavaScript Date

		const sanitized: { [key: string]: any } = {};
		for (const key in data) {
			sanitized[key] = sanitizeData(data[key]);
		}
		return sanitized;
	}
	return data;
}

export const load: PageServerLoad = async ({ locals }) => {
	console.log('🔧 [SETTINGS] Loading profile settings page');
	console.log('🔧 [SETTINGS] locals.user:', locals.user);

	// Ensure user is authenticated
	if (!locals.user) {
		console.log('❌ [SETTINGS] No user in locals, redirecting to login');
		throw redirect(302, '/login');
	}

	try {
		console.log('🔧 [SETTINGS] Fetching user profile for UID:', locals.user.uid);
		
		// Get user profile data
		const userDoc = await adminDb.collection('users').doc(locals.user.uid).get();
		const userData = userDoc.data();
		
		console.log('🔧 [SETTINGS] User document exists:', userDoc.exists);
		console.log('🔧 [SETTINGS] User data keys:', userData ? Object.keys(userData) : 'null');

		// Get additional profile data based on role
		let additionalData = {};
		if (locals.user.role === 'funeral_director') {
			console.log('🔧 [SETTINGS] User is funeral director, fetching FD profile');
			const fdDoc = await adminDb.collection('funeral_directors').doc(locals.user.uid).get();
			if (fdDoc.exists) {
				additionalData = { funeralDirector: sanitizeData(fdDoc.data()) };
				console.log('🔧 [SETTINGS] FD profile loaded');
			} else {
				console.log('🔧 [SETTINGS] FD profile not found');
			}
		}

		const result = {
			user: locals.user,
			profile: sanitizeData(userData),
			...additionalData
		};

		console.log('✅ [SETTINGS] Profile settings loaded successfully');
		return result;
	} catch (error) {
		console.error('❌ [SETTINGS] Error loading profile settings:', error);
		console.error('❌ [SETTINGS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
		throw redirect(302, '/profile');
	}
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Not authenticated', success: false });
		}

		try {
			const formData = await request.formData();
			const displayName = formData.get('displayName')?.toString();
			const email = formData.get('email')?.toString();
			const phone = formData.get('phone')?.toString();
			const street = formData.get('street')?.toString();
			const city = formData.get('city')?.toString();
			const state = formData.get('state')?.toString();
			const zipCode = formData.get('zipCode')?.toString();

			// Validate required fields
			if (!displayName || !email) {
				return fail(400, { 
					message: 'Display name and email are required', 
					success: false 
				});
			}

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return fail(400, { 
					message: 'Please enter a valid email address', 
					success: false 
				});
			}

			// Prepare update data
			const updateData: any = {
				displayName,
				email,
				phone: phone || null,
				address: {
					street: street || '',
					city: city || '',
					state: state || '',
					zipCode: zipCode || ''
				},
				updatedAt: new Date()
			};

			// If email changed, initiate email change verification process
			if (email !== locals.user.email) {
				console.log('📧 [SETTINGS] Email change requested from', locals.user.email, 'to', email);
				
				// Store pending email change in user document (don't update Firebase Auth yet)
				updateData.pendingEmailChange = {
					newEmail: email,
					requestedAt: new Date(),
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
					confirmed: false
				};
				
				// Keep the old email in the profile for now
				updateData.email = locals.user.email;
				
				console.log('⏳ [SETTINGS] Email change pending confirmation. User stays logged in with current email.');
				
				// Send confirmation email to new address
				try {
					await sendEmailChangeConfirmation(locals.user.uid, email, displayName || 'User');
					console.log('✅ [SETTINGS] Confirmation email sent successfully');
				} catch (emailError) {
					console.error('⚠️ [SETTINGS] Failed to send confirmation email:', emailError);
					// Don't fail the entire operation if email sending fails
				}
			}

			// Update user document in Firestore
			await adminDb.collection('users').doc(locals.user.uid).update(updateData);

			return {
				message: 'Profile updated successfully!',
				success: true
			};

		} catch (error) {
			console.error('Error updating profile:', error);
			return fail(500, { 
				message: 'Failed to update profile. Please try again.', 
				success: false 
			});
		}
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Not authenticated', success: false });
		}

		try {
			const formData = await request.formData();
			const currentPassword = formData.get('currentPassword')?.toString();
			const newPassword = formData.get('newPassword')?.toString();
			const confirmPassword = formData.get('confirmPassword')?.toString();

			// Validate required fields
			if (!currentPassword || !newPassword || !confirmPassword) {
				return fail(400, { 
					message: 'All password fields are required', 
					success: false 
				});
			}

			// Validate password match
			if (newPassword !== confirmPassword) {
				return fail(400, { 
					message: 'New passwords do not match', 
					success: false 
				});
			}

			// Validate password strength
			if (newPassword.length < 6) {
				return fail(400, { 
					message: 'Password must be at least 6 characters long', 
					success: false 
				});
			}

			// Note: In a real implementation, you would need to verify the current password
			// This typically requires re-authentication on the client side
			// For now, we'll just update the password in Firebase Auth
			try {
				const auth = getAuth();
				await auth.updateUser(locals.user.uid, {
					password: newPassword
				});

				// Update password change timestamp in user document
				await adminDb.collection('users').doc(locals.user.uid).update({
					passwordChangedAt: new Date(),
					updatedAt: new Date()
				});

				return {
					message: 'Password updated successfully!',
					success: true
				};

			} catch (authError: any) {
				console.error('Error updating password:', authError);
				
				// Handle specific Firebase Auth errors
				if (authError.code === 'auth/weak-password') {
					return fail(400, { 
						message: 'Password is too weak. Please choose a stronger password.', 
						success: false 
					});
				}
				
				return fail(500, { 
					message: 'Failed to update password. Please try again.', 
					success: false 
				});
			}

		} catch (error) {
			console.error('Error changing password:', error);
			return fail(500, { 
				message: 'Failed to change password. Please try again.', 
				success: false 
			});
		}
	}
};
