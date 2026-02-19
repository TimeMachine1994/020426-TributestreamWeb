import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getMuxLiveStream } from '$lib/server/mux';

/**
 * Check if a stream is actively broadcasting from OBS
 * Returns the watch URL if live
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const { streamId } = params;

	// Check authentication
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Get stream document
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			throw error(404, 'Stream not found');
		}

		const streamData = streamDoc.data();
		if (!streamData) {
			throw error(404, 'Stream data not found');
		}

		// Get the Mux live stream ID
		const muxLiveStreamId = streamData.mux?.liveStreamId;
		const muxPlaybackId = streamData.mux?.playbackId;

		if (!muxLiveStreamId) {
			return json({
				isLive: false,
				message: 'No Mux Live Stream ID found for this stream'
			});
		}

		console.log('🔍 [CHECK-LIVE] Checking stream:', streamId, 'Mux ID:', muxLiveStreamId);

		// Get status from Mux
		const muxStream = await getMuxLiveStream(muxLiveStreamId);
		const isLive = muxStream.status === 'active';

		if (isLive && muxPlaybackId) {
			console.log('✅ [CHECK-LIVE] Stream is LIVE! Playback ID:', muxPlaybackId);
			
			return json({
				isLive: true,
				watchUrl: `https://stream.mux.com/${muxPlaybackId}.m3u8`,
				playbackId: muxPlaybackId,
				hlsUrl: `https://stream.mux.com/${muxPlaybackId}.m3u8`
			});
		}

		console.log('📴 [CHECK-LIVE] Stream is NOT live');

		return json({
			isLive: false,
			message: 'No active broadcast detected'
		});
	} catch (err: any) {
		console.error('❌ [CHECK-LIVE] Error:', err);
		
		// If it's a Mux API error, return more details
		if (err.message?.includes('Mux') || err.message?.includes('mux')) {
			return json({
				isLive: false,
				error: err.message
			});
		}

		throw error(500, `Failed to check stream status: ${err.message}`);
	}
};
