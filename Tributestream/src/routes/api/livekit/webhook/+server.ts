import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { WebhookReceiver } from 'livekit-server-sdk';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/livekit/webhook
 * Receives LiveKit webhook events for room, participant, and egress lifecycle.
 *
 * Configure your LiveKit project to send webhooks to:
 *   https://<your-domain>/api/livekit/webhook
 */
export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.LIVEKIT_API_KEY;
	const apiSecret = env.LIVEKIT_API_SECRET;

	if (!apiKey || !apiSecret) {
		console.error('[LiveKit Webhook] Missing API credentials');
		return json({ error: 'Server misconfigured' }, { status: 500 });
	}

	const receiver = new WebhookReceiver(apiKey, apiSecret);

	const body = await request.text();
	const authHeader = request.headers.get('Authorization') ?? '';

	let event;
	try {
		event = await receiver.receive(body, authHeader);
	} catch (e) {
		console.error('[LiveKit Webhook] Signature validation failed:', e);
		return json({ error: 'Invalid signature' }, { status: 401 });
	}

	console.log('[LiveKit Webhook] Event:', event.event, 'Room:', event.room?.name);

	try {
		switch (event.event) {
			case 'egress_started': {
				const egressId = event.egressInfo?.egressId;
				const roomName = event.egressInfo?.roomName ?? event.room?.name;
				if (egressId && roomName) {
					const memorialId = roomName.replace('memorial-', '');
					await db
						.update(table.memorial)
						.set({ egressId, updatedAt: new Date() })
						.where(eq(table.memorial.id, memorialId));
					console.log('[LiveKit Webhook] Egress started for memorial:', memorialId);
				}
				break;
			}

			case 'egress_ended': {
				const egressId = event.egressInfo?.egressId;
				const roomName = event.egressInfo?.roomName ?? event.room?.name;
				if (roomName) {
					const memorialId = roomName.replace('memorial-', '');
					// Clear egress ID; if stream was live, mark as ended
					const [memorial] = await db
						.select({ status: table.memorial.status })
						.from(table.memorial)
						.where(eq(table.memorial.id, memorialId));

					if (memorial?.status === 'live') {
						await db
							.update(table.memorial)
							.set({ egressId: null, status: 'ended', updatedAt: new Date() })
							.where(eq(table.memorial.id, memorialId));
						console.log('[LiveKit Webhook] Egress ended, memorial set to ended:', memorialId);
					} else {
						await db
							.update(table.memorial)
							.set({ egressId: null, updatedAt: new Date() })
							.where(eq(table.memorial.id, memorialId));
						console.log('[LiveKit Webhook] Egress ended, cleared egress ID:', memorialId);
					}
				}
				break;
			}

			case 'participant_joined': {
				const identity = event.participant?.identity;
				const roomName = event.room?.name;
				if (identity && roomName && !identity.startsWith('switcher-')) {
					// A camera device joined — update device status
					await db
						.update(table.device)
						.set({
							status: 'connected',
							connectedAt: new Date(),
							lastSeen: new Date()
						})
						.where(eq(table.device.id, identity));
					console.log('[LiveKit Webhook] Device connected:', identity);
				}
				break;
			}

			case 'participant_left': {
				const identity = event.participant?.identity;
				if (identity && !identity.startsWith('switcher-')) {
					await db
						.update(table.device)
						.set({
							status: 'disconnected',
							lastSeen: new Date()
						})
						.where(eq(table.device.id, identity));
					console.log('[LiveKit Webhook] Device disconnected:', identity);
				}
				break;
			}

			default:
				console.log('[LiveKit Webhook] Unhandled event:', event.event);
		}
	} catch (e) {
		console.error('[LiveKit Webhook] Error processing event:', e);
	}

	return json({ received: true });
};
