/**
 * Image optimization utilities for Tributestream
 * Handles responsive image generation and format optimization
 */

export interface ImageOptimizationOptions {
	width?: number;
	height?: number;
	quality?: number;
	format?: 'webp' | 'avif' | 'jpg' | 'png' | 'auto';
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ResponsiveImageSet {
	src: string;
	srcset: string;
	webpSrcset?: string;
	avifSrcset?: string;
	sizes: string;
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function generateResponsiveImageSet(
	baseSrc: string, 
	options: ImageOptimizationOptions = {}
): ResponsiveImageSet {
	const { width = 800, quality = 80, format = 'auto' } = options;
	
	// Generate multiple sizes for responsive images
	const breakpoints = [
		Math.floor(width * 0.5),  // Small screens
		width,                    // Medium screens  
		Math.floor(width * 1.5),  // Large screens
		Math.floor(width * 2)     // High DPI screens
	];

	// For Firebase Storage URLs, we can't do server-side transformation
	// So we'll return the original URL for now
	if (baseSrc.includes('firebasestorage.googleapis.com')) {
		return {
			src: baseSrc,
			srcset: baseSrc,
			webpSrcset: baseSrc,
			avifSrcset: baseSrc,
			sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
		};
	}

	// For local images, generate Vite imagetools URLs
	const srcset = breakpoints
		.map(size => `${baseSrc}?w=${size}&q=${quality} ${size}w`)
		.join(', ');

	const webpSrcset = breakpoints
		.map(size => `${baseSrc}?w=${size}&q=${quality}&format=webp ${size}w`)
		.join(', ');

	const avifSrcset = breakpoints
		.map(size => `${baseSrc}?w=${size}&q=${quality}&format=avif ${size}w`)
		.join(', ');

	return {
		src: `${baseSrc}?w=${width}&q=${quality}`,
		srcset,
		webpSrcset,
		avifSrcset,
		sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
	};
}

/**
 * Optimize Firebase Storage image URL
 * This is a placeholder - Firebase Storage doesn't support URL transformation
 * In production, you'd want to use a service like Cloudinary or process images beforehand
 */
export function optimizeFirebaseImage(
	firebaseUrl: string, 
	options: ImageOptimizationOptions = {}
): string {
	// For now, return the original URL
	// TODO: Implement image optimization service integration
	return firebaseUrl;
}

/**
 * Check browser support for modern image formats
 */
export function checkImageFormatSupport(): Promise<{webp: boolean, avif: boolean}> {
	return new Promise((resolve) => {
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		
		const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
		
		// AVIF support check
		const avifImage = new Image();
		avifImage.onload = () => resolve({ webp: webpSupport, avif: true });
		avifImage.onerror = () => resolve({ webp: webpSupport, avif: false });
		avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
	});
}

/**
 * Calculate optimal image dimensions based on container and screen size
 */
export function calculateOptimalDimensions(
	containerWidth: number,
	containerHeight: number,
	devicePixelRatio: number = window.devicePixelRatio || 1
): { width: number; height: number } {
	return {
		width: Math.ceil(containerWidth * devicePixelRatio),
		height: Math.ceil(containerHeight * devicePixelRatio)
	};
}

/**
 * Generate blur placeholder data URL
 */
export function generateBlurPlaceholder(width: number = 40, height: number = 40): string {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	
	const ctx = canvas.getContext('2d');
	if (!ctx) return '';
	
	// Create a simple gradient placeholder
	const gradient = ctx.createLinearGradient(0, 0, width, height);
	gradient.addColorStop(0, '#f0f0f0');
	gradient.addColorStop(1, '#e0e0e0');
	
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, width, height);
	
	return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Preload critical images for better performance
 */
export function preloadImage(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve();
		img.onerror = reject;
		img.src = src;
	});
}

/**
 * Lazy load images with Intersection Observer
 */
export function createImageLazyLoader(
	callback: (entry: IntersectionObserverEntry) => void,
	options: IntersectionObserverInit = {}
): IntersectionObserver {
	const defaultOptions: IntersectionObserverInit = {
		rootMargin: '50px',
		threshold: 0.1,
		...options
	};

	return new IntersectionObserver((entries) => {
		entries.forEach(callback);
	}, defaultOptions);
}

/**
 * Convert file size to human readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Image optimization configuration
 */
export const IMAGE_OPTIMIZATION_CONFIG = {
	// Quality settings for different formats
	quality: {
		jpg: 80,
		webp: 80,
		avif: 70,
		png: 90
	},
	
	// Responsive breakpoints
	breakpoints: [400, 800, 1200, 1600],
	
	// Default sizes attribute
	defaultSizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
	
	// Lazy loading settings
	lazyLoading: {
		rootMargin: '50px',
		threshold: 0.1
	},
	
	// Placeholder settings
	placeholder: {
		blur: true,
		quality: 10,
		size: { width: 40, height: 40 }
	}
} as const;
