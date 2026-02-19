import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sendFuneralDirectorRegistrationEmail } from '$lib/server/email';
import { indexMemorial } from '$lib/server/algolia-indexing';
import type { Memorial } from '$lib/types/memorial';
import { generateUniqueMemorialSlug } from '$lib/utils/memorial-slug';
import { createStandardUserProfile } from '$lib/utils/user-profile';

/**
 * ENHANCED FUNERAL DIRECTOR REGISTRATION PAGE
 *
 * Allows funeral directors to register families with comprehensive
 * memorial and service information
 */

// Helper function to generate a random password
function generateRandomPassword(length = 12) {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
	let password = '';
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		password += charset[randomIndex];
	}
	return password;
}


export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is logged in
	if (!locals.user) {
		throw redirect(302, '/login?redirect=/register/funeral-director');
	}

	// Check if user has proper role (funeral director or admin)
	if (locals.user.role !== 'funeral_director' && locals.user.role !== 'admin') {
		throw redirect(302, '/profile?error=access-denied');
	}

	// Get funeral director profile for prepopulation
	let funeralDirectorProfile = null;
	let prepopulatedData = {
		directorName: '',
		directorEmail: '',
		funeralHomeName: ''
	};

	if (locals.user.role === 'funeral_director') {
		try {
			console.log('🔍 Attempting to fetch funeral director profile...');
			console.log('🔍 adminDb defined?', !!adminDb);
			console.log('🔍 User UID:', locals.user.uid);
			
			const fdDoc = await adminDb
				.collection('funeral_directors')
				.doc(locals.user.uid)
				.get();
			
			console.log('🔍 FD doc exists?', fdDoc.exists);
			
			if (fdDoc.exists) {
				const rawData: any = fdDoc.data();
				
				// Convert Firestore Timestamps to ISO strings for serialization
				funeralDirectorProfile = {
					...rawData,
					createdAt: rawData?.createdAt?.toDate?.()?.toISOString() || null,
					updatedAt: rawData?.updatedAt?.toDate?.()?.toISOString() || null,
					approvedAt: rawData?.approvedAt?.toDate?.()?.toISOString() || null
				} as any;
				
				console.log('✅ FD profile loaded:', Object.keys(funeralDirectorProfile || {}));
				
				// Prepopulate form data from funeral director profile
				prepopulatedData = {
					directorName: rawData?.contactPerson || locals.user.displayName || '',
					directorEmail: rawData?.email || locals.user.email || '',
					funeralHomeName: rawData?.companyName || ''
				};
			} else {
				console.log('⚠️ FD profile not found, using user data only');
			}
		} catch (error) {
			console.error('❌ Failed to fetch funeral director profile:', error);
			console.error('❌ Error details:', error.message, error.stack);
		}
	} else if (locals.user.role === 'admin') {
		// For admin users, just use their basic info
		prepopulatedData = {
			directorName: locals.user.displayName || '',
			directorEmail: locals.user.email || '',
			funeralHomeName: ''
		};
	}

	return {
		user: locals.user,
		funeralDirectorProfile,
		prepopulatedData
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		console.log('🎯 Enhanced funeral director registration started');
		const data = await request.formData();
		
		// Extract all form fields
		console.log('📝 Extracting form data...');
		const lovedOneName = (data.get('lovedOneName') as string)?.trim();
		const familyContactName = (data.get('familyContactName') as string)?.trim();
		const familyContactEmail = (data.get('familyContactEmail') as string)?.trim();
		const familyContactPhone = (data.get('familyContactPhone') as string)?.trim();
		const directorName = (data.get('directorName') as string)?.trim();
		const directorEmail = (data.get('directorEmail') as string)?.trim();
		const funeralHomeName = (data.get('funeralHomeName') as string)?.trim();
		const locationName = (data.get('locationName') as string)?.trim();
		const locationAddress = (data.get('locationAddress') as string)?.trim();
		const memorialDate = (data.get('memorialDate') as string)?.trim();
		const memorialTime = (data.get('memorialTime') as string)?.trim();
		const contactPreference = (data.get('contactPreference') as string)?.trim() || 'email';
		const additionalNotes = (data.get('additionalNotes') as string)?.trim();

		console.log('📋 Form data extracted:', {
			lovedOneName,
			familyContactName,
			familyContactEmail,
			directorName,
			funeralHomeName,
			hasLocationInfo: !!(locationName || locationAddress),
			hasScheduleInfo: !!(memorialDate || memorialTime),
			contactPreference
		});

		// Enhanced validation for required fields
		console.log('🔍 Validating required fields...');
		const validationErrors: string[] = [];

		if (!lovedOneName) validationErrors.push('Loved one\'s name is required');
		if (!directorName) validationErrors.push('Director name is required');
		if (!familyContactEmail) validationErrors.push('Family contact email is required');
		if (!familyContactPhone) validationErrors.push('Family contact phone is required');
		if (!funeralHomeName) validationErrors.push('Funeral home name is required');

		if (validationErrors.length > 0) {
			console.log('❌ Validation failed:', validationErrors);
			return fail(400, { error: `Validation failed: ${validationErrors.join(', ')}` });
		}

		console.log('✅ All validation passed successfully');

		const fullSlug = await generateUniqueMemorialSlug(lovedOneName);
		let userRecord;
		let isExistingUser = false;
		let password = '';

		try {
			// Check if user already exists
			console.log(`🔍 Checking if user exists with email: ${familyContactEmail}`);
			try {
				userRecord = await adminAuth.getUserByEmail(familyContactEmail);
				isExistingUser = true;
				console.log(`✅ Found existing user: ${userRecord.uid}`);
			} catch (error: any) {
				if (error.code === 'auth/user-not-found') {
					// User doesn't exist, create new one
					console.log(`👤 Creating new user account with family contact email: ${familyContactEmail}`);
					password = generateRandomPassword();
					userRecord = await adminAuth.createUser({
						email: familyContactEmail,
						password,
						displayName: familyContactName || directorName
					});
					console.log(`✅ New user created successfully: ${userRecord.uid}`);

					// Set custom claim for owner role (only for new users)
					console.log('👑 Setting owner role claim...');
					await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'owner' });
					console.log(`✅ Custom claim 'owner' set for ${familyContactEmail}`);
				} else {
					throw error; // Re-throw other errors
				}
			}

			// Update or create user profile in Firestore
			if (isExistingUser) {
				console.log('📝 Updating existing user profile with new memorial info...');
				// Get existing profile
				const existingProfileDoc = await adminDb.collection('users').doc(userRecord.uid).get();
				const existingProfile = existingProfileDoc.data() || {};
				
				// Update with new information (merge with existing)
				const updatedProfile = {
					...existingProfile,
					phone: familyContactPhone || existingProfile.phone,
					familyContactName: familyContactName || existingProfile.familyContactName,
					familyContactPhone: familyContactPhone || existingProfile.familyContactPhone,
					contactPreference: contactPreference || existingProfile.contactPreference,
					updatedAt: new Date(),
					// Increment memorial count if it exists
					memorialCount: (existingProfile.memorialCount || 0) + 1
				};

				await adminDb.collection('users').doc(userRecord.uid).update(updatedProfile);
				console.log(`✅ Existing user profile updated for ${familyContactEmail}`);
			} else {
				console.log('📝 Creating new user profile...');
				const userProfile = createStandardUserProfile({
					email: familyContactEmail,
					displayName: familyContactName || directorName,
					phone: familyContactPhone,
					funeralHomeName,
					role: 'owner',
					directorEmail: directorEmail || undefined,
					familyContactName: familyContactName,
					familyContactPhone: familyContactPhone,
					contactPreference: contactPreference as 'phone' | 'email',
					createdByFuneralDirector: true
				});

				await adminDb.collection('users').doc(userRecord.uid).set(userProfile);
				console.log(`✅ New user profile created for ${familyContactEmail}`);
			}

			// Get funeral director profile for tracking
			let funeralDirectorProfile = null;
			if (locals.user) {
				const funeralDirectorDoc = await adminDb.collection('funeral_directors').doc(locals.user.uid).get();
				funeralDirectorProfile = funeralDirectorDoc.exists ? funeralDirectorDoc.data() : null;
			}

			// 4. Create comprehensive memorial with all service details
			console.log('🕊️ Creating comprehensive memorial...');
			const memorialData = {
				// Core memorial fields
				lovedOneName: lovedOneName,
				slug: fullSlug, // Use fullSlug as slug for consistency
				fullSlug: fullSlug,
				ownerUid: userRecord.uid, // Required field
				createdByUserId: userRecord.uid,
				creatorEmail: familyContactEmail,
				creatorName: familyContactName || directorName,
				
				// Service information structure (required)
				services: {
					main: {
						location: {
							name: locationName || '',
							address: locationAddress || '',
							isUnknown: !locationName
						},
						time: {
							date: memorialDate || null,
							time: memorialTime || null,
							isUnknown: !memorialDate || !memorialTime
						},
						hours: 2 // Default duration
					},
					additional: [] // Empty initially
				},
				
				// Service information fields (legacy)
				directorFullName: directorName,
				funeralHomeName: funeralHomeName,
				memorialDate: memorialDate || null,
				memorialTime: memorialTime || null,
				memorialLocationName: locationName || null,
				memorialLocationAddress: locationAddress || null,
				
				// Family contact fields
				familyContactName: familyContactName,
				familyContactEmail: familyContactEmail,
				familyContactPhone: familyContactPhone,
				familyContactPreference: contactPreference as 'phone' | 'email',
				
				// Director information
				directorEmail: directorEmail || null,
				
				// Funeral director tracking (CRITICAL FIX)
				funeralDirectorUid: locals.user?.uid || null, // For profile page queries
				funeralDirector: locals.user ? {
					id: locals.user.uid,
					companyName: funeralDirectorProfile?.companyName || funeralHomeName,
					contactPerson: funeralDirectorProfile?.contactPerson || directorName,
					phone: funeralDirectorProfile?.phone || '',
					email: funeralDirectorProfile?.email || directorEmail || ''
				} : null, // For API endpoint queries
				
				// Additional information
				additionalNotes: additionalNotes || null,
				
				// Required fields
				isPublic: true,
				isComplete: false, // Required field
				content: '',
				custom_html: null,
				
				// Timestamps
				createdAt: new Date(),
				updatedAt: new Date(),
				
				// Legacy compatibility
				creatorUid: userRecord.uid // Keep for backward compatibility
			};

			const memorialRef = await adminDb.collection('memorials').add(memorialData);
			console.log(`✅ Comprehensive memorial created for ${lovedOneName} with ID: ${memorialRef.id}`);
			console.log(`🔗 Memorial fullSlug: ${fullSlug}`);

			// Index the new memorial in Algolia
			await indexMemorial({ ...memorialData, id: memorialRef.id } as unknown as Memorial);

			// 5. Generate magic link for calculator access
			console.log('🎟️ Generating magic link for calculator access...');
			const calculatorToken = await adminAuth.createCustomToken(userRecord.uid, {
				role: 'owner',
				email: familyContactEmail,
				memorial_id: memorialRef.id
			});
			const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
			const calculatorMagicLink = `${baseUrl}/auth/session?token=${calculatorToken}&redirect=schedule/${memorialRef.id}`;
			console.log('🔗 Calculator magic link created for memorial:', memorialRef.id);

			// 6. Send funeral director registration email with magic link
			console.log(`📧 Sending funeral director registration email to ${isExistingUser ? 'existing' : 'new'} user...`);
			await sendFuneralDirectorRegistrationEmail({
				email: familyContactEmail,
				familyName: familyContactName || 'Family',
				lovedOneName: lovedOneName,
				memorialUrl: `https://tributestream.com/${fullSlug}`,
				password: isExistingUser ? '' : password, // Include password for new users only
				additionalNotes: additionalNotes,
				calculatorMagicLink: calculatorMagicLink // Add magic link to calculator
			});
			console.log('✅ Funeral director registration email sent successfully with calculator magic link');

			// 6. Create a custom token for auto-login
			console.log('🎟️ Creating custom token for auto-login...');
			const customToken = await adminAuth.createCustomToken(userRecord.uid);
			console.log(`✅ Custom token created for ${familyContactEmail}`);

			// 7. Return success to show to user, then redirect to profile
			console.log(`🚀 Memorial created successfully: ${fullSlug}`);
			
			if (isExistingUser) {
				console.log('🎉 Additional memorial created for existing user successfully!');
			} else {
				console.log('🎉 Enhanced funeral director registration completed successfully!');
			}
			
			// For authenticated funeral directors completing their profile, show success then redirect to profile
			return {
				success: true,
				message: `Memorial created successfully for ${lovedOneName}! Credentials have been emailed to ${familyContactEmail}.`,
				memorialSlug: fullSlug,
				familyContactEmail: familyContactEmail
			};
			
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			
			console.error('💥 Error during enhanced registration process:', error);
			
			// Enhanced error handling with specific messages
			let errorMessage = 'Registration failed. Please try again.';
			let fieldName = undefined;
			
			// Since we pre-validated email, this should rarely happen
			if (error.code === 'auth/email-already-exists') {
				errorMessage = `An account with email ${familyContactEmail} already exists. Please use a different email or sign in to your existing account.`;
				fieldName = 'familyContactEmail';
			} else if (error.code === 'auth/invalid-email') {
				errorMessage = 'The provided email address is invalid. Please check and try again.';
				fieldName = 'familyContactEmail';
			} else if (error.code === 'auth/weak-password') {
				errorMessage = 'The generated password is too weak. Please try again.';
			} else if (error.message?.includes('PERMISSION_DENIED')) {
				errorMessage = 'Database permission denied. Please contact support.';
			} else if (error.message?.includes('QUOTA_EXCEEDED')) {
				errorMessage = 'Service quota exceeded. Please try again later.';
			}
			
			console.error('❌ Specific error details:', {
				code: error.code,
				message: error.message,
				stack: error.stack
			});
			
			return fail(500, { 
				error: errorMessage,
				...(fieldName && { field: fieldName })
			});
		}
	}
};
