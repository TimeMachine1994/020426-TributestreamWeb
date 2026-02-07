/**
 * AudioMixer — Web Audio API infrastructure stub.
 * Creates an AudioContext with a destination node that outputs a MediaStream.
 * Sources can be connected/disconnected with per-source gain control.
 * Full mixing implementation deferred to a future phase.
 */
export class AudioMixer {
	private ctx: AudioContext | null = null;
	private destination: MediaStreamAudioDestinationNode | null = null;
	private sources: Map<string, { source: MediaStreamAudioSourceNode; gain: GainNode }> = new Map();

	initialize(): MediaStream | null {
		try {
			this.ctx = new AudioContext();
			this.destination = this.ctx.createMediaStreamDestination();
			return this.destination.stream;
		} catch (e) {
			console.error('AudioMixer: Failed to initialize AudioContext', e);
			return null;
		}
	}

	connectSource(id: string, stream: MediaStream): void {
		if (!this.ctx || !this.destination) return;

		// Disconnect existing source with same id
		this.disconnectSource(id);

		const audioTracks = stream.getAudioTracks();
		if (audioTracks.length === 0) return;

		try {
			const source = this.ctx.createMediaStreamSource(stream);
			const gain = this.ctx.createGain();
			gain.gain.value = 1.0;

			source.connect(gain);
			gain.connect(this.destination);

			this.sources.set(id, { source, gain });
		} catch (e) {
			console.error(`AudioMixer: Failed to connect source ${id}`, e);
		}
	}

	disconnectSource(id: string): void {
		const entry = this.sources.get(id);
		if (entry) {
			try {
				entry.gain.disconnect();
				entry.source.disconnect();
			} catch {
				// ignore disconnect errors
			}
			this.sources.delete(id);
		}
	}

	setGain(id: string, value: number): void {
		const entry = this.sources.get(id);
		if (entry) {
			entry.gain.gain.value = Math.max(0, Math.min(2, value));
		}
	}

	getOutputStream(): MediaStream | null {
		return this.destination?.stream ?? null;
	}

	/**
	 * Combine video and audio streams into a single MediaStream
	 */
	static combineStreams(videoStream: MediaStream, audioStream: MediaStream | null): MediaStream {
		const combined = new MediaStream();

		for (const track of videoStream.getVideoTracks()) {
			combined.addTrack(track);
		}

		if (audioStream) {
			for (const track of audioStream.getAudioTracks()) {
				combined.addTrack(track);
			}
		}

		return combined;
	}

	destroy(): void {
		for (const [id] of this.sources) {
			this.disconnectSource(id);
		}
		this.sources.clear();

		if (this.ctx && this.ctx.state !== 'closed') {
			this.ctx.close().catch(() => {});
		}

		this.ctx = null;
		this.destination = null;
	}
}
