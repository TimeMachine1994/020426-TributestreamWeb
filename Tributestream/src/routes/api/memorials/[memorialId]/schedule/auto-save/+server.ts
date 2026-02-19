import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMemorialById, canEditMemorial } from '$lib/server/services/memorial.service';
import { autoSaveBooking } from '$lib/server/services/booking.service';
import type { MemorialServices, CalculatorFormData } from '$lib/features/booking/types';

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

	const { services, calculatorData } = (await request.json()) as {
		services?: MemorialServices;
		calculatorData?: CalculatorFormData;
	};

	if (!services && !calculatorData) {
		throw error(400, 'Services or calculator data is required');
	}

	const result = await autoSaveBooking(
		{ memorialId, services, calculatorData },
		locals.user.id
	);

	if (!result.success) {
		return json({ error: result.error }, { status: 500 });
	}

	return json({ success: true, timestamp: result.timestamp });
};

export const GET: RequestHandler = async ({ params, locals }) => {
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

	return json({
		success: true,
		services: memorial.services,
		calculatorConfig: memorial.calculatorConfig,
		hasAutoSave: !!(memorial.calculatorConfig?.autoSave)
	});
};
