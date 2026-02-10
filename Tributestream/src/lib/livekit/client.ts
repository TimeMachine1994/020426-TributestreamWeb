import {
	Room,
	RoomEvent,
	Track,
	type RemoteTrack,
	type RemoteTrackPublication,
	type RemoteParticipant,
	type LocalTrack,
	ConnectionState
} from 'livekit-client';

export type LiveKitConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface TrackSubscribedEvent {
	track: RemoteTrack;
	publication: RemoteTrackPublication;
	participant: RemoteParticipant;
}

export interface LiveKitRoomCallbacks {
	onConnectionChange?: (state: LiveKitConnectionState) => void;
	onTrackSubscribed?: (event: TrackSubscribedEvent) => void;
	onTrackUnsubscribed?: (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => void;
	onParticipantConnected?: (participant: RemoteParticipant) => void;
	onParticipantDisconnected?: (participant: RemoteParticipant) => void;
}

/**
 * Wrapper around LiveKit Room for Tributestream.
 * Handles connecting, publishing, subscribing, and lifecycle events.
 */
export class LiveKitRoom {
	private room: Room;
	private callbacks: LiveKitRoomCallbacks;

	constructor(callbacks: LiveKitRoomCallbacks = {}) {
		this.callbacks = callbacks;
		this.room = new Room({
			adaptiveStream: true,
			dynacast: true
		});
		this.setupEventHandlers();
	}

	private setupEventHandlers(): void {
		this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
			console.log('[LiveKitRoom] Connection state:', state);
			let mapped: LiveKitConnectionState;
			switch (state) {
				case ConnectionState.Connected:
					mapped = 'connected';
					break;
				case ConnectionState.Connecting:
					mapped = 'connecting';
					break;
				case ConnectionState.Reconnecting:
					mapped = 'reconnecting';
					break;
				default:
					mapped = 'disconnected';
			}
			this.callbacks.onConnectionChange?.(mapped);
		});

		this.room.on(
			RoomEvent.TrackSubscribed,
			(track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
				console.log('[LiveKitRoom] Track subscribed:', track.kind, 'from', participant.identity);
				this.callbacks.onTrackSubscribed?.({ track, publication, participant });
			}
		);

		this.room.on(
			RoomEvent.TrackUnsubscribed,
			(track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
				console.log('[LiveKitRoom] Track unsubscribed:', track.kind, 'from', participant.identity);
				this.callbacks.onTrackUnsubscribed?.(track, publication, participant);
			}
		);

		this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
			console.log('[LiveKitRoom] Participant connected:', participant.identity);
			this.callbacks.onParticipantConnected?.(participant);
		});

		this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
			console.log('[LiveKitRoom] Participant disconnected:', participant.identity);
			this.callbacks.onParticipantDisconnected?.(participant);
		});

		this.room.on(RoomEvent.Disconnected, () => {
			console.log('[LiveKitRoom] Disconnected from room');
			this.callbacks.onConnectionChange?.('disconnected');
		});

		this.room.on(RoomEvent.Reconnecting, () => {
			console.log('[LiveKitRoom] Reconnecting...');
			this.callbacks.onConnectionChange?.('reconnecting');
		});

		this.room.on(RoomEvent.Reconnected, () => {
			console.log('[LiveKitRoom] Reconnected');
			this.callbacks.onConnectionChange?.('connected');
		});
	}

	/**
	 * Connect to a LiveKit room with retry support.
	 */
	async connect(url: string, token: string, maxRetries = 3): Promise<void> {
		if (!url) throw new Error('LiveKit URL is not configured');
		if (!token) throw new Error('LiveKit token is empty');

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				console.log(`[LiveKitRoom] Connecting to: ${url} (attempt ${attempt}/${maxRetries})`);
				await this.room.connect(url, token);
				console.log('[LiveKitRoom] Connected to room:', this.room.name);
				return;
			} catch (e) {
				console.error(`[LiveKitRoom] Connection attempt ${attempt} failed:`, e);
				if (attempt === maxRetries) throw e;
				await new Promise(r => setTimeout(r, 1000 * attempt));
			}
		}
	}

	/**
	 * Publish a local media track (video or audio) to the room.
	 */
	async publishTrack(track: MediaStreamTrack, options?: { name?: string }): Promise<LocalTrack> {
		if (this.room.state !== ConnectionState.Connected) {
			throw new Error('Cannot publish track: not connected to room');
		}
		if (track.readyState !== 'live') {
			throw new Error(`Cannot publish track: track state is '${track.readyState}'`);
		}
		console.log('[LiveKitRoom] Publishing track:', track.kind, options?.name ?? '');
		const publication = await this.room.localParticipant.publishTrack(track, {
			name: options?.name
		});
		console.log('[LiveKitRoom] Track published:', publication.trackSid);
		return publication.track as LocalTrack;
	}

	/**
	 * Unpublish a local track by its MediaStreamTrack.
	 */
	async unpublishTrack(track: MediaStreamTrack): Promise<void> {
		// Find the publication for this track
		for (const pub of this.room.localParticipant.trackPublications.values()) {
			if (pub.track?.mediaStreamTrack === track) {
				await this.room.localParticipant.unpublishTrack(track);
				console.log('[LiveKitRoom] Track unpublished');
				return;
			}
		}
		console.warn('[LiveKitRoom] Track not found for unpublish');
	}

	/**
	 * Disconnect from the room.
	 */
	async disconnect(): Promise<void> {
		console.log('[LiveKitRoom] Disconnecting...');
		await this.room.disconnect();
		console.log('[LiveKitRoom] Disconnected');
	}

	/**
	 * Get the underlying Room instance for advanced usage.
	 */
	getRoom(): Room {
		return this.room;
	}

	/**
	 * Get current connection state.
	 */
	get state(): LiveKitConnectionState {
		switch (this.room.state) {
			case ConnectionState.Connected:
				return 'connected';
			case ConnectionState.Connecting:
				return 'connecting';
			case ConnectionState.Reconnecting:
				return 'reconnecting';
			default:
				return 'disconnected';
		}
	}

	/**
	 * Get the local participant identity.
	 */
	get localIdentity(): string | undefined {
		return this.room.localParticipant?.identity;
	}

	/**
	 * Get the room name.
	 */
	get roomName(): string | undefined {
		return this.room.name;
	}
}
