import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MemorialBlock, CreateLivestreamBlockRequest } from '$lib/types/memorial-blocks';
import { sortBlocksByOrder, createLivestreamBlock, insertBlockAt } from '$lib/utils/block-utils';
import { createMuxLiveStream } from '$lib/server/mux';

/**
 * Livestream Block Creation API
 * POST - Create a new stream AND a block referencing it
 * 
 * This combines the stream creation with block creation for better UX.
 */

export const POST: RequestHandler = async ({ locals, params, request }) => {
	console.log('📦 [BLOCKS] POST livestream - Creating stream + block for memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [BLOCKS] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId } = params;

	try {
		const body: CreateLivestreamBlockRequest = await request.json();
		const { title, scheduledStartTime, description, insertAt } = body;

		// Validate required fields
		if (!title || !title.trim()) {
			throw svelteError(400, 'Stream title is required');
		}

		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		let blocks: MemorialBlock[] = memorialData?.contentBlocks || [];

		// Create stream document in root streams collection (not subcollection)
		const streamsRef = adminDb.collection('streams');
		const now = new Date().toISOString();

		// === MUX INTEGRATION: Create Live Stream with RTMP credentials ===
		console.log('🎬 [BLOCKS] Creating Mux live stream for:', title.trim());

		let muxLiveStream;
		try {
			muxLiveStream = await createMuxLiveStream(title.trim(), {
				reconnectWindow: 60,
				reducedLatency: true
			});

			console.log('✅ [BLOCKS] Mux live stream created:', muxLiveStream.id);
			console.log('🎬 [BLOCKS] Playback ID:', muxLiveStream.playbackId);
			console.log('📺 [BLOCKS] RTMP URL:', muxLiveStream.rtmpUrl);
			console.log('🔑 [BLOCKS] Stream Key length:', muxLiveStream.streamKey?.length || 0);
		} catch (muxError) {
			console.error('❌ [BLOCKS] Failed to create Mux live stream:', muxError);
			throw svelteError(500, `Failed to create Mux live stream: ${muxError instanceof Error ? muxError.message : 'Unknown error'}`);
		}

		const streamData = {
			title: title.trim(),
			description: description?.trim() || '',
			scheduledStartTime: scheduledStartTime || null,
			status: scheduledStartTime ? 'scheduled' : 'ready',
			visibility: 'public',
			memorialId,
			createdAt: now,
			updatedAt: now,
			createdBy: locals.user.uid,
			createdByEmail: locals.user.email,

			// Mux Platform Configuration (RTMP credentials for OBS)
			mux: {
				liveStreamId: muxLiveStream.id,
				playbackId: muxLiveStream.playbackId,
				rtmpUrl: muxLiveStream.rtmpUrl,
				streamKey: muxLiveStream.streamKey,
				recordingReady: false,
				streamingStatus: 'idle',
				reconnectWindow: 60
			},

			// Firestore Chat Configuration
			chat: {
				enabled: true,
				locked: false,
				archived: false,
				messageCount: 0,
				participantCount: 0,
				moderationMode: 'manual'
			},

			isVisible: true
		};

		const streamDocRef = await streamsRef.add(streamData);
		const streamId = streamDocRef.id;

		console.log(`✅ [BLOCKS] Stream created: ${streamId}`);

		// Create block referencing the stream
		const order = insertAt !== undefined ? insertAt : blocks.length;
		const newBlock = createLivestreamBlock(streamId, order);

		// Insert at position
		if (insertAt !== undefined) {
			blocks = insertBlockAt(blocks, newBlock, insertAt);
		} else {
			blocks = [...blocks, newBlock];
		}

		// Update memorial document with new blocks
		await memorialRef.update({
			contentBlocks: blocks,
			contentBlocksVersion: (memorialData?.contentBlocksVersion || 0) + 1,
			updatedAt: now
		});

		console.log(`✅ [BLOCKS] Livestream block created: ${newBlock.id}`);

		return json({
			stream: {
				id: streamId,
				...streamData
			},
			block: newBlock,
			blocks: sortBlocksByOrder(blocks)
		});
	} catch (err: any) {
		console.error('❌ [BLOCKS] Error creating livestream block:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to create livestream block: ${err?.message || 'Unknown error'}`);
	}
};
