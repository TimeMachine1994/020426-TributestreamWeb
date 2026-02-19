/**
 * Stream Analytics API - Mux Data Integration
 * 
 * Created: January 22, 2026
 * Retrieves real-time and historical analytics from Mux Data API
 * 
 * Endpoints:
 * - GET: Fetch analytics for a stream
 */

import { adminDb } from '$lib/server/firebase';
import { error as svelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMuxAnalytics } from '$lib/server/mux';

console.log('📊 [ANALYTICS API] Stream analytics endpoint loaded - Mux Data integration active');

/**
 * GET - Retrieve analytics for a stream
 * Returns real-time metrics, historical data, and timeline
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const { streamId } = params;
	
	console.log('📊 [ANALYTICS API] GET - Fetching analytics for stream:', streamId);

	// Require authentication for analytics
	if (!locals.user) {
		console.log('❌ [ANALYTICS API] User not authenticated');
		throw svelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	console.log('📊 [ANALYTICS API] User ID:', userId);
	console.log('📊 [ANALYTICS API] User role:', locals.user.role);

	try {
		// Get stream document
		console.log('🔍 [ANALYTICS API] Fetching stream document...');
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		
		if (!streamDoc.exists) {
			console.log('❌ [ANALYTICS API] Stream not found:', streamId);
			throw svelteKitError(404, 'Stream not found');
		}

		const stream = streamDoc.data();
		console.log('✅ [ANALYTICS API] Stream found, status:', stream?.status);
		console.log('📊 [ANALYTICS API] Mux live stream ID:', stream?.mux?.liveStreamId);

		// Get memorial to check permissions
		console.log('🔍 [ANALYTICS API] Fetching memorial document...');
		const memorialDoc = await adminDb.collection('memorials').doc(stream?.memorialId).get();
		
		if (!memorialDoc.exists) {
			console.log('❌ [ANALYTICS API] Memorial not found');
			throw svelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();

		// Check permissions (admin, owner, or funeral director)
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [ANALYTICS API] User lacks permission:', userId);
			throw svelteKitError(403, 'Permission denied');
		}

		console.log('✅ [ANALYTICS API] User has permission to view analytics');

		// Check if stream has Mux configuration
		if (!stream?.mux?.liveStreamId) {
			console.log('⚠️ [ANALYTICS API] Stream has no Mux configuration');
			// Return empty analytics for legacy streams
			return json({
				success: true,
				realTime: {
					viewerCount: 0,
					playbackQuality: 0,
					bufferingRate: 0,
					chatActivity: 0
				},
				historical: stream?.analytics || {
					totalViews: 0,
					peakViewers: 0,
					averageWatchTime: 0,
					totalWatchTime: 0
				},
				timeline: []
			});
		}

		// Fetch analytics from Mux Data API
		console.log('📊 [ANALYTICS API - MUX] Fetching analytics from Mux Data API...');
		const assetId = stream.mux.assetId || stream.mux.liveStreamId;
		console.log('📊 [ANALYTICS API - MUX] Asset ID:', assetId);

		const muxAnalytics = await getMuxAnalytics(assetId);
		console.log('✅ [ANALYTICS API - MUX] Mux analytics retrieved');
		console.log('📊 [ANALYTICS API - MUX] Current viewers:', muxAnalytics.viewerCount);

		// Get historical analytics from Firestore cache
		console.log('🔍 [ANALYTICS API] Fetching timeline from Firestore...');
		const analyticsSnapshot = await adminDb
			.collection('streams')
			.doc(streamId)
			.collection('analytics')
			.orderBy('timestamp', 'desc')
			.limit(60) // Last 60 data points
			.get();

		const timeline: any[] = [];
		analyticsSnapshot.forEach(doc => {
			timeline.push({
				timestamp: doc.data().timestamp,
				viewerCount: doc.data().viewerCount || 0,
				chatMessages: doc.data().chatMessages || 0
			});
		});

		// Reverse timeline to show oldest first
		timeline.reverse();
		console.log('✅ [ANALYTICS API] Timeline retrieved:', timeline.length, 'data points');

		// Calculate chat activity (messages per minute)
		const chatActivity = stream?.chat?.messageCount || 0;
		const streamDuration = stream?.liveStartedAt 
			? (new Date().getTime() - new Date(stream.liveStartedAt).getTime()) / 60000 
			: 1;
		const chatMessagesPerMinute = Math.round(chatActivity / streamDuration);

		console.log('💬 [ANALYTICS API] Chat activity:', chatActivity, 'total messages');
		console.log('💬 [ANALYTICS API] Messages per minute:', chatMessagesPerMinute);

		// Build response
		const response = {
			success: true,
			realTime: {
				viewerCount: muxAnalytics.viewerCount,
				playbackQuality: 100, // Default to 100% until we can parse quality data
				bufferingRate: 0,     // Will be populated from quality metrics
				chatActivity: chatMessagesPerMinute
			},
			historical: stream?.analytics || {
				totalViews: 0,
				peakViewers: muxAnalytics.viewerCount,
				averageWatchTime: 0,
				totalWatchTime: 0,
				engagement: {
					playbackQuality: 100,
					bufferingRate: 0,
					seekingRate: 0
				}
			},
			timeline
		};

		console.log('✅ [ANALYTICS API] Response prepared, returning analytics');

		return json(response);

	} catch (error: any) {
		console.error('❌ [ANALYTICS API] Error fetching analytics:', error);
		console.error('❌ [ANALYTICS API] Error details:', {
			message: error?.message,
			stack: error?.stack
		});

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteKitError(500, 'Failed to fetch analytics');
	}
};
