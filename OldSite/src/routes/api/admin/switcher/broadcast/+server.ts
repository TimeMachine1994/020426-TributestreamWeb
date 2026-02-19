import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

/**
 * Broadcast API - Updates Firestore with stream status
 * 
 * Per Daily.co docs: Streaming is started/stopped via client SDK (callFrame.startLiveStreaming)
 * This API just persists the state to Firestore for the memorial page to read
 */
export async function POST({ request, locals }) {
	// Security check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const { memorialId, action, hlsUrl } = await request.json();

	if (!memorialId || !action) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	if (!['start', 'stop'].includes(action)) {
		return json({ error: 'Invalid action. Use "start" or "stop"' }, { status: 400 });
	}

	try {
		// Get/create stream config in Firestore
		const streamRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('streams')
			.doc('main-broadcast');

		if (action === 'start') {
			// Update Firestore with live status
			await streamRef.set({
				isLive: true,
				liveStartedAt: new Date(),
				hlsUrl: hlsUrl || null,
				status: 'live',
				updatedAt: new Date()
			}, { merge: true });

			// Also update the main memorial streams collection for the public page
			const mainStreamRef = adminDb.collection('streams').doc(`${memorialId}-main`);
			await mainStreamRef.set({
				memorialId,
				title: 'Live Memorial Service',
				status: 'live',
				playbackUrl: hlsUrl || null,
				hlsUrl: hlsUrl || null,
				liveStartedAt: new Date(),
				updatedAt: new Date(),
				type: 'daily-hls',
				isVisible: true,
				isLive: true
			}, { merge: true });

			return json({ 
				success: true, 
				message: 'Stream status updated to live'
			});

		} else if (action === 'stop') {
			// Update Firestore
			await streamRef.update({
				isLive: false,
				liveEndedAt: new Date(),
				status: 'completed',
				updatedAt: new Date()
			});

			// Update main streams collection
			const mainStreamRef = adminDb.collection('streams').doc(`${memorialId}-main`);
			await mainStreamRef.update({
				status: 'completed',
				isLive: false,
				liveEndedAt: new Date(),
				updatedAt: new Date()
			});

			return json({ 
				success: true, 
				message: 'Stream status updated to completed'
			});
		}

	} catch (err) {
		console.error('Broadcast API error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
