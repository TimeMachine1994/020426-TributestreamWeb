import { adminDb } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Memorial } from '$lib/types/memorial';
import { verifyRecaptcha, RECAPTCHA_ACTIONS, getScoreThreshold } from '$lib/utils/recaptcha';
import { dev } from '$app/environment';
import { generateUniqueMemorialSlug } from '$lib/utils/memorial-slug';

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
	try {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const { uid, role } = locals.user;

		// Redirect admins to admin dashboard
		if (role === 'admin') {
			throw redirect(303, '/admin');
		}

		// Fetch user profile
		const userDoc = await adminDb.collection('users').doc(uid).get();
		const profileData = userDoc.data();

		// Fetch funeral director profile if user is a funeral director
		let funeralDirectorData = null;
		if (role === 'funeral_director') {
			const directorDoc = await adminDb.collection('funeral_directors').doc(uid).get();
			if (directorDoc.exists) {
				funeralDirectorData = directorDoc.data();
			}
		}

		// Fetch memorials based on role
		let memorials: Memorial[] = [];
		if (role === 'funeral_director') {
			// Query using funeralDirectorUid (compatible with both old and new memorials)
			const memorialsSnap = await adminDb
				.collection('memorials')
				.where('funeralDirectorUid', '==', uid)
				.get();
		
			// Also query using funeralDirector.id for newer format
			const memorialsSnap2 = await adminDb
				.collection('memorials')
				.where('funeralDirector.id', '==', uid)
				.get();
		
			// Combine results and deduplicate by memorial ID
			const memorialMap = new Map();
		
			[...memorialsSnap.docs, ...memorialsSnap2.docs].forEach((doc) => {
				if (!memorialMap.has(doc.id)) {
					const data = doc.data();
					if (!data.fullSlug && data.slug) {
						data.fullSlug = data.slug;
					}
					memorialMap.set(doc.id, { id: doc.id, ...data } as Memorial);
				}
			});
		
			memorials = Array.from(memorialMap.values());
		} else if (role === 'owner') {
			const memorialsSnap = await adminDb
				.collection('memorials')
				.where('ownerUid', '==', uid)
				.get();
			memorials = memorialsSnap.docs.map((doc) => {
				const data = doc.data();
				if (!data.fullSlug && data.slug) {
					data.fullSlug = data.slug;
				}
				return { id: doc.id, ...data } as Memorial;
			});
		}
		// Add other roles as needed

		return {
			profile: {
				email: locals.user.email,
				displayName: profileData?.displayName || locals.user.displayName,
				hasPaidForMemorial: profileData?.hasPaidForMemorial || false,
				memorialCount: profileData?.memorialCount || 0
			},
			user: {
				role: locals.user.role,
				uid: locals.user.uid
			},
			funeralDirector: funeralDirectorData ? sanitizeData(funeralDirectorData) : null,
			memorials: sanitizeData(memorials)
		};
	} catch (error) {
		console.error('Profile load error:', error);
		return fail(500, { error: 'Failed to load profile data.' });
	}
};

export const actions: Actions = {
	testAction: async ({ request, locals }) => {
		console.log('🧪 [PROFILE_SERVER] Test action called successfully!');
		console.log('🧪 [PROFILE_SERVER] User:', locals.user);
		return { success: true, message: 'Test action works!' };
	},
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const data = await request.formData();
		const displayName = data.get('displayName');

		if (!displayName) {
			return fail(400, { message: 'Display name is required' });
		}

		try {
			await adminDb.collection('users').doc(locals.user.uid).set(
				{
					displayName: displayName.toString()
				},
				{ merge: true }
			);
		} catch (error) {
			return fail(500, { message: 'Error updating profile' });
		}

		return {
			message: 'Profile updated successfully'
		};
	},
	createMemorial: async ({ request, locals }) => {
		console.log('🎯 [PROFILE_SERVER] createMemorial action called');
		console.log('🎯 [PROFILE_SERVER] User:', locals.user);
		
		if (!locals.user || locals.user.role !== 'owner') {
			console.error('❌ [PROFILE_SERVER] Unauthorized user or not owner:', locals.user);
			return fail(401, { message: 'Only owners can create memorials' });
		}

		const data = await request.formData();
		const recaptchaToken = data.get('recaptchaToken');

		// Verify reCAPTCHA (bypass in development mode)
		if (dev) {
			console.log('[PROFILE_SERVER] Development mode: bypassing reCAPTCHA verification');
		} else if (recaptchaToken) {
			const recaptchaResult = await verifyRecaptcha(
				recaptchaToken.toString(),
				RECAPTCHA_ACTIONS.CREATE_MEMORIAL,
				getScoreThreshold(RECAPTCHA_ACTIONS.CREATE_MEMORIAL)
			);

			if (!recaptchaResult.success) {
				console.error('[PROFILE_SERVER] reCAPTCHA verification failed:', recaptchaResult.error);
				return fail(400, {
					message: 'Security verification failed. Please try again.'
				});
			}

			console.log(`[PROFILE_SERVER] reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
		} else {
			console.warn('[PROFILE_SERVER] No reCAPTCHA token provided');
			return fail(400, {
				message: 'Security verification required. Please refresh and try again.'
			});
		}

		// Check if user has already created a memorial and hasn't paid
		const userDoc = await adminDb.collection('users').doc(locals.user.uid).get();
		const userData = userDoc.data();

		if (userData?.memorialCount > 0 && !userData?.hasPaidForMemorial) {
			// Get the first memorial to redirect user to payment
			const memorialsSnap = await adminDb
				.collection('memorials')
				.where('ownerUid', '==', locals.user.uid)
				.limit(1)
				.get();
			
			const firstMemorialId = memorialsSnap.docs[0]?.id;
			
			return fail(400, {
				message: 'You must complete payment for your existing memorial before creating a new one.',
				needsPayment: true,
				memorialId: firstMemorialId
			});
		}

		const lovedOneName = data.get('lovedOneName')?.toString().trim();
		
		console.log('🎯 [PROFILE_SERVER] Form data received:', { lovedOneName });

		if (!lovedOneName) {
			console.error(' [PROFILE_SERVER] Missing loved one name');
			return fail(400, { message: "Loved one's name is required" });
		}

		try {
			// Generate unique memorial slug
			const fullSlug = await generateUniqueMemorialSlug(lovedOneName);
			console.log(`[PROFILE] Creating memorial with unique fullSlug: ${fullSlug}`);

			// Create the memorial
			const memorialData = {
				lovedOneName,
				fullSlug,
				ownerUid: locals.user.uid,
				ownerEmail: locals.user.email,
				
				// Memorial metadata
				title: `Celebration of Life for ${lovedOneName}`,
				description: `A celebration of life dedicated to ${lovedOneName}`,

				// Basic memorial structure
				services: {
					main: {
						location: { name: '', address: '', isUnknown: true },
						time: { date: null, time: null, isUnknown: true },
						hours: 2
					},
					additional: []
				},

				// Memorial settings
				isPublic: true, // Make public so it's accessible
				content: `<h1>Celebration of Life for ${lovedOneName}</h1><p>This page is dedicated to celebrating the life and legacy of ${lovedOneName}.</p>`,
				custom_html: null,
				isPaid: false, // Track payment status
				
				// Additional fields for memorial page
				photos: [],
				embeds: [],
				birthDate: null,
				deathDate: null,
				imageUrl: null,

				createdAt: new Date(),
				updatedAt: new Date()
			};

			const memorialRef = await adminDb.collection('memorials').add(memorialData);

			// Update user's memorial count
			await adminDb
				.collection('users')
				.doc(locals.user.uid)
				.set(
					{
						memorialCount: (userData?.memorialCount || 0) + 1,
						updatedAt: new Date().toISOString()
					},
					{ merge: true }
				);

			console.log(`[PROFILE] Memorial created successfully with ID: ${memorialRef.id}`);

			// Redirect to the newly created memorial page
			throw redirect(303, `/${fullSlug}`);
		} catch (error) {
			console.error('Error creating memorial:', error);
			return fail(500, { message: 'Failed to create memorial. Please try again.' });
		}
	}
};
