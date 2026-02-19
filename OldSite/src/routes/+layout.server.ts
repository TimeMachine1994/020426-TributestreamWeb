import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	console.log('[+layout.server.ts] Load function running...');
	return {
		user: locals.user
	};
};
