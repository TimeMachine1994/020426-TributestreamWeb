import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MemorialBlock, UpdateBlockRequest } from '$lib/types/memorial-blocks';
import { sortBlocksByOrder, updateBlock, removeBlock, findBlock } from '$lib/utils/block-utils';

/**
 * Single Block API
 * PATCH - Update a block
 * DELETE - Remove a block
 */

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	console.log('📦 [BLOCKS] PATCH - Updating block:', params.blockId, 'for memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [BLOCKS] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId, blockId } = params;

	try {
		const body: UpdateBlockRequest = await request.json();
		const { enabled, config } = body;

		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		const data = memorialDoc.data();
		let blocks: MemorialBlock[] = data?.contentBlocks || [];

		// Find the block
		const existingBlock = findBlock(blocks, blockId);
		if (!existingBlock) {
			throw svelteError(404, 'Block not found');
		}

		// Build updates
		const updates: Partial<MemorialBlock> = {};
		
		if (enabled !== undefined) {
			updates.enabled = enabled;
		}
		
		if (config) {
			// Merge config updates
			updates.config = {
				...existingBlock.config,
				...config
			};
		}

		// Apply updates
		blocks = updateBlock(blocks, blockId, updates);
		const updatedBlock = findBlock(blocks, blockId);

		// Update memorial document
		await memorialRef.update({
			contentBlocks: blocks,
			contentBlocksVersion: (data?.contentBlocksVersion || 0) + 1,
			updatedAt: new Date().toISOString()
		});

		console.log(`✅ [BLOCKS] Block updated: ${blockId}`);

		return json({
			block: updatedBlock,
			blocks: sortBlocksByOrder(blocks)
		});
	} catch (err: any) {
		console.error('❌ [BLOCKS] Error updating block:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to update block: ${err?.message || 'Unknown error'}`);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	console.log('📦 [BLOCKS] DELETE - Removing block:', params.blockId, 'from memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [BLOCKS] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId, blockId } = params;

	try {
		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		const data = memorialDoc.data();
		let blocks: MemorialBlock[] = data?.contentBlocks || [];

		// Find the block
		const existingBlock = findBlock(blocks, blockId);
		if (!existingBlock) {
			throw svelteError(404, 'Block not found');
		}

		// Remove block
		blocks = removeBlock(blocks, blockId);

		// Update memorial document
		await memorialRef.update({
			contentBlocks: blocks,
			contentBlocksVersion: (data?.contentBlocksVersion || 0) + 1,
			updatedAt: new Date().toISOString()
		});

		console.log(`✅ [BLOCKS] Block deleted: ${blockId}`);

		return json({
			deleted: blockId,
			blocks: sortBlocksByOrder(blocks)
		});
	} catch (err: any) {
		console.error('❌ [BLOCKS] Error deleting block:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to delete block: ${err?.message || 'Unknown error'}`);
	}
};
