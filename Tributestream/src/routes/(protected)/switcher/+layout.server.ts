import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { canAccessSwitcher } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!canAccessSwitcher(user)) {
		throw redirect(303, '/dashboard');
	}

	return { user };
};
