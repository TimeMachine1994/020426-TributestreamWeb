export interface MemorialSlideshow {
	id: string;
	title: string;
	memorialId: string;
	firebaseStoragePath: string; // Firebase Storage path (required)
	playbackUrl: string; // Firebase Storage video URL (required)
	thumbnailUrl?: string | null; // Optional thumbnail
	status: 'ready' | 'error' | 'processing' | 'local_only' | 'unpublished'; // Slideshow status
	isFirebaseHosted: boolean; // Always true for new slideshows
	photos: SlideshowPhoto[];
	settings: SlideshowSettings;
	audio?: SlideshowAudio; // Optional background audio
	embedCode?: string | null; // Custom embed code (iframe, etc.) - overrides generated slideshow
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface SlideshowPhoto {
	id: string;
	url: string; // Firebase Storage URL (required)
	storagePath: string; // Firebase Storage path for management (required)
	caption?: string;
	duration?: number;
}

export interface SlideshowSettings {
	photoDuration: number;
	transitionType: 'fade' | 'slide' | 'zoom';
	videoQuality: 'low' | 'medium' | 'high';
	aspectRatio: '16:9' | '4:3' | '1:1';
	audioVolume?: number; // 0-1, default 0.5
	audioFadeIn?: boolean; // Fade in at start
	audioFadeOut?: boolean; // Fade out at end
}

export interface SlideshowAudio {
	id: string;
	name: string;
	file?: File; // For upload
	url?: string; // Firebase Storage URL after upload
	storagePath?: string; // Firebase Storage path
	duration: number; // Audio duration in seconds
	size: number; // File size in bytes
	type: string; // MIME type (audio/mpeg, audio/wav, etc.)
}

export interface SlideshowGenerationProgress {
	progress: number;
	phase: 'loading' | 'rendering' | 'encoding' | 'complete';
	currentPhoto?: number;
	totalPhotos?: number;
}
