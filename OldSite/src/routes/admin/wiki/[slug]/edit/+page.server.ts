import { error, fail, redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { WikiPage } from '$lib/types/wiki';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Check authentication - same pattern as /admin page
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (locals.user.role !== 'admin') {
		throw redirect(302, '/profile');
	}

	const { slug } = params;

	try {
		// Fetch the wiki page by slug
		const pagesSnapshot = await adminDb
			.collection('wiki_pages')
			.where('slug', '==', slug)
			.limit(1)
			.get();

		if (pagesSnapshot.empty) {
			throw error(404, 'Page not found');
		}

		const doc = pagesSnapshot.docs[0];
		const data = doc.data();

		const page: WikiPage = {
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

		// Load all pages to build wiki links map
		const allPagesSnapshot = await adminDb.collection('wiki_pages').get();
		const pageMap = new Map<string, string>();
		allPagesSnapshot.docs.forEach((d) => {
			const pageData = d.data();
			pageMap.set(pageData.title.toLowerCase(), pageData.slug);
		});

		return {
			page,
			pageMap: Object.fromEntries(pageMap)
		};
	} catch (err) {
		if (err instanceof Response) throw err;
		console.error('Error loading wiki page:', err);
		throw error(500, 'Failed to load page');
	}
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Unauthorized' });
		}

		const { slug } = params;

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

			// Find the page
			const pagesSnapshot = await adminDb
				.collection('wiki_pages')
				.where('slug', '==', slug)
				.limit(1)
				.get();

			if (pagesSnapshot.empty) {
				return fail(404, { error: 'Page not found' });
			}

			const doc = pagesSnapshot.docs[0];
			const currentData = doc.data();

			// Generate new slug if title changed
			const newSlug =
				title.toLowerCase() !== currentData.title.toLowerCase()
					? title
							.toLowerCase()
							.replace(/[^\w\s-]/g, '')
							.replace(/\s+/g, '-')
							.replace(/-+/g, '-')
							.trim()
					: slug;

			// If slug changed, check if new slug exists
			if (newSlug !== slug) {
				const existingPage = await adminDb
					.collection('wiki_pages')
					.where('slug', '==', newSlug)
					.limit(1)
					.get();

				if (!existingPage.empty) {
					return fail(400, { error: 'A page with this title already exists' });
				}
			}

			// Parse tags
			const tags = tagsRaw
				? tagsRaw
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean)
				: [];

			// Update page
			const now = new Date();
			const updateData = {
				slug: newSlug,
				title,
				content,
				category: category || null,
				tags,
				updatedBy: locals.user.uid,
				updatedByEmail: locals.user.email || '',
				updatedAt: now,
				version: (currentData.version || 1) + 1
			};

			await adminDb.collection('wiki_pages').doc(doc.id).update(updateData);

			console.log('Updated wiki page:', doc.id);

			// Redirect to the (possibly new) page slug
			throw redirect(303, `/admin/wiki/${newSlug}`);
		} catch (err) {
			if (err instanceof Response) throw err;
			console.error('Error updating wiki page:', err);
			return fail(500, { error: 'Failed to update page' });
		}
	},

	delete: async ({ params, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Unauthorized' });
		}

		const { slug } = params;

		try {

			// Find the page
			const pagesSnapshot = await adminDb
				.collection('wiki_pages')
				.where('slug', '==', slug)
				.limit(1)
				.get();

			if (pagesSnapshot.empty) {
				return fail(404, { error: 'Page not found' });
			}

			const doc = pagesSnapshot.docs[0];

			// Delete the page
			await adminDb.collection('wiki_pages').doc(doc.id).delete();

			console.log('Deleted wiki page:', doc.id);

			// Redirect to wiki homepage
			throw redirect(303, '/admin/wiki');
		} catch (err) {
			if (err instanceof Response) throw err;
			console.error('Error deleting wiki page:', err);
			return fail(500, { error: 'Failed to delete page' });
		}
	}
};
