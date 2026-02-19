import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MemorialBlock, ReorderBlocksRequest } from '$lib/types/memorial-blocks';
import { sortBlocksByOrder, reorderBlocks } from '$lib/utils/block-utils';

/**
 * Block Reorder API
 * POST - Reorder blocks based on array of IDs
 */

export const POST: RequestHandler = async ({ locals, params, request }) => {
	console.log('📦 [BLOCKS] POST reorder - Reordering blocks for memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [BLOCKS] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId } = params;

	try {
		const body: ReorderBlocksRequest = await request.json();
		const { order } = body;

		if (!order || !Array.isArray(order)) {
			throw svelteError(400, 'Order must be an array of block IDs');
		}

		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		const data = memorialDoc.data();
		const currentBlocks: MemorialBlock[] = data?.contentBlocks || [];

		// Validate all IDs exist
		const currentIds = new Set(currentBlocks.map(b => b.id));
		for (const id of order) {
			if (!currentIds.has(id)) {
				throw svelteError(400, `Block not found: ${id}`);
			}
		}

		// Check for missing IDs (all blocks must be in new order)
		if (order.length !== currentBlocks.length) {
			throw svelteError(400, 'Order array must contain all block IDs');
		}

		// Reorder blocks
		const reorderedBlocks = reorderBlocks(currentBlocks, order);

		// Update memorial document
		await memorialRef.update({
			contentBlocks: reorderedBlocks,
			contentBlocksVersion: (data?.contentBlocksVersion || 0) + 1,
			updatedAt: new Date().toISOString()
		});

		console.log(`✅ [BLOCKS] Blocks reordered successfully`);

		return json({
			blocks: sortBlocksByOrder(reorderedBlocks)
		});
	} catch (err: any) {
		console.error('❌ [BLOCKS] Error reordering blocks:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to reorder blocks: ${err?.message || 'Unknown error'}`);
	}
};
