export interface VideoSource {
	id: string;
	type: 'webrtc' | 'local';
	stream: MediaStream;
	videoElement: HTMLVideoElement;
	label: string;
	connected: boolean;
}

export type TransitionType = 'cut' | 'fade';

export interface TransitionConfig {
	type: TransitionType;
	durationMs: number;
}

export interface BlendState {
	sourceA: { id: string; opacity: number } | null;
	sourceB: { id: string; opacity: number } | null;
	complete: boolean;
}

export interface OverlayItem {
	id: string;
	type: 'image' | 'text';
	visible: boolean;
	opacity: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface ImageOverlay extends OverlayItem {
	type: 'image';
	image: HTMLImageElement;
}

export interface TextOverlay extends OverlayItem {
	type: 'text';
	text: string;
	font: string;
	color: string;
	backgroundColor: string;
	padding: number;
}

export type Overlay = ImageOverlay | TextOverlay;

export interface CompositorConfig {
	width: number;
	height: number;
	fps: number;
}

export const DEFAULT_CONFIG: CompositorConfig = {
	width: 1280,
	height: 720,
	fps: 30
};

export type EasingFunction = (t: number) => number;

export const easings: Record<string, EasingFunction> = {
	linear: (t) => t,
	easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
};
