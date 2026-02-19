import { adminDb } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('🔍 Dashboard load - locals.user:', locals.user);

	if (!locals.user) {
		console.log('❌ No user in locals, redirecting to login');
		throw redirect(303, '/login');
	}

	if (locals.user.role !== 'funeral_director') {
		console.log('❌ User role is not funeral_director:', locals.user.role);
		throw redirect(303, '/profile');
	}

	// Helper function to convert Timestamps to strings
	const sanitizeTimestamp = (timestamp: any) => {
		if (timestamp && typeof timestamp.toDate === 'function') {
			return timestamp.toDate().toISOString();
		}
		if (timestamp instanceof Date) {
			return timestamp.toISOString();
		}
		return timestamp;
	};

	try {
		console.log('🔍 Fetching funeral director profile for UID:', locals.user.uid);

		// Fetch funeral director profile
		const directorDoc = await adminDb.collection('funeral_directors').doc(locals.user.uid).get();

		// Fetch memorials assigned to this funeral director
		console.log('🔍 Fetching memorials for FD:', locals.user.uid);
		const memorialsSnapshot = await adminDb
			.collection('memorials')
			.where('funeralDirectorUid', '==', locals.user.uid)
			.orderBy('createdAt', 'desc')
			.limit(50)
			.get();

		const memorials = memorialsSnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				lovedOneName: data.lovedOneName || data.title || 'Untitled Memorial',
				fullSlug: data.fullSlug || null,
				serviceDate: sanitizeTimestamp(data.serviceDate),
				serviceTime: data.serviceTime || null,
				createdAt: sanitizeTimestamp(data.createdAt),
				isPublic: data.isPublic || false,
				// Encoder config
				encoderConfig: data.encoderConfig || {
					assignedEncoderId: null,
					assignedEncoderName: null,
					streamStatus: 'offline'
				}
			};
		});

		console.log('✅ Found', memorials.length, 'memorials for FD');

		console.log('🔍 Director doc exists:', directorDoc.exists);

		if (!directorDoc.exists) {
			console.log('❌ Funeral director profile not found');
			// Instead of fail, return empty data to allow creation
			return {
				funeralDirector: {
					id: locals.user.uid,
					companyName: '',
					contactPerson: '',
					email: locals.user.email || '',
					phone: '',
					address: {
						street: '',
						city: '',
						state: '',
						zipCode: ''
					}
				},
				memorials
			};
		}

		const directorData = directorDoc.data();
		console.log('✅ Director data loaded:', Object.keys(directorData || {}));

		return {
			funeralDirector: {
				id: directorDoc.id,
				companyName: directorData?.companyName || '',
				contactPerson: directorData?.contactPerson || '',
				email: directorData?.email || '',
				phone: directorData?.phone || '',
				address: directorData?.address || {
					street: '',
					city: '',
					state: '',
					zipCode: ''
				},
				status: directorData?.status || 'approved',
				isActive: directorData?.isActive || true,
				userId: directorData?.userId || '',
				createdAt: sanitizeTimestamp(directorData?.createdAt),
				updatedAt: sanitizeTimestamp(directorData?.updatedAt),
				approvedAt: sanitizeTimestamp(directorData?.approvedAt),
				approvedBy: directorData?.approvedBy || null
			},
			memorials
		};
	} catch (error: any) {
		console.error('❌ Error loading funeral director dashboard:', error);
		console.error('❌ Error details:', error?.message, error?.stack);
		return {
			funeralDirector: {
				id: locals.user?.uid || '',
				companyName: '',
				contactPerson: '',
				email: locals.user?.email || '',
				phone: '',
				address: {
					street: '',
					city: '',
					state: '',
					zipCode: ''
				}
			},
			memorials: [],
			error: 'Failed to load dashboard data: ' + (error?.message || 'Unknown error')
		};
	}
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'funeral_director') {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();

			const updateData = {
				companyName: formData.get('companyName')?.toString() || '',
				contactPerson: formData.get('contactPerson')?.toString() || '',
				email: formData.get('email')?.toString() || '',
				phone: formData.get('phone')?.toString() || '',
				address: {
					street: formData.get('street')?.toString() || '',
					city: formData.get('city')?.toString() || '',
					state: formData.get('state')?.toString() || '',
					zipCode: formData.get('zipCode')?.toString() || ''
				},
				updatedAt: new Date()
			};

			// Validate required fields
			if (
				!updateData.companyName ||
				!updateData.contactPerson ||
				!updateData.email ||
				!updateData.phone
			) {
				return fail(400, { error: 'All required fields must be filled' });
			}

			// Update funeral director profile
			await adminDb.collection('funeral_directors').doc(locals.user.uid).update(updateData);

			return { success: true, message: 'Profile updated successfully' };
		} catch (error) {
			console.error('Error updating funeral director profile:', error);
			return fail(500, { error: 'Failed to update profile' });
		}
	}
};
