export interface WHIPClientOptions {
	whipUrl: string;
	videoElement: HTMLVideoElement;
	onStateChange?: (state: WHIPClientState) => void;
	onError?: (error: Error) => void;
}

export type WHIPClientState =
	| 'idle'
	| 'requesting-media'
	| 'connecting'
	| 'streaming'
	| 'stopped'
	| 'error';

/**
 * WHIP (WebRTC-HTTP Ingestion Protocol) Client
 * Handles browser-based streaming to Cloudflare via WebRTC
 */
export class WHIPClient {
	private peerConnection: RTCPeerConnection | null = null;
	private mediaStream: MediaStream | null = null;
	private state: WHIPClientState = 'idle';
	private options: WHIPClientOptions;

	constructor(options: WHIPClientOptions) {
		this.options = options;
	}

	/**
	 * Start WHIP streaming
	 */
	async start(): Promise<void> {
		try {
			this.setState('requesting-media');

			console.log('🎥 [WHIP] Requesting media access...');
			this.mediaStream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 },
					frameRate: { ideal: 30 }
				},
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				}
			});

			this.options.videoElement.srcObject = this.mediaStream;
			await this.options.videoElement.play();

			this.setState('connecting');

			console.log('🔗 [WHIP] Creating peer connection...');
			this.peerConnection = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }]
			});

			this.mediaStream.getTracks().forEach((track) => {
				this.peerConnection!.addTrack(track, this.mediaStream!);
			});

			console.log('📝 [WHIP] Creating offer...');
			const offer = await this.peerConnection.createOffer();
			await this.peerConnection.setLocalDescription(offer);

			console.log('📤 [WHIP] Sending offer to:', this.options.whipUrl);
			const response = await fetch(this.options.whipUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/sdp' },
				body: offer.sdp
			});

			if (!response.ok) {
				throw new Error(`WHIP endpoint returned ${response.status}`);
			}

			const answerSdp = await response.text();
			console.log('📥 [WHIP] Received answer');
			await this.peerConnection.setRemoteDescription({
				type: 'answer',
				sdp: answerSdp
			});

			this.peerConnection.onconnectionstatechange = () => {
				console.log('🔄 [WHIP] Connection state:', this.peerConnection?.connectionState);
				if (this.peerConnection?.connectionState === 'connected') {
					this.setState('streaming');
				} else if (
					this.peerConnection?.connectionState === 'failed' ||
					this.peerConnection?.connectionState === 'disconnected'
				) {
					this.handleError(new Error('Connection lost'));
				}
			};

			console.log('✅ [WHIP] Streaming started');
		} catch (error) {
			this.handleError(error as Error);
			throw error;
		}
	}

	/**
	 * Stop WHIP streaming
	 */
	stop(): void {
		console.log('🛑 [WHIP] Stopping stream...');

		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach((track) => track.stop());
			this.mediaStream = null;
		}

		if (this.peerConnection) {
			this.peerConnection.close();
			this.peerConnection = null;
		}

		this.options.videoElement.srcObject = null;
		this.setState('stopped');
		console.log('✅ [WHIP] Stream stopped');
	}

	/**
	 * Get current state
	 */
	getState(): WHIPClientState {
		return this.state;
	}

	/**
	 * Check if streaming is active
	 */
	isStreaming(): boolean {
		return this.state === 'streaming';
	}

	private setState(state: WHIPClientState): void {
		this.state = state;
		this.options.onStateChange?.(state);
	}

	private handleError(error: Error): void {
		console.error('❌ [WHIP] Error:', error);
		this.setState('error');
		this.options.onError?.(error);
	}
}
