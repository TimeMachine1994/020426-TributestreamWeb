import type { Timestamp } from 'firebase/firestore';

/**
 * Chat message interface for memorial chat system
 */
export interface ChatMessage {
	/** Unique message ID */
	id: string;
	
	/** Memorial this message belongs to */
	memorialId: string;
	
	/** User who sent the message */
	userId: string;
	
	/** Display name of the user */
	userName: string;
	
	/** User's role (for badge display) */
	userRole: 'admin' | 'owner' | 'funeral_director' | 'viewer';
	
	/** Message content (max 500 characters) */
	message: string;
	
	/** When the message was sent */
	timestamp: Timestamp | Date;
	
	/** Whether the message has been edited */
	isEdited: boolean;
	
	/** When the message was edited (if applicable) */
	editedAt?: Timestamp | Date;
	
	/** Whether the message has been deleted (soft delete) */
	isDeleted: boolean;
	
	/** When the message was deleted (if applicable) */
	deletedAt?: Timestamp | Date;
	
	/** ID of message being replied to (for threading) */
	replyTo?: string;
}

/**
 * Input type for creating a new chat message
 */
export interface CreateChatMessageInput {
	message: string;
	replyTo?: string;
}

/**
 * Input type for updating an existing chat message
 */
export interface UpdateChatMessageInput {
	message: string;
}

/**
 * Chat statistics for a memorial
 */
export interface ChatStats {
	/** Total number of messages */
	messageCount: number;
	
	/** Number of active participants */
	participantCount: number;
	
	/** Most recent message timestamp */
	lastMessageAt?: Timestamp | Date;
}

/**
 * User's unread message tracking
 */
export interface UnreadChatInfo {
	/** Memorial ID */
	memorialId: string;
	
	/** Number of unread messages */
	unreadCount: number;
	
	/** Last message timestamp user has seen */
	lastSeenAt: Timestamp | Date;
}

/**
 * Serialized chat message (for client-side use)
 */
export interface SerializedChatMessage extends Omit<ChatMessage, 'timestamp' | 'editedAt' | 'deletedAt'> {
	timestamp: string;
	editedAt?: string;
	deletedAt?: string;
}

/**
 * Stream Chat Message
 * Messages sent during live streams, stored in Firestore
 * Note: Mux does not have a native chat API, so we use Firestore
 */
export interface StreamChatMessage {
	/** Unique message ID */
	id: string;
	
	/** Stream this message belongs to */
	streamId: string;
	
	/** User ID (if authenticated) */
	userId?: string;
	
	/** Display name */
	userName: string;
	
	/** User avatar URL */
	userAvatar?: string;
	
	/** User role for badge display */
	userRole?: 'admin' | 'guest';
	
	/** Is this an anonymous viewer (guest)? */
	isAnonymous: boolean;
	
	/** Message content */
	message: string;
	
	/** When the message was sent */
	timestamp: string;
	
	/** Moderation status */
	deleted: boolean;
	deletedBy?: string;
	deletedAt?: string;
	flagged: boolean;
	flagReason?: string;
}
