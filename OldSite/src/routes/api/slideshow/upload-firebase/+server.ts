import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { getStorage } from 'firebase-admin/storage';

export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('🔥 [FIREBASE SLIDESHOW API] Upload request received');

	if (!locals.user) {
		console.log('🔒 [FIREBASE SLIDESHOW API] No authenticated user');
		throw error(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const userRole = locals.user.role;

	try {
		const formData = await request.formData();
		const videoBlob = formData.get('video') as File;
		const memorialId = formData.get('memorialId') as string;
		const title = formData.get('title') as string;
		const settingsData = formData.get('settings') as string;
		const existingSlideshowId = formData.get('slideshowId') as string;

		console.log('🔥 [FIREBASE SLIDESHOW API] Form data received:', {
			hasVideo: !!videoBlob,
			videoSize: videoBlob?.size,
			memorialId,
			title
		});

		if (!videoBlob || !memorialId) {
			throw error(400, 'Video file and memorial ID are required');
		}

		// Verify memorial exists and user has permission
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.log('🔥 [FIREBASE SLIDESHOW API] Memorial not found:', memorialId);
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		const hasPermission = 
			userRole === 'admin' ||
			memorialData?.ownerUid === userId ||
			memorialData?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log(' [FIREBASE SLIDESHOW API] Insufficient permissions for user:', userId);
			throw error(403, 'Insufficient permissions');
		}

		// Check for existing slideshows if no specific slideshowId provided
		let existingSlideshowToOverwrite = null;
		if (!existingSlideshowId) {
			console.log(' [FIREBASE SLIDESHOW API] Checking for existing slideshows to overwrite...');
			try {
				const existingSlideshowsSnapshot = await adminDb
					.collection('memorials')
					.doc(memorialId)
					.collection('slideshows')
					.orderBy('createdAt', 'desc')
					.limit(1)
					.get();

				if (!existingSlideshowsSnapshot.empty) {
					const existingDoc = existingSlideshowsSnapshot.docs[0];
					existingSlideshowToOverwrite = {
						id: existingDoc.id,
						data: existingDoc.data()
					};
					console.log(' [FIREBASE SLIDESHOW API] Found existing slideshow to overwrite:', existingSlideshowToOverwrite.id);
				} else {
					console.log(' [FIREBASE SLIDESHOW API] No existing slideshows found, creating new one');
				}
			} catch (err) {
				console.warn(' [FIREBASE SLIDESHOW API] Could not check for existing slideshows:', err);
				// Continue with new slideshow creation if check fails
			}
		}

		// Parse photos from FormData and settings
		const photos = [];
		let settings = {};
		
		// Extract photos from FormData
		let photoIndex = 0;
		while (formData.has(`photo_${photoIndex}_id`)) {
			const photoFile = formData.get(`photo_${photoIndex}_file`) as File;
			const photoId = formData.get(`photo_${photoIndex}_id`) as string;
			const photoCaption = formData.get(`photo_${photoIndex}_caption`) as string;
			const photoDuration = formData.get(`photo_${photoIndex}_duration`) as string;
			const photoUrl = formData.get(`photo_${photoIndex}_url`) as string;
			const photoStoragePath = formData.get(`photo_${photoIndex}_storagePath`) as string;
			
			if (photoId) {
				const photoData: any = {
					id: photoId,
					caption: photoCaption || '',
					duration: parseFloat(photoDuration) || 3
				};
				
				// New photo with file
				if (photoFile) {
					photoData.file = photoFile;
				}
				// Existing photo with stored URL
				else if (photoUrl) {
					photoData.url = photoUrl;
					photoData.storagePath = photoStoragePath;
				}
				
				photos.push(photoData);
			}
			photoIndex++;
		}
		
		// Parse settings
		try {
			if (settingsData) settings = JSON.parse(settingsData);
		} catch (parseError) {
			console.warn('Failed to parse settings data:', parseError);
		}
		
		console.log('🔥 [FIREBASE SLIDESHOW API] Parsed photos:', photos.length, 'files');

		// Upload individual photos to Firebase Storage for editing capability
		console.log('🔥 [FIREBASE SLIDESHOW API] Uploading individual photos for editing...');
		const uploadedPhotos = await uploadPhotosToFirebaseStorage(photos, memorialId, title);
		console.log('🔥 [FIREBASE SLIDESHOW API] Uploaded', uploadedPhotos.length, 'photos');

		// Upload video to Firebase Storage
		console.log('🔥 [FIREBASE SLIDESHOW API] Uploading to Firebase Storage...');
		const firebaseResult = await uploadToFirebaseStorage(videoBlob, memorialId, title);
		console.log('🔥 [FIREBASE SLIDESHOW API] Firebase result:', firebaseResult);

		// Use existing slideshow ID (from form data, found existing, or create new one)
		const slideshowId = existingSlideshowId || existingSlideshowToOverwrite?.id || crypto.randomUUID();
		const isUpdate = !!existingSlideshowId || !!existingSlideshowToOverwrite;
		
		// Get existing slideshow data if updating
		let existingData: any = {};
		if (isUpdate) {
			if (existingSlideshowToOverwrite) {
				// Use the slideshow data we already found
				existingData = existingSlideshowToOverwrite.data;
				console.log('📝 [FIREBASE SLIDESHOW API] Using existing slideshow data for overwrite');
			} else {
				// Fetch from Firestore for explicit slideshow ID updates
				try {
					const existingRef = adminDb
						.collection('memorials')
						.doc(memorialId)
						.collection('slideshows')
						.doc(slideshowId);
					const existingDoc = await existingRef.get();
					if (existingDoc.exists) {
						existingData = existingDoc.data() || {};
						console.log('📝 [FIREBASE SLIDESHOW API] Fetched existing slideshow data from Firestore');
					}
				} catch (err) {
					console.warn('Could not fetch existing slideshow data:', err);
				}
			}
		}
		
		// Ensure no undefined values for Firestore
		const slideshowDoc = {
			id: slideshowId,
			title: title || 'Memorial Slideshow',
			memorialId,
			firebaseStoragePath: firebaseResult.storagePath,
			playbackUrl: firebaseResult.downloadURL,
			thumbnailUrl: null, // Firebase Storage doesn't auto-generate thumbnails
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
			status: 'ready', // Firebase Storage files are immediately available
			isFirebaseHosted: true,
			isCloudflareHosted: false,
			createdBy: existingData.createdBy || userId || '',
			createdAt: existingData.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		console.log('📝 [FIREBASE SLIDESHOW API] Slideshow document to save:', JSON.stringify(slideshowDoc, null, 2));

		// Remove any undefined values recursively (Firestore safety)
		const cleanSlideshowDoc = removeUndefinedValues(slideshowDoc);
		
		console.log('📝 [FIREBASE SLIDESHOW API] Cleaned slideshow document:', JSON.stringify(cleanSlideshowDoc, null, 2));

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

		if (existingSlideshowToOverwrite) {
			console.log('✅ [FIREBASE SLIDESHOW API] Slideshow overwritten successfully:', slideshowId);
		} else if (existingSlideshowId) {
			console.log('✅ [FIREBASE SLIDESHOW API] Slideshow updated successfully:', slideshowId);
		} else {
			console.log('✅ [FIREBASE SLIDESHOW API] New slideshow created successfully:', slideshowId);
		}

		return json({
			success: true,
			slideshowId,
			downloadURL: firebaseResult.downloadURL,
			message: 'Slideshow uploaded to Firebase Storage successfully'
		});

	} catch (err: any) {
		console.error('🔥 [FIREBASE SLIDESHOW API] Error:', err);
		
		if (err.status) {
			throw err; // Re-throw SvelteKit errors
		}
		
		throw error(500, `Failed to upload slideshow: ${err.message}`);
	}
};

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
			
			// If photo already has URL (existing photo), just return its data
			if (photo.url && photo.storagePath) {
				uploadedPhotos.push({
					id: photo.id,
					caption: photo.caption || '',
					duration: photo.duration || 3,
					downloadURL: photo.url,
					storagePath: photo.storagePath
				});
				console.log(`✅ [FIREBASE STORAGE] Photo ${i + 1} already stored, using existing URL`);
				continue;
			}
			
			// Skip photos that don't have file data
			if (!photo.file && !photo.data) {
				console.warn(`Photo ${i + 1} has no file data, skipping`);
				continue;
			}

			// Create unique filename for each photo
			const filename = `slideshows/${memorialId}/photos/${timestamp}-${photo.id}.jpg`;
			
			console.log(`🔥 [FIREBASE STORAGE] Uploading photo ${i + 1} to:`, filename);

			let buffer: Buffer;
			let contentType = 'image/jpeg';

			// Handle File object (preferred) or base64 fallback
			if (photo.file instanceof File) {
				// Convert File to buffer
				const arrayBuffer = await photo.file.arrayBuffer();
				buffer = Buffer.from(arrayBuffer);
				contentType = photo.file.type || 'image/jpeg';
			} else if (photo.data) {
				// Fallback: Convert base64 to buffer (for existing data)
				const base64Data = photo.data.replace(/^data:image\/[a-z]+;base64,/, '');
				buffer = Buffer.from(base64Data, 'base64');
			} else {
				console.warn(`Photo ${i + 1} has no valid data format`);
				continue;
			}

			// Upload photo
			const file = bucket.file(filename);
			await file.save(buffer, {
				metadata: {
					contentType,
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
 * Upload video to Firebase Storage
 */
async function uploadToFirebaseStorage(videoBlob: File, memorialId: string, title: string) {
	try {
		// Get Firebase Storage instance
		const storage = getStorage();
		const bucket = storage.bucket();

		// Create unique filename
		const timestamp = Date.now();
		const filename = `slideshows/${memorialId}/${timestamp}-${title.replace(/[^a-zA-Z0-9]/g, '-')}.webm`;
		
		console.log('🔥 [FIREBASE STORAGE] Uploading to path:', filename);

		// Convert File to Buffer
		const arrayBuffer = await videoBlob.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload file
		const file = bucket.file(filename);
		await file.save(buffer, {
			metadata: {
				contentType: 'video/webm',
				metadata: {
					memorialId,
					title,
					uploadedAt: new Date().toISOString(),
					type: 'memorial-slideshow'
				}
			}
		});

		// Make file publicly readable
		await file.makePublic();

		// Get public download URL
		const downloadURL = `https://storage.googleapis.com/${bucket.name}/${filename}`;

		console.log('✅ [FIREBASE STORAGE] Upload successful:', downloadURL);

		return {
			storagePath: filename,
			downloadURL,
			bucket: bucket.name
		};

	} catch (error) {
		console.error('🔥 [FIREBASE STORAGE] Upload failed:', error);
		throw new Error(`Firebase Storage upload failed: ${error instanceof Error ? error.message : String(error)}`);
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
