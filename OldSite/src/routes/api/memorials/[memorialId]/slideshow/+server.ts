import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { memorialId } = params;
	
	console.log('🎬 [SLIDESHOW API] POST - Adding slideshow to memorial:', memorialId);
	
	// Check authentication
	if (!locals.user) {
		console.log('🔒 [SLIDESHOW API] Unauthorized request');
		throw error(401, 'Unauthorized');
	}
	
	try {
		const slideshowData = await request.json();
		console.log('🎬 [SLIDESHOW API] Slideshow data received:', {
			id: slideshowData.id,
			title: slideshowData.title,
			photoCount: slideshowData.photos?.length || 0
		});
		
		// Verify user has access to this memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();
		
		if (!memorialDoc.exists) {
			console.log('🔒 [SLIDESHOW API] Memorial not found:', memorialId);
			throw error(404, 'Memorial not found');
		}
		
		const memorialData = memorialDoc.data();
		const userRole = locals.user.role;
		const userId = locals.user.uid;
		
		// Check permissions
		const hasPermission = 
			userRole === 'admin' ||
			memorialData?.ownerUid === userId ||
			memorialData?.funeralDirectorUid === userId;
			
		if (!hasPermission) {
			console.log('🔒 [SLIDESHOW API] Insufficient permissions for user:', userId);
			throw error(403, 'Insufficient permissions');
		}
		
		// Check if slideshow already exists (for updates)
		const slideshowRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshows')
			.doc(slideshowData.id);
			
		const existingSlideshow = await slideshowRef.get();
		
		let slideshowDoc;
		if (existingSlideshow.exists) {
			// Update existing slideshow
			slideshowDoc = {
				...slideshowData,
				memorialId,
				createdBy: existingSlideshow.data()?.createdBy || userId,
				createdAt: existingSlideshow.data()?.createdAt || new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			console.log('🔄 [SLIDESHOW API] Updating existing slideshow:', slideshowData.id);
		} else {
			// Create new slideshow
			slideshowDoc = {
				...slideshowData,
				memorialId,
				createdBy: userId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			console.log('✨ [SLIDESHOW API] Creating new slideshow:', slideshowData.id);
		}
		
		await slideshowRef.set(slideshowDoc);
		
		console.log('✅ [SLIDESHOW API] Slideshow added successfully:', slideshowData.id);
		
		// Update memorial document to include slideshow reference
		await memorialRef.update({
			hasSlideshow: true,
			updatedAt: new Date().toISOString()
		});
		
		return json({ 
			success: true, 
			slideshowId: slideshowData.id,
			message: 'Slideshow added to memorial successfully'
		});
		
	} catch (err: any) {
		console.error('🔥 [SLIDESHOW API] Error adding slideshow:', err);
		
		if (err.status) {
			throw err; // Re-throw SvelteKit errors
		}
		
		throw error(500, 'Failed to add slideshow to memorial');
	}
};

export const GET: RequestHandler = async ({ params, locals }) => {
	const { memorialId } = params;
	
	console.log('🎬 [SLIDESHOW API] GET - Fetching slideshows for memorial:', memorialId);
	
	try {
		// Get all slideshows for this memorial
		const slideshowsRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshows')
			.orderBy('createdAt', 'desc');
			
		const slideshowsSnapshot = await slideshowsRef.get();
		
		const slideshows = slideshowsSnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data()
		}));
		
		console.log(' [SLIDESHOW API] Found', slideshows.length, 'slideshows');
		
		return json(slideshows);
		
	} catch (err: any) {
		console.error(' [SLIDESHOW API] Error fetching slideshows:', err);
		throw error(500, 'Failed to fetch slideshows');
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { memorialId } = params;
	
	console.log('🗑️ [SLIDESHOW API] DELETE - Unpublishing slideshow for memorial:', memorialId);
	
	// Check authentication
	if (!locals.user) {
		console.log('🔒 [SLIDESHOW API] Unauthorized delete request');
		throw error(401, 'Unauthorized');
	}
	
	try {
		// Verify user has access to this memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();
		
		if (!memorialDoc.exists) {
			console.log('🔒 [SLIDESHOW API] Memorial not found:', memorialId);
			throw error(404, 'Memorial not found');
		}
		
		const memorialData = memorialDoc.data();
		const userRole = locals.user.role;
		const userId = locals.user.uid;
		
		// Check permissions
		const hasPermission = 
			userRole === 'admin' ||
			memorialData?.ownerUid === userId ||
			memorialData?.funeralDirectorUid === userId;
			
		if (!hasPermission) {
			console.log('🔒 [SLIDESHOW API] Insufficient permissions for delete:', userId);
			throw error(403, 'Insufficient permissions');
		}
		
		// Get all published slideshows for this memorial
		const slideshowsRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshows')
			.where('status', 'in', ['ready', 'processing']);
			
		const slideshowsSnapshot = await slideshowsRef.get();
		
		if (slideshowsSnapshot.empty) {
			console.log('⚠️ [SLIDESHOW API] No published slideshows found to unpublish');
			return json({ success: true, message: 'No published slideshows to unpublish' });
		}
		
		// Update slideshow status to 'unpublished' instead of deleting
		const batch = adminDb.batch();
		
		slideshowsSnapshot.docs.forEach(doc => {
			batch.update(doc.ref, {
				status: 'unpublished',
				unpublishedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});
		});
		
		await batch.commit();
		
		console.log('✅ [SLIDESHOW API] Unpublished', slideshowsSnapshot.docs.length, 'slideshows');
		
		// Update memorial document to reflect no published slideshow
		await memorialRef.update({
			hasSlideshow: false,
			updatedAt: new Date().toISOString()
		});
		
		return json({ 
			success: true, 
			message: 'Slideshow unpublished successfully',
			unpublishedCount: slideshowsSnapshot.docs.length
		});
		
	} catch (err: any) {
		console.error('🔥 [SLIDESHOW API] Error unpublishing slideshow:', err);
		
		if (err.status) {
			throw err; // Re-throw SvelteKit errors
		}
		
		throw error(500, 'Failed to unpublish slideshow');
	}
};
