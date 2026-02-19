import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * TEST ENDPOINT: Manually trigger a stream to go live
 * 
 * Usage:
 * POST /api/webhooks/test-live
 * Body: { "streamId": "your-stream-id" }
 * 
 * This simulates what Cloudflare webhook would do
 */
export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const { streamId, action = 'go-live' } = await request.json();
		
		if (!streamId) {
			return json({ error: 'streamId is required' }, { status: 400 });
		}
		
		console.log(`🧪 [TEST WEBHOOK] Simulating ${action} for stream:`, streamId);
		
		// Simulate Cloudflare webhook payloads
		let webhookPayload;
		
		if (action === 'go-live') {
			// Simulate stream going live
			webhookPayload = {
				uid: `test-video-${Date.now()}`,
				status: {
					state: 'live-inprogress',
					errorReasonCode: '',
					errorReasonText: ''
				},
				liveInput: {
					uid: streamId // This should match cloudflareInputId in Firestore
				},
				preview: `https://customer-${Math.random().toString(36).substr(2, 9)}.cloudflarestream.com/${streamId}/iframe`,
				playback: {
					hls: `https://customer-${Math.random().toString(36).substr(2, 9)}.cloudflarestream.com/${streamId}/manifest/video.m3u8`,
					dash: `https://customer-${Math.random().toString(36).substr(2, 9)}.cloudflarestream.com/${streamId}/manifest/video.mpd`
				},
				meta: {
					name: 'Test Live Stream'
				}
			};
		} else if (action === 'end-stream') {
			// Simulate stream ending (recording ready)
			webhookPayload = {
				uid: `test-video-${Date.now()}`,
				status: {
					state: 'ready',
					errorReasonCode: '',
					errorReasonText: ''
				},
				liveInput: {
					uid: streamId
				},
				preview: `https://customer-${Math.random().toString(36).substr(2, 9)}.cloudflarestream.com/${streamId}/iframe`,
				playback: {
					hls: `https://customer-${Math.random().toString(36).substr(2, 9)}.cloudflarestream.com/${streamId}/manifest/video.m3u8`,
					dash: `https://customer-${Math.random().toString(36).substr(2, 9)}.cloudflarestream.com/${streamId}/manifest/video.mpd`
				},
				meta: {
					name: 'Test Live Stream - Recording'
				}
			};
		} else {
			return json({ error: 'Invalid action. Use "go-live" or "end-stream"' }, { status: 400 });
		}
		
		console.log('🧪 [TEST WEBHOOK] Sending payload to webhook handler:', webhookPayload);
		
		// Call the actual webhook endpoint
		const webhookUrl = new URL('/api/webhooks/cloudflare-stream', request.url);
		const webhookResponse = await fetch(webhookUrl.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(webhookPayload)
		});
		
		const webhookResult = await webhookResponse.json();
		
		console.log('🧪 [TEST WEBHOOK] Webhook handler response:', webhookResult);
		
		if (!webhookResponse.ok) {
			return json({
				success: false,
				error: 'Webhook handler failed',
				webhookResult
			}, { status: webhookResponse.status });
		}
		
		return json({
			success: true,
			message: `Stream ${streamId} ${action === 'go-live' ? 'went live' : 'ended'}`,
			webhookPayload,
			webhookResult
		});
		
	} catch (error: any) {
		console.error('❌ [TEST WEBHOOK] Error:', error);
		return json({
			error: 'Internal server error',
			message: error?.message
		}, { status: 500 });
	}
};

/**
 * GET endpoint to show usage instructions
 */
export const GET: RequestHandler = async () => {
	return json({
		endpoint: 'test-live',
		description: 'Manually trigger stream status changes for testing',
		usage: {
			goLive: {
				method: 'POST',
				url: '/api/webhooks/test-live',
				body: {
					streamId: 'your-cloudflare-input-id',
					action: 'go-live'
				}
			},
			endStream: {
				method: 'POST',
				url: '/api/webhooks/test-live',
				body: {
					streamId: 'your-cloudflare-input-id',
					action: 'end-stream'
				}
			}
		},
		note: 'The streamId should match the cloudflareInputId in your stream document'
	});
};
