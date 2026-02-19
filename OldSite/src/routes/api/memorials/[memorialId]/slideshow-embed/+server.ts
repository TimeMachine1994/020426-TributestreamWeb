import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const { memorialId } = params;

	// Check admin authentication
	if (!locals.user || locals.user.role !== 'admin') {
		throw svelteError(403, 'Admin access required');
	}

	try {
		const { embedCode, title, location } = await request.json();

		// Validation - only embedCode is required
		if (!embedCode || !embedCode.trim()) {
			throw svelteError(400, 'Missing required field: embedCode');
		}

		if (!location || !['header', 'body'].includes(location)) {
			throw svelteError(400, 'Invalid location. Must be "header" or "body"');
		}

		// Auto-wrap plain URLs in iframes
		let processedEmbedCode = embedCode.trim();
		if (processedEmbedCode.startsWith('http') && !processedEmbedCode.includes('<iframe')) {
			processedEmbedCode = `<iframe src="${processedEmbedCode}" frameborder="0" allowfullscreen></iframe>`;
		}

		// Create slideshow embed object - title is optional
		const slideshowEmbed = {
			embedCode: processedEmbedCode,
			title: (title && title.trim()) || 'Slideshow Embed',
			location: location,
			createdAt: new Date().toISOString(),
			createdBy: locals.user.uid,
			createdByEmail: locals.user.email || 'Unknown'
		};

		// Update memorial document with slideshow embed
		await adminDb.collection('memorials').doc(memorialId).update({
			slideshowEmbed: slideshowEmbed,
			updatedAt: new Date().toISOString()
		});

		return json({ 
			success: true, 
			message: 'Slideshow embed created successfully',
			slideshowEmbed 
		});

	} catch (err: any) {
		console.error('Error creating slideshow embed:', err);
		if (err.status) throw err;
		throw svelteError(500, err.message || 'Failed to create slideshow embed');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const { memorialId } = params;

	// Check admin authentication
	if (!locals.user || locals.user.role !== 'admin') {
		throw svelteError(403, 'Admin access required');
	}

	try {
		// Remove slideshow embed from memorial document
		await adminDb.collection('memorials').doc(memorialId).update({
			slideshowEmbed: null,
			updatedAt: new Date().toISOString()
		});

		return json({ 
			success: true, 
			message: 'Slideshow embed removed successfully' 
		});

	} catch (err: any) {
		console.error('Error removing slideshow embed:', err);
		throw svelteError(500, err.message || 'Failed to remove slideshow embed');
	}
};
