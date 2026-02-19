// DEPRECATED: This API is no longer called by the admin UI.
// Orphan stream sync is no longer needed — streams are created via block editor only.
// Retained for backward compatibility and one-time migration use.

import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MemorialBlock } from '$lib/types/memorial-blocks';
import { sortBlocksByOrder, createLivestreamBlock, hasStreamBlock } from '$lib/utils/block-utils';

/**
 * Blocks Sync API
 * POST - Auto-create blocks for existing streams that don't have blocks
 */

export const POST: RequestHandler = async ({ locals, params }) => {
	console.log('📦 [BLOCKS] POST sync - Syncing streams to blocks for memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [BLOCKS] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId } = params;

	try {
		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		let blocks: MemorialBlock[] = memorialData?.contentBlocks || [];

		// Get all streams for this memorial from root collection
		// Filter deleted in JS to handle missing isDeleted field
		const streamsSnapshot = await adminDb
			.collection('streams')
			.where('memorialId', '==', memorialId)
			.get();

		// Find orphan streams (streams without blocks, excluding deleted)
		const orphanStreams: { id: string; title: string }[] = [];
		
		streamsSnapshot.docs.forEach(doc => {
			const streamId = doc.id;
			const streamData = doc.data();
			
			// Skip deleted streams
			if (streamData.isDeleted === true) return;
			
			// Skip if stream already has a block
			if (!hasStreamBlock(blocks, streamId)) {
				orphanStreams.push({
					id: streamId,
					title: streamData.title || 'Untitled Stream'
				});
			}
		});

		console.log(`📦 [BLOCKS] Found ${orphanStreams.length} orphan streams to sync`);

		if (orphanStreams.length === 0) {
			return json({
				success: true,
				message: 'All streams already have blocks',
				created: 0,
				skipped: streamsSnapshot.size,
				blocks: sortBlocksByOrder(blocks)
			});
		}

		// Create blocks for orphan streams
		const createdBlocks: MemorialBlock[] = [];
		let nextOrder = blocks.length;

		for (const stream of orphanStreams) {
			const newBlock = createLivestreamBlock(stream.id, nextOrder);
			blocks.push(newBlock);
			createdBlocks.push(newBlock);
			nextOrder++;
			console.log(`✅ [BLOCKS] Created block for stream: ${stream.id} (${stream.title})`);
		}

		// Update memorial document with new blocks
		await memorialRef.update({
			contentBlocks: blocks,
			contentBlocksVersion: (memorialData?.contentBlocksVersion || 0) + 1,
			updatedAt: new Date().toISOString()
		});

		console.log(`✅ [BLOCKS] Sync complete: ${createdBlocks.length} blocks created`);

		return json({
			success: true,
			message: `Created ${createdBlocks.length} block(s) for existing streams`,
			created: createdBlocks.length,
			skipped: streamsSnapshot.size - orphanStreams.length,
			createdBlocks,
			blocks: sortBlocksByOrder(blocks)
		});
	} catch (err: any) {
		console.error('❌ [BLOCKS] Error syncing streams to blocks:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to sync streams: ${err?.message || 'Unknown error'}`);
	}
};
