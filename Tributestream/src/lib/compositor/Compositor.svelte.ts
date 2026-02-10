import type { CompositorConfig, TransitionType } from './types';
import { DEFAULT_CONFIG } from './types';
import { SourceManager } from './SourceManager.svelte';
import { TransitionEngine } from './TransitionEngine';
import { OverlayManager } from './OverlayManager';

export class Compositor {
	private config: CompositorConfig;
	private sourceManager: SourceManager;
	private transitionEngine: TransitionEngine;
	private overlayManager: OverlayManager;

	private programCtx: CanvasRenderingContext2D | null = null;
	private previewCtx: CanvasRenderingContext2D | null = null;
	private previewLogOnce = false;
	private animationFrameId: number | null = null;
	private lastFrameTime: number = 0;
	private frameCount: number = 0;
	private fpsAccumulator: number = 0;

	// Web Worker timer for background-tab rendering during live streaming
	private workerTimer: Worker | null = null;
	private isLiveMode = false;

	isRunning = $state(false);
	measuredFps = $state(0);
	outputStream = $state<MediaStream | null>(null);

	constructor(
		sourceManager: SourceManager,
		config: CompositorConfig = DEFAULT_CONFIG
	) {
		this.config = config;
		this.sourceManager = sourceManager;
		this.transitionEngine = new TransitionEngine();
		this.overlayManager = new OverlayManager();
	}

	setProgramCanvas(canvas: HTMLCanvasElement): void {
		canvas.width = this.config.width;
		canvas.height = this.config.height;
		this.programCtx = canvas.getContext('2d');
		this.outputStream = canvas.captureStream(this.config.fps);
	}

	setPreviewCanvas(canvas: HTMLCanvasElement): void {
		canvas.width = this.config.width;
		canvas.height = this.config.height;
		this.previewCtx = canvas.getContext('2d');
	}

	start(): void {
		if (this.isRunning) return;
		this.isRunning = true;
		this.lastFrameTime = performance.now();
		this.frameCount = 0;
		this.fpsAccumulator = 0;
		this.renderLoop(performance.now());
	}

	stop(): void {
		this.isRunning = false;
		this.disableLiveMode();
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	/**
	 * Enable live mode: uses a Web Worker timer instead of requestAnimationFrame
	 * so the render loop keeps running at full fps even when the tab is backgrounded.
	 * Call this when going live / starting egress.
	 */
	enableLiveMode(): void {
		if (this.isLiveMode) return;
		this.isLiveMode = true;

		// Stop the rAF loop — worker will drive rendering
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		const interval = Math.round(1000 / this.config.fps);
		const workerCode = `let id; onmessage = (e) => { if (e.data === 'start') { id = setInterval(() => postMessage('tick'), ${interval}); } else if (e.data === 'stop') { clearInterval(id); } };`;
		const blob = new Blob([workerCode], { type: 'application/javascript' });
		this.workerTimer = new Worker(URL.createObjectURL(blob));
		this.workerTimer.onmessage = () => {
			if (!this.isRunning) return;
			this.renderLoop(performance.now());
		};
		this.workerTimer.postMessage('start');
		console.log('[Compositor] Live mode enabled — Worker timer active at', this.config.fps, 'fps');
	}

	/**
	 * Disable live mode: go back to requestAnimationFrame.
	 * Call this when ending stream.
	 */
	disableLiveMode(): void {
		if (!this.isLiveMode) return;
		this.isLiveMode = false;

		if (this.workerTimer) {
			this.workerTimer.postMessage('stop');
			this.workerTimer.terminate();
			this.workerTimer = null;
		}

		// Resume rAF loop if still running
		if (this.isRunning) {
			this.renderLoop(performance.now());
		}
		console.log('[Compositor] Live mode disabled — back to requestAnimationFrame');
	}

	takeToProgram(
		transitionType: TransitionType = 'cut',
		durationMs: number = 500
	): void {
		const previewId = this.sourceManager.activePreview;
		if (!previewId) return;

		const currentProgramId = this.sourceManager.activeProgram;

		this.transitionEngine.startTransition(
			currentProgramId,
			previewId,
			transitionType,
			durationMs
		);

		// Immediately update program source reference
		this.sourceManager.setProgram(previewId);
	}

	getOverlayManager(): OverlayManager {
		return this.overlayManager;
	}

	getSourceManager(): SourceManager {
		return this.sourceManager;
	}

	getTransitionEngine(): TransitionEngine {
		return this.transitionEngine;
	}

	private renderLoop = (timestamp: number): void => {
		if (!this.isRunning) return;

		// FPS calculation
		this.frameCount++;
		this.fpsAccumulator += timestamp - this.lastFrameTime;
		this.lastFrameTime = timestamp;

		if (this.fpsAccumulator >= 1000) {
			this.measuredFps = Math.round((this.frameCount * 1000) / this.fpsAccumulator);
			this.frameCount = 0;
			this.fpsAccumulator = 0;
		}

		// Render program output
		if (this.programCtx) {
			this.renderProgram(this.programCtx, timestamp);
		}

		// Render preview
		if (this.previewCtx) {
			this.renderPreview(this.previewCtx);
		}

		// In live mode, the Worker drives the loop — don't schedule rAF
		if (!this.isLiveMode) {
			this.animationFrameId = requestAnimationFrame(this.renderLoop);
		}
	};

	private renderProgram(ctx: CanvasRenderingContext2D, timestamp: number): void {
		const { width, height } = this.config;

		// Clear
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, width, height);

		// Get blend state from transition engine
		const blend = this.transitionEngine.tick(timestamp);

		// Draw source A (outgoing) if present
		if (blend.sourceA) {
			const sourceA = this.sourceManager.getSource(blend.sourceA.id);
			if (sourceA && sourceA.videoElement.readyState >= 2) {
				ctx.globalAlpha = blend.sourceA.opacity;
				this.drawVideoFit(ctx, sourceA.videoElement, width, height);
			}
		}

		// Draw source B (incoming / current) if present
		if (blend.sourceB) {
			const sourceB = this.sourceManager.getSource(blend.sourceB.id);
			if (sourceB && sourceB.videoElement.readyState >= 2) {
				ctx.globalAlpha = blend.sourceB.opacity;
				this.drawVideoFit(ctx, sourceB.videoElement, width, height);
			}
		}

		// Reset alpha for overlays
		ctx.globalAlpha = 1;

		// Render overlays on top
		this.overlayManager.render(ctx, width, height);
	}

	private renderPreview(ctx: CanvasRenderingContext2D): void {
		const { width, height } = this.config;

		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, width, height);

		const previewSource = this.sourceManager.previewSource;
		if (previewSource) {
			if (!this.previewLogOnce) {
				console.log('[Compositor] Preview source:', previewSource.id, 'readyState:', previewSource.videoElement.readyState, 'videoWidth:', previewSource.videoElement.videoWidth);
				if (previewSource.videoElement.readyState >= 2) {
					console.log('[Compositor] Preview rendering started');
					this.previewLogOnce = true;
				}
			}
			if (previewSource.videoElement.readyState >= 2) {
				ctx.globalAlpha = 1;
				this.drawVideoFit(ctx, previewSource.videoElement, width, height);
			}
		}
	}

	/** Draw video maintaining aspect ratio (cover fit) */
	private drawVideoFit(
		ctx: CanvasRenderingContext2D,
		video: HTMLVideoElement,
		canvasW: number,
		canvasH: number
	): void {
		const videoW = video.videoWidth || canvasW;
		const videoH = video.videoHeight || canvasH;

		const videoAspect = videoW / videoH;
		const canvasAspect = canvasW / canvasH;

		let drawW: number, drawH: number, offsetX: number, offsetY: number;

		if (videoAspect > canvasAspect) {
			// Video is wider — crop sides
			drawH = canvasH;
			drawW = canvasH * videoAspect;
			offsetX = (canvasW - drawW) / 2;
			offsetY = 0;
		} else {
			// Video is taller — crop top/bottom
			drawW = canvasW;
			drawH = canvasW / videoAspect;
			offsetX = 0;
			offsetY = (canvasH - drawH) / 2;
		}

		ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
	}

	destroy(): void {
		this.stop();
		this.disableLiveMode();
		this.outputStream = null;
		this.programCtx = null;
		this.previewCtx = null;
	}
}
