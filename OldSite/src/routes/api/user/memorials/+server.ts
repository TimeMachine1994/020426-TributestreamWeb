import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	console.log('👤 [USER MEMORIALS API] GET - Fetching user memorials');
	
	// Check authentication
	if (!locals.user) {
		console.log('🔒 [USER MEMORIALS API] Unauthorized request');
		throw error(401, 'Unauthorized');
	}
	
	try {
		const userId = locals.user.uid;
		const userRole = locals.user.role;
		
		console.log('👤 [USER MEMORIALS API] User:', userId, 'Role:', userRole);
		
		let memorialsQuery;
		
		if (userRole === 'admin') {
			// Admins can see all memorials
			memorialsQuery = adminDb.collection('memorials').orderBy('createdAt', 'desc');
		} else if (userRole === 'funeral_director') {
			// Funeral directors can see memorials they created or are assigned to
			memorialsQuery = adminDb.collection('memorials')
				.where('funeralDirectorUid', '==', userId)
				.orderBy('createdAt', 'desc');
		} else {
			// Regular users can only see memorials they own
			memorialsQuery = adminDb.collection('memorials')
				.where('ownerUid', '==', userId)
				.orderBy('createdAt', 'desc');
		}
		
		const memorialsSnapshot = await memorialsQuery.get();
		
		const memorials = memorialsSnapshot.docs.map(doc => {
			const data = doc.data();
			return {
				id: doc.id,
				lovedOneName: data.lovedOneName || 'Unnamed Memorial',
				fullSlug: data.fullSlug,
				isPublic: data.isPublic || false,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
				hasSlideshow: data.hasSlideshow || false
			};
		});
		
		console.log('✅ [USER MEMORIALS API] Found', memorials.length, 'memorials for user');
		
		return json(memorials);
		
	} catch (err: any) {
		console.error('🔥 [USER MEMORIALS API] Error fetching memorials:', err);
		throw error(500, 'Failed to fetch user memorials');
	}
};
