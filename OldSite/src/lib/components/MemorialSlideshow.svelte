<script lang="ts">
	import { Play, Pause, SkipForward, SkipBack } from 'lucide-svelte';
	
	interface SlideshowPhoto {
		id: string;
		data: string; // base64 data
		caption?: string;
	}
	
	interface SlideshowData {
		id: string;
		title: string;
		photos: SlideshowPhoto[];
		settings: {
			duration: number;
			transition: string;
		};
		createdAt: string;
	}
	
	interface Props {
		slideshow: SlideshowData;
	}
	
	let { slideshow }: Props = $props();
	
	let currentSlide = $state(0);
	let isPlaying = $state(false);
	let playInterval: number | null = null;
	let slideKey = $state(0);
	
	function nextSlide() {
		if (slideshow.photos.length > 0) {
			currentSlide = (currentSlide + 1) % slideshow.photos.length;
			slideKey += 1;
		}
	}
	
	function prevSlide() {
		if (slideshow.photos.length > 0) {
			currentSlide = currentSlide === 0 ? slideshow.photos.length - 1 : currentSlide - 1;
			slideKey += 1;
		}
	}
	
	function togglePlayback() {
		isPlaying = !isPlaying;
		if (isPlaying) {
			playInterval = setInterval(nextSlide, slideshow.settings.duration);
		} else if (playInterval) {
			clearInterval(playInterval);
			playInterval = null;
		}
	}
	
	function goToSlide(index: number) {
		if (index !== currentSlide) {
			currentSlide = index;
			slideKey += 1;
		}
	}
	
	// Cleanup on destroy
	$effect(() => {
		return () => {
			if (playInterval) {
				clearInterval(playInterval);
			}
		};
	});
</script>

<div class="memorial-slideshow">
	<div class="slideshow-header">
		<h3 class="slideshow-title">{slideshow.title}</h3>
		<div class="slideshow-meta">
			{slideshow.photos.length} photos • Created {new Date(slideshow.createdAt).toLocaleDateString()}
		</div>
	</div>
	
	<div class="slideshow-container">
		<!-- Main Display -->
		<div class="slideshow-display">
			{#if slideshow.photos[currentSlide]}
				{#key slideKey}
					<img 
						src={slideshow.photos[currentSlide].data} 
						alt={slideshow.photos[currentSlide].caption || `Slide ${currentSlide + 1}`}
						class="slideshow-image transition-{slideshow.settings.transition}"
					/>
				{/key}
				
				{#if slideshow.photos[currentSlide].caption}
					<div class="slideshow-caption">
						{slideshow.photos[currentSlide].caption}
					</div>
				{/if}
			{/if}
			
			<!-- Slide Counter -->
			<div class="slide-counter">
				{currentSlide + 1} / {slideshow.photos.length}
			</div>
		</div>
		
		<!-- Controls -->
		<div class="slideshow-controls">
			<button onclick={prevSlide} class="control-btn" disabled={slideshow.photos.length <= 1}>
				<SkipBack class="w-4 h-4" />
			</button>
			<button onclick={togglePlayback} class="control-btn play-btn">
				{#if isPlaying}
					<Pause class="w-5 h-5" />
				{:else}
					<Play class="w-5 h-5" />
				{/if}
			</button>
			<button onclick={nextSlide} class="control-btn" disabled={slideshow.photos.length <= 1}>
				<SkipForward class="w-4 h-4" />
			</button>
		</div>
		
		<!-- Thumbnail Navigation -->
		{#if slideshow.photos.length > 1}
			<div class="thumbnail-nav">
				{#each slideshow.photos as photo, index (photo.id)}
					<button 
						class="thumbnail" 
						class:active={index === currentSlide}
						onclick={() => goToSlide(index)}
					>
						<img src={photo.data} alt="Thumbnail {index + 1}" />
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.memorial-slideshow {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}
	
	.slideshow-header {
		margin-bottom: 1.5rem;
		text-align: center;
	}
	
	.slideshow-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}
	
	.slideshow-meta {
		font-size: 0.875rem;
		color: #6b7280;
	}
	
	.slideshow-container {
		max-width: 700px;
		margin: 0 auto;
	}
	
	.slideshow-display {
		position: relative;
		border-radius: 12px;
		overflow: hidden;
		background: #000;
		margin-bottom: 1.5rem;
	}
	
	.slideshow-image {
		width: 100%;
		height: 400px;
		object-fit: contain;
		background: #000;
	}
	
	.transition-fade {
		animation: fadeIn 0.5s ease-in-out;
	}
	
	.transition-slide {
		animation: slideIn 0.5s ease-in-out;
	}
	
	.transition-zoom {
		animation: zoomIn 0.5s ease-in-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	@keyframes slideIn {
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	}
	
	@keyframes zoomIn {
		from { transform: scale(0.8); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
	
	.slideshow-caption {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
		color: white;
		padding: 2rem 1.5rem 1rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}
	
	.slide-counter {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
	}
	
	.slideshow-controls {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	
	.control-btn {
		padding: 0.75rem;
		background: #f3f4f6;
		color: #374151;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.control-btn:hover:not(:disabled) {
		background: #e5e7eb;
		transform: translateY(-1px);
	}
	
	.control-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.play-btn {
		background: #3b82f6;
		color: white;
		padding: 1rem;
	}
	
	.play-btn:hover {
		background: #2563eb;
	}
	
	.thumbnail-nav {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		max-width: 600px;
		margin: 0 auto;
	}
	
	.thumbnail {
		width: 50px;
		height: 50px;
		border-radius: 6px;
		overflow: hidden;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		background: none;
		padding: 0;
	}
	
	.thumbnail:hover {
		transform: scale(1.05);
	}
	
	.thumbnail.active {
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}
	
	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	/* Responsive Design */
	@media (max-width: 768px) {
		.memorial-slideshow {
			padding: 1rem;
		}
		
		.slideshow-image {
			height: 300px;
		}
		
		.slideshow-controls {
			gap: 0.5rem;
		}
		
		.control-btn {
			padding: 0.5rem;
		}
		
		.play-btn {
			padding: 0.75rem;
		}
		
		.thumbnail {
			width: 40px;
			height: 40px;
		}
		
		.thumbnail-nav {
			gap: 0.25rem;
		}
	}
</style>
