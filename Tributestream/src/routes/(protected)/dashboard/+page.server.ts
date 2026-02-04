import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	// Role-aware redirect to appropriate dashboard
	switch (user.role) {
		case 'admin':
			throw redirect(303, '/admin');
		case 'videographer':
			throw redirect(303, '/switcher');
		case 'funeral_director':
			// TODO: Create funeral director dashboard
			return { user };
		case 'family_member':
		case 'contributor':
		case 'viewer':
		default:
			// Generic dashboard for other roles
			return { user };
	}
};
