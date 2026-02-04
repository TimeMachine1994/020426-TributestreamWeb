import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isAdmin } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!isAdmin(user)) {
		throw redirect(303, '/dashboard');
	}

	return { user };
};
