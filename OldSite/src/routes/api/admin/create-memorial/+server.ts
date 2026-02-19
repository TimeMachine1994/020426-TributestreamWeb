import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		const formData = await request.json();

		if (!formData.lovedOneName || !formData.creatorEmail) {
			return json({ error: 'Loved one name and creator email are required' }, { status: 400 });
		}

		const baseSlug = formData.lovedOneName
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');

		const fullSlug = `celebration-of-life-for-${baseSlug}`;

		const auth = getAuth();
		let userUid = null;
		let userExists = false;
		let password = '';

		try {
			const existingUser = await auth.getUserByEmail(formData.creatorEmail);
			userUid = existingUser.uid;
			userExists = true;
		} catch (userNotFoundError) {
			password = Math.random().toString(36).slice(-12);
			const newUser = await auth.createUser({
				email: formData.creatorEmail,
				displayName: formData.creatorName || formData.lovedOneName + ' Family',
				password: password
			});
			userUid = newUser.uid;
			await auth.setCustomUserClaims(userUid, {
				role: 'owner',
				canCreateMemorials: true
			});
		}

		if (!userExists) {
			await adminDb
				.collection('users')
				.doc(userUid)
				.set({
					email: formData.creatorEmail,
					displayName: formData.creatorName || formData.lovedOneName + ' Family',
					role: 'owner',
					createdAt: Timestamp.now(),
					updatedAt: Timestamp.now(),
					createdByAdmin: true,
					createdBy: locals.user.uid
				});
		}

		const memorial = {
			lovedOneName: formData.lovedOneName,
			slug: baseSlug,
			fullSlug: fullSlug,
			ownerUid: userUid, // V1: Single source of truth for ownership
			creatorEmail: formData.creatorEmail,
			creatorName: formData.creatorName || formData.lovedOneName + ' Family',
			content: formData.content || '',
			isPublic: true, // Always set to true for new memorials
			isComplete: false, // New memorials start as incomplete/scheduled
			serviceDate: formData.serviceDate || null,
			serviceTime: formData.serviceTime || null,
			location: formData.location || '',
			allowComments: true,
			allowPhotos: true,
			allowTributes: true,
			createdByAdmin: true,
			adminCreator: {
				uid: locals.user.uid,
				email: locals.user.email,
				createdAt: Timestamp.now()
			},
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
			photos: [],
			embeds: [],
			calculatorConfig: {
				status: 'draft',
				formData: {},
				autoSave: {}
			}
		};

		const memorialRef = adminDb.collection('memorials').doc();
		await memorialRef.set(memorial);

		const memorialId = memorialRef.id;

		try {
			await adminDb.collection('admin_actions').add({
				action: 'create_memorial',
				targetId: memorialId,
				targetType: 'memorial',
				performedBy: locals.user.uid,
				performedByEmail: locals.user.email,
				timestamp: Timestamp.now(),
				details: {
					lovedOneName: formData.lovedOneName,
					creatorEmail: formData.creatorEmail,
					fullSlug: fullSlug,
					userCreated: !userExists
				}
			});
		} catch (auditError) {
			console.error('⚠️ [ADMIN API] Failed to create audit log:', auditError);
		}

		if (!userExists && password) {
			try {
				// Generate custom token for magic link authentication
				console.log('🎟️ [ADMIN API] Generating magic link token...');
				const customToken = await auth.createCustomToken(userUid, {
					role: 'owner',
					email: formData.creatorEmail,
					memorial_id: memorialId
				});

				// Create magic link URL that goes directly to their memorial page
				const baseUrl = process.env.PUBLIC_BASE_URL || 'https://tributestream.com';
				const magicLink = `${baseUrl}/auth/session?token=${customToken}&fullSlug=${fullSlug}`;
				console.log('🔗 [ADMIN API] Magic link created for memorial page:', fullSlug);

				await sendEnhancedRegistrationEmail({
					email: formData.creatorEmail,
					password: password,
					lovedOneName: formData.lovedOneName,
					familyContactEmail: formData.creatorEmail,
					familyContactName: formData.creatorName || `${formData.lovedOneName} Family`,
					familyContactPhone: '',
					contactPreference: 'email',
					directorName: 'Tributestream Admin',
					funeralHomeName: 'Tributestream',
					magicLink: magicLink // Pass magic link to email
				});
			} catch (emailError) {
				console.error('⚠️ [ADMIN API] Failed to send welcome email:', emailError);
			}
		}

		return json({
			success: true,
			message: 'Memorial created successfully',
			memorialId,
			fullSlug,
			userUid,
			userCreated: !userExists,
			memorialUrl: `/${fullSlug}`
		});
	} catch (error: any) {
		console.error('💥 [ADMIN API] Error creating memorial:', {
			error: error.message,
			stack: error.stack,
			user: locals.user?.email
		});

		return json(
			{
				error: 'Internal server error occurred while creating memorial'
			},
			{ status: 500 }
		);
	}
};
