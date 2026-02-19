<script lang="ts">
	/**
	 * Mux Video Player Component
	 * 
	 * Created: January 22, 2026
	 * Provides HLS video playback for both live and recorded streams using Mux Player
	 * 
	 * Features:
	 * - Automatic adaptive bitrate streaming
	 * - Built-in player controls
	 * - Low latency for live streams
	 * - Automatic analytics tracking
	 * - Seamless live → VOD transition
	 */

	import '@mux/mux-player';

	// Flexible stream interface for MuxVideoPlayer
	// Accepts both the global Stream type and local component stream interfaces
	interface MuxPlayerStream {
		id: string;
		title?: string;
		status: string;
		mux?: {
			liveStreamId?: string;
			playbackId?: string;
			vodPlaybackId?: string;
			streamingStatus?: 'idle' | 'active' | 'disconnected';
			recordingReady?: boolean;
			recordings?: { assetId: string; vodPlaybackId: string; duration?: number; createdAt: string }[];
		};
	}

	// Props interface with TypeScript
	interface Props {
		stream: MuxPlayerStream;
		autoplay?: boolean;
		muted?: boolean;
		showTitle?: boolean;
	}

	let { 
		stream, 
		autoplay = true, 
		muted = false,
		showTitle = true 
	}: Props = $props();

	/**
	 * Determine which playback ID to use based on stream status
	 * - For completed streams: Use VOD playback ID
	 * - For live/scheduled streams: Use live playback ID
	 */
	const playbackId = $derived(() => {
		console.log('🎬 [MUX PLAYER] Determining playback ID for stream:', stream.id);
		console.log('🎬 [MUX PLAYER] Stream status:', stream.status);
		
		// Check if stream has Mux configuration
		if (!stream.mux) {
			console.warn('⚠️ [MUX PLAYER] No Mux configuration found for stream:', stream.id);
			return null;
		}

		// For completed/ended streams with recording ready, use VOD playback ID
		if (stream.mux.recordingReady || stream.status === 'completed' || stream.status === 'ended') {
			// Prefer latest recording from recordings array
			if (stream.mux.recordings?.length) {
				const latest = stream.mux.recordings[stream.mux.recordings.length - 1];
				console.log('📼 [MUX PLAYER] Using latest recording VOD playback ID:', latest.vodPlaybackId, `(session ${stream.mux.recordings.length})`);
				return latest.vodPlaybackId;
			}
			// Fallback to legacy single field
			if (stream.mux.vodPlaybackId) {
				console.log('📼 [MUX PLAYER] Using legacy VOD playback ID:', stream.mux.vodPlaybackId);
				return stream.mux.vodPlaybackId;
			}
		}

		// For live or scheduled streams, use live playback ID
		console.log('🔴 [MUX PLAYER] Using live playback ID:', stream.mux.playbackId);
		return stream.mux.playbackId;
	});

	/**
	 * Determine if this stream has a recording available
	 */
	const isRecording = $derived(() => {
		return stream.status === 'completed' ||
		       stream.status === 'ended' ||
		       stream.mux?.recordingReady === true;
	});

	/**
	 * Determine if this is a live stream or VOD
	 * Recording state takes precedence - if recording is ready, stream is not live
	 */
	const isLive = $derived(() => {
		// If recording is ready or stream has ended, it's NOT live anymore
		if (stream.mux?.recordingReady) return false;
		if (stream.status === 'completed' || stream.status === 'ended') return false;
		
		// Check for active live indicators
		const live = stream.status === 'live' || 
		             (stream.status === 'ready' && stream.mux?.streamingStatus === 'active');
		
		console.log('🎬 [MUX PLAYER] Is live:', live, {
			status: stream.status,
			recordingReady: stream.mux?.recordingReady,
			streamingStatus: stream.mux?.streamingStatus
		});
		return live;
	});

	/**
	 * Get stream type for Mux Player
	 */
	const streamType = $derived(() => {
		const type = isLive() ? 'live' : 'on-demand';
		console.log('🎬 [MUX PLAYER] Stream type:', type);
		return type;
	});

	/**
	 * Handle player events for debugging
	 */
	function handlePlayerReady(event: Event) {
		console.log('✅ [MUX PLAYER] Player ready for stream:', stream.id);
		console.log('🎬 [MUX PLAYER] Player element:', event.target);
	}

	function handlePlayerError(event: Event) {
		console.error('❌ [MUX PLAYER] Player error for stream:', stream.id);
		console.error('❌ [MUX PLAYER] Error event:', event);
	}

	function handlePlaybackStart(event: Event) {
		console.log('▶️ [MUX PLAYER] Playback started for stream:', stream.id);
	}

	function handlePlaybackPause(event: Event) {
		console.log('⏸️ [MUX PLAYER] Playback paused for stream:', stream.id);
	}

	// Log component mount
	$effect(() => {
		console.log('🎬 [MUX PLAYER] Component mounted');
		console.log('🎬 [MUX PLAYER] Stream ID:', stream.id);
		console.log('🎬 [MUX PLAYER] Stream title:', stream.title);
		console.log('🎬 [MUX PLAYER] Playback ID:', playbackId());
		console.log('🎬 [MUX PLAYER] Autoplay:', autoplay);
		console.log('🎬 [MUX PLAYER] Muted:', muted);
	});
</script>

{#if playbackId()}
	<div class="mux-player-wrapper">
		<!-- Show stream title if enabled -->
		{#if showTitle}
			<div class="stream-header">
				<h3>{stream.title}</h3>
				{#if isLive()}
					<span class="live-badge">🔴 LIVE</span>
				{/if}
			</div>
		{/if}

		<!-- Mux Video Player -->
		<!-- See: https://docs.mux.com/guides/video/mux-player-web -->
		<mux-player
			playback-id={playbackId()}
			metadata-video-title={stream.title}
			metadata-viewer-user-id="anonymous"
			stream-type={streamType()}
			autoplay={autoplay}
			muted={muted}
			controls
			onloadedmetadata={handlePlayerReady}
			onerror={handlePlayerError}
			onplay={handlePlaybackStart}
			onpause={handlePlaybackPause}
		></mux-player>

		<!-- Stream info footer -->
		{#if stream.description}
			<div class="stream-description">
				<p>{stream.description}</p>
			</div>
		{/if}
	</div>
{:else}
	<!-- Fallback when no playback ID available -->
	<div class="no-player-message">
		<div class="message-content">
			<p>⚠️ Stream not yet available</p>
			{#if stream.status === 'scheduled'}
				<p class="help-text">
					This stream is scheduled and will be available when it goes live.
				</p>
			{:else if stream.status === 'completed' && !stream.mux?.recordingReady}
				<p class="help-text">
					Recording is being processed. Please check back shortly.
				</p>
			{:else}
				<p class="help-text">
					Stream configuration is incomplete. Please contact support.
				</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.mux-player-wrapper {
		width: 100%;
		background: #000;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.stream-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.8);
		color: white;
	}

	.stream-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.live-badge {
		background: #ef4444;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
	}


	/* Mux Player styling */
	mux-player {
		width: 100%;
		aspect-ratio: 16 / 9;
		--media-object-fit: contain;
		--media-object-position: center;
	}

	.stream-description {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.8);
		color: #d1d5db;
	}

	.stream-description p {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	/* No player message styling */
	.no-player-message {
		width: 100%;
		aspect-ratio: 16 / 9;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
		border-radius: 0.5rem;
		border: 2px dashed #374151;
	}

	.message-content {
		text-align: center;
		padding: 2rem;
		color: #9ca3af;
	}

	.message-content p {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 500;
	}

	.help-text {
		font-size: 0.875rem !important;
		color: #6b7280 !important;
		font-weight: 400 !important;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.stream-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.stream-header h3 {
			font-size: 1rem;
		}

		mux-player {
			aspect-ratio: 16 / 9;
		}
	}
</style>
