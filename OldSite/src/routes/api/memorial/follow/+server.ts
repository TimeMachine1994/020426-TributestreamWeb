import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { memorialId, action } = await request.json();
		const user = locals.user;

		if (!user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (!memorialId || !action) {
			return json({ error: 'Memorial ID and action are required' }, { status: 400 });
		}

		if (action !== 'follow' && action !== 'unfollow') {
			return json({ error: 'Action must be "follow" or "unfollow"' }, { status: 400 });
		}

		// Update user's followed memorials
		const userRef = adminDb.collection('users').doc(user.uid);

		if (action === 'follow') {
			await userRef.update({
				followedMemorials: FieldValue.arrayUnion(memorialId)
			});
		} else {
			await userRef.update({
				followedMemorials: FieldValue.arrayRemove(memorialId)
			});
		}

		// Update memorial's followers count
		const memorialRef = adminDb.collection('memorials').doc(memorialId);

		if (action === 'follow') {
			await memorialRef.update({
				followers: FieldValue.arrayUnion(user.uid),
				followerCount: FieldValue.increment(1)
			});
		} else {
			await memorialRef.update({
				followers: FieldValue.arrayRemove(user.uid),
				followerCount: FieldValue.increment(-1)
			});
		}

		return json({
			success: true,
			action,
			message:
				action === 'follow' ? 'Memorial followed successfully' : 'Memorial unfollowed successfully'
		});
	} catch (error) {
		console.error('Memorial follow/unfollow error:', error);
		return json({ error: 'Failed to update follow status' }, { status: 500 });
	}
};
