import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const query = url.searchParams.get('q')?.toLowerCase().trim() || '';
		
		// CRITICAL: Only return public memorials for privacy/security
		const memorialsRef = adminDb.collection('memorials')
			.where('isPublic', '==', true);
		
		const snapshot = await memorialsRef.get();
		
		let memorials = snapshot.docs.map(doc => {
			const data = doc.data();
			return {
				id: doc.id,
				lovedOneName: data.lovedOneName,
				fullSlug: data.fullSlug,
				creatorName: data.creatorName,
				birthDate: data.birthDate,
				deathDate: data.deathDate,
				createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
			};
		});

		// Optional server-side filtering if query provided
		if (query.length >= 2) {
			memorials = memorials.filter(memorial => {
				const searchableText = [
					memorial.lovedOneName,
					memorial.creatorName,
					memorial.birthDate,
					memorial.deathDate
				].filter(Boolean).join(' ').toLowerCase();
				
				return searchableText.includes(query);
			});
		}

		return json({
			memorials,
			count: memorials.length
		});
	} catch (error) {
		console.error('Error loading memorials for search:', error);
		return json(
			{ 
				error: 'Failed to load memorials',
				memorials: [],
				count: 0
			},
			{ status: 500 }
		);
	}
};
