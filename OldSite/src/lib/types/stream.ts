// Stream Types for Tributestream
// Updated: January 22, 2026 - Added Mux platform integration

export type StreamStatus = 'scheduled' | 'ready' | 'live' | 'ended' | 'completed' | 'error';
export type StreamVisibility = 'public' | 'hidden' | 'archived';

// Mux-specific streaming status
export type MuxStreamingStatus = 'idle' | 'active' | 'disconnected';

/** Individual VOD recording from a stream session */
export interface MuxRecording {
	assetId: string;              // Mux asset ID for this recording
	vodPlaybackId: string;        // Playback ID for this VOD
	duration?: number;            // Duration in seconds
	createdAt: string;            // ISO timestamp when recording was processed
}

export interface StreamCredentials {
	// For WHIP (Mobile Input & Mobile Streaming)
	whipUrl?: string;
	whepUrl?: string; // For playback
	
	// For RTMP (Stream Key)
	rtmpUrl?: string;
	streamKey?: string;
	
	// Cloudflare identifiers
	cloudflareInputId?: string;
	cloudflareStreamId?: string;
}

/**
 * Mux Live Stream Configuration
 * Contains all Mux-specific stream data including RTMP credentials,
 * playback IDs, and recording information
 */
export interface MuxStreamConfig {
	// Mux identifiers
	liveStreamId: string;        // Mux live stream ID
	playbackId: string;           // HLS playback ID for live viewing
	
	// RTMP ingestion credentials
	rtmpUrl: string;              // RTMP ingest URL
	streamKey: string;            // RTMP stream key for OBS
	
	// Recording — legacy single fields (latest recording wins, for backward compat)
	assetId?: string;             // Mux VOD asset ID
	vodPlaybackId?: string;       // VOD playback ID for recordings
	recordingReady: boolean;      // Is recording processed and ready?
	duration?: number;            // Recording duration in seconds
	
	// Multiple recordings (one per stream session, newest last)
	recordings?: MuxRecording[];
	
	// Stream status from Mux
	reconnectWindow?: number;     // Seconds before stream times out
	streamingStatus: MuxStreamingStatus; // Current streaming status
}

/**
 * Stream Chat Configuration
 * Contains chat settings and stats (stored in Firestore, not Mux)
 * Note: Mux does not have a native chat API
 */
export interface StreamChatConfig {
	enabled: boolean;             // Show/hide chat entirely
	locked?: boolean;             // Prevent new messages (read-only mode) - manually controlled by admin
	archived?: boolean;           // Chat is archived (stream ended)
	messageCount?: number;        // Total messages sent
	participantCount?: number;    // Unique participants
	moderationMode?: 'off' | 'auto' | 'manual'; // Moderation mode
}

// Alias for backward compatibility
export type MuxChatConfig = StreamChatConfig;

/**
 * Stream Embed Configuration
 * Allows embedding external video content above or below the stream
 */
export type StreamEmbedPosition = 'above' | 'below' | 'replace';

export interface StreamEmbed {
	code: string;                 // iframe or embed HTML code
	title?: string;               // Optional display title
	position: StreamEmbedPosition; // Display position relative to video
	createdAt: string;            // ISO timestamp
	createdBy: string;            // User ID who created
}

/**
 * Stream Analytics Data
 * Cached analytics from Mux Data API
 */
export interface StreamAnalytics {
	lastUpdated: string;          // ISO timestamp of last update
	viewerCount: number;          // Current concurrent viewers
	peakViewerCount: number;      // Peak viewers during stream
	totalViews: number;           // Total view sessions
	averageWatchTime: number;     // Average watch time (seconds)
	totalWatchTime: number;       // Total watch time (seconds)
	engagement?: {
		playbackQuality: number;  // Average quality score (0-100)
		bufferingRate: number;    // % of time buffering
		seekingRate: number;      // % of time seeking
	};
}

export interface Stream {
	id: string;
	title: string;
	description?: string;
	status: StreamStatus;
	visibility?: StreamVisibility;
	
	// Memorial association
	memorialId: string;
	
	// Scheduling
	scheduledStartTime?: string;
	
	// Legacy stream credentials (keeping for backward compatibility)
	streamCredentials?: StreamCredentials;
	
	// Mux Platform Integration (NEW)
	mux?: MuxStreamConfig;        // Mux live stream configuration
	chat?: MuxChatConfig;          // Mux chat configuration
	analytics?: StreamAnalytics;   // Cached analytics data
	embed?: StreamEmbed;           // Optional external embed (above/below video)
	
	// Playback
	playbackUrl?: string;
	embedUrl?: string;
	recordingReady?: boolean;
	
	// Live tracking
	liveStartedAt?: string;
	liveEndedAt?: string;
	
	// Legacy Cloudflare fields (for backward compatibility during migration)
	streamKey?: string;
	rtmpUrl?: string;
	cloudflareInputId?: string;
	cloudflareStreamId?: string;
	legacyCloudflareInputId?: string; // Preserved during migration
	
	// Metadata
	isVisible?: boolean;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
	
	// Calculator integration
	calculatorServiceType?: string;
	calculatorServiceIndex?: number;
	serviceHash?: string;
	lastSyncedAt?: string;
	syncStatus?: string;
}
