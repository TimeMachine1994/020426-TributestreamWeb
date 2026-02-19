import { adminDb } from '$lib/server/firebase';
import { error as svelteError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { MemorialBlock, CreateBlockRequest } from '$lib/types/memorial-blocks';
import {
	sortBlocksByOrder,
	createBlock,
	insertBlockAt,
	validateBlockConfig
} from '$lib/utils/block-utils';

/**
 * Memorial Blocks API
 * GET - Fetch all blocks for a memorial
 * POST - Create a new block
 */

export const GET: RequestHandler = async ({ locals, params }) => {
	console.log('📦 [BLOCKS] GET - Fetching blocks for memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [BLOCKS] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId } = params;

	try {
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		const data = memorialDoc.data();
		const blocks: MemorialBlock[] = data?.contentBlocks || [];
		const version = data?.contentBlocksVersion || 0;

		console.log(`✅ [BLOCKS] Returning ${blocks.length} blocks`);

		return json({
			blocks: sortBlocksByOrder(blocks),
			version
		});
	} catch (err: any) {
		console.error('❌ [BLOCKS] Error fetching blocks:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to fetch blocks: ${err?.message || 'Unknown error'}`);
	}
};

export const POST: RequestHandler = async ({ locals, params, request }) => {
	console.log('📦 [BLOCKS] POST - Creating new block for memorial:', params.memorialId);

	// Check authentication and admin role
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('❌ [BLOCKS] Unauthorized access attempt');
		throw svelteError(403, 'Admin access required');
	}

	const { memorialId } = params;

	try {
		const body: CreateBlockRequest = await request.json();
		const { type, config, insertAt } = body;

		// Validate block type
		if (!type || !['livestream', 'embed', 'text'].includes(type)) {
			throw svelteError(400, 'Invalid block type. Must be: livestream, embed, or text');
		}

		// Validate config
		const configError = validateBlockConfig(type, config);
		if (configError) {
			throw svelteError(400, configError);
		}

		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw svelteError(404, 'Memorial not found');
		}

		const data = memorialDoc.data();
		let blocks: MemorialBlock[] = data?.contentBlocks || [];

		// Create new block
		const order = insertAt !== undefined ? insertAt : blocks.length;
		const newBlock = createBlock(type, config, order);

		// Insert at position
		if (insertAt !== undefined) {
			blocks = insertBlockAt(blocks, newBlock, insertAt);
		} else {
			blocks = [...blocks, newBlock];
		}

		// Update memorial document
		await memorialRef.update({
			contentBlocks: blocks,
			contentBlocksVersion: (data?.contentBlocksVersion || 0) + 1,
			updatedAt: new Date().toISOString()
		});

		console.log(`✅ [BLOCKS] Block created: ${newBlock.id} (type: ${type})`);

		return json({
			block: newBlock,
			blocks: sortBlocksByOrder(blocks)
		});
	} catch (err: any) {
		console.error('❌ [BLOCKS] Error creating block:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw svelteError(500, `Failed to create block: ${err?.message || 'Unknown error'}`);
	}
};
