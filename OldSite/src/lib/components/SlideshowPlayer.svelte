<script lang="ts">
	import type { MemorialSlideshow } from '$lib/types/slideshow';
	import { Play, Pause, SkipForward, SkipBack } from 'lucide-svelte';
	
	interface Props {
		slideshow: MemorialSlideshow;
		autoplay?: boolean;
		controls?: boolean;
		editable?: boolean;
		currentUserId?: string;
	}
	
	let { slideshow, autoplay = false, controls = true, editable = false, currentUserId }: Props = $props();
	
	// Check if current user can edit this specific slideshow
	const canEditThisSlideshow = $derived(() => {
		if (!editable || !currentUserId) return false;
		return slideshow.createdBy === currentUserId;
	});
	
	// Handle slideshow editing
	function handleSlideshowEdit() {
		if (!canEditThisSlideshow()) return;
		
		// Navigate to slideshow generator with slideshow data
		const slideshowData = encodeURIComponent(JSON.stringify({
			id: slideshow.id,
			title: slideshow.title,
			photos: slideshow.photos,
			settings: slideshow.settings,
			memorialId: slideshow.memorialId
		}));
		
		window.location.href = `/slideshow-generator?edit=${slideshowData}`;
	}
	
	// Local slideshow player state
	let currentSlide = $state(0);
	let isPlaying = $state(autoplay);
	let slideInterval: ReturnType<typeof setInterval> | null = null;
	
	// Firebase Storage video source
	const videoSrc = $derived(() => {
		return slideshow.playbackUrl; // Firebase Storage URL for WebM video
	});
	
	const posterImage = $derived(() => slideshow.thumbnailUrl || '');
	
	// Local slideshow functions
	function nextSlide() {
		currentSlide = (currentSlide + 1) % slideshow.photos.length;
	}
	
	function prevSlide() {
		currentSlide = currentSlide === 0 ? slideshow.photos.length - 1 : currentSlide - 1;
	}
	
	function togglePlayback() {
		isPlaying = !isPlaying;
		if (isPlaying) {
			startSlideshow();
		} else {
			stopSlideshow();
		}
	}
	
	function startSlideshow() {
		if (slideInterval) clearInterval(slideInterval);
		const duration = (slideshow.settings?.photoDuration || 3) * 1000;
		slideInterval = setInterval(nextSlide, duration);
	}
	
	function stopSlideshow() {
		if (slideInterval) {
			clearInterval(slideInterval);
			slideInterval = null;
		}
	}
	
	// Auto-start slideshow if autoplay is enabled
	$effect(() => {
		if (isPlaying) {
			startSlideshow();
		}
		return () => stopSlideshow();
	});
	
	// Calculate total duration based on photo count and settings
	const totalDuration = $derived(() => {
		const photoDuration = slideshow.settings?.photoDuration || 3;
		return slideshow.photos.length * photoDuration;
	});
</script>

{#if slideshow.embedCode}
	<!-- Custom Embed Code - Takes Priority -->
	<div class="slideshow-player embed-mode" class:editable={canEditThisSlideshow()}>
		<div class="player-actions">
			{#if canEditThisSlideshow()}
				<button 
					class="action-btn edit-btn"
					onclick={handleSlideshowEdit}
					title="Click to edit slideshow"
				>
					✏️ Edit
				</button>
			{/if}
		</div>
		
		<div class="embed-container">
			{@html slideshow.embedCode}
		</div>
		
		<div class="embed-badge">
			<span>📺 Custom Embed</span>
		</div>
	</div>
{:else if slideshow.status === 'ready' && videoSrc()}
	<!-- Firebase Storage WebM Video Player -->
	<div class="slideshow-player" class:editable={canEditThisSlideshow()}>
		<div class="player-actions">
			{#if canEditThisSlideshow()}
				<button 
					class="action-btn edit-btn"
					onclick={handleSlideshowEdit}
					title="Click to edit slideshow"
				>
					✏️ Edit
				</button>
			{/if}
		</div>
		
		<div class="video-container">
			<video
				src={videoSrc()}
				{controls}
				{autoplay}
				poster={posterImage()}
				class="webm-player"
				preload="metadata"
			>
				<track kind="captions" src="" srclang="en" label="English" />
				Your browser does not support the video tag.
			</video>
		</div>
		
		{#if slideshow.photos.some(p => p.caption)}
			<div class="slideshow-captions">
				<h4>Photo Captions</h4>
				<ul>
					{#each slideshow.photos.filter(p => p.caption) as photo, index}
						<li>
							<span class="caption-number">#{index + 1}</span>
							<span class="caption-text">{photo.caption}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{:else if slideshow.status === 'processing'}
	<div class="slideshow-processing">
		<div class="processing-content">
			<div class="spinner"></div>
			<h4>Processing Slideshow</h4>
			<p>Your slideshow "{slideshow.title}" is being transcoded to MP4/HLS format.</p>
			<p class="processing-note">This usually takes 1-5 minutes. The page will automatically update when ready.</p>
		</div>
	</div>
{:else if slideshow.status === 'error'}
	<div class="slideshow-error">
		<div class="error-content">
			<h4>Slideshow Unavailable</h4>
			<p>There was an issue processing "{slideshow.title}". Please try creating it again.</p>
		</div>
	</div>
{/if}

<style>
	.slideshow-player {
		background: #0a0a1a;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		margin-bottom: 2rem;
		border: 1px solid #1f2937;
		transition: all 0.3s ease;
		position: relative;
	}
	
	.player-actions {
		position: absolute;
		top: 1rem;
		left: 1rem;
		display: flex;
		gap: 0.5rem;
		z-index: 10;
	}
	
	.action-btn {
		background: rgba(213, 186, 127, 0.9);
		color: #0a0a1a;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.3s ease;
	}
	
	.action-btn:hover {
		background: rgba(213, 186, 127, 1);
		transform: scale(1.05);
	}
	
	.embed-container {
		position: relative;
		width: 100%;
		min-height: 400px;
		background: #000;
		border-radius: 16px;
		overflow: hidden;
	}
	
	.embed-container :global(iframe) {
		width: 100%;
		height: 100%;
		min-height: 400px;
		border: none;
		display: block;
	}
	
	.embed-badge {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		background: rgba(139, 92, 246, 0.9);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		z-index: 10;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}
	
	.embed-badge span {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.video-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16/9;
		background: #000;
		border-radius: 16px;
		overflow: hidden;
	}
	
	.webm-player {
		width: 100%;
		height: 100%;
		border: none;
		display: block;
	}
	
	.slideshow-captions {
		padding: 1.5rem;
		background: #f9fafb;
		border-top: 1px solid #e5e7eb;
	}
	
	.slideshow-captions h4 {
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 1rem 0;
	}
	
	.slideshow-captions ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	
	.slideshow-captions li {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem 0;
		color: #6b7280;
		border-bottom: 1px solid #e5e7eb;
		align-items: flex-start;
	}
	
	.slideshow-captions li:last-child {
		border-bottom: none;
	}
	
	.caption-number {
		font-weight: 600;
		color: #D5BA7F;
		min-width: 2rem;
		font-size: 0.875rem;
	}
	
	.caption-text {
		flex: 1;
		line-height: 1.5;
	}
	
	.slideshow-processing,
	.slideshow-error {
		background: white;
		border-radius: 12px;
		padding: 3rem;
		text-align: center;
		margin-bottom: 2rem;
		border: 1px solid #e5e7eb;
	}
	
	.local-slideshow-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16/9;
		background: #000;
		border-radius: 16px;
		overflow: hidden;
	}
	
	.slideshow-viewer {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.slide-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.slide-image {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		border-radius: 8px;
	}
	
	.slide-caption {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		right: 1rem;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		line-height: 1.4;
	}
	
	.slideshow-controls {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5rem;
		background: rgba(0, 0, 0, 0.7);
		padding: 0.5rem;
		border-radius: 8px;
	}
	
	.control-btn {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		border-radius: 6px;
		padding: 0.5rem;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}
	
	.control-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}
	
	.play-btn {
		background: #D5BA7F;
	}
	
	.play-btn:hover {
		background: #c4a96e;
	}
	
	.slide-indicator {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
	}
	
	.no-photos {
		color: #6b7280;
		text-align: center;
	}
	
	.processing-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}
	
	.processing-content h4,
	.error-content h4 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}
	
	.processing-content p,
	.error-content p {
		color: #6b7280;
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}
	
	.processing-note {
		font-size: 0.875rem;
		color: #9ca3af;
		margin: 0.5rem 0 0 0 !important;
	}
	
	.processing-meta {
		display: flex;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #9ca3af;
		justify-content: center;
		align-items: center;
	}
	
	.spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #D5BA7F;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	
	.slideshow-error {
		background: #fef2f2;
		border-color: #fecaca;
	}
	
	.error-content h4 {
		color: #dc2626;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	@media (max-width: 768px) {
		.slideshow-captions {
			padding: 1rem;
		}
		
		.slideshow-processing,
		.slideshow-error {
			padding: 2rem 1rem;
		}
	}
</style>
