import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError } from '@sveltejs/kit';
import type { Stream } from '$lib/types/stream';

export const load: PageServerLoad = async ({ params, locals }) => {
	const memorialId = params.id;

	// Fetch memorial details
	const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

	if (!memorialDoc.exists) {
		throw SvelteKitError(404, 'Memorial not found');
	}

	const memorialData = memorialDoc.data()!;
	
	const memorial = {
		id: memorialDoc.id,
		lovedOneName: memorialData.lovedOneName,
		ownerUid: memorialData.ownerUid,
		funeralDirectorUid: memorialData.funeralDirectorUid,
		isPublic: memorialData.isPublic
	};

	// Check if user can manage streams
	let canManage = false;
	if (locals.user) {
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		canManage =
			userRole === 'admin' ||
			userRole === 'funeral_director' ||
			memorialData.funeralDirectorUid === userId ||
			memorialData.ownerUid === userId;
	}

	// Fetch streams for this memorial
	const streamsSnapshot = await adminDb
		.collection('streams')
		.where('memorialId', '==', memorialId)
		.orderBy('createdAt', 'desc')
		.get();

	const streams: Stream[] = streamsSnapshot.docs.map((doc) => ({
		id: doc.id,
		...doc.data()
	})) as Stream[];

	return {
		memorial,
		streams,
		canManage
	};
};
