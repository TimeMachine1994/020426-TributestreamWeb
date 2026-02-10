/**
 * Client-side helper for the Switcher UI to send RPC commands
 * to the server-side compositor (egress template participant).
 */

import type { Room } from 'livekit-client';
import {
	RPC_SWITCH_SOURCE,
	RPC_SET_PREVIEW,
	RPC_SET_OVERLAY,
	RPC_GET_STATE,
	type SwitchSourcePayload,
	type SwitchSourceResponse,
	type SetPreviewPayload,
	type SetPreviewResponse,
	type SetOverlayPayload,
	type SetOverlayResponse,
	type GetStateResponse
} from './rpc-commands';

export class SwitcherRpc {
	private room: Room;
	private compositorIdentity: string;

	constructor(room: Room, compositorIdentity: string) {
		this.room = room;
		this.compositorIdentity = compositorIdentity;
	}

	private async call<T>(method: string, payload: unknown): Promise<T> {
		const response = await this.room.localParticipant.performRpc({
			destinationIdentity: this.compositorIdentity,
			method,
			payload: JSON.stringify(payload),
			responseTimeout: 5000
		});
		return JSON.parse(response) as T;
	}

	async switchSource(
		sourceId: string,
		transition: 'cut' | 'fade' = 'cut',
		duration: number = 500
	): Promise<SwitchSourceResponse> {
		const payload: SwitchSourcePayload = { sourceId, transition, duration };
		return this.call<SwitchSourceResponse>(RPC_SWITCH_SOURCE, payload);
	}

	async setPreview(sourceId: string): Promise<SetPreviewResponse> {
		const payload: SetPreviewPayload = { sourceId };
		return this.call<SetPreviewResponse>(RPC_SET_PREVIEW, payload);
	}

	async setOverlay(
		id: string,
		text: string,
		visible: boolean,
		options?: { type?: 'lower-third'; x?: number; y?: number }
	): Promise<SetOverlayResponse> {
		const payload: SetOverlayPayload = {
			id,
			type: options?.type ?? 'lower-third',
			text,
			visible,
			x: options?.x,
			y: options?.y
		};
		return this.call<SetOverlayResponse>(RPC_SET_OVERLAY, payload);
	}

	async getState(): Promise<GetStateResponse> {
		return this.call<GetStateResponse>(RPC_GET_STATE, {});
	}
}
