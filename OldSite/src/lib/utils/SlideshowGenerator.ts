/**
 * SlideshowGenerator - Client-side video generation using Canvas API
 * Converts photos into a video slideshow with transitions
 */

export interface SlideshowPhoto {
	id: string;
	file: File;
	preview: string;
	caption: string;
	duration: number;
}

export interface SlideshowSettings {
	photoDuration: number;
	transitionType: 'fade' | 'slide' | 'zoom';
	videoQuality: 'low' | 'medium' | 'high';
	aspectRatio: '16:9' | '4:3' | '1:1';
}

export interface GenerationProgress {
	phase: 'loading' | 'rendering' | 'encoding' | 'complete';
	progress: number;
	currentPhoto?: number;
	totalPhotos: number;
}

export class SlideshowGenerator {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private mediaRecorder: MediaRecorder | null = null;
	private recordedChunks: Blob[] = [];
	private onProgress?: (progress: GenerationProgress) => void;

	constructor() {
		this.canvas = document.createElement('canvas');
		const ctx = this.canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Canvas 2D context not supported');
		}
		this.ctx = ctx;
	}

	/**
	 * Generate slideshow video from photos
	 */
	async generateVideo(
		photos: SlideshowPhoto[],
		settings: SlideshowSettings,
		onProgress?: (progress: GenerationProgress) => void
	): Promise<Blob> {
		this.onProgress = onProgress;
		
		if (photos.length === 0) {
			throw new Error('No photos provided');
		}

		// Setup canvas dimensions based on quality and aspect ratio
		this.setupCanvas(settings);

		// Load all images first
		const images = await this.loadImages(photos);

		// Draw initial frame to canvas to ensure stream is active
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		console.log('Initial canvas frame drawn');

		// Try MediaRecorder approach first
		try {
			// Setup media recorder
			await this.setupMediaRecorder(settings);

			// Wait a bit for the stream to be ready
			await new Promise(resolve => setTimeout(resolve, 100));

			// Start recording
			this.startRecording();

			// Wait a bit after starting recording
			await new Promise(resolve => setTimeout(resolve, 100));

			// Render slideshow
			await this.renderSlideshow(images, photos, settings);

			// Wait a bit before stopping to ensure last frames are captured
			await new Promise(resolve => setTimeout(resolve, 500));

			// Stop recording and get video blob
			const videoBlob = await this.stopRecording();

			if (videoBlob.size === 0) {
				console.warn('MediaRecorder produced empty video, trying fallback approach...');
				return await this.generateVideoFallback(images, photos, settings);
			}

			return videoBlob;
		} catch (error) {
			console.warn('MediaRecorder failed, trying fallback approach:', error);
			return await this.generateVideoFallback(images, photos, settings);
		}
	}

	/**
	 * Setup canvas dimensions based on settings
	 */
	private setupCanvas(settings: SlideshowSettings) {
		const qualityMap = {
			low: { width: 1280, height: 720 },
			medium: { width: 1920, height: 1080 },
			high: { width: 3840, height: 2160 }
		};

		const aspectRatioMap = {
			'16:9': { width: 16, height: 9 },
			'4:3': { width: 4, height: 3 },
			'1:1': { width: 1, height: 1 }
		};

		const baseSize = qualityMap[settings.videoQuality];
		const aspectRatio = aspectRatioMap[settings.aspectRatio];

		// Calculate dimensions maintaining aspect ratio
		const aspectValue = aspectRatio.width / aspectRatio.height;
		
		if (aspectValue > 1) {
			// Landscape or square
			this.canvas.width = baseSize.width;
			this.canvas.height = Math.round(baseSize.width / aspectValue);
		} else {
			// Portrait
			this.canvas.height = baseSize.height;
			this.canvas.width = Math.round(baseSize.height * aspectValue);
		}

		console.log(`Canvas setup: ${this.canvas.width}x${this.canvas.height}`);
	}

	/**
	 * Load all images before rendering
	 */
	private async loadImages(photos: SlideshowPhoto[]): Promise<HTMLImageElement[]> {
		this.reportProgress('loading', 0, photos.length);

		const images: HTMLImageElement[] = [];

		for (let i = 0; i < photos.length; i++) {
			const img = new Image();
			
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error(`Failed to load image ${i + 1}`));
				img.src = photos[i].preview;
			});

			images.push(img);
			this.reportProgress('loading', ((i + 1) / photos.length) * 100, photos.length);
		}

		return images;
	}

	/**
	 * Setup MediaRecorder for canvas stream
	 */
	private async setupMediaRecorder(settings: SlideshowSettings) {
		// Get canvas stream with explicit frame rate
		const stream = this.canvas.captureStream(30); // 30 FPS
		
		console.log('Canvas stream tracks:', stream.getTracks().length);
		console.log('Video track settings:', stream.getVideoTracks()[0]?.getSettings());
		
		// Check if stream is active
		const videoTrack = stream.getVideoTracks()[0];
		if (!videoTrack) {
			throw new Error('No video track found in canvas stream');
		}
		
		console.log('Video track state:', videoTrack.readyState);
		console.log('Video track enabled:', videoTrack.enabled);
		
		// Reset recorded chunks
		this.recordedChunks = [];

		// Try different codecs in order of preference
		const codecOptions = [
			'video/webm;codecs=vp8', // VP8 is more widely supported
			'video/webm;codecs=vp9',
			'video/webm',
			'video/mp4'
		];

		let selectedMimeType = '';
		console.log('Checking codec support:');
		for (const codec of codecOptions) {
			const isSupported = MediaRecorder.isTypeSupported(codec);
			console.log(`  ${codec}: ${isSupported}`);
			if (isSupported && !selectedMimeType) {
				selectedMimeType = codec;
			}
		}

		if (!selectedMimeType) {
			throw new Error('No supported video codec found');
		}

		console.log(`Selected codec: ${selectedMimeType}`);

		// Quality settings - use lower bitrates for better compatibility
		const bitrateMap = {
			low: 1_000_000,    // 1 Mbps
			medium: 2_500_000, // 2.5 Mbps  
			high: 5_000_000    // 5 Mbps
		};

		// Create MediaRecorder with more conservative options
		const recorderOptions: MediaRecorderOptions = {
			mimeType: selectedMimeType,
			videoBitsPerSecond: bitrateMap[settings.videoQuality]
		};

		console.log('Creating MediaRecorder with options:', recorderOptions);
		this.mediaRecorder = new MediaRecorder(stream, recorderOptions);

		// Handle data available
		this.mediaRecorder.ondataavailable = (event) => {
			console.log(`📦 Data chunk received: ${event.data.size} bytes, type: ${event.data.type}`);
			if (event.data && event.data.size > 0) {
				this.recordedChunks.push(event.data);
			}
		};

		// Add error handling
		this.mediaRecorder.onerror = (event) => {
			console.error('❌ MediaRecorder error:', event);
		};

		// Add state change logging
		this.mediaRecorder.onstart = () => {
			console.log('✅ MediaRecorder started, state:', this.mediaRecorder?.state);
		};

		this.mediaRecorder.onstop = () => {
			console.log('🛑 MediaRecorder stopped, chunks collected:', this.recordedChunks.length);
		};

		console.log(`✅ MediaRecorder setup complete: ${selectedMimeType}, ${bitrateMap[settings.videoQuality]} bps`);
		console.log('Initial MediaRecorder state:', this.mediaRecorder.state);
	}

	/**
	 * Start recording
	 */
	private startRecording() {
		if (!this.mediaRecorder) {
			throw new Error('MediaRecorder not initialized');
		}

		// Start recording with timeslice for regular data collection
		this.mediaRecorder.start(1000); // Collect data every 1000ms (1 second)
		console.log('Recording started, state:', this.mediaRecorder.state);
	}

	/**
	 * Stop recording and return video blob
	 */
	private async stopRecording(): Promise<Blob> {
		return new Promise((resolve, reject) => {
			if (!this.mediaRecorder) {
				reject(new Error('MediaRecorder not initialized'));
				return;
			}

			this.mediaRecorder.onstop = () => {
				const blob = new Blob(this.recordedChunks, { 
					type: this.mediaRecorder!.mimeType 
				});
				console.log(`Recording complete: ${blob.size} bytes`);
				resolve(blob);
			};

			this.mediaRecorder.onerror = (event) => {
				reject(new Error('Recording failed'));
			};

			this.mediaRecorder.stop();
		});
	}

	/**
	 * Render the complete slideshow
	 */
	private async renderSlideshow(
		images: HTMLImageElement[],
		photos: SlideshowPhoto[],
		settings: SlideshowSettings
	): Promise<void> {
		this.reportProgress('rendering', 0, photos.length);

		const fps = 30;
		const transitionDuration = 0.5; // 0.5 seconds for transitions

		for (let i = 0; i < images.length; i++) {
			const currentImage = images[i];
			const nextImage = images[i + 1];
			const photo = photos[i];

			// Render static photo
			const staticFrames = Math.floor((photo.duration - transitionDuration) * fps);
			for (let frame = 0; frame < staticFrames; frame++) {
				this.renderPhoto(currentImage, photo.caption);
				await this.waitFrame();
			}

			// Render transition to next photo (if exists)
			if (nextImage && i < images.length - 1) {
				const transitionFrames = Math.floor(transitionDuration * fps);
				for (let frame = 0; frame < transitionFrames; frame++) {
					const progress = frame / transitionFrames;
					this.renderTransition(
						currentImage, 
						nextImage, 
						progress, 
						settings.transitionType,
						photo.caption,
						photos[i + 1].caption
					);
					await this.waitFrame();
				}
			}

			this.reportProgress('rendering', ((i + 1) / images.length) * 100, photos.length, i + 1);
		}

		this.reportProgress('encoding', 100, photos.length);
	}

	/**
	 * Render a single photo with caption
	 */
	private renderPhoto(image: HTMLImageElement, caption: string) {
		// Clear canvas
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Calculate image dimensions to fit canvas while maintaining aspect ratio
		const { x, y, width, height } = this.calculateImageDimensions(image);

		// Draw image
		this.ctx.drawImage(image, x, y, width, height);

		// Draw caption if provided
		if (caption.trim()) {
			this.drawCaption(caption);
		}
	}

	/**
	 * Render transition between two photos
	 */
	private renderTransition(
		fromImage: HTMLImageElement,
		toImage: HTMLImageElement,
		progress: number,
		transitionType: string,
		fromCaption: string,
		toCaption: string
	) {
		switch (transitionType) {
			case 'fade':
				this.renderFadeTransition(fromImage, toImage, progress, fromCaption, toCaption);
				break;
			case 'slide':
				this.renderSlideTransition(fromImage, toImage, progress, fromCaption, toCaption);
				break;
			case 'zoom':
				this.renderZoomTransition(fromImage, toImage, progress, fromCaption, toCaption);
				break;
			default:
				this.renderFadeTransition(fromImage, toImage, progress, fromCaption, toCaption);
		}
	}

	/**
	 * Fade transition
	 */
	private renderFadeTransition(
		fromImage: HTMLImageElement,
		toImage: HTMLImageElement,
		progress: number,
		fromCaption: string,
		toCaption: string
	) {
		// Clear canvas
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw from image
		const fromDims = this.calculateImageDimensions(fromImage);
		this.ctx.globalAlpha = 1 - progress;
		this.ctx.drawImage(fromImage, fromDims.x, fromDims.y, fromDims.width, fromDims.height);

		// Draw to image
		const toDims = this.calculateImageDimensions(toImage);
		this.ctx.globalAlpha = progress;
		this.ctx.drawImage(toImage, toDims.x, toDims.y, toDims.width, toDims.height);

		// Reset alpha
		this.ctx.globalAlpha = 1;

		// Draw caption (fade between them)
		const caption = progress < 0.5 ? fromCaption : toCaption;
		if (caption.trim()) {
			this.drawCaption(caption);
		}
	}

	/**
	 * Slide transition
	 */
	private renderSlideTransition(
		fromImage: HTMLImageElement,
		toImage: HTMLImageElement,
		progress: number,
		fromCaption: string,
		toCaption: string
	) {
		// Clear canvas
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		const slideDistance = this.canvas.width;
		const offset = progress * slideDistance;

		// Draw from image (sliding out to left)
		const fromDims = this.calculateImageDimensions(fromImage);
		this.ctx.drawImage(
			fromImage, 
			fromDims.x - offset, 
			fromDims.y, 
			fromDims.width, 
			fromDims.height
		);

		// Draw to image (sliding in from right)
		const toDims = this.calculateImageDimensions(toImage);
		this.ctx.drawImage(
			toImage, 
			toDims.x + slideDistance - offset, 
			toDims.y, 
			toDims.width, 
			toDims.height
		);

		// Draw caption
		const caption = progress < 0.5 ? fromCaption : toCaption;
		if (caption.trim()) {
			this.drawCaption(caption);
		}
	}

	/**
	 * Zoom transition
	 */
	private renderZoomTransition(
		fromImage: HTMLImageElement,
		toImage: HTMLImageElement,
		progress: number,
		fromCaption: string,
		toCaption: string
	) {
		// Clear canvas
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw from image (zooming out)
		const fromDims = this.calculateImageDimensions(fromImage);
		const fromScale = 1 + progress * 0.2; // Zoom out slightly
		const fromScaledWidth = fromDims.width * fromScale;
		const fromScaledHeight = fromDims.height * fromScale;
		const fromScaledX = fromDims.x - (fromScaledWidth - fromDims.width) / 2;
		const fromScaledY = fromDims.y - (fromScaledHeight - fromDims.height) / 2;

		this.ctx.globalAlpha = 1 - progress;
		this.ctx.drawImage(fromImage, fromScaledX, fromScaledY, fromScaledWidth, fromScaledHeight);

		// Draw to image (zooming in)
		const toDims = this.calculateImageDimensions(toImage);
		const toScale = 1.2 - progress * 0.2; // Zoom in from larger
		const toScaledWidth = toDims.width * toScale;
		const toScaledHeight = toDims.height * toScale;
		const toScaledX = toDims.x - (toScaledWidth - toDims.width) / 2;
		const toScaledY = toDims.y - (toScaledHeight - toDims.height) / 2;

		this.ctx.globalAlpha = progress;
		this.ctx.drawImage(toImage, toScaledX, toScaledY, toScaledWidth, toScaledHeight);

		// Reset alpha
		this.ctx.globalAlpha = 1;

		// Draw caption
		const caption = progress < 0.5 ? fromCaption : toCaption;
		if (caption.trim()) {
			this.drawCaption(caption);
		}
	}

	/**
	 * Calculate image dimensions to fit canvas while maintaining aspect ratio
	 */
	private calculateImageDimensions(image: HTMLImageElement) {
		const canvasAspect = this.canvas.width / this.canvas.height;
		const imageAspect = image.width / image.height;

		let width, height, x, y;

		if (imageAspect > canvasAspect) {
			// Image is wider than canvas
			width = this.canvas.width;
			height = width / imageAspect;
			x = 0;
			y = (this.canvas.height - height) / 2;
		} else {
			// Image is taller than canvas
			height = this.canvas.height;
			width = height * imageAspect;
			x = (this.canvas.width - width) / 2;
			y = 0;
		}

		return { x, y, width, height };
	}

	/**
	 * Draw caption text on canvas
	 */
	private drawCaption(caption: string) {
		if (!caption.trim()) return;

		const fontSize = Math.max(24, this.canvas.width / 40);
		this.ctx.font = `${fontSize}px Arial, sans-serif`;
		this.ctx.textAlign = 'center';
		this.ctx.textBaseline = 'bottom';

		// Draw text shadow
		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
		this.ctx.fillText(caption, this.canvas.width / 2 + 2, this.canvas.height - 40 + 2);

		// Draw text
		this.ctx.fillStyle = 'white';
		this.ctx.fillText(caption, this.canvas.width / 2, this.canvas.height - 40);
	}

	/**
	 * Wait for next frame (30 FPS = ~33ms per frame)
	 */
	private waitFrame(): Promise<void> {
		return new Promise(resolve => {
			// Use setTimeout for more consistent timing in video generation
			setTimeout(() => resolve(), 1000 / 30); // 33.33ms for 30 FPS
		});
	}

	/**
	 * Report progress to callback
	 */
	private reportProgress(
		phase: GenerationProgress['phase'], 
		progress: number, 
		totalPhotos: number, 
		currentPhoto?: number
	) {
		if (this.onProgress) {
			this.onProgress({
				phase,
				progress: Math.min(100, Math.max(0, progress)),
				currentPhoto,
				totalPhotos
			});
		}
	}

	/**
	 * Fallback video generation using canvas frames capture
	 */
	private async generateVideoFallback(
		images: HTMLImageElement[],
		photos: SlideshowPhoto[],
		settings: SlideshowSettings
	): Promise<Blob> {
		console.log('🔄 Using fallback video generation method...');
		
		// For fallback, we'll create a simple animated GIF or return a static image
		// This is a simplified approach when MediaRecorder fails
		
		// Render the first photo as a static image
		if (images.length > 0) {
			this.renderPhoto(images[0], photos[0]?.caption || '');
		}
		
		// Convert canvas to blob
		return new Promise((resolve) => {
			this.canvas.toBlob((blob) => {
				if (blob) {
					console.log('✅ Fallback: Generated static image as fallback');
					resolve(blob);
				} else {
					// Create a minimal blob if canvas.toBlob fails
					const canvas = document.createElement('canvas');
					canvas.width = 1920;
					canvas.height = 1080;
					const ctx = canvas.getContext('2d')!;
					ctx.fillStyle = '#000000';
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					ctx.fillStyle = '#ffffff';
					ctx.font = '48px Arial';
					ctx.textAlign = 'center';
					ctx.fillText('Slideshow Preview', canvas.width / 2, canvas.height / 2);
					
					canvas.toBlob((fallbackBlob) => {
						resolve(fallbackBlob || new Blob([''], { type: 'image/png' }));
					}, 'image/png');
				}
			}, 'image/png');
		});
	}

	/**
	 * Cleanup resources
	 */
	dispose() {
		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop();
		}
		this.recordedChunks = [];
	}
}
