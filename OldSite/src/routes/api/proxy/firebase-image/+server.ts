import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, request }) => {
	try {
		const imageUrl = url.searchParams.get('url');
		
		if (!imageUrl) {
			throw error(400, 'Missing image URL parameter');
		}

		// Validate that it's a Firebase Storage URL
		if (!imageUrl.includes('storage.googleapis.com') && !imageUrl.includes('firebasestorage.app')) {
			throw error(400, 'Invalid image URL - must be Firebase Storage');
		}

		console.log('🖼️ Proxying Firebase image:', imageUrl);

		// Fetch the image from Firebase Storage
		const response = await fetch(imageUrl);

		if (!response.ok) {
			console.error('❌ Failed to fetch image:', response.status, response.statusText);
			throw error(response.status, `Failed to fetch image: ${response.statusText}`);
		}

		// Get the image blob
		const imageBlob = await response.blob();
		
		// Return the image with proper headers
		return new Response(imageBlob, {
			status: 200,
			headers: {
				'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
				'Content-Length': response.headers.get('Content-Length') || imageBlob.size.toString(),
				'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET',
				'Access-Control-Allow-Headers': 'Content-Type'
			}
		});

	} catch (err) {
		console.error('❌ Proxy error:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Internal server error while proxying image');
	}
};
