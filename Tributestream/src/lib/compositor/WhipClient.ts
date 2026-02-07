/**
 * WhipClient — Mux WHIP (WebRTC-HTTP Ingest Protocol) client.
 * Sends a MediaStream to Mux via WebRTC using the WHIP protocol.
 *
 * WHIP flow:
 * 1. Create RTCPeerConnection, add tracks from MediaStream
 * 2. Create SDP offer
 * 3. POST offer to WHIP endpoint → receive SDP answer
 * 4. Set remote description → connection established
 * 5. Stream flows via WebRTC to Mux
 */

export type WhipConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

export class WhipClient {
	private pc: RTCPeerConnection | null = null;
	private whipEndpoint: string | null = null;
	private resourceUrl: string | null = null;
	private onStateChange: ((state: WhipConnectionState) => void) | null = null;

	constructor(onStateChange?: (state: WhipConnectionState) => void) {
		this.onStateChange = onStateChange ?? null;
	}

	private setState(state: WhipConnectionState): void {
		this.onStateChange?.(state);
	}

	/**
	 * Connect to Mux via WHIP
	 * @param stream - Combined MediaStream (video + audio tracks)
	 * @param whipEndpoint - The WHIP ingest URL (e.g., from Mux live stream config)
	 */
	async connect(stream: MediaStream, whipEndpoint: string): Promise<void> {
		this.whipEndpoint = whipEndpoint;
		this.setState('connecting');

		try {
			this.pc = new RTCPeerConnection({
				iceServers: [] // WHIP servers typically handle ICE internally
			});

			this.pc.onconnectionstatechange = () => {
				if (!this.pc) return;
				switch (this.pc.connectionState) {
					case 'connected':
						this.setState('connected');
						break;
					case 'disconnected':
						this.setState('disconnected');
						this.attemptReconnect(stream);
						break;
					case 'failed':
					case 'closed':
						this.setState('failed');
						break;
				}
			};

			// Add all tracks from the stream
			for (const track of stream.getTracks()) {
				this.pc.addTrack(track, stream);
			}

			// Create and set local offer
			const offer = await this.pc.createOffer();
			await this.pc.setLocalDescription(offer);

			// Wait for ICE gathering to complete
			await this.waitForIceGathering();

			const localDescription = this.pc.localDescription;
			if (!localDescription) {
				throw new Error('No local description after ICE gathering');
			}

			// Send offer to WHIP endpoint
			const response = await fetch(whipEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/sdp'
				},
				body: localDescription.sdp
			});

			if (!response.ok) {
				throw new Error(`WHIP endpoint returned ${response.status}: ${response.statusText}`);
			}

			// Store resource URL for DELETE on disconnect
			this.resourceUrl = response.headers.get('Location') ?? null;

			// Set remote answer
			const answerSdp = await response.text();
			await this.pc.setRemoteDescription(
				new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
			);

			this.setState('connected');
		} catch (e) {
			console.error('WhipClient: Connection failed', e);
			this.setState('failed');
			throw e;
		}
	}

	private waitForIceGathering(): Promise<void> {
		return new Promise<void>((resolve) => {
			if (!this.pc) return resolve();

			if (this.pc.iceGatheringState === 'complete') {
				return resolve();
			}

			const checkState = () => {
				if (this.pc?.iceGatheringState === 'complete') {
					this.pc.removeEventListener('icegatheringstatechange', checkState);
					resolve();
				}
			};

			this.pc.addEventListener('icegatheringstatechange', checkState);

			// Timeout after 5 seconds
			setTimeout(() => {
				this.pc?.removeEventListener('icegatheringstatechange', checkState);
				resolve();
			}, 5000);
		});
	}

	private async attemptReconnect(stream: MediaStream): Promise<void> {
		if (!this.whipEndpoint) return;

		console.log('WhipClient: Attempting reconnect...');
		this.disconnect();

		// Wait before retry
		await new Promise((r) => setTimeout(r, 2000));

		try {
			await this.connect(stream, this.whipEndpoint);
		} catch {
			console.error('WhipClient: Reconnect failed');
		}
	}

	async disconnect(): Promise<void> {
		// Send DELETE to WHIP resource URL to end the session
		if (this.resourceUrl) {
			try {
				await fetch(this.resourceUrl, { method: 'DELETE' });
			} catch {
				// Ignore cleanup errors
			}
			this.resourceUrl = null;
		}

		if (this.pc) {
			this.pc.close();
			this.pc = null;
		}

		this.setState('disconnected');
	}

	getConnectionState(): WhipConnectionState {
		if (!this.pc) return 'disconnected';
		switch (this.pc.connectionState) {
			case 'connected':
				return 'connected';
			case 'connecting':
			case 'new':
				return 'connecting';
			default:
				return 'disconnected';
		}
	}
}
