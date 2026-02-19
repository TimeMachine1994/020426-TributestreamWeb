import { fail, redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Check authentication - same pattern as /admin page
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (locals.user.role !== 'admin') {
		throw redirect(302, '/profile');
	}

	try {

		// Load all pages to build wiki links map
		const pagesSnapshot = await adminDb.collection('wiki_pages').get();

		const pageMap = new Map<string, string>();
		pagesSnapshot.docs.forEach((doc) => {
			const data = doc.data();
			pageMap.set(data.title.toLowerCase(), data.slug);
		});

		return {
			pageMap: Object.fromEntries(pageMap)
		};
	} catch (error) {
		console.error('Error loading pages:', error);
		return {
			pageMap: {}
		};
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Unauthorized' });
		}

		try {

			const formData = await request.formData();
			const title = formData.get('title') as string;
			const content = formData.get('content') as string;
			const category = formData.get('category') as string;
			const tagsRaw = formData.get('tags') as string;

			// Validation
			if (!title || !content) {
				return fail(400, { error: 'Title and content are required' });
			}

			// Generate slug from title
			const slug = title
				.toLowerCase()
				.replace(/[^\w\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.trim();

			// Check if slug already exists
			const existingPage = await adminDb
				.collection('wiki_pages')
				.where('slug', '==', slug)
				.limit(1)
				.get();

			if (!existingPage.empty) {
				return fail(400, { error: 'A page with this title already exists' });
			}

			// Parse tags
			const tags = tagsRaw
				? tagsRaw
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean)
				: [];

			// Create wiki page
			const now = new Date();
			const pageData = {
				slug,
				title,
				content,
				category: category || null,
				tags,
				createdBy: locals.user.uid,
				createdByEmail: locals.user.email || '',
				createdAt: now,
				updatedBy: locals.user.uid,
				updatedByEmail: locals.user.email || '',
				updatedAt: now,
				version: 1,
				viewCount: 0,
				parentPageId: null,
				order: 0
			};

			const docRef = await adminDb.collection('wiki_pages').add(pageData);

			console.log('Created wiki page:', docRef.id);

			// Redirect to edit the new page
			throw redirect(303, `/admin/wiki/${slug}/edit`);
		} catch (error) {
			if (error instanceof Response) throw error;
			console.error('Error creating wiki page:', error);
			return fail(500, { error: 'Failed to create page' });
		}
	}
};
