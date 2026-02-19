import type { PageLoad } from './$types';
import type { MemorialSlideshow } from '$lib/types/slideshow';

export const load: PageLoad = async ({ url, fetch }) => {
	// Extract memorialId from URL
	const memorialId = url.searchParams.get('memorialId');
	
	// Extract slideshowId from URL (admin edit mode)
	const slideshowId = url.searchParams.get('slideshowId');
	
	// Extract edit data from URL (legacy method)
	const editParam = url.searchParams.get('edit');
	let editData: MemorialSlideshow | null = null;
	let isEditMode = false;
	
	// If slideshowId is provided, fetch the slideshow data
	if (slideshowId && memorialId) {
		try {
			const response = await fetch(`/api/memorials/${memorialId}/slideshow/${slideshowId}`);
			if (response.ok) {
				editData = await response.json();
				isEditMode = true;
				console.log('🎬 Loaded slideshow for editing:', slideshowId);
			} else {
				console.error('Failed to load slideshow:', response.statusText);
			}
		} catch (error) {
			console.error('Error loading slideshow:', error);
		}
	} else if (editParam) {
		// Legacy method: parse edit data from URL parameter
		try {
			editData = JSON.parse(decodeURIComponent(editParam));
			isEditMode = true;
		} catch (error) {
			console.error('Failed to parse edit data:', error);
		}
	}
	
	// Use memorialId from editData if available, otherwise from URL
	const finalMemorialId = editData?.memorialId || memorialId;
	
	return {
		memorialId: finalMemorialId,
		editData,
		isEditMode
	};
};
