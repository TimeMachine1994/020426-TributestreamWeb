import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { FuneralDirector } from '$lib/types/funeral-director';
import { Timestamp } from 'firebase-admin/firestore';
import { validateUserProfileData } from '$lib/utils/user-profile';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check if user is authenticated
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const data = await request.json();

		// Validate required fields and data structure
		const requiredFields = ['companyName', 'contactPerson', 'email', 'phone', 'address'];

		for (const field of requiredFields) {
			if (!data[field]) {
				return json({ error: `Missing required field: ${field}` }, { status: 400 });
			}
		}

		// Validate profile data structure
		const profileValidation = validateUserProfileData({
			email: data.email,
			displayName: data.contactPerson,
			role: 'funeral_director',
			phone: data.phone,
			funeralHomeName: data.companyName
		});

		if (!profileValidation.isValid) {
			const firstError = profileValidation.errors[0];
			return json({ 
				error: firstError.message,
				field: firstError.field
			}, { status: 400 });
		}

		// Create funeral director document (V1: simplified)
		const funeralDirector: Omit<FuneralDirector, 'id'> = {
			companyName: data.companyName,
			contactPerson: data.contactPerson,
			email: data.email,
			phone: data.phone,
			address: {
				street: data.address.street,
				city: data.address.city,
				state: data.address.state,
				zipCode: data.address.zipCode
			},
			status: 'approved', // V1: auto-approved
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now()
		};

		// Save to Firestore
		const docRef = adminDb.collection('funeral_directors').doc(locals.user.uid);
		await docRef.set(funeralDirector);

		// Update user's custom claims to include funeral_director role
		const auth = (await import('firebase-admin/auth')).getAuth();
		await auth.setCustomUserClaims(locals.user.uid, {
			role: 'funeral_director'
		});

		return json({
			success: true,
			message: 'Funeral director registration completed successfully',
			id: locals.user.uid
		});
	} catch (error: any) {
		console.error('Error registering funeral director:', error);
		
		// Enhanced error handling
		let errorMessage = 'Internal server error';
		
		if (error.message?.includes('PERMISSION_DENIED')) {
			errorMessage = 'Database permission denied. Please contact support.';
		} else if (error.message?.includes('QUOTA_EXCEEDED')) {
			errorMessage = 'Service quota exceeded. Please try again later.';
		} else if (error.message) {
			errorMessage = `Registration failed: ${error.message}`;
		}
		
		return json({ 
			error: errorMessage
		}, { status: 500 });
	}
};
