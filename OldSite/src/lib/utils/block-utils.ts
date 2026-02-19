/**
 * Block Utilities
 * 
 * Helper functions for working with memorial content blocks.
 */

import type {
	MemorialBlock,
	BlockType,
	BlockConfig,
	LivestreamConfig,
	EmbedConfig,
	TextConfig,
	EmbedType,
	TextStyle
} from '$lib/types/memorial-blocks';

/**
 * Generate a unique block ID
 */
export function generateBlockId(): string {
	return crypto.randomUUID();
}

/**
 * Sort blocks by order field
 */
export function sortBlocksByOrder(blocks: MemorialBlock[]): MemorialBlock[] {
	return [...blocks].sort((a, b) => a.order - b.order);
}

/**
 * Recompute order values after deletion or insertion
 * Ensures order values are sequential: 0, 1, 2, ...
 */
export function recomputeOrder(blocks: MemorialBlock[]): MemorialBlock[] {
	return blocks.map((block, index) => ({
		...block,
		order: index
	}));
}

/**
 * Insert a block at a specific position
 */
export function insertBlockAt(
	blocks: MemorialBlock[],
	newBlock: MemorialBlock,
	position: number
): MemorialBlock[] {
	const sorted = sortBlocksByOrder(blocks);
	const result = [...sorted];
	
	// Clamp position to valid range
	const insertPos = Math.max(0, Math.min(position, result.length));
	
	// Insert at position
	result.splice(insertPos, 0, newBlock);
	
	// Recompute order
	return recomputeOrder(result);
}

/**
 * Remove a block by ID
 */
export function removeBlock(blocks: MemorialBlock[], blockId: string): MemorialBlock[] {
	const filtered = blocks.filter(b => b.id !== blockId);
	return recomputeOrder(sortBlocksByOrder(filtered));
}

/**
 * Update a block by ID
 */
export function updateBlock(
	blocks: MemorialBlock[],
	blockId: string,
	updates: Partial<MemorialBlock>
): MemorialBlock[] {
	return blocks.map(block => {
		if (block.id === blockId) {
			return {
				...block,
				...updates,
				updatedAt: new Date().toISOString()
			};
		}
		return block;
	});
}

/**
 * Reorder blocks based on array of IDs
 */
export function reorderBlocks(blocks: MemorialBlock[], newOrder: string[]): MemorialBlock[] {
	const blockMap = new Map(blocks.map(b => [b.id, b]));
	const now = new Date().toISOString();
	
	return newOrder.map((id, index) => {
		const block = blockMap.get(id);
		if (!block) {
			throw new Error(`Block not found: ${id}`);
		}
		return {
			...block,
			order: index,
			updatedAt: now
		};
	});
}

/**
 * Create a new block with defaults
 */
export function createBlock(
	type: BlockType,
	config: BlockConfig,
	order: number
): MemorialBlock {
	const now = new Date().toISOString();
	return {
		id: generateBlockId(),
		type,
		order,
		enabled: true,
		createdAt: now,
		updatedAt: now,
		config
	};
}

/**
 * Create a livestream block
 */
export function createLivestreamBlock(streamId: string, order: number): MemorialBlock {
	return createBlock('livestream', { streamId } as LivestreamConfig, order);
}

/**
 * Create an embed block
 */
export function createEmbedBlock(
	title: string,
	embedCode: string,
	embedType: EmbedType,
	order: number
): MemorialBlock {
	return createBlock('embed', { title, embedCode, embedType } as EmbedConfig, order);
}

/**
 * Create a text block
 */
export function createTextBlock(
	content: string,
	style: TextStyle,
	order: number
): MemorialBlock {
	return createBlock('text', { content, style } as TextConfig, order);
}

/**
 * Validate block config based on type
 */
export function validateBlockConfig(type: BlockType, config: BlockConfig): string | null {
	switch (type) {
		case 'livestream': {
			const c = config as LivestreamConfig;
			if (!c.streamId || typeof c.streamId !== 'string') {
				return 'Livestream block requires a valid streamId';
			}
			break;
		}
		case 'embed': {
			const c = config as EmbedConfig;
			if (!c.embedCode || typeof c.embedCode !== 'string') {
				return 'Embed block requires embedCode';
			}
			if (!c.embedType || !['video', 'chat', 'other'].includes(c.embedType)) {
				return 'Embed block requires valid embedType (video, chat, or other)';
			}
			break;
		}
		case 'text': {
			const c = config as TextConfig;
			if (typeof c.content !== 'string') {
				return 'Text block requires content';
			}
			if (!c.style || !['paragraph', 'heading', 'note'].includes(c.style)) {
				return 'Text block requires valid style (paragraph, heading, or note)';
			}
			break;
		}
		default:
			return `Unknown block type: ${type}`;
	}
	return null;
}

/**
 * Get block icon based on type
 */
export function getBlockIcon(type: BlockType): string {
	switch (type) {
		case 'livestream':
			return '📹';
		case 'embed':
			return '🔗';
		case 'text':
			return '📝';
		default:
			return '📦';
	}
}

/**
 * Get block type label
 */
export function getBlockTypeLabel(type: BlockType): string {
	switch (type) {
		case 'livestream':
			return 'Livestream';
		case 'embed':
			return 'Embed';
		case 'text':
			return 'Text';
		default:
			return 'Unknown';
	}
}

/**
 * Get only enabled blocks, sorted by order
 */
export function getEnabledBlocks(blocks: MemorialBlock[]): MemorialBlock[] {
	return sortBlocksByOrder(blocks.filter(b => b.enabled));
}

/**
 * Find a block by ID
 */
export function findBlock(blocks: MemorialBlock[], blockId: string): MemorialBlock | undefined {
	return blocks.find(b => b.id === blockId);
}

/**
 * Check if blocks array contains a block with the given stream ID
 * @deprecated Used only by the deprecated blocks/sync API. No longer called from UI.
 */
export function hasStreamBlock(blocks: MemorialBlock[], streamId: string): boolean {
	return blocks.some(
		b => b.type === 'livestream' && (b.config as LivestreamConfig).streamId === streamId
	);
}

/**
 * Sanitize embed code for security
 * Only allows iframe tags with whitelisted domains
 */
export function sanitizeEmbedCode(embedCode: string): string {
	// If it's just a URL, wrap it in an iframe
	if (embedCode.startsWith('http') && !embedCode.includes('<')) {
		return `<iframe src="${embedCode}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`;
	}
	
	// Extract iframe src and validate domain
	const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
	if (!srcMatch) {
		return embedCode; // Return as-is, let frontend handle display
	}
	
	const src = srcMatch[1];
	const allowedDomains = [
		'youtube.com',
		'youtube-nocookie.com',
		'youtu.be',
		'vimeo.com',
		'player.vimeo.com',
		'dailymotion.com',
		'facebook.com',
		'twitch.tv',
		'player.twitch.tv',
		'cloudflare.com',
		'cloudflarestream.com',
		'iframe.videodelivery.net',
		'tributestream.com'
	];
	
	try {
		const url = new URL(src);
		const isAllowed = allowedDomains.some(domain => 
			url.hostname === domain || url.hostname.endsWith('.' + domain)
		);
		
		if (!isAllowed) {
			console.warn(`Embed domain not in allowlist: ${url.hostname}`);
		}
	} catch {
		// Invalid URL, return as-is
	}
	
	return embedCode;
}
