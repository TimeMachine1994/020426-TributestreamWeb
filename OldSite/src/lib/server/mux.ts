/**
 * Mux Service Utilities
 * 
 * Provides wrapper functions for Mux API operations including:
 * - Live stream creation and management
 * - Video analytics retrieval
 * 
 * Note: Mux does not have a native chat API. Chat is implemented via Firestore.
 * 
 * All functions include comprehensive logging for debugging and monitoring.
 */

import Mux from '@mux/mux-node';
import { env } from '$env/dynamic/private';

// Lazy-initialized Mux client
let muxClient: Mux | null = null;

function getMux(): Mux {
	if (!muxClient) {
		muxClient = new Mux({
			tokenId: env.MUX_TOKEN_ID,
			tokenSecret: env.MUX_TOKEN_SECRET
		});
		console.log('🎬 [MUX SERVICE] Mux client initialized');
	}
	return muxClient;
}

// Proxy for backwards compatibility - exposes all Mux client properties
const mux = {
	get video() { return getMux().video; },
	get data() { return getMux().data; }
};

/**
 * Create a new Mux Live Stream
 * 
 * @param title - Stream title for metadata
 * @param options - Optional configuration
 * @returns Mux live stream object with RTMP credentials
 */
export async function createMuxLiveStream(
	title: string,
	options: {
		reconnectWindow?: number;
		reducedLatency?: boolean;
	} = {}
) {
	console.log('🎬 [MUX SERVICE] Creating new live stream:', title);
	console.log('🎬 [MUX SERVICE] Options:', JSON.stringify(options, null, 2));

	try {
		// Create live stream with automatic recording enabled
		const liveStream = await mux.video.liveStreams.create({
			// Public playback policy - no authentication required
			playback_policy: ['public'],
			
			// Automatic asset creation settings for recording
			new_asset_settings: {
				playback_policy: ['public'],
				mp4_support: 'standard' // Enable MP4 downloads
			},
			
			// Reconnection window (seconds before stream times out)
			reconnect_window: options.reconnectWindow || 60,
			
			// Low latency mode for real-time streaming
			reduced_latency: options.reducedLatency !== false
		});

		console.log('✅ [MUX SERVICE] Live stream created successfully');
		console.log('🎬 [MUX SERVICE] Stream ID:', liveStream.id);
		console.log('🎬 [MUX SERVICE] Playback ID:', liveStream.playback_ids?.[0]?.id);
		console.log('🎬 [MUX SERVICE] Stream Key:', liveStream.stream_key?.substring(0, 20) + '...');

		// Extract RTMP URL and stream key from the full stream key
		const fullStreamKey = liveStream.stream_key || '';
		const rtmpUrl = 'rtmps://global-live.mux.com:443/app';
		const streamKey = fullStreamKey;

		console.log('🎬 [MUX SERVICE] RTMP URL:', rtmpUrl);

		return {
			id: liveStream.id,
			playbackId: liveStream.playback_ids?.[0]?.id || '',
			rtmpUrl,
			streamKey,
			reconnectWindow: liveStream.reconnect_window,
			status: liveStream.status
		};
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to create live stream:', error);
		throw error;
	}
}

// NOTE: Mux does not have a native chat API.
// Chat functionality is implemented via Firestore.
// See: /api/streams/[streamId]/chat/messages/+server.ts

/**
 * Get live stream details from Mux
 * 
 * @param liveStreamId - Mux live stream ID
 * @returns Live stream details
 */
export async function getMuxLiveStream(liveStreamId: string) {
	console.log('🎬 [MUX SERVICE] Fetching live stream details:', liveStreamId);

	try {
		const liveStream = await mux.video.liveStreams.retrieve(liveStreamId);

		console.log('✅ [MUX SERVICE] Live stream retrieved');
		console.log('🎬 [MUX SERVICE] Status:', liveStream.status);
		console.log('🎬 [MUX SERVICE] Stream key exists:', !!liveStream.stream_key);

		return liveStream;
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to get live stream:', error);
		throw error;
	}
}

/**
 * Delete a Mux live stream
 * 
 * @param liveStreamId - Mux live stream ID
 */
export async function deleteMuxLiveStream(liveStreamId: string) {
	console.log('🎬 [MUX SERVICE] Deleting live stream:', liveStreamId);

	try {
		await mux.video.liveStreams.delete(liveStreamId);
		console.log('✅ [MUX SERVICE] Live stream deleted successfully');
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to delete live stream:', error);
		throw error;
	}
}


/**
 * Get analytics metrics for a stream
 * 
 * @param assetId - Mux asset ID or live stream ID
 * @returns Analytics metrics
 */
export async function getMuxAnalytics(assetId: string) {
	console.log('📊 [MUX SERVICE] Fetching analytics for:', assetId);

	try {
		// Note: Mux Data API requires a separate subscription
		// For now, return placeholder values
		// TODO: Implement when Mux Data is configured
		console.log('📊 [MUX SERVICE] Analytics not yet configured for asset:', assetId);

		return {
			viewerCount: 0,
			qualityData: []
		};
	} catch (error) {
		console.error('❌ [MUX SERVICE] Failed to get analytics:', error);
		return {
			viewerCount: 0,
			qualityData: []
		};
	}
}

/**
 * Verify Mux webhook signature (Updated for @mux/mux-node v12+)
 * 
 * @param body - Raw request body string
 * @param headers - Full request headers object
 * @param secret - Webhook signing secret from Mux Dashboard
 * @returns True if signature is valid
 */
export function verifyMuxWebhookSignature(
	body: string,
	headers: Headers,
	secret: string
): boolean {
	console.log('🔐 [MUX SERVICE] Verifying webhook signature (v12+ API)');
	console.log('🔐 [MUX SERVICE] Body length:', body.length);
	console.log('🔐 [MUX SERVICE] Has mux-signature header:', headers.has('mux-signature'));

	try {
		// Create Mux instance with webhook secret for verification
		const muxInstance = new Mux({ webhookSecret: secret });
		
		// v12+ API: verifySignature takes body, headers object, and secret
		// This method THROWS on invalid signature, doesn't return boolean
		muxInstance.webhooks.verifySignature(body, headers, secret);
		
		console.log('✅ [MUX SERVICE] Webhook signature valid');
		return true;
	} catch (error: any) {
		console.error('❌ [MUX SERVICE] Webhook signature verification failed:', error?.message || error);
		return false;
	}
}

export default mux;
