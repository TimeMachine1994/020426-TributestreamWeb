export interface SignalingMessage {
	id: string;
	type: 'offer' | 'answer' | 'ice-candidate';
	payload: string;
	createdAt: string;
}

export class SignalingClient {
	private deviceId: string;
	private memorialId: string;
	private fromDevice: boolean;
	private pollInterval: number | null = null;
	private onMessage: (message: SignalingMessage) => void;

	constructor(config: {
		deviceId: string;
		memorialId: string;
		fromDevice: boolean;
		onMessage: (message: SignalingMessage) => void;
	}) {
		this.deviceId = config.deviceId;
		this.memorialId = config.memorialId;
		this.fromDevice = config.fromDevice;
		this.onMessage = config.onMessage;
	}

	async send(type: 'offer' | 'answer' | 'ice-candidate', payload: RTCSessionDescriptionInit | RTCIceCandidateInit | null): Promise<void> {
		if (!payload) return;

		await fetch('/api/signaling/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				deviceId: this.deviceId,
				memorialId: this.memorialId,
				fromDevice: this.fromDevice,
				type,
				payload: JSON.stringify(payload)
			})
		});
	}

	startPolling(intervalMs: number = 1000): void {
		if (this.pollInterval) return;

		const poll = async () => {
			try {
				const response = await fetch('/api/signaling/poll', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						deviceId: this.deviceId,
						memorialId: this.memorialId,
						fromDevice: this.fromDevice
					})
				});

				if (response.ok) {
					const data = await response.json();
					for (const message of data.messages) {
						this.onMessage(message);
					}
				}
			} catch (e) {
				console.error('Polling error:', e);
			}
		};

		poll();
		this.pollInterval = window.setInterval(poll, intervalMs);
	}

	stopPolling(): void {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}
}
