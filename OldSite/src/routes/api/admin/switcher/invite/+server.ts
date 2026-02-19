import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { createDailyToken } from '$lib/server/daily';

export async function POST({ request, locals }) {
	// Security check
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const { memorialId, cameraLabel } = await request.json();

	if (!memorialId || !cameraLabel) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	try {
		// Get room name from Firestore
		const streamDoc = await adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('streams')
			.doc('main-broadcast')
			.get();

		if (!streamDoc.exists) {
			return json({ error: 'Stream configuration not found. Visit the switcher page first.' }, { status: 404 });
		}

		const { dailyRoomName, dailyRoomUrl } = streamDoc.data();

		// Generate Token
		const tokenData = await createDailyToken(dailyRoomName, {
			isOwner: false,
			userName: cameraLabel,
			expiresIn: 86400 * 7 // 7 days validity for helper links
		});

		// Build URL to our dedicated camera page (mobile-friendly)
		const baseUrl = request.headers.get('origin') || 'https://tributestream.com';
		const joinUrl = `${baseUrl}/camera/${dailyRoomName}?t=${tokenData.token}&label=${encodeURIComponent(cameraLabel)}`;

		return json({ joinUrl, token: tokenData.token });

	} catch (err) {
		console.error('Error generating invite:', err);
		return json({ error: 'Failed to generate invite' }, { status: 500 });
	}
}
