import { redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, url }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	// Get query params
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const sortBy = url.searchParams.get('sortBy') || 'createdAt';
	const sortDir = url.searchParams.get('sortDir') || 'desc';

	// Load blog posts
	let query = adminDb.collection('blog').orderBy(sortBy, sortDir as any).limit(limit);

	const snapshot = await query.get();
	console.log('📝 [BLOG LIST] Found', snapshot.docs.length, 'blog posts');

	const posts = snapshot.docs.map((doc) => {
		console.log('📝 [BLOG LIST] Post ID:', doc.id, 'Title:', doc.data().title);
		const data = doc.data();

		return {
			id: doc.id,
			title: data.title || 'Untitled',
			slug: data.slug || '',
			author: data.author || 'Unknown',
			category: data.category || 'uncategorized',
			status: data.status || 'draft',
			featured: data.featured || false,
			excerpt: data.excerpt || '',
			featuredImage: data.featuredImage || null,
			publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
			createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
			updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
		};
	});

	console.log('✅ [BLOG LIST] Loaded blog posts with IDs:', posts.map(p => p.id).join(', '));

	// Calculate stats
	const stats = {
		published: posts.filter((p) => p.status === 'published').length,
		draft: posts.filter((p) => p.status === 'draft').length,
		scheduled: posts.filter((p) => p.status === 'scheduled').length,
		featured: posts.filter((p) => p.featured).length
	};

	return {
		posts,
		stats
	};
};
