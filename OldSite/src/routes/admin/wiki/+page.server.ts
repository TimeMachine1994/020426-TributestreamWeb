import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { WikiPage } from '$lib/types/wiki';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('📖 [WIKI] Loading wiki pages...');
	console.log('📖 [WIKI] User:', locals.user);
	
	// Check authentication - same pattern as /admin page
	if (!locals.user) {
		console.log('❌ [WIKI] No authenticated user - redirecting to login');
		throw redirect(302, '/login');
	}

	if (locals.user.role !== 'admin') {
		console.log('❌ [WIKI] User lacks admin privileges:', {
			uid: locals.user.uid,
			role: locals.user.role
		});
		throw redirect(302, '/profile');
	}

	console.log('✅ [WIKI] Admin access verified for:', locals.user.email);

	try {

		// Fetch wiki pages
		console.log('📖 [WIKI] Fetching pages from Firestore...');
		
		// Fetch all wiki pages (no orderBy to avoid index requirement on first run)
		const pagesSnapshot = await adminDb
			.collection('wiki_pages')
			.get();

		console.log('📖 [WIKI] Found', pagesSnapshot.docs.length, 'pages');

		const pages: WikiPage[] = pagesSnapshot.docs
			.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					slug: data.slug,
					title: data.title,
					content: data.content,
					category: data.category || null,
					tags: data.tags || [],
					createdBy: data.createdBy,
					createdByEmail: data.createdByEmail,
					createdAt: data.createdAt?.toDate?.() || data.createdAt,
					updatedBy: data.updatedBy,
					updatedByEmail: data.updatedByEmail,
					updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
					version: data.version || 1,
					viewCount: data.viewCount || 0,
					parentPageId: data.parentPageId || null,
					order: data.order || 0
				};
			})
			.sort((a, b) => {
				// Sort by updatedAt in memory (most recent first)
				const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
				const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
				return dateB.getTime() - dateA.getTime();
			});

		console.log('✅ [WIKI] Successfully loaded and sorted', pages.length, 'pages');
		
		return {
			pages
		};
	} catch (error) {
		console.error('❌ [WIKI] Error loading wiki pages:', error);
		console.error('❌ [WIKI] Error details:', error instanceof Error ? error.message : 'Unknown error');
		
		// Return empty array on error instead of redirecting
		return {
			pages: []
		};
	}
};
