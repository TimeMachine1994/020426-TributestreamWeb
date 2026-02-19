import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, adminAuth } from '$lib/server/firebase';
import type { FuneralDirectorMemorialRequest } from '$lib/types/funeral-director';
import { Timestamp } from 'firebase-admin/firestore';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';

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
		// V1: All funeral directors are auto-approved
		if (funeralDirector?.status !== 'approved') {
			return json({ error: 'Funeral director account not active' }, { status: 403 });
		}

		const memorialData: FuneralDirectorMemorialRequest = await request.json();

		// Generate memorial title if not provided
		const title =
			memorialData.memorial.title ||
			`In Memory of ${memorialData.deceased.firstName} ${memorialData.deceased.lastName}`;

		// Generate slug
		const baseSlug =
			memorialData.memorial.customSlug ||
			`${memorialData.deceased.firstName}-${memorialData.deceased.lastName}`
				.toLowerCase()
				.replace(/[^a-z0-9]/g, '-')
				.replace(/-+/g, '-')
				.replace(/^-|-$/g, '');

		// Create memorial document
		const memorial = {
			title,
			slug: baseSlug,
			fullSlug: `${baseSlug}-${Date.now()}`, // Ensure uniqueness

			// Deceased information
			deceased: {
				firstName: memorialData.deceased.firstName,
				lastName: memorialData.deceased.lastName,
				middleName: memorialData.deceased.middleName,
				nickname: memorialData.deceased.nickname,
				dateOfBirth: memorialData.deceased.dateOfBirth,
				dateOfDeath: memorialData.deceased.dateOfDeath,
				placeOfBirth: memorialData.deceased.placeOfBirth,
				placeOfDeath: memorialData.deceased.placeOfDeath,
				occupation: memorialData.deceased.occupation,
				education: memorialData.deceased.education,
				militaryService: memorialData.deceased.militaryService,
				militaryBranch: memorialData.deceased.militaryBranch,
				militaryRank: memorialData.deceased.militaryRank
			},

			// Family information
			family: memorialData.family,

			// Service Details - new consolidated structure
			services: {
				main: {
					location: {
						name: memorialData.services?.location?.name || '',
						address: memorialData.services?.location?.address || '',
						isUnknown: memorialData.services?.location?.isUnknown || false
					},
					time: {
						date: memorialData.services?.date || null,
						time: memorialData.services?.time || null,
						isUnknown: memorialData.services?.timeUnknown || false
					},
					hours: memorialData.services?.duration || 2
				},
				additional: [] // Empty initially, can be added via calculator
			},

			// Funeral director information
			funeralDirector: {
				id: locals.user.uid,
				companyName: funeralDirector.companyName,
				contactPerson: funeralDirector.contactPerson,
				phone: funeralDirector.phone,
				email: funeralDirector.email
				// V1: License number removed
			},

			// Owner information (will be created as user)
			ownerInfo: memorialData.owner,

			// Memorial settings
			description: memorialData.memorial.description || '',
			isPublic: memorialData.memorial.isPublic,
			allowComments: memorialData.memorial.allowComments,
			allowPhotos: memorialData.memorial.allowPhotos,
			allowTributes: memorialData.memorial.allowTributes,

			// Additional options
			options: memorialData.options,

			// Permissions
			permissions: {
				funeralDirectorCanEdit: true
			},

			// Metadata
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
			createdBy: locals.user.uid,
			createdByRole: 'funeral_director',

			// Status
			status: 'active'
		};

		// Create owner user account
		const ownerData = memorialData.owner;
		const password = generateRandomPassword();
		const userRecord = await adminAuth.createUser({
			email: ownerData.email,
			password: password,
			displayName: `${ownerData.firstName} ${ownerData.lastName}`
		});

		await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'owner' });

		// Create user profile in Firestore
		await adminDb
			.collection('users')
			.doc(userRecord.uid)
			.set({
				email: ownerData.email,
				displayName: `${ownerData.firstName} ${ownerData.lastName}`,
				phone: ownerData.phone,
				role: 'owner',
				createdAt: Timestamp.now(),
				createdByFuneralDirector: locals.user.uid
			});

		// Add ownerUid to the memorial data
		memorial.ownerUid = userRecord.uid;

		// Create memorial document
		const memorialRef = adminDb.collection('memorials').doc();
		await memorialRef.set(memorial);

		// Send registration email to the owner
		try {
			await sendEnhancedRegistrationEmail({
				email: ownerData.email,
				password: password,
				lovedOneName: `${memorialData.deceased.firstName} ${memorialData.deceased.lastName}`,
				tributeUrl: `https://tributestream.com/${memorial.fullSlug}`,
				familyContactName: `${ownerData.firstName} ${ownerData.lastName}`,
				familyContactEmail: ownerData.email,
				familyContactPhone: ownerData.phone,
				contactPreference: 'email', // Defaulting
				directorName: funeralDirector.contactPerson,
				directorEmail: funeralDirector.email,
				funeralHomeName: funeralDirector.companyName
			});
		} catch (emailError) {
			console.error('⚠️ Failed to send registration email to owner:', emailError);
		}

		return json({
			success: true,
			memorialId: memorialRef.id,
			fullSlug: memorial.fullSlug,
			message: 'Memorial created successfully'
		});
	} catch (error) {
		console.error('Error creating memorial:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
