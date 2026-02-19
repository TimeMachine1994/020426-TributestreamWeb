import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Return default author info
	return {
		author: {
			name: locals.user.displayName || '',
			email: locals.user.email || ''
		}
	};
};

export const actions: Actions = {
	create: async ({ request, fetch }) => {
		try {
			const formData = await request.formData();
			
			// Build blog post data
			const blogData = {
				title: formData.get('title') as string,
				slug: formData.get('slug') as string || undefined,
				excerpt: formData.get('excerpt') as string,
				content: formData.get('content') as string,
				authorName: formData.get('authorName') as string,
				authorEmail: formData.get('authorEmail') as string,
				authorBio: formData.get('authorBio') as string || undefined,
				authorAvatar: formData.get('authorAvatar') as string || undefined,
				featuredImage: formData.get('featuredImage') as string || undefined,
				featuredImageAlt: formData.get('featuredImageAlt') as string || undefined,
				category: formData.get('category') as string,
				tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()) : [],
				status: formData.get('status') as string,
				featured: formData.get('featured') === 'true',
				metaTitle: formData.get('metaTitle') as string || undefined,
				metaDescription: formData.get('metaDescription') as string || undefined,
				keywords: formData.get('keywords') ? (formData.get('keywords') as string).split(',').map(k => k.trim()) : []
			};

			// Call API
			const response = await fetch('/api/admin/blog', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(blogData)
			});

			const result = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: result.error || 'Failed to create blog post'
				};
			}

			// Redirect to blog list on success
			throw redirect(303, '/admin/content/blog');
		} catch (error) {
			// If it's a redirect, rethrow it
			if (error instanceof Response) {
				throw error;
			}

			console.error('Error creating blog post:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
};
