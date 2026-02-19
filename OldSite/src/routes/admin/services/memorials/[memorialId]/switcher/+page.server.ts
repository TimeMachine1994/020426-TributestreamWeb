import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params, locals }) => {
	// 1. Security Check
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Unauthorized access');
	}

	const { memorialId } = params;

	// Check if Daily API key is configured
	const dailyApiKey = env.PRIVATE_DAILY_API_KEY;
	const isDailyConfigured = !!dailyApiKey;

	// DEBUG: Allow test ID
	if (memorialId === 'test-memorial-id') {
		return {
			memorial: {
				id: 'test-memorial-id',
				name: 'Test Memorial Service',
				lovedOneName: 'John Doe'
			},
			dailyConfig: {
				roomUrl: 'https://demo.daily.co/test-room', // Mock URL
				token: 'mock-token',
				configured: isDailyConfigured
			}
		};
	}

	// 2. Fetch Memorial
	const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
	if (!memorialDoc.exists) {
		throw error(404, 'Memorial not found');
	}
	const memorialData = memorialDoc.data() || {};

	// Helper to convert Firestore Timestamp to ISO string
	const toISOString = (val: any): string | null => {
		if (!val) return null;
		if (val.toDate) return val.toDate().toISOString(); // Firestore Timestamp
		if (val instanceof Date) return val.toISOString();
		if (typeof val === 'string') return val;
		return null;
	};

	// Only include serializable fields - explicitly avoid spreading raw Firestore data
	const memorial = {
		id: memorialId,
		name: memorialData.lovedOneName || 'Unknown Memorial',
		lovedOneName: memorialData.lovedOneName || null,
		fullSlug: memorialData.fullSlug || null,
		createdAt: toISOString(memorialData.createdAt),
		updatedAt: toISOString(memorialData.updatedAt),
		scheduledDate: toISOString(memorialData.scheduledDate),
	};

	// 3. Fetch or Create Daily Room
	// Check if we already have a Daily room for this memorial
	// Storing in a subcollection 'system/daily' or just on the memorial doc
	// Let's use a stream record for this.
	
	const streamRef = adminDb.collection('memorials').doc(memorialId).collection('streams').doc('main-broadcast');
	let streamDoc = await streamRef.get();
	let dailyRoomName = streamDoc.exists ? streamDoc.data()?.dailyRoomName : null;
	let dailyRoomUrl = streamDoc.exists ? streamDoc.data()?.dailyRoomUrl : null;

	// If no room exists and Daily is configured, create one
	if (!dailyRoomName && isDailyConfigured) {
		// Dynamically import daily helper only when needed
		const { createDailyRoom } = await import('$lib/server/daily');
		
		// Create unique room name: "mem-{memorialId short hash}"
		const uniqueSuffix = memorialId.substring(0, 8);
		const roomName = `mem-${uniqueSuffix}-${Date.now().toString().slice(-4)}`; // Ensure uniqueness
		
		try {
			const room = await createDailyRoom({
				name: roomName,
				privacy: 'private',
				properties: {
					enable_recording: 'cloud',
					max_participants: 10,
					exp: Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days expiry for the room
				}
			});
			
			dailyRoomName = room.name;
			dailyRoomUrl = room.url;

			// Save to Firestore
			await streamRef.set({
				id: 'main-broadcast',
				memorialId,
				dailyRoomName,
				dailyRoomUrl,
				createdAt: new Date(),
				type: 'daily-livestream'
			}, { merge: true });

		} catch (err) {
			console.error('Error creating Daily room:', err);
			// Continue without Daily - page will show unconfigured state
		}
	}

	// 4. Generate Admin Token (Owner)
	let token = null;
	if (dailyRoomName && isDailyConfigured) {
		const { createDailyToken } = await import('$lib/server/daily');
		try {
			const tokenData = await createDailyToken(dailyRoomName, {
				isOwner: true,
				userName: `Admin (${locals.user.displayName || 'Staff'})`,
				expiresIn: 86400 // 24 hours
			});
			token = tokenData.token;
		} catch (err) {
			console.error('Error creating Daily token:', err);
		}
	}

	return {
		memorial,
		dailyConfig: {
			roomUrl: dailyRoomUrl,
			token: token,
			configured: isDailyConfigured
		}
	};
};
