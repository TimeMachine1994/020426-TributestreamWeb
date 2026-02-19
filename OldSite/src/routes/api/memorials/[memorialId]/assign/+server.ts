import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const POST: RequestHandler = async ({ locals, request, params }) => {
	console.log('Memorial ownership reassignment request received 🚚');

	// 1. Verify user is an admin
	if (!locals.user?.admin) {
		console.error('🚫 User is not an admin');
		error(403, 'Forbidden: You do not have permission to perform this action.');
	}

	const { memorialId } = params;
	if (!memorialId) {
		console.error('🚫 Memorial ID is missing from parameters');
		error(400, 'Bad Request: Memorial ID is required.');
	}

	try {
		// 2. Expect a JSON body with newOwnerUid
		const { newOwnerUid } = await request.json();
		console.log(`Received request to assign memorial ${memorialId} to new owner ${newOwnerUid} 👨‍💼`);

		// 3. Validate newOwnerUid is present
		if (!newOwnerUid) {
			console.error('🚫 newOwnerUid is missing from request body');
			error(400, 'Bad Request: newOwnerUid is required.');
		}

		// 4. Update the creatorUid field in Firestore
		const memorialRef = adminDb.collection('memorials').doc(memorialId);

		console.log(`Updating memorial ${memorialId} in Firestore... 📝`);
		await memorialRef.update({
			creatorUid: newOwnerUid
		});
		console.log(`✅ Successfully updated memorial ${memorialId}`);

		// 5. Return a successful JSON response
		return json({
			success: true,
			message: `Memorial ownership successfully reassigned to ${newOwnerUid}.`
		});
	} catch (e) {
		console.error('🔥 An error occurred during memorial ownership reassignment:', e);
		error(500, 'Internal Server Error: Could not reassign memorial ownership.');
	}
};
