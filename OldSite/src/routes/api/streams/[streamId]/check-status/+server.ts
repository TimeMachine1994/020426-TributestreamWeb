import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMuxLiveStream } from '$lib/server/mux';

/**
 * Manual endpoint to check and update stream status
 * FOR DEBUGGING/TESTING ONLY - Not used in production
 * Production relies on Cloudflare webhooks for instant status updates
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	console.log('🔍 [CHECK STATUS] Checking stream status:', params.streamId);

	const streamId = params.streamId;

	try {
		// Get stream document
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			throw SvelteKitError(404, 'Stream not found');
		}

		const streamData = streamDoc.data()!;
		const muxLiveStreamId = streamData.mux?.liveStreamId;

		if (!muxLiveStreamId) {
			console.log('⚠️ [CHECK STATUS] No Mux Live Stream ID found');
			return json({
				success: true,
				streamId,
				status: streamData.status,
				message: 'Stream not created with Mux or missing Live Stream ID'
			});
		}

		// Check Mux status
		const muxStream = await getMuxLiveStream(muxLiveStreamId);
		const muxStatus = { status: muxStream.status };
		console.log('📊 [CHECK STATUS] Mux status:', muxStatus);

		// Determine new status based on Mux status
		let newStatus = streamData.status;
		let updates: any = {
			updatedAt: new Date().toISOString()
		};

		const isLive = muxStatus.status === 'active';

		if (isLive && streamData.status !== 'live') {
			// Stream just went live
			newStatus = 'live';
			updates.status = 'live';
			updates.liveStartedAt = new Date().toISOString();
			updates['mux.streamingStatus'] = 'active';
			console.log('🔴 [CHECK STATUS] Stream is now LIVE');
		} else if (!isLive && streamData.status === 'live') {
			// Stream ended
			newStatus = 'completed';
			updates.status = 'completed';
			updates.liveEndedAt = new Date().toISOString();
			updates['mux.streamingStatus'] = 'idle';
			console.log('⚪ [CHECK STATUS] Stream ENDED');

			// Recording info will be updated via Mux webhooks
		}

		// Update if status changed
		if (Object.keys(updates).length > 1) {
			await streamDoc.ref.update(updates);
			console.log('💾 [CHECK STATUS] Stream updated:', newStatus);
		}

		return json({
			success: true,
			streamId,
			status: newStatus,
			isLive,
			muxStatus: muxStatus.status,
			updated: Object.keys(updates).length > 1
		});
	} catch (err: any) {
		console.error('❌ [CHECK STATUS] Error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw SvelteKitError(500, `Failed to check stream status: ${err?.message || 'Unknown error'}`);
	}
};
