import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

/**
 * Generate a signed upload URL for direct Cloudflare Stream upload
 * This bypasses the 4.5MB Vercel limit by letting clients upload directly to Cloudflare
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('🔗 [GET UPLOAD URL API] Request received');
	
	// Authentication check
	if (!locals.user) {
		console.log('🔒 [GET UPLOAD URL API] Unauthorized request');
		return error(401, 'Unauthorized');
	}

	// Configuration check
	if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
		console.error('❌ [GET UPLOAD URL API] Cloudflare credentials not configured');
		return error(500, 'Cloudflare Stream not configured');
	}

	try {
		const { title, memorialId } = await request.json();
		
		console.log('🔗 [GET UPLOAD URL API] Generating signed URL:', {
			title,
			memorialId,
			userId: locals.user.uid
		});

		// Request a signed upload URL from Cloudflare Stream
		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
			{
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					maxDurationSeconds: 3600, // Max 1 hour video
					meta: {
						name: title || 'Memorial Slideshow',
						type: 'memorial-slideshow',
						memorialId: memorialId || '',
						uploadedBy: locals.user.uid,
						created: new Date().toISOString()
					}
				})
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ [GET UPLOAD URL API] Cloudflare API error:', response.status, errorText);
			return error(500, `Cloudflare API error: ${response.status}`);
		}

		const result = await response.json() as {
			success: boolean;
			result?: {
				uploadURL: string;
				uid: string;
			};
			errors?: Array<{ message: string }>;
		};

		if (!result.success || !result.result) {
			console.error('❌ [GET UPLOAD URL API] Failed to generate upload URL:', result.errors);
			return error(500, `Cloudflare API error: ${result.errors?.[0]?.message || 'Unknown error'}`);
		}

		console.log('✅ [GET UPLOAD URL API] Signed URL generated:', result.result.uid);

		return json({
			uploadURL: result.result.uploadURL,
			uid: result.result.uid
		});

	} catch (err) {
		console.error('❌ [GET UPLOAD URL API] Error:', err);
		
		const message = err instanceof Error ? err.message : 'Unknown error';
		return error(500, `Failed to generate upload URL: ${message}`);
	}
};
