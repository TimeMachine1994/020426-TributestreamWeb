import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMemorialById, canEditMemorial } from '$lib/server/services/memorial.service';
import { getStreamsForMemorial } from '$lib/server/services/stream.service';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	const { memorialId } = params;
	const memorial = await getMemorialById(memorialId);

	if (!memorial) {
		throw error(404, 'Memorial not found');
	}

	if (!canEditMemorial(memorial, locals.user)) {
		throw error(403, 'You do not have permission to edit this memorial');
	}

	const streams = await getStreamsForMemorial(memorialId);

	return {
		memorial: {
			id: memorial.id,
			title: memorial.title,
			slug: memorial.slug,
			lovedOneName: memorial.lovedOneName,
			directorFullName: memorial.directorFullName,
			funeralHomeName: memorial.funeralHomeName
		},
		services: memorial.services,
		calculatorConfig: memorial.calculatorConfig,
		customPricing: memorial.customPricing,
		streams,
		user: locals.user
	};
};
