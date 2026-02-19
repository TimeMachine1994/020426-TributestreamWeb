import { json } from '@sveltejs/kit';
import { AdminService } from '$lib/server/admin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}

		const { uid } = params;
		const { reason } = await request.json();

		await AdminService.suspendUser(uid, reason);

		// Log admin action
		await AdminService.logAdminAction(locals.user.uid, 'user_suspended', 'user', uid, { reason });

		return json({ success: true });
	} catch (error) {
		console.error('Error suspending user:', error);
		return json({ error: 'Failed to suspend user' }, { status: 500 });
	}
};
