/**
 * Shared RPC method names and payload/response types for communication
 * between the Switcher UI (thin client) and the Egress Template (server-side compositor).
 */

// --- RPC Method Names ---

export const RPC_SWITCH_SOURCE = 'switchSource';
export const RPC_SET_PREVIEW = 'setPreview';
export const RPC_SET_OVERLAY = 'setOverlay';
export const RPC_GET_STATE = 'getState';

// --- Data Packet Topics ---

export const TOPIC_COMPOSITOR_STATE = 'compositor-state';
export const TOPIC_COMPOSITOR_IDENTITY = 'compositor-identity';

// --- Payload Types ---

export interface SwitchSourcePayload {
	sourceId: string;
	transition: 'cut' | 'fade';
	duration: number;
}

export interface SwitchSourceResponse {
	ok: boolean;
	activeSource: string;
}

export interface SetPreviewPayload {
	sourceId: string;
}

export interface SetPreviewResponse {
	ok: boolean;
}

export interface SetOverlayPayload {
	id: string;
	type: 'lower-third';
	text: string;
	visible: boolean;
	x?: number;
	y?: number;
}

export interface SetOverlayResponse {
	ok: boolean;
}

export interface GetStatePayload {
	// empty — just requesting current state
}

export interface SourceInfo {
	id: string;
	label: string;
	type: 'local' | 'webrtc';
	connected: boolean;
}

export interface OverlayInfo {
	id: string;
	type: string;
	visible: boolean;
}

export interface CompositorState {
	compositorIdentity: string;
	programSource: string | null;
	previewSource: string | null;
	sources: SourceInfo[];
	overlays: OverlayInfo[];
}

export type GetStateResponse = CompositorState;

// --- Compositor Identity Helper ---

export function compositorIdentity(memorialId: string): string {
	return `compositor-${memorialId}`;
}
