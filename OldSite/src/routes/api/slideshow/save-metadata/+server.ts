import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

/**
 * Lightweight API to save slideshow metadata only
 * Video and photos are uploaded to Firebase Storage
 * This avoids Vercel's 4.5MB serverless function body limit
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('💾 [METADATA API] Save request received');

	// Authentication check
	if (!locals.user) {
		console.log('🔒 [METADATA API] No authenticated user');
		return error(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const userRole = locals.user.role;

	try {
		const { memorialId, title, firebaseStoragePath, playbackUrl, thumbnailUrl, photos, settings, audio, status, isFirebaseHosted } = await request.json();

		console.log('💾 [METADATA API] Metadata received:', {
			memorialId,
			title,
			firebaseStoragePath,
			playbackUrl: playbackUrl?.substring(0, 50) + '...',
			photoCount: photos?.length,
			hasAudio: !!audio,
			isFirebaseHosted
		});

		// Validate required fields
		if (!firebaseStoragePath || !playbackUrl || !memorialId || !photos) {
			return error(400, 'Missing required fields: firebaseStoragePath, playbackUrl, memorialId, photos');
		}

		// Verify memorial exists and user has permission
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.log('💾 [METADATA API] Memorial not found:', memorialId);
			return error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		
		// Check user permissions
		const hasPermission = 
			userRole === 'admin' ||
			memorialData?.ownerUid === userId ||
			memorialData?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('💾 [METADATA API] Insufficient permissions for user:', userId);
			return error(403, 'Insufficient permissions');
		}

		// Check for existing slideshow to overwrite
		let slideshowId: string;
		let isUpdate = false;

		try {
			const existingSlideshowsSnapshot = await adminDb
				.collection('memorials')
				.doc(memorialId)
				.collection('slideshows')
				.orderBy('createdAt', 'desc')
				.limit(1)
				.get();

			if (!existingSlideshowsSnapshot.empty) {
				slideshowId = existingSlideshowsSnapshot.docs[0].id;
				isUpdate = true;
				console.log('💾 [METADATA API] Updating existing slideshow:', slideshowId);
			} else {
				slideshowId = crypto.randomUUID();
				console.log('💾 [METADATA API] Creating new slideshow:', slideshowId);
			}
		} catch (err) {
			slideshowId = crypto.randomUUID();
			console.log('💾 [METADATA API] Creating new slideshow (check failed):', slideshowId);
		}

		// Get existing data if updating
		let existingData: any = {};
		if (isUpdate) {
			try {
				const existingRef = adminDb
					.collection('memorials')
					.doc(memorialId)
					.collection('slideshows')
					.doc(slideshowId);
				const existingDoc = await existingRef.get();
				if (existingDoc.exists) {
					existingData = existingDoc.data() || {};
				}
			} catch (err) {
				console.warn('Could not fetch existing slideshow data:', err);
			}
		}

		// Build slideshow document
		const slideshowDoc = {
			id: slideshowId,
			title: title || 'Memorial Slideshow',
			memorialId,
			// Firebase Storage URLs
			firebaseStoragePath,
			playbackUrl, // Firebase Storage WebM video URL
			thumbnailUrl: thumbnailUrl || null,
			photos: Array.isArray(photos) ? photos.map((photo: any) => ({
				id: photo.id || '',
				caption: photo.caption || '',
				duration: photo.duration || 3,
				url: photo.url || '',
				storagePath: photo.storagePath || ''
			})) : [],
			settings: settings || {
				photoDuration: 3,
				transitionType: 'fade',
				videoQuality: 'medium',
				aspectRatio: '16:9'
			},
			audio: audio || null,
			// WebM videos are immediately ready (no transcoding needed)
			status: status || 'ready',
			isFirebaseHosted: isFirebaseHosted !== false, // Default to true
			createdBy: existingData.createdBy || userId || '',
			createdAt: existingData.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		console.log('💾 [METADATA API] Slideshow document:', JSON.stringify(slideshowDoc, null, 2));

		// Remove any undefined values recursively
		const cleanSlideshowDoc = removeUndefinedValues(slideshowDoc);

		// Save to Firestore
		const slideshowRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshows')
			.doc(slideshowId);
			
		await slideshowRef.set(cleanSlideshowDoc);

		// Update memorial to indicate it has slideshows
		await memorialRef.update({
			hasSlideshow: true,
			updatedAt: new Date().toISOString()
		});

		console.log(`✅ [METADATA API] Slideshow ${isUpdate ? 'updated' : 'created'} successfully:`, slideshowId);

		return json({
			success: true,
			slideshowId,
			downloadURL: playbackUrl,
			firebaseStoragePath,
			thumbnailUrl,
			message: `Slideshow ${isUpdate ? 'updated' : 'created'} successfully`
		});

	} catch (err) {
		console.error('💾 [METADATA API] Error:', err);
		
		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		const message = err instanceof Error ? err.message : 'Unknown error';
		return error(500, `Failed to save slideshow: ${message}`);
	}
};

/**
 * Recursively remove undefined values from an object for Firestore compatibility
 */
function removeUndefinedValues(obj: any): any {
	if (obj === null || obj === undefined) {
		return null;
	}
	
	if (Array.isArray(obj)) {
		return obj.map(item => removeUndefinedValues(item));
	}
	
	if (typeof obj === 'object') {
		const cleaned: any = {};
		for (const [key, value] of Object.entries(obj)) {
			if (value !== undefined) {
				cleaned[key] = removeUndefinedValues(value);
			}
		}
		return cleaned;
	}
	
	return obj;
}
