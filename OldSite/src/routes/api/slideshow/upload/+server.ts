import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getStorage } from 'firebase-admin/storage';

// Cloudflare Stream API configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
	console.error('Missing Cloudflare configuration');
}

export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('🎬 [SLIDESHOW API] POST - Uploading slideshow video');
	
	// Check authentication
	if (!locals.user) {
		console.log('🔒 [SLIDESHOW API] Unauthorized request');
		throw error(401, 'Unauthorized');
	}

	try {
		const formData = await request.formData();
		const videoBlob = formData.get('video') as File;
		const memorialId = formData.get('memorialId') as string;
		const title = formData.get('title') as string || 'Memorial Slideshow';
		const photosData = formData.get('photos') as string;
		const settingsData = formData.get('settings') as string;

		if (!videoBlob) {
			throw error(400, 'No video file provided');
		}

		if (!memorialId) {
			throw error(400, 'Memorial ID is required');
		}

		console.log('🎬 [SLIDESHOW API] Processing upload:', {
			videoSize: videoBlob.size,
			memorialId,
			title,
			userId: locals.user.uid
		});

		// Verify user has access to this memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();
		
		if (!memorialDoc.exists) {
			console.log('🔒 [SLIDESHOW API] Memorial not found:', memorialId);
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		const userId = locals.user.uid;
		const userRole = locals.user.role;
		
		// Check permissions
		const hasPermission = 
			userRole === 'admin' ||
			memorialData?.ownerUid === userId ||
			memorialData?.funeralDirectorUid === userId;
			
		if (!hasPermission) {
			console.log('🔒 [SLIDESHOW API] Insufficient permissions for user:', userId);
			throw error(403, 'Insufficient permissions');
		}

		// Upload to Cloudflare Stream (if configured)
		let cloudflareResult = null;
		if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
			console.log('☁️ [SLIDESHOW API] Uploading to Cloudflare Stream...');
			cloudflareResult = await uploadToCloudflareStream(videoBlob, title);
			console.log('☁️ [SLIDESHOW API] Cloudflare result:', JSON.stringify(cloudflareResult, null, 2));
		} else {
			console.warn('⚠️ [SLIDESHOW API] Cloudflare Stream not configured - storing slideshow without video hosting');
			// Create a mock result for local storage
			cloudflareResult = {
				uid: `local-${Date.now()}`,
				preview: null,
				playback: null,
				thumbnail: null
			};
		}

		// Parse photos and settings data
		let photos = [];
		let settings = {};
		
		try {
			if (photosData) photos = JSON.parse(photosData);
			if (settingsData) settings = JSON.parse(settingsData);
		} catch (parseError) {
			console.warn('Failed to parse photos/settings data:', parseError);
		}

		// Upload individual photos to Firebase Storage for editing capability
		// (We use Firebase Storage for photos even with Cloudflare video hosting)
		console.log('🔥 [SLIDESHOW API] Uploading individual photos for editing...');
		const uploadedPhotos = await uploadPhotosToFirebaseStorage(photos, memorialId, title);
		console.log('🔥 [SLIDESHOW API] Uploaded', uploadedPhotos.length, 'photos');

		// Save slideshow metadata to Firestore
		const slideshowId = crypto.randomUUID();
		const isCloudflareConfigured = CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN;
		
		// Ensure no undefined values for Firestore
		const slideshowDoc = {
			id: slideshowId,
			title: title || 'Memorial Slideshow',
			memorialId,
			cloudflareStreamId: cloudflareResult.uid || null,
			embedUrl: cloudflareResult.preview || null,
			playbackUrl: cloudflareResult.playback?.hls || null,
			thumbnailUrl: cloudflareResult.thumbnail || null,
			photos: Array.isArray(uploadedPhotos) ? uploadedPhotos.map((photo: any) => ({
				id: photo.id || '',
				caption: photo.caption || '',
				duration: photo.duration || 3,
				url: photo.downloadURL || '', // Firebase Storage URL for editing
				storagePath: photo.storagePath || '' // Storage path for management
			})) : [],
			settings: settings || {
				photoDuration: 3,
				transitionType: 'fade',
				videoQuality: 'medium',
				aspectRatio: '16:9'
			},
			status: isCloudflareConfigured ? 'processing' : 'local_only',
			isCloudflareHosted: isCloudflareConfigured,
			createdBy: userId || '',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		console.log('📝 [SLIDESHOW API] Slideshow document to save:', JSON.stringify(slideshowDoc, null, 2));

		// Remove any undefined values recursively (Firestore safety)
		const cleanSlideshowDoc = removeUndefinedValues(slideshowDoc);
		
		console.log('📝 [SLIDESHOW API] Cleaned slideshow document:', JSON.stringify(cleanSlideshowDoc, null, 2));

		// Save to memorial's slideshows subcollection
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

		console.log('✅ [SLIDESHOW API] Slideshow created successfully:', slideshowId);

		return json({
			success: true,
			slideshowId,
			cloudflareStreamId: cloudflareResult.uid,
			embedUrl: cloudflareResult.preview,
			playbackUrl: cloudflareResult.playback?.hls,
			isCloudflareHosted: isCloudflareConfigured,
			message: isCloudflareConfigured 
				? 'Slideshow uploaded to Cloudflare Stream and processing'
				: 'Slideshow created successfully (Cloudflare Stream not configured - video stored locally only)'
		});

	} catch (err: any) {
		console.error('🔥 [SLIDESHOW API] Error uploading slideshow:', err);
		
		if (err.status) {
			throw err; // Re-throw SvelteKit errors
		}
		
		throw error(500, `Failed to upload slideshow: ${err.message}`);
	}
};

/**
 * Upload video to Cloudflare Stream
 */
async function uploadToCloudflareStream(videoBlob: File, title: string) {
	if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
		throw new Error('Cloudflare configuration missing');
	}

	const formData = new FormData();
	formData.append('file', videoBlob);
	
	// Add metadata
	const metadata = {
		name: title,
		meta: {
			type: 'memorial-slideshow',
			created: new Date().toISOString()
		}
	};
	
	formData.append('meta', JSON.stringify(metadata));

	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
		{
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
			},
			body: formData
		}
	);

	if (!response.ok) {
		const errorText = await response.text();
		console.error('Cloudflare Stream upload failed:', response.status, errorText);
		throw new Error(`Cloudflare upload failed: ${response.status} ${response.statusText}`);
	}

	const result = await response.json();
	
	if (!result.success) {
		console.error('Cloudflare Stream API error:', result.errors);
		throw new Error(`Cloudflare API error: ${result.errors?.[0]?.message || 'Unknown error'}`);
	}

	console.log('✅ Cloudflare Stream upload successful:', result.result.uid);
	return result.result;
}

/**
 * Upload individual photos to Firebase Storage for editing capability
 */
async function uploadPhotosToFirebaseStorage(photos: any[], memorialId: string, title: string) {
	try {
		const storage = getStorage();
		const bucket = storage.bucket();
		const timestamp = Date.now();
		const uploadedPhotos = [];

		for (let i = 0; i < photos.length; i++) {
			const photo = photos[i];
			
			if (!photo.data) {
				console.warn(`Photo ${i + 1} has no data, skipping`);
				continue;
			}

			// Create unique filename for each photo
			const filename = `slideshows/${memorialId}/photos/${timestamp}-${photo.id}.jpg`;
			
			console.log(`🔥 [FIREBASE STORAGE] Uploading photo ${i + 1} to:`, filename);

			// Convert base64 to buffer
			const base64Data = photo.data.replace(/^data:image\/[a-z]+;base64,/, '');
			const buffer = Buffer.from(base64Data, 'base64');

			// Upload photo
			const file = bucket.file(filename);
			await file.save(buffer, {
				metadata: {
					contentType: 'image/jpeg',
					metadata: {
						memorialId,
						photoId: photo.id,
						caption: photo.caption || '',
						uploadedAt: new Date().toISOString(),
						type: 'slideshow-photo'
					}
				}
			});

			// Make photo publicly readable
			await file.makePublic();

			// Get public download URL
			const downloadURL = `https://storage.googleapis.com/${bucket.name}/${filename}`;

			uploadedPhotos.push({
				id: photo.id,
				caption: photo.caption || '',
				duration: photo.duration || 3,
				downloadURL,
				storagePath: filename
			});

			console.log(`✅ [FIREBASE STORAGE] Photo ${i + 1} uploaded successfully`);
		}

		console.log(`✅ [FIREBASE STORAGE] All photos uploaded. Total: ${uploadedPhotos.length}`);
		return uploadedPhotos;

	} catch (err: any) {
		console.error('🔥 [FIREBASE STORAGE] Photo upload failed:', err);
		throw new Error(`Firebase Storage photo upload failed: ${err.message}`);
	}
}

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

/**
 * Get slideshow status from Cloudflare
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const streamId = url.searchParams.get('streamId');
	
	if (!streamId) {
		throw error(400, 'Stream ID required');
	}

	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
			throw new Error('Cloudflare configuration missing');
		}

		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${streamId}`,
			{
				headers: {
					'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
				}
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to get stream status: ${response.status}`);
		}

		const result = await response.json();
		
		return json({
			success: true,
			status: result.result.status,
			playback: result.result.playback,
			thumbnail: result.result.thumbnail
		});

	} catch (err: any) {
		console.error('Error getting stream status:', err);
		throw error(500, `Failed to get stream status: ${err.message}`);
	}
};
