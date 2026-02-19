import { error as svelteError } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

/**
 * Load stream data for mobile input streaming
 * This page is accessed by the person who will stream from their phone/browser
 */
export const load: PageServerLoad = async ({ params }) => {
	const { streamId } = params;

	try {
		const streamRef = adminDb.collection('streams').doc(streamId);
		const streamDoc = await streamRef.get();

		if (!streamDoc.exists) {
			throw svelteError(404, 'Stream not found');
		}

		const streamData = streamDoc.data()!;

		// Verify WHIP URL exists for mobile streaming
		if (!streamData.streamCredentials?.whipUrl) {
			throw svelteError(400, 'Mobile streaming not available for this stream.');
		}

		// Get memorial info for context
		const memorialRef = adminDb.collection('memorials').doc(streamData.memorialId);
		const memorialDoc = await memorialRef.get();
		const memorialData = memorialDoc.exists ? memorialDoc.data() : null;

		return {
			stream: {
				id: streamDoc.id,
				title: streamData.title,
				description: streamData.description,
				whipUrl: streamData.streamCredentials.whipUrl,
				cloudflareInputId: streamData.streamCredentials.cloudflareInputId,
				status: streamData.status,
				hlsUrl: streamData.hlsUrl, // HLS URL set by webhook when live
				liveWatchUrl: streamData.liveWatchUrl // Preview URL from webhook
			},
			memorial: memorialData ? {
				lovedOneName: memorialData.lovedOneName,
				fullSlug: memorialData.fullSlug
			} : null
		};
	} catch (err: any) {
		console.error('❌ [MOBILE STREAM] Error loading stream:', err);
		if (err.status) throw err;
		throw svelteError(500, 'Failed to load stream data');
	}
};
