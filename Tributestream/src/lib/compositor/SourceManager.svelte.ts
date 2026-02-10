import { SvelteMap } from 'svelte/reactivity';
import type { VideoSource } from './types';

export class SourceManager {
	sources = new SvelteMap<string, VideoSource>();
	activePreview = $state<string | null>(null);
	activeProgram = $state<string | null>(null);
	private pendingPreview: string | null = null;

	addSource(
		id: string,
		stream: MediaStream,
		label: string,
		type: 'webrtc' | 'local'
	): HTMLVideoElement {
		const videoElement = document.createElement('video');
		videoElement.srcObject = stream;
		videoElement.autoplay = true;
		videoElement.playsInline = true;
		videoElement.muted = true;
		// Keep element in DOM but hidden so browser continues decoding frames
		videoElement.style.position = 'fixed';
		videoElement.style.top = '-9999px';
		videoElement.style.width = '1px';
		videoElement.style.height = '1px';
		document.body.appendChild(videoElement);

		// Explicitly play — some browsers won't autoplay programmatic elements
		videoElement.play().catch((e) => {
			console.warn('[SourceManager] Video play() failed:', e);
		});
		console.log('[SourceManager] addSource:', id, 'type:', type, 'label:', label);

		const source: VideoSource = {
			id,
			type,
			stream,
			videoElement,
			label,
			connected: true
		};

		this.sources.set(id, source);

		// Auto-select first source as preview
		if (this.sources.size === 1 && !this.activePreview) {
			console.log('[SourceManager] Auto-selecting first source as preview:', id);
			this.activePreview = id;
		}

		// Fulfill deferred preview selection
		if (this.pendingPreview === id) {
			console.log('[SourceManager] Fulfilling deferred preview:', id);
			this.activePreview = id;
			this.pendingPreview = null;
		}

		return videoElement;
	}

	removeSource(id: string): void {
		const source = this.sources.get(id);
		if (source) {
			source.videoElement.srcObject = null;
			source.videoElement.remove();
			this.sources.delete(id);

			if (this.activePreview === id) {
				this.activePreview = this.sources.size > 0 ? this.sources.keys().next().value ?? null : null;
			}
			if (this.activeProgram === id) {
				this.activeProgram = null;
			}
		}
	}

	getSource(id: string): VideoSource | undefined {
		return this.sources.get(id);
	}

	setPreview(id: string): void {
		if (this.sources.has(id)) {
			console.log('[SourceManager] setPreview:', id);
			this.activePreview = id;
			this.pendingPreview = null;
		} else {
			// Source not registered yet — defer until addSource is called
			console.log('[SourceManager] setPreview deferred (source not yet registered):', id);
			this.pendingPreview = id;
		}
	}

	setProgram(id: string): void {
		if (this.sources.has(id)) {
			this.activeProgram = id;
		}
	}

	updateConnectionState(id: string, connected: boolean): void {
		const source = this.sources.get(id);
		if (source) {
			source.connected = connected;
		}
	}

	get previewSource(): VideoSource | undefined {
		return this.activePreview ? this.sources.get(this.activePreview) : undefined;
	}

	get programSource(): VideoSource | undefined {
		return this.activeProgram ? this.sources.get(this.activeProgram) : undefined;
	}

	get sourceList(): VideoSource[] {
		return Array.from(this.sources.values());
	}

	destroy(): void {
		for (const source of this.sources.values()) {
			source.videoElement.srcObject = null;
			source.videoElement.remove();
		}
		this.sources.clear();
		this.activePreview = null;
		this.activeProgram = null;
	}
}
