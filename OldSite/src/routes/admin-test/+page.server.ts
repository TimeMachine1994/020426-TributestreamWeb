import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (locals.user.role !== 'admin') {
		throw redirect(302, '/profile');
	}

	try {
		await adminDb.collection('test').limit(1).get();
		const memorialsSnap = await adminDb.collection('memorials').get();
		const usersSnap = await adminDb.collection('users').get();
		const singleMemorialSnap = await adminDb.collection('memorials').limit(1).get();

		return {
			user: locals.user,
			testResults: {
				firestoreConnection: true,
				memorialCount: memorialsSnap.size,
				userCount: usersSnap.size,
				sampleMemorialLoaded: !singleMemorialSnap.empty
			}
		};
	} catch (error: any) {
		console.error('❌ [ADMIN TEST] Error during testing:', error);

		return {
			user: locals.user,
			testResults: {
				firestoreConnection: false,
				error: error.message,
				errorType: error.constructor.name
			}
		};
	}
};
