import { json } from '@sveltejs/kit';
import { AdminService } from '$lib/server/admin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}

		const { uid } = params;

		await AdminService.activateUser(uid);

		// Log admin action
		await AdminService.logAdminAction(locals.user.uid, 'user_activated', 'user', uid, {});

		return json({ success: true });
	} catch (error) {
		console.error('Error activating user:', error);
		return json({ error: 'Failed to activate user' }, { status: 500 });
	}
};
