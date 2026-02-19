import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, fetch }) => {
	const query = url.searchParams.get('q') || '';

	try {
		// Use server-side API to load memorials
		const response = await fetch('/api/memorials/search');
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
		const data = await response.json();
		const memorials = data.memorials || [];

		return {
			query,
			memorials
		};
	} catch (error) {
		console.error('Error loading memorials:', error);
		return {
			query,
			memorials: []
		};
	}
};
