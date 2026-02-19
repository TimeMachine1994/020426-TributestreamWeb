import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMemorialById, canEditMemorial } from '$lib/server/services/memorial.service';
import {
	getStreamsForMemorial,
	createStream,
	type CreateStreamInput
} from '$lib/server/services/stream.service';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { memorialId } = params;
	if (!memorialId) {
		throw error(400, 'Memorial ID is required');
	}

	const streams = await getStreamsForMemorial(memorialId);
	return json({ success: true, streams });
};

export const POST: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	const { memorialId } = params;
	if (!memorialId) {
		throw error(400, 'Memorial ID is required');
	}

	const memorial = await getMemorialById(memorialId);
	if (!memorial) {
		throw error(404, 'Memorial not found');
	}

	if (!canEditMemorial(memorial, locals.user)) {
		throw error(403, 'Permission denied');
	}

	const body = await request.json();
	const { title, description, scheduledStartTime, calculatorServiceType, calculatorServiceIndex } =
		body as {
			title: string;
			description?: string;
			scheduledStartTime?: string;
			calculatorServiceType?: string;
			calculatorServiceIndex?: number | null;
		};

	if (!title) {
		throw error(400, 'Stream title is required');
	}

	const input: CreateStreamInput = {
		memorialId,
		title,
		description,
		scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined,
		calculatorServiceType,
		calculatorServiceIndex,
		createdBy: locals.user.id
	};

	const stream = await createStream(input);

	return json({ success: true, stream });
};
