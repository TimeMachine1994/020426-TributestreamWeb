import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Redirect to the appropriate profile page based on role
	if (locals.user.role === 'admin') {
		throw redirect(303, '/admin');
	} else if (locals.user.role === 'funeral_director' || locals.user.role === 'owner') {
		throw redirect(303, '/profile');
	}

	// Fallback to profile for any other roles
	throw redirect(303, '/profile');
};
