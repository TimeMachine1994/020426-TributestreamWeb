import Mux from '@mux/mux-node';
import { env } from '$env/dynamic/private';

if (!env.MUX_TOKEN_ID || !env.MUX_TOKEN_SECRET) {
	console.warn('MUX_TOKEN_ID or MUX_TOKEN_SECRET not set. Mux features will be disabled.');
}

export const mux = env.MUX_TOKEN_ID && env.MUX_TOKEN_SECRET
	? new Mux({
			tokenId: env.MUX_TOKEN_ID,
			tokenSecret: env.MUX_TOKEN_SECRET
		})
	: null;

export interface LiveStreamResult {
	streamKey: string;
	playbackId: string;
	liveStreamId: string;
	whipEndpoint: string;
}

export async function createLiveStream(memorialSlug: string): Promise<LiveStreamResult | null> {
	if (!mux) {
		console.error('Mux client not initialized');
		return null;
	}

	try {
		const liveStream = await mux.video.liveStreams.create({
			playback_policy: ['public'],
			new_asset_settings: {
				playback_policy: ['public']
			},
			passthrough: memorialSlug,
			latency_mode: 'low',
			max_continuous_duration: 43200 // 12 hours max
		});

		const playbackId = liveStream.playback_ids?.[0]?.id;
		if (!playbackId) {
			throw new Error('No playback ID returned from Mux');
		}

		return {
			streamKey: liveStream.stream_key!,
			playbackId,
			liveStreamId: liveStream.id,
			whipEndpoint: `https://global-live.mux.com/app/${liveStream.stream_key!}/whip`
		};
	} catch (error) {
		console.error('Failed to create Mux live stream:', error);
		return null;
	}
}

export async function deleteLiveStream(liveStreamId: string): Promise<boolean> {
	if (!mux) {
		console.error('Mux client not initialized');
		return false;
	}

	try {
		await mux.video.liveStreams.delete(liveStreamId);
		return true;
	} catch (error) {
		console.error('Failed to delete Mux live stream:', error);
		return false;
	}
}

export async function getLiveStreamStatus(liveStreamId: string): Promise<string | null> {
	if (!mux) {
		return null;
	}

	try {
		const liveStream = await mux.video.liveStreams.retrieve(liveStreamId);
		return liveStream.status ?? null;
	} catch (error) {
		console.error('Failed to get live stream status:', error);
		return null;
	}
}

export function getPlaybackUrl(playbackId: string): string {
	return `https://stream.mux.com/${playbackId}.m3u8`;
}

export function getThumbnailUrl(playbackId: string): string {
	return `https://image.mux.com/${playbackId}/thumbnail.jpg`;
}
