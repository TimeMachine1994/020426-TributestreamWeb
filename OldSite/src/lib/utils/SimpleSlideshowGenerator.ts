/**
 * Simplified slideshow generator with better MediaRecorder handling
 */

export interface SlideshowPhoto {
	id: string;
	file?: File;
	preview: string;
	caption?: string;
	duration: number;
}

export interface SlideshowSettings {
	photoDuration: number;
	transitionType: 'fade' | 'slide' | 'none';
	videoQuality: 'low' | 'medium' | 'high';
	aspectRatio: '16:9' | '4:3' | '1:1';
	audioVolume?: number;
	audioFadeIn?: boolean;
	audioFadeOut?: boolean;
}

export interface SlideshowAudio {
	file: File;
	duration: number;
	volume: number;
	fadeIn: boolean;
	fadeOut: boolean;
}

export interface GenerationProgress {
	phase: 'loading' | 'rendering' | 'encoding';
	progress: number;
	currentPhoto?: number;
	totalPhotos: number;
}

export class SimpleSlideshowGenerator {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private mediaRecorder: MediaRecorder | null = null;
	private recordedChunks: Blob[] = [];
	private onProgress?: (progress: GenerationProgress) => void;
	private audioContext: AudioContext | null = null;
	private audioBuffer: AudioBuffer | null = null;
	private audioSource: AudioBufferSourceNode | null = null;
	private audioDestination: MediaStreamAudioDestinationNode | null = null;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not get 2D context from canvas');
		}
		this.ctx = ctx;
	}

	/**
	 * Generate slideshow video with simplified approach
	 */
	async generateVideo(
		photos: SlideshowPhoto[],
		settings: SlideshowSettings,
		onProgress?: (progress: GenerationProgress) => void,
		audio?: SlideshowAudio
	): Promise<Blob> {
		this.onProgress = onProgress;
		
		if (photos.length === 0) {
			throw new Error('No photos provided');
		}

		console.log('🎬 Starting simplified video generation...');
		console.log('📊 Input:', { photoCount: photos.length, settings, hasAudio: !!audio });

		try {
			// Setup canvas
			this.setupCanvas(settings);
			
			// Load audio if provided
			if (audio?.file) {
				await this.loadAudio(audio);
			}
			
			// Load images
			const images = await this.loadImages(photos);
			console.log(`✅ Loaded ${images.length} images`);

			// Calculate total slideshow duration
			const totalDuration = photos.reduce((sum, photo) => sum + photo.duration, 0);
			
			// Generate video with MediaRecorder (with or without audio)
			return await this.generateWithMediaRecorder(images, photos, settings, totalDuration, audio);
			
		} catch (error) {
			console.error('❌ Video generation failed:', error);
			throw error;
		}
	}

	/**
	 * Setup canvas dimensions
	 */
	private setupCanvas(settings: SlideshowSettings) {
		const dimensions = {
			'low': { width: 854, height: 480 },    // 480p
			'medium': { width: 1280, height: 720 }, // 720p
			'high': { width: 1920, height: 1080 }   // 1080p
		};

		const { width, height } = dimensions[settings.videoQuality];
		this.canvas.width = width;
		this.canvas.height = height;
		
		console.log(`🖼️ Canvas setup: ${width}x${height}`);
	}

	/**
	 * Load all images
	 */
	private async loadImages(photos: SlideshowPhoto[]): Promise<HTMLImageElement[]> {
		this.reportProgress('loading', 0, photos.length);

		const images = await Promise.all(
			photos.map((photo, index) => {
				return new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image();
					img.crossOrigin = 'anonymous'; // Handle CORS
					img.onload = () => {
						console.log(`✅ Loaded image ${index + 1}/${photos.length}`);
						resolve(img);
					};
					img.onerror = () => {
						console.error(`❌ Failed to load image ${index + 1}`);
						reject(new Error(`Failed to load image ${index + 1}`));
					};
					img.src = photo.preview;
				});
			})
		);

		this.reportProgress('loading', 100, photos.length);
		return images;
	}

	/**
	 * Load and prepare audio file
	 */
	private async loadAudio(audio: SlideshowAudio): Promise<void> {
		try {
			console.log('🎵 Loading audio file...');
			
			// Create audio context
			this.audioContext = new AudioContext();
			
			// Read file as ArrayBuffer
			const arrayBuffer = await audio.file.arrayBuffer();
			
			// Decode audio data
			this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
			
			console.log(`✅ Audio loaded: ${this.audioBuffer.duration.toFixed(2)}s`);
			
		} catch (error) {
			console.error('❌ Failed to load audio:', error);
			throw new Error('Failed to load audio file');
		}
	}

	/**
	 * Generate video using MediaRecorder
	 */
	private async generateWithMediaRecorder(
		images: HTMLImageElement[],
		photos: SlideshowPhoto[],
		settings: SlideshowSettings,
		totalDuration: number,
		audio?: SlideshowAudio
	): Promise<Blob> {
		console.log('🎥 Starting MediaRecorder generation...');

		// Draw first frame to initialize canvas
		this.drawPhoto(images[0], photos[0].caption || '');
		
		// Get canvas video stream
		const videoStream = this.canvas.captureStream(30);
		console.log('📹 Canvas stream created');

		// Prepare final stream
		let finalStream: MediaStream;
		
		if (audio && this.audioContext && this.audioBuffer) {
			console.log('🎵 Mixing audio with video...');
			
			// Create audio destination node
			this.audioDestination = this.audioContext.createMediaStreamDestination();
			
			// Create audio source
			this.audioSource = this.audioContext.createBufferSource();
			this.audioSource.buffer = this.audioBuffer;
			
			// Apply volume
			const gainNode = this.audioContext.createGain();
			gainNode.gain.value = audio.volume;
			
			// Handle looping if audio is shorter than video
			if (this.audioBuffer.duration < totalDuration) {
				console.log('🔁 Audio will loop (shorter than slideshow)');
				this.audioSource.loop = true;
			}
			
			// Handle fade in
			if (audio.fadeIn) {
				console.log('🎵 Applying fade in (2s)');
				gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
				gainNode.gain.linearRampToValueAtTime(audio.volume, this.audioContext.currentTime + 2);
			}
			
			// Handle fade out if audio is longer than video
			if (this.audioBuffer.duration > totalDuration && audio.fadeOut) {
				console.log('🎵 Will apply fade out at end');
				const fadeOutStart = totalDuration - 2; // 2 seconds before end
				gainNode.gain.setValueAtTime(audio.volume, this.audioContext.currentTime + fadeOutStart);
				gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + totalDuration);
			}
			
			// Connect audio nodes
			this.audioSource.connect(gainNode);
			gainNode.connect(this.audioDestination);
			
			// Start audio playback
			this.audioSource.start(0);
			
			// Combine video and audio streams
			const audioTrack = this.audioDestination.stream.getAudioTracks()[0];
			const videoTrack = videoStream.getVideoTracks()[0];
			
			finalStream = new MediaStream([videoTrack, audioTrack]);
			console.log('✅ Audio and video streams combined');
			
		} else {
			// No audio, use video stream only
			finalStream = videoStream;
			console.log('📹 Using video stream only (no audio)');
		}

		// Check for video track
		const videoTrack = finalStream.getVideoTracks()[0];
		if (!videoTrack) {
			throw new Error('No video track available');
		}

		console.log('📺 Final stream ready:', {
			videoTracks: finalStream.getVideoTracks().length,
			audioTracks: finalStream.getAudioTracks().length
		});

		// Find supported codec
		const codecs = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
		let mimeType = '';
		
		for (const codec of codecs) {
			if (MediaRecorder.isTypeSupported(codec)) {
				mimeType = codec;
				console.log(`✅ Using codec: ${codec}`);
				break;
			}
		}

		if (!mimeType) {
			throw new Error('No supported video codec found');
		}

		// Setup MediaRecorder
		this.recordedChunks = [];
		this.mediaRecorder = new MediaRecorder(finalStream, {
			mimeType,
			videoBitsPerSecond: 2000000, // 2 Mbps for better quality with audio
			audioBitsPerSecond: 128000   // 128 kbps for audio
		});

		// Setup event handlers
		this.mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				console.log(`📦 Chunk: ${event.data.size} bytes`);
				this.recordedChunks.push(event.data);
			}
		};

		// Start recording and render
		return new Promise((resolve, reject) => {
			this.mediaRecorder!.onstop = () => {
				console.log(`🛑 Recording stopped. Chunks: ${this.recordedChunks.length}`);
				
				// Stop audio source if exists
				if (this.audioSource) {
					this.audioSource.stop();
					this.audioSource.disconnect();
				}
				
				const blob = new Blob(this.recordedChunks, { type: mimeType });
				console.log(`📹 Final video: ${blob.size} bytes`);
				
				if (blob.size === 0) {
					reject(new Error('Generated video is empty'));
				} else {
					resolve(blob);
				}
			};

			this.mediaRecorder!.onerror = (event) => {
				console.error('❌ MediaRecorder error:', event);
				reject(new Error('MediaRecorder failed'));
			};

			// Start recording
			console.log('🔴 Starting recording...');
			this.mediaRecorder!.start(1000); // 1 second chunks

			// Render slideshow
			this.renderSlideshow(images, photos, settings).then(() => {
				console.log('🏁 Rendering complete, stopping recording...');
				setTimeout(() => {
					this.mediaRecorder!.stop();
				}, 500); // Wait a bit before stopping
			}).catch(reject);
		});
	}

	/**
	 * Render the slideshow animation
	 */
	private async renderSlideshow(
		images: HTMLImageElement[],
		photos: SlideshowPhoto[],
		settings: SlideshowSettings
	): Promise<void> {
		console.log('🎨 Starting slideshow rendering...');
		this.reportProgress('rendering', 0, photos.length);

		const fps = 30;
		const frameDuration = 1000 / fps; // ms per frame

		for (let i = 0; i < images.length; i++) {
			console.log(`🖼️ Rendering photo ${i + 1}/${images.length}`);
			
			// Show photo for specified duration
			const frames = Math.floor(photos[i].duration * fps);
			
			for (let frame = 0; frame < frames; frame++) {
				this.drawPhoto(images[i], photos[i].caption || '');
				await this.waitFrame(frameDuration);
			}

			this.reportProgress('rendering', ((i + 1) / images.length) * 100, photos.length, i + 1);
		}

		console.log('✅ Slideshow rendering complete');
	}

	/**
	 * Draw a photo on the canvas
	 */
	private drawPhoto(image: HTMLImageElement, caption: string) {
		// Clear canvas
		this.ctx.fillStyle = '#000000';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// Calculate image dimensions to fit canvas
		const canvasAspect = this.canvas.width / this.canvas.height;
		const imageAspect = image.width / image.height;

		let drawWidth, drawHeight, drawX, drawY;

		if (imageAspect > canvasAspect) {
			// Image is wider - fit to width
			drawWidth = this.canvas.width;
			drawHeight = drawWidth / imageAspect;
			drawX = 0;
			drawY = (this.canvas.height - drawHeight) / 2;
		} else {
			// Image is taller - fit to height
			drawHeight = this.canvas.height;
			drawWidth = drawHeight * imageAspect;
			drawX = (this.canvas.width - drawWidth) / 2;
			drawY = 0;
		}

		// Draw image
		this.ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

		// Draw caption if provided
		if (caption.trim()) {
			this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
			this.ctx.fillRect(0, this.canvas.height - 80, this.canvas.width, 80);
			
			this.ctx.fillStyle = '#ffffff';
			this.ctx.font = '24px Arial';
			this.ctx.textAlign = 'center';
			this.ctx.fillText(caption, this.canvas.width / 2, this.canvas.height - 30);
		}
	}

	/**
	 * Wait for next frame
	 */
	private waitFrame(duration: number): Promise<void> {
		return new Promise(resolve => {
			setTimeout(resolve, duration);
		});
	}

	/**
	 * Report progress
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
	 * Cleanup
	 */
	dispose() {
		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop();
		}
		if (this.audioSource) {
			this.audioSource.stop();
			this.audioSource.disconnect();
		}
		if (this.audioContext) {
			this.audioContext.close();
		}
		this.recordedChunks = [];
	}
}
