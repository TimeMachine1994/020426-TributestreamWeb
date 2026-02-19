import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMemorialById, canEditMemorial } from '$lib/server/services/memorial.service';
import { saveBooking } from '$lib/server/services/booking.service';
import type { MemorialServices, CalculatorFormData } from '$lib/features/booking/types';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
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
	const {
		services,
		calculatorData,
		lovedOneName,
		directorFullName,
		funeralHomeName
	} = body as {
		services: MemorialServices;
		calculatorData: CalculatorFormData;
		lovedOneName?: string;
		directorFullName?: string;
		funeralHomeName?: string;
	};

	if (!services?.main) {
		throw error(400, 'Invalid services data');
	}

	if (!calculatorData?.selectedTier) {
		throw error(400, 'Calculator data with selected tier is required');
	}

	const result = await saveBooking(
		{
			memorialId,
			services,
			calculatorData,
			lovedOneName,
			directorFullName,
			funeralHomeName
		},
		locals.user.id
	);

	if (!result.success) {
		return json(
			{ error: 'Failed to save booking', details: result.errors },
			{ status: 500 }
		);
	}

	return json({
		success: true,
		bookingItems: result.bookingItems,
		total: result.total,
		services
	});
};
