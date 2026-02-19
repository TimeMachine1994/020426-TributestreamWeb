import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMemorialBySlug } from '$lib/server/services/memorial.service';
import { getStreamsForMemorial } from '$lib/server/services/stream.service';

// Reserved routes that should not be treated as memorial slugs
const RESERVED_ROUTES = ['login', 'logout', 'register', 'admin', 'dashboard', 'switcher', 'camera'];

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;

	// Don't match reserved routes
	if (RESERVED_ROUTES.includes(slug)) {
		throw error(404, 'Not found');
	}

	const memorial = await getMemorialBySlug(slug);

	if (!memorial) {
		throw error(404, 'Memorial not found');
	}

	// Fetch streams created by the calculator
	const streams = await getStreamsForMemorial(memorial.id);

	return {
		memorial: {
			id: memorial.id,
			slug: memorial.slug,
			title: memorial.title,
			description: memorial.description,
			scheduledAt: memorial.scheduledAt?.toISOString() ?? null,
			status: memorial.status,
			chatEnabled: memorial.chatEnabled,
			muxPlaybackId: memorial.muxPlaybackId,
			// Calculator-written fields (read path uses same MemorialServices type)
			lovedOneName: memorial.lovedOneName,
			services: memorial.services,
			imageUrl: memorial.imageUrl,
			birthDate: memorial.birthDate,
			deathDate: memorial.deathDate,
			content: memorial.content,
			isPaid: memorial.isPaid,
			funeralHomeName: memorial.funeralHomeName
		},
		streams: streams.map((s) => ({
			id: s.id,
			title: s.title,
			status: s.status,
			scheduledStartTime: s.scheduledStartTime?.toISOString() ?? null,
			muxPlaybackId: s.muxPlaybackId
		}))
	};
};
