import { SignalingClient, type SignalingMessage } from './signaling';

const ICE_SERVERS: RTCIceServer[] = [
	{ urls: 'stun:stun.l.google.com:19302' },
	{ urls: 'stun:stun1.l.google.com:19302' }
];

export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed';

export class WebRTCPeer {
	private pc: RTCPeerConnection;
	private signaling: SignalingClient;
	private isInitiator: boolean;
	private onStateChange: (state: ConnectionState) => void;
	private onTrack?: (stream: MediaStream) => void;

	constructor(config: {
		deviceId: string;
		memorialId: string;
		isInitiator: boolean;
		onStateChange: (state: ConnectionState) => void;
		onTrack?: (stream: MediaStream) => void;
	}) {
		this.isInitiator = config.isInitiator;
		this.onStateChange = config.onStateChange;
		this.onTrack = config.onTrack;

		this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

		this.signaling = new SignalingClient({
			deviceId: config.deviceId,
			memorialId: config.memorialId,
			fromDevice: config.isInitiator,
			onMessage: this.handleSignalingMessage.bind(this)
		});

		this.setupPeerConnection();
	}

	private setupPeerConnection(): void {
		this.pc.onicecandidate = (event) => {
			if (event.candidate) {
				this.signaling.send('ice-candidate', event.candidate.toJSON());
			}
		};

		this.pc.onconnectionstatechange = () => {
			const state = this.pc.connectionState;
			switch (state) {
				case 'new':
					this.onStateChange('new');
					break;
				case 'connecting':
					this.onStateChange('connecting');
					break;
				case 'connected':
					this.onStateChange('connected');
					break;
				case 'disconnected':
					this.onStateChange('disconnected');
					break;
				case 'failed':
				case 'closed':
					this.onStateChange('failed');
					break;
			}
		};

		this.pc.ontrack = (event) => {
			if (this.onTrack && event.streams[0]) {
				this.onTrack(event.streams[0]);
			}
		};
	}

	private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
		const payload = JSON.parse(message.payload);

		switch (message.type) {
			case 'offer':
				await this.pc.setRemoteDescription(new RTCSessionDescription(payload));
				const answer = await this.pc.createAnswer();
				await this.pc.setLocalDescription(answer);
				await this.signaling.send('answer', answer);
				break;

			case 'answer':
				await this.pc.setRemoteDescription(new RTCSessionDescription(payload));
				break;

			case 'ice-candidate':
				if (payload) {
					await this.pc.addIceCandidate(new RTCIceCandidate(payload));
				}
				break;
		}
	}

	async addStream(stream: MediaStream): Promise<void> {
		for (const track of stream.getTracks()) {
			this.pc.addTrack(track, stream);
		}
	}

	async createOffer(): Promise<void> {
		const offer = await this.pc.createOffer();
		await this.pc.setLocalDescription(offer);
		await this.signaling.send('offer', offer);
	}

	start(): void {
		this.signaling.startPolling(500);

		if (this.isInitiator) {
			// Wait a moment for the connection to be set up, then create offer
			setTimeout(() => this.createOffer(), 100);
		}
	}

	stop(): void {
		this.signaling.stopPolling();
		this.pc.close();
	}

	getStats(): Promise<RTCStatsReport> {
		return this.pc.getStats();
	}
}
