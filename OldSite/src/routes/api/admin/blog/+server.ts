import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

/**
 * Blog API Endpoint
 * Handles creating and updating blog posts
 */

// Helper to generate URL-friendly slug from title
function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

// Helper to calculate reading time
function calculateReadingTime(content: string): number {
	const wordsPerMinute = 200;
	const words = content.split(/\s+/).length;
	return Math.ceil(words / wordsPerMinute);
}

/**
 * GET - Retrieve blog post by ID
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const id = url.searchParams.get('id');

		if (!id) {
			return json({ error: 'Missing blog post ID' }, { status: 400 });
		}

		const postDoc = await adminDb.collection('blog').doc(id).get();

		if (!postDoc.exists) {
			console.warn('❌ Blog post not found:', id);
			return json({ error: 'Blog post not found' }, { status: 404 });
		}

		const postData = postDoc.data();
		if (!postData) {
			return json({ error: 'Blog post data not found' }, { status: 404 });
		}

		// Convert timestamps to ISO strings
		const post = {
			id: postDoc.id,
			...postData,
			publishedAt: postData.publishedAt?.toDate?.()?.toISOString() || null,
			createdAt: postData.createdAt?.toDate?.()?.toISOString() || null,
			updatedAt: postData.updatedAt?.toDate?.()?.toISOString() || null
		};

		console.log('✅ Blog post retrieved:', id);

		return json({ success: true, post });
	} catch (error) {
		console.error('❌ Error retrieving blog post:', error);
		return json(
			{ error: 'Failed to retrieve blog post', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
};

/**
 * POST - Create new blog post
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Validate required fields
		if (!data.title || !data.content || !data.category) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Generate slug if not provided
		const slug = data.slug || generateSlug(data.title);

		// Check if slug already exists
		const existingSlug = await adminDb.collection('blog').where('slug', '==', slug).get();
		if (!existingSlug.empty) {
			return json({ error: 'Slug already exists' }, { status: 400 });
		}

		// Calculate reading time
		const readingTime = calculateReadingTime(data.content);

		// Create blog post document
		const blogPost = {
			title: data.title,
			slug,
			excerpt: data.excerpt || '',
			content: data.content,
			authorName: data.authorName || locals.user.displayName || 'Admin',
			authorEmail: data.authorEmail || locals.user.email,
			authorBio: data.authorBio || '',
			authorAvatar: data.authorAvatar || '',
			featuredImage: data.featuredImage || '',
			featuredImageAlt: data.featuredImageAlt || '',
			category: data.category,
			tags: data.tags || [],
			status: data.status || 'draft',
			publishedAt: data.status === 'published' ? new Date() : null,
			featured: data.featured || false,
			metaTitle: data.metaTitle || data.title,
			metaDescription: data.metaDescription || data.excerpt,
			keywords: data.keywords || [],
			viewCount: 0,
			readingTime,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const docRef = await adminDb.collection('blog').add(blogPost);

		console.log('✅ Blog post created:', docRef.id);

		return json({
			success: true,
			id: docRef.id,
			post: blogPost
		});
	} catch (error) {
		console.error('❌ Error creating blog post:', error);
		return json(
			{ error: 'Failed to create blog post', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
};

/**
 * PUT - Update existing blog post
 */
export const PUT: RequestHandler = async ({ request, locals }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		if (!data.id) {
			return json({ error: 'Missing blog post ID' }, { status: 400 });
		}

		// Get existing post
		const postDoc = await adminDb.collection('blog').doc(data.id).get();
		if (!postDoc.exists) {
			return json({ error: 'Blog post not found' }, { status: 404 });
		}

		// If slug is being changed, check for conflicts
		if (data.slug && data.slug !== postDoc.data()?.slug) {
			const existingSlug = await adminDb
				.collection('blog')
				.where('slug', '==', data.slug)
				.get();
			if (!existingSlug.empty && existingSlug.docs[0].id !== data.id) {
				return json({ error: 'Slug already exists' }, { status: 400 });
			}
		}

		// Calculate reading time if content changed
		const readingTime = data.content
			? calculateReadingTime(data.content)
			: postDoc.data()?.readingTime || 0;

		// Prepare update data (only include fields that are provided)
		const updateData: any = {
			updatedAt: new Date()
		};

		// Add fields that are provided
		if (data.title) updateData.title = data.title;
		if (data.slug) updateData.slug = data.slug;
		if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
		if (data.content) updateData.content = data.content;
		if (data.authorName) updateData.authorName = data.authorName;
		if (data.authorEmail) updateData.authorEmail = data.authorEmail;
		if (data.authorBio !== undefined) updateData.authorBio = data.authorBio;
		if (data.authorAvatar !== undefined) updateData.authorAvatar = data.authorAvatar;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.featuredImageAlt !== undefined) updateData.featuredImageAlt = data.featuredImageAlt;
		if (data.category) updateData.category = data.category;
		if (data.tags !== undefined) updateData.tags = data.tags;
		if (data.status) {
			updateData.status = data.status;
			// Set publishedAt when publishing for the first time
			if (data.status === 'published' && !postDoc.data()?.publishedAt) {
				updateData.publishedAt = new Date();
			}
		}
		if (data.featured !== undefined) updateData.featured = data.featured;
		if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
		if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
		if (data.keywords !== undefined) updateData.keywords = data.keywords;
		updateData.readingTime = readingTime;

		await adminDb.collection('blog').doc(data.id).update(updateData);

		console.log('✅ Blog post updated:', data.id);

		return json({
			success: true,
			id: data.id,
			updated: updateData
		});
	} catch (error) {
		console.error('❌ Error updating blog post:', error);
		return json(
			{ error: 'Failed to update blog post', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
};

/**
 * DELETE - Delete blog post
 */
export const DELETE: RequestHandler = async ({ request, locals }) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { id } = await request.json();

		if (!id) {
			return json({ error: 'Missing blog post ID' }, { status: 400 });
		}

		await adminDb.collection('blog').doc(id).delete();

		console.log('✅ Blog post deleted:', id);

		return json({ success: true, id });
	} catch (error) {
		console.error('❌ Error deleting blog post:', error);
		return json(
			{ error: 'Failed to delete blog post', details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
};
