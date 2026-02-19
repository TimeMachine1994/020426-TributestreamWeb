import { error, redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	console.log('📝 [BLOG EDIT] Loading blog post with ID:', id);
	console.log('📝 [BLOG EDIT] User:', locals.user?.email, 'Role:', locals.user?.role);

	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		console.warn('❌ [BLOG EDIT] Unauthorized access attempt');
		throw redirect(302, '/login');
	}

	try {
		// Load blog post
		const postDoc = await adminDb.collection('blog').doc(id).get();
		console.log('📝 [BLOG EDIT] Post doc exists:', postDoc.exists);

		if (!postDoc.exists) {
			console.error('❌ [BLOG EDIT] Blog post not found in Firestore:', id);
			console.error('❌ [BLOG EDIT] Attempted path: blog/' + id);
			throw error(404, `Blog post not found: ${id}`);
		}

		const postData = postDoc.data();
		if (!postData) {
			throw error(404, 'Blog post data not found');
		}

		// Convert timestamps to ISO strings
		const post = {
			id: postDoc.id,
			title: postData.title || '',
			slug: postData.slug || '',
			excerpt: postData.excerpt || '',
			content: postData.content || '',
			authorName: postData.authorName || '',
			authorEmail: postData.authorEmail || '',
			authorBio: postData.authorBio || '',
			authorAvatar: postData.authorAvatar || '',
			featuredImage: postData.featuredImage || '',
			featuredImageAlt: postData.featuredImageAlt || '',
			category: postData.category || 'memorial-planning',
			tags: postData.tags || [],
			status: postData.status || 'draft',
			featured: postData.featured || false,
			metaTitle: postData.metaTitle || '',
			metaDescription: postData.metaDescription || '',
			keywords: postData.keywords || [],
			viewCount: postData.viewCount || 0,
			readingTime: postData.readingTime || 0,
			publishedAt: postData.publishedAt?.toDate?.()?.toISOString() || null,
			createdAt: postData.createdAt?.toDate?.()?.toISOString() || null,
			updatedAt: postData.updatedAt?.toDate?.()?.toISOString() || null
		};

		console.log('✅ [BLOG EDIT] Successfully loaded blog post:', post.title);
		return { post };
	} catch (err) {
		console.error('❌ [BLOG EDIT] Error loading blog post:', err);
		
		// If it's already an error response, rethrow it
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		console.error('❌ [BLOG EDIT] Detailed error:', JSON.stringify(err, null, 2));
		throw error(500, `Failed to load blog post: ${err instanceof Error ? err.message : String(err)}`);
	}
};

export const actions: Actions = {
	update: async ({ request, params, fetch }) => {
		const { id } = params;

		try {
			const formData = await request.formData();

			// Build update data
			const updateData = {
				id,
				title: formData.get('title') as string,
				slug: formData.get('slug') as string,
				excerpt: formData.get('excerpt') as string,
				content: formData.get('content') as string,
				authorName: formData.get('authorName') as string,
				authorEmail: formData.get('authorEmail') as string,
				authorBio: formData.get('authorBio') as string || '',
				authorAvatar: formData.get('authorAvatar') as string || '',
				featuredImage: formData.get('featuredImage') as string || '',
				featuredImageAlt: formData.get('featuredImageAlt') as string || '',
				category: formData.get('category') as string,
				tags: formData.get('tags')
					? (formData.get('tags') as string).split(',').map((t) => t.trim())
					: [],
				status: formData.get('status') as string,
				featured: formData.get('featured') === 'true',
				metaTitle: formData.get('metaTitle') as string || '',
				metaDescription: formData.get('metaDescription') as string || '',
				keywords: formData.get('keywords')
					? (formData.get('keywords') as string).split(',').map((k) => k.trim())
					: []
			};

			// Call API
			const response = await fetch('/api/admin/blog', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updateData)
			});

			const result = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: result.error || 'Failed to update blog post'
				};
			}

			return {
				success: true,
				message: 'Blog post updated successfully'
			};
		} catch (err) {
			console.error('Error updating blog post:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Unknown error'
			};
		}
	},

	delete: async ({ params, fetch }) => {
		const { id } = params;

		try {
			const response = await fetch('/api/admin/blog', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id })
			});

			const result = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: result.error || 'Failed to delete blog post'
				};
			}

			// Redirect to blog list on success
			throw redirect(303, '/admin/content/blog');
		} catch (err) {
			// If it's a redirect, rethrow it
			if (err instanceof Response) {
				throw err;
			}

			console.error('Error deleting blog post:', err);
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Unknown error'
			};
		}
	}
};
