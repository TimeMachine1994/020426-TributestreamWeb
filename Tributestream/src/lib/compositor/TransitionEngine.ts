import type { BlendState, TransitionType, EasingFunction } from './types';
import { easings } from './types';

export type TransitionState = 'idle' | 'transitioning';

export class TransitionEngine {
	private state: TransitionState = 'idle';
	private type: TransitionType = 'cut';
	private durationMs: number = 500;
	private startTime: number = 0;
	private easing: EasingFunction = easings.easeInOut;
	private sourceAId: string | null = null;
	private sourceBId: string | null = null;
	private _progress: number = 0;

	get isTransitioning(): boolean {
		return this.state === 'transitioning';
	}

	get progress(): number {
		return this._progress;
	}

	startTransition(
		fromId: string | null,
		toId: string,
		type: TransitionType = 'fade',
		durationMs: number = 500,
		easingName: string = 'easeInOut'
	): void {
		if (type === 'cut') {
			// Instant swap — no animation needed
			this.sourceAId = null;
			this.sourceBId = toId;
			this._progress = 1;
			this.state = 'idle';
			return;
		}

		this.type = type;
		this.durationMs = durationMs;
		this.easing = easings[easingName] ?? easings.easeInOut;
		this.sourceAId = fromId;
		this.sourceBId = toId;
		this.startTime = performance.now();
		this._progress = 0;
		this.state = 'transitioning';
	}

	tick(timestamp: number): BlendState {
		if (this.state === 'idle') {
			// No transition in progress — just show source B at full opacity
			return {
				sourceA: null,
				sourceB: this.sourceBId ? { id: this.sourceBId, opacity: 1 } : null,
				complete: true
			};
		}

		const elapsed = timestamp - this.startTime;
		const rawProgress = Math.min(elapsed / this.durationMs, 1);
		this._progress = this.easing(rawProgress);

		const complete = rawProgress >= 1;

		if (complete) {
			this.state = 'idle';
			this._progress = 1;
		}

		return {
			sourceA: this.sourceAId ? { id: this.sourceAId, opacity: 1 - this._progress } : null,
			sourceB: this.sourceBId ? { id: this.sourceBId, opacity: this._progress } : null,
			complete
		};
	}

	cancel(): void {
		this.state = 'idle';
		this._progress = 0;
	}

	/** Get the final destination source id (what program will be after transition) */
	get destinationId(): string | null {
		return this.sourceBId;
	}
}
