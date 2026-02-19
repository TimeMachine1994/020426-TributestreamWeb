/**
 * Memorial Blocks Type Definitions
 * 
 * Defines the data structures for the WYSIWYG memorial content editor.
 * Blocks represent ordered, toggleable content sections on a memorial page.
 */

// Block type discriminator
export type BlockType = 'livestream' | 'embed' | 'text';

// Embed subtypes for styling/icons
export type EmbedType = 'video' | 'chat' | 'other';

// Text display styles
export type TextStyle = 'paragraph' | 'heading' | 'note';

// Livestream block configuration
export interface LivestreamConfig {
	streamId: string; // Reference to stream document in streams subcollection
}

// Embed block configuration
export interface EmbedConfig {
	title: string;
	embedCode: string;
	embedType: EmbedType;
}

// Text block configuration
export interface TextConfig {
	content: string;
	style: TextStyle;
}

// Union type for block configurations
export type BlockConfig = LivestreamConfig | EmbedConfig | TextConfig;

// Base memorial block interface
export interface MemorialBlock {
	id: string;
	type: BlockType;
	order: number;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
	config: BlockConfig;
}

// Type guards for block configurations
export function isLivestreamConfig(config: BlockConfig): config is LivestreamConfig {
	return 'streamId' in config;
}

export function isEmbedConfig(config: BlockConfig): config is EmbedConfig {
	return 'embedCode' in config && 'embedType' in config;
}

export function isTextConfig(config: BlockConfig): config is TextConfig {
	return 'content' in config && 'style' in config;
}

// Typed block interfaces for convenience
export interface LivestreamBlock extends MemorialBlock {
	type: 'livestream';
	config: LivestreamConfig;
}

export interface EmbedBlock extends MemorialBlock {
	type: 'embed';
	config: EmbedConfig;
}

export interface TextBlock extends MemorialBlock {
	type: 'text';
	config: TextConfig;
}

// API request/response types
export interface CreateBlockRequest {
	type: BlockType;
	config: BlockConfig;
	insertAt?: number; // Position to insert, defaults to end
}

export interface UpdateBlockRequest {
	enabled?: boolean;
	config?: Partial<BlockConfig>;
}

export interface ReorderBlocksRequest {
	order: string[]; // Array of block IDs in new order
}

export interface BlocksResponse {
	blocks: MemorialBlock[];
	version: number;
}

export interface BlockResponse {
	block: MemorialBlock;
	blocks: MemorialBlock[];
}

export interface DeleteBlockResponse {
	deleted: string;
	blocks: MemorialBlock[];
}

// Create livestream block request (combines stream + block creation)
export interface CreateLivestreamBlockRequest {
	title: string;
	scheduledStartTime: string;
	description?: string;
	insertAt?: number;
}
