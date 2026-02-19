import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Verify user is an approved funeral director
		const funeralDirectorDoc = await adminDb
			.collection('funeral_directors')
			.doc(locals.user.uid)
			.get();
		if (!funeralDirectorDoc.exists) {
			return json({ error: 'Funeral director profile not found' }, { status: 404 });
		}

		const funeralDirector = funeralDirectorDoc.data();
		if (funeralDirector?.status !== 'approved') {
			return json({ error: 'Funeral director account not approved' }, { status: 403 });
		}

		const formData = await request.json();

		// Generate memorial title and slug
		const title = `In Memory of ${formData.lovedOne.firstName} ${formData.lovedOne.lastName}`;
		const baseSlug = `${formData.lovedOne.firstName}-${formData.lovedOne.lastName}`
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
		const fullSlug = `${baseSlug}-${Date.now()}`;

		// Create customer user account
		const auth = getAuth();
		const temporaryPassword =
			Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

		let customerUser;
		try {
			customerUser = await auth.createUser({
				email: formData.customer.email,
				password: temporaryPassword,
				displayName: `${formData.customer.firstName} ${formData.customer.lastName}`,
				emailVerified: false
			});

			// Set custom claims for the customer (owner role)
			await auth.setCustomUserClaims(customerUser.uid, {
				role: 'owner'
			});
		} catch (authError: any) {
			console.error('Error creating customer user:', authError);
			return json({ error: 'Failed to create customer account' }, { status: 500 });
		}

		// Create memorial document
		const memorial = {
			title,
			slug: baseSlug,
			fullSlug,

			// Deceased information
			deceased: {
				firstName: formData.lovedOne.firstName,
				lastName: formData.lovedOne.lastName,
				middleName: formData.lovedOne.middleName || '',
				dateOfBirth: formData.lovedOne.dateOfBirth || '',
				dateOfDeath: formData.lovedOne.dateOfDeath || ''
			},

			// Owner information (customer)
			ownerUid: customerUser.uid,
			ownerInfo: {
				firstName: formData.customer.firstName,
				lastName: formData.customer.lastName,
				email: formData.customer.email,
				phone: formData.customer.phone,
				relationship: formData.customer.relationship
			},

			// Service information
			services: {
				primary: {
					date: formData.service.date,
					time: formData.service.time,
					durationHours: formData.service.durationHours,
					serviceType: formData.service.serviceType,
					location: formData.service.location || ''
				},
				additional: formData.service.additionalDays || []
			},

			// Funeral director information
			funeralDirectorUid: locals.user.uid,
			funeralDirector: {
				id: locals.user.uid,
				companyName: funeralDirector.companyName,
				contactPerson: funeralDirector.contactPerson,
				phone: funeralDirector.phone,
				email: funeralDirector.email,
				licenseNumber: funeralDirector.licenseNumber
			},

			// Memorial settings
			description: formData.memorial.customMessage || '',
			isPublic: formData.memorial.isPublic,
			allowComments: formData.memorial.allowComments,
			allowPhotos: formData.memorial.allowPhotos,
			allowTributes: formData.memorial.allowTributes,

			// Permissions
			permissions: {
				funeralDirectorCanEdit: true
			},

			// Metadata
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
			createdBy: locals.user.uid,
			createdByRole: 'funeral_director',
			creatorUid: customerUser.uid, // Memorial owner for existing logic

			// Status
			status: 'active'
		};

		// Create memorial document
		const memorialRef = adminDb.collection('memorials').doc();
		await memorialRef.set(memorial);

		// Create user profile document for customer
		await adminDb
			.collection('users')
			.doc(customerUser.uid)
			.set({
				uid: customerUser.uid,
				email: formData.customer.email,
				displayName: `${formData.customer.firstName} ${formData.customer.lastName}`,
				firstName: formData.customer.firstName,
				lastName: formData.customer.lastName,
				phone: formData.customer.phone,
				role: 'owner',
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now(),
				createdBy: locals.user.uid,
				createdByRole: 'funeral_director',

				// Memorial association
				primaryMemorialId: memorialRef.id,
				memorialIds: [memorialRef.id]
			});

		// Send email invitation to customer with login credentials
		try {
			await sendEnhancedRegistrationEmail({
				email: formData.customer.email,
				lovedOneName: `${formData.lovedOne.firstName} ${formData.lovedOne.lastName}`,
				memorialUrl: `https://tributestream.com/${fullSlug}`,
				ownerName: `${formData.customer.firstName} ${formData.customer.lastName}`
			});
			console.log('📧 Welcome email sent to new customer successfully.');
		} catch (emailError) {
			console.error('⚠️ Failed to send welcome email to customer:', emailError);
			// Do not fail the request if email sending fails
		}

		return json({
			success: true,
			memorialId: memorialRef.id,
			fullSlug: fullSlug,
			customerEmail: formData.customer.email,
			customerUserId: customerUser.uid,
			message: 'Memorial created successfully and customer account set up'
		});
	} catch (error) {
		console.error('Error creating customer memorial:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
