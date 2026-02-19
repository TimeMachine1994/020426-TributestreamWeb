import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, adminAuth } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';
import { validateEmail } from '$lib/utils/email-validation';
import { generateUniqueMemorialSlug } from '$lib/utils/memorial-slug';
import { createStandardUserProfile } from '$lib/utils/user-profile';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Verify user is a funeral director
		if (locals.user.role !== 'funeral_director') {
			return json({ error: 'Funeral director access required' }, { status: 403 });
		}

		const data = await request.json();
		const { lovedOneName, familyEmail, serviceDate, serviceTime } = data;

		if (!lovedOneName || !familyEmail || !serviceDate || !serviceTime) {
			return json({ error: 'All fields are required' }, { status: 400 });
		}

		// Pre-validate email before expensive operations
		const emailValidation = await validateEmail(familyEmail, 'familyEmail');
		if (!emailValidation.isValid) {
			return json({ 
				error: emailValidation.error,
				field: emailValidation.field
			}, { status: 400 });
		}

		// Get funeral director profile
		const funeralDirectorDoc = await adminDb
			.collection('funeral_directors')
			.doc(locals.user.uid)
			.get();

		if (!funeralDirectorDoc.exists) {
			return json({ error: 'Funeral director profile not found' }, { status: 404 });
		}

		const funeralDirector = funeralDirectorDoc.data();

		// Generate temporary password for family
		const tempPassword = Math.random().toString(36).slice(-8);

		// Create user account for family
		const userRecord = await adminAuth.createUser({
			email: familyEmail,
			password: tempPassword,
			displayName: `Family of ${lovedOneName}`
		});

		// Set custom claims for the new user
		await adminAuth.setCustomUserClaims(userRecord.uid, {
			role: 'owner'
		});

		// Create user profile in Firestore
		const userProfile = createStandardUserProfile({
			email: familyEmail,
			displayName: `Family of ${lovedOneName}`,
			role: 'owner',
			createdBy: locals.user.uid,
			createdByFuneralDirector: true
		});

		await adminDb
			.collection('users')
			.doc(userRecord.uid)
			.set(userProfile);

		// Generate unique memorial slug
		const memorialSlug = await generateUniqueMemorialSlug(lovedOneName);

		// Combine service date and time
		const serviceDateTime = new Date(`${serviceDate}T${serviceTime}`);

		// Parse loved one's name for memorial structure
		const nameParts = lovedOneName.trim().split(' ');
		const firstName = nameParts[0] || '';
		const lastName = nameParts.slice(1).join(' ') || '';

		// Create memorial
		const memorialRef = adminDb.collection('memorials').doc();
		await memorialRef.set({
			title: `In Memory of ${lovedOneName}`,
			slug: memorialSlug,
			fullSlug: memorialSlug,
			lovedOneName: lovedOneName,
			deceased: {
				firstName: firstName,
				lastName: lastName,
				fullName: lovedOneName
			},
			ownerId: userRecord.uid,
			ownerEmail: familyEmail,
			creatorUid: userRecord.uid,

			// Funeral director info
			funeralDirectorId: locals.user.uid,
			funeralDirectorName: funeralDirector?.companyName || 'Funeral Director',
			managedByFuneralDirector: true,

			// Service info
			serviceDate: Timestamp.fromDate(serviceDateTime),
			serviceTime: serviceTime,

			// Settings
			isPublic: true,
			allowComments: true,
			allowPhotos: true,
			allowTributes: true,

			// Timestamps
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),

			// Status
			status: 'active'
		});

		// Send welcome email to the family
		try {
			await sendEnhancedRegistrationEmail({
				email: familyEmail,
				password: tempPassword,
				lovedOneName: lovedOneName,
				memorialUrl: `https://tributestream.com/${memorialSlug}`,
				ownerName: `Family of ${lovedOneName}`
			});
			console.log('📧 Welcome email sent to family successfully.');
		} catch (emailError) {
			console.error('⚠️ Failed to send welcome email:', emailError);
			// Do not fail the entire request if email sending fails, just log it
		}

		return json({
			success: true,
			message: 'Family memorial created successfully',
			memorialId: memorialRef.id,
			memorialUrl: `/${memorialRef.id}`
		});
	} catch (error: any) {
		console.error('Quick family registration error:', error);
		
		// Handle specific Firebase Auth errors
		if (error.code === 'auth/email-already-exists') {
			return json({ 
				error: `An account with the provided email already exists. Please use a different email or sign in to your existing account.`,
				field: 'familyEmail'
			}, { status: 400 });
		}
		
		return json({ 
			error: 'Failed to create family memorial. Please try again.'
		}, { status: 500 });
	}
};
