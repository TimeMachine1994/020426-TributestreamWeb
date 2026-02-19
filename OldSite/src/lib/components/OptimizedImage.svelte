<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		src: string;
		alt: string;
		width?: number;
		height?: number;
		sizes?: string;
		priority?: boolean; // For above-fold images (no lazy loading)
		quality?: number;
		class?: string;
		placeholder?: 'blur' | 'empty' | string;
		onLoad?: () => void;
		onError?: () => void;
	}

	let {
		src,
		alt,
		width,
		height,
		sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
		priority = false,
		quality = 80,
		class: className = '',
		placeholder = 'blur',
		onLoad,
		onError
	} = $props<Props>();

	let imgElement: HTMLImageElement = $state();
	let isLoaded = $state(false);
	let hasError = $state(false);
	let isIntersecting = $state(false);

	// Generate responsive image URLs using Vite imagetools syntax
	const generateResponsiveImages = (baseSrc: string, baseWidth?: number) => {
		// For Firebase Storage URLs, we'll optimize them differently
		if (baseSrc.includes('firebasestorage.googleapis.com')) {
			// Firebase Storage doesn't support URL transformation, so we'll use the original
			// In production, you'd want to pre-process these images or use a service
			return {
				src: baseSrc,
				srcset: baseSrc,
				webpSrcset: baseSrc,
				avifSrcset: baseSrc
			};
		}

		// For local images, we can use Vite imagetools syntax
		// This will be processed at build time
		const sizes = baseWidth 
			? [Math.floor(baseWidth * 0.5), baseWidth, Math.floor(baseWidth * 1.5)]
			: [400, 800, 1200];

		// Generate srcset for different formats
		const srcset = sizes.map(size => `${baseSrc}?w=${size}&q=${quality} ${size}w`).join(', ');
		const webpSrcset = sizes.map(size => `${baseSrc}?w=${size}&q=${quality}&format=webp ${size}w`).join(', ');
		const avifSrcset = sizes.map(size => `${baseSrc}?w=${size}&q=${quality}&format=avif ${size}w`).join(', ');

		return {
			src: `${baseSrc}?w=${width || 800}&q=${quality}`,
			srcset,
			webpSrcset,
			avifSrcset
		};
	};

	// Check if browser supports modern image formats
	const checkFormatSupport = () => {
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		
		return {
			webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
			avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
		};
	};

	let formatSupport = $state({ webp: false, avif: false });
	let responsiveImages = $derived(generateResponsiveImages(src, width));

	// Intersection Observer for lazy loading
	let observer: IntersectionObserver;

	onMount(() => {
		// Check format support
		formatSupport = checkFormatSupport();

		// Set up lazy loading if not priority
		if (!priority && imgElement) {
			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							isIntersecting = true;
							observer.unobserve(entry.target);
						}
					});
				},
				{
					rootMargin: '50px' // Start loading 50px before image comes into view
				}
			);

			observer.observe(imgElement);
		} else {
			isIntersecting = true;
		}

		return () => {
			if (observer) {
				observer.disconnect();
			}
		};
	});

	const handleLoad = () => {
		isLoaded = true;
		onLoad?.();
	};

	const handleError = () => {
		hasError = true;
		onError?.();
	};
</script>

<div class="optimized-image-container {className}" style:width={width ? `${width}px` : 'auto'} style:height={height ? `${height}px` : 'auto'}>
	{#if hasError}
		<!-- Error fallback -->
		<div class="image-error" role="img" aria-label={alt}>
			<div class="error-content">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
					<circle cx="8.5" cy="8.5" r="1.5"/>
					<polyline points="21,15 16,10 5,21"/>
				</svg>
				<p>Image failed to load</p>
			</div>
		</div>
	{:else if isIntersecting || priority}
		<!-- Modern browser support with picture element -->
		<picture>
			{#if formatSupport.avif && responsiveImages.avifSrcset}
				<source srcset={responsiveImages.avifSrcset} {sizes} type="image/avif" />
			{/if}
			{#if formatSupport.webp && responsiveImages.webpSrcset}
				<source srcset={responsiveImages.webpSrcset} {sizes} type="image/webp" />
			{/if}
			<img
				bind:this={imgElement}
				src={responsiveImages.src}
				srcset={responsiveImages.srcset}
				{sizes}
				{alt}
				{width}
				{height}
				loading={priority ? 'eager' : 'lazy'}
				decoding="async"
				class:loaded={isLoaded}
				class:loading={!isLoaded && !hasError}
				onload={handleLoad}
				onerror={handleError}
			/>
		</picture>
	{:else}
		<!-- Placeholder while not in viewport -->
		<div 
			bind:this={imgElement}
			class="image-placeholder" 
			role="img" 
			aria-label={alt}
			style:width={width ? `${width}px` : '100%'}
			style:height={height ? `${height}px` : 'auto'}
			style:aspect-ratio={width && height ? `${width}/${height}` : 'auto'}
		>
			{#if placeholder === 'blur'}
				<div class="blur-placeholder"></div>
			{:else if typeof placeholder === 'string' && placeholder !== 'empty'}
				<img src={placeholder} {alt} class="placeholder-img" />
			{/if}
		</div>
	{/if}
</div>

<style>
	.optimized-image-container {
		position: relative;
		display: inline-block;
		overflow: hidden;
	}

	img {
		max-width: 100%;
		height: auto;
		transition: opacity 0.3s ease, filter 0.3s ease;
	}

	img.loading {
		opacity: 0;
	}

	img.loaded {
		opacity: 1;
		filter: none !important;
	}

	.image-placeholder {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100px;
		border-radius: 4px;
	}

	.blur-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
		filter: blur(10px);
		border-radius: 4px;
	}

	.placeholder-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(5px);
		opacity: 0.7;
	}

	.image-error {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		border: 2px dashed #ddd;
		min-height: 200px;
		color: #666;
		border-radius: 4px;
	}

	.error-content {
		text-align: center;
	}

	.error-content svg {
		margin-bottom: 0.5rem;
		opacity: 0.5;
	}

	.error-content p {
		margin: 0;
		font-size: 0.875rem;
	}

	@keyframes loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Responsive behavior */
	@media (max-width: 768px) {
		.optimized-image-container {
			width: 100%;
		}
	}
</style>
