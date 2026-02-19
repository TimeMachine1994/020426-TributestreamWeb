/**
 * Stream Creation API - Mux Platform Integration
 * 
 * Updated: January 22, 2026
 * Migrated from Cloudflare Stream to Mux Video Platform
 * 
 * This endpoint handles:
 * - Creating new live streams via Mux
 * - Creating chat spaces for real-time viewer interaction
 * - Storing stream credentials and metadata in Firestore
 * - Managing stream permissions and visibility
 */

import { adminAuth, adminDb, FieldValue } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stream } from '$lib/types/stream';
import { createMuxLiveStream } from '$lib/server/mux';

console.log('🎬 [STREAMS API] Module loaded - Mux platform integration active');

// GET - Fetch all streams for a memorial
export const GET: RequestHandler = async ({ locals, params }) => {
	console.log('🎬 [STREAMS API] GET - Fetching streams for memorial:', params.memorialId);

	const memorialId = params.memorialId;

	try {
		// Verify memorial exists
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [STREAMS API] Memorial not found:', memorialId);
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;

		// For GET requests, allow public access to public memorials
		// For authenticated users, check permissions for private memorials
		if (locals.user) {
			const userId = locals.user.uid;
			const hasPermission =
				locals.user.role === 'admin' ||
				memorial.ownerUid === userId ||
				memorial.funeralDirectorUid === userId;

			if (!hasPermission && !memorial.isPublic) {
				console.log('❌ [STREAMS API] User lacks permission for private memorial:', userId);
				throw SvelteKitError(403, 'Permission denied');
			}
		} else {
			// Unauthenticated users can only access public memorials
			if (!memorial.isPublic) {
				console.log('❌ [STREAMS API] Unauthenticated access to private memorial');
				throw SvelteKitError(403, 'Authentication required for private memorial');
			}
		}

		// Fetch streams from the streams collection
		console.log('🔍 [STREAMS API] Querying streams collection for memorial:', memorialId);

		const streamsSnapshot = await adminDb
			.collection('streams')
			.where('memorialId', '==', memorialId)
			.get();

		const streams: Stream[] = [];
		streamsSnapshot.forEach((doc) => {
			streams.push({
				id: doc.id,
				...doc.data()
			} as Stream);
		});

		// Sort by createdAt descending (newest first)
		streams.sort((a, b) => {
			const aTime = new Date(a.createdAt || 0).getTime();
			const bTime = new Date(b.createdAt || 0).getTime();
			return bTime - aTime;
		});

		console.log('✅ [STREAMS API] Found', streams.length, 'streams');

		return json({
			success: true,
			streams,
			memorial: {
				id: memorialId,
				lovedOneName: memorial.lovedOneName,
				fullSlug: memorial.fullSlug
			}
		});
	} catch (error: any) {
		console.error('❌ [STREAMS API] Error fetching streams:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, 'Failed to fetch streams');
	}
};

// POST - Create a new stream
export const POST: RequestHandler = async ({ locals, params, request }) => {
	console.log('🎬 [STREAMS API] POST - Creating stream for memorial:', params.memorialId);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [STREAMS API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const memorialId = params.memorialId;

	try {
		// Parse request body
		const requestBody = await request.json();
		console.log('📥 [STREAMS API] Request body received:', JSON.stringify(requestBody, null, 2));
		
		const { 
			title, 
			description, 
			scheduledStartTime,
			calculatorServiceType, 
			calculatorServiceIndex,
			serviceHash,
			lastSyncedAt,
			syncStatus
		} = requestBody;

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			throw SvelteKitError(400, 'Stream title is required');
		}

		// Verify memorial exists and user has access
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [STREAMS API] Memorial not found:', memorialId);
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;

		// Check permissions
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [STREAMS API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// === MUX INTEGRATION: Create Live Stream ===
		console.log('🎬 [STREAMS API - MUX] Creating Mux live stream for:', title.trim());
		console.log('🎬 [STREAMS API - MUX] Scheduled start time:', scheduledStartTime || 'Not scheduled');
		
		let muxLiveStream;

		try {
			// Create Mux Live Stream with RTMP credentials
			console.log('🎬 [STREAMS API - MUX] Creating Mux live stream...');
			muxLiveStream = await createMuxLiveStream(title.trim(), {
				reconnectWindow: 60,    // 60 seconds before timeout
				reducedLatency: true    // Low latency mode
			});

			console.log('✅ [STREAMS API - MUX] Mux live stream created successfully');
			console.log('🎬 [STREAMS API - MUX] Live Stream ID:', muxLiveStream.id);
			console.log('🎬 [STREAMS API - MUX] Playback ID:', muxLiveStream.playbackId);
			console.log('📺 [STREAMS API - MUX] RTMP URL:', muxLiveStream.rtmpUrl);
			console.log('🔑 [STREAMS API - MUX] Stream Key length:', muxLiveStream.streamKey?.length || 0);

			// Note: Chat is handled via Firestore, not Mux (Mux doesn't have chat API)
			console.log('💬 [STREAMS API] Chat will be handled via Firestore subcollection');

		} catch (error) {
			console.error('❌ [STREAMS API - MUX] Failed to create Mux live stream:', error);
			console.error('❌ [STREAMS API - MUX] Error details:', {
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined
			});
			throw SvelteKitError(500, `Failed to create Mux live stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}

		// === BUILD STREAM DOCUMENT ===
		console.log('💾 [STREAMS API - MUX] Building Firestore stream document...');
		
		const streamData: any = {
			title: title.trim(),
			description: description?.trim() || '',
			memorialId,
			status: scheduledStartTime ? 'scheduled' : 'ready',
			visibility: 'public',
			
			// Mux Platform Configuration
			mux: {
				liveStreamId: muxLiveStream.id,
				playbackId: muxLiveStream.playbackId,
				rtmpUrl: muxLiveStream.rtmpUrl,
				streamKey: muxLiveStream.streamKey,
				recordingReady: false,
				streamingStatus: 'idle',
				reconnectWindow: 60
			},
			
			// Firestore Chat Configuration (Mux doesn't have native chat)
			chat: {
				enabled: true,  // Chat enabled by default
				archived: false, // New streams have live chat, not archived
				messageCount: 0,
				participantCount: 0,
				moderationMode: 'manual'
			},
			
			// Metadata
			createdBy: userId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			isVisible: true,
			syncStatus: syncStatus || 'synced'
		};

		console.log('💾 [STREAMS API - MUX] Stream data structure complete');
		console.log('💾 [STREAMS API - MUX] Contains Mux config:', !!streamData.mux);
		console.log('💾 [STREAMS API] Chat enabled:', streamData.chat.enabled);

		// Only add optional fields if they have values (avoid undefined)
		if (scheduledStartTime) {
			streamData.scheduledStartTime = scheduledStartTime;
		}
		if (calculatorServiceType) {
			streamData.calculatorServiceType = calculatorServiceType;
		}
		if (calculatorServiceIndex !== undefined && calculatorServiceIndex !== null) {
			streamData.calculatorServiceIndex = calculatorServiceIndex;
		}
		if (serviceHash) {
			streamData.serviceHash = serviceHash;
		}
		if (lastSyncedAt) {
			streamData.lastSyncedAt = lastSyncedAt;
		}

		console.log('💾 [STREAMS API] Stream data to save:', JSON.stringify(streamData, null, 2));

		// Save to streams collection
		console.log('💾 [STREAMS API] Saving stream to Firestore...');
		const streamRef = await adminDb.collection('streams').add(streamData);

		const createdStream: Stream = {
			id: streamRef.id,
			...streamData
		};

		console.log('✅ [STREAMS API] Stream created and saved:', streamRef.id);

		return json({
			success: true,
			stream: createdStream,
			message: 'Stream created successfully'
		});
	} catch (error: any) {
		console.error('❌ [STREAMS API] Error creating stream:', error);
		console.error('❌ [STREAMS API] Error details:', {
			message: error?.message,
			stack: error?.stack,
			name: error?.name,
			code: error?.code
		});

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, `Failed to create stream: ${error?.message || 'Unknown error'}`);
	}
};
