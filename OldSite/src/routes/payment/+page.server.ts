import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Extract booking data from URL params
	const encodedData = url.searchParams.get('data');

	if (!encodedData) {
		// Redirect to schedule if no data provided
		throw redirect(302, '/schedule');
	}

	try {
		// Decode base64 data first, then parse JSON
		const decodedData = atob(encodedData);
		const bookingData = JSON.parse(decodedData);
		return {
			bookingData
		};
	} catch (error) {
		console.error('Failed to parse booking data:', error);
		throw redirect(302, '/schedule');
	}
};
