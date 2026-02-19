import { json } from '@sveltejs/kit';
import { AdminService } from '$lib/server/admin';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is admin
		if (!locals.user || locals.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}

		const stats = await AdminService.getDashboardStats();
		return json(stats);
	} catch (error) {
		console.error('Error fetching admin stats:', error);
		return json({ error: 'Failed to fetch statistics' }, { status: 500 });
	}
};
