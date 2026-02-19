import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Verify authentication
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
		const userId = decodedClaims.uid;

		const { memorialId, photos, settings } = await request.json();

		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		// Validate and clean the photos array
		const cleanPhotos = Array.isArray(photos) ? photos.map(photo => ({
			id: photo.id || '',
			caption: photo.caption || '',
			duration: photo.duration || 3,
			fileName: photo.fileName || '',
			fileSize: photo.fileSize || 0,
			fileType: photo.fileType || '',
			preview: photo.preview || null,
			storedUrl: photo.storedUrl || null,
			storagePath: photo.storagePath || null
		})) : [];

		// Validate and clean settings
		const cleanSettings = {
			photoDuration: settings?.photoDuration || 3,
			transitionType: settings?.transitionType || 'fade',
			videoQuality: settings?.videoQuality || 'medium',
			aspectRatio: settings?.aspectRatio || '16:9'
		};

		console.log(`📝 Saving draft: ${cleanPhotos.length} photos, settings:`, cleanSettings);

		// Verify user has access to this memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorialData = memorialDoc.data();
		
		// Check permissions using the same pattern as other memorial APIs
		const hasPermission = 
			decodedClaims.role === 'admin' ||
			memorialData?.ownerUid === userId ||
			memorialData?.funeralDirectorUid === userId;
			
		if (!hasPermission) {
			console.log('🔒 [DRAFT API] Insufficient permissions for user:', userId, 'role:', decodedClaims.role);
			console.log('🔒 [DRAFT API] Memorial owner:', memorialData?.ownerUid, 'funeral director:', memorialData?.funeralDirectorUid);
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Save draft to Firestore
		const draftData = {
			memorialId,
			userId,
			photos: cleanPhotos,
			settings: cleanSettings,
			createdAt: new Date(),
			updatedAt: new Date(),
			version: '1.0'
		};

		const draftRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshow_drafts')
			.doc(userId);

		console.log('💾 Attempting to save draft data:', JSON.stringify(draftData, null, 2));
		
		await draftRef.set(draftData);

		console.log(`✅ Draft saved successfully for memorial ${memorialId}, user ${userId}`);

		return json({ 
			success: true, 
			message: 'Draft saved successfully',
			draftId: userId,
			photoCount: cleanPhotos.length
		});

	} catch (error: any) {
		console.error('❌ Error saving draft:', error);
		console.error('❌ Error details:', {
			message: error?.message,
			code: error?.code,
			details: error?.details
		});
		
		// Return more specific error information
		const errorMessage = error?.code === 3 ? 
			'Invalid data format - please try uploading photos again' : 
			'Failed to save draft';
			
		return json({ 
			error: errorMessage,
			details: error?.message || 'Unknown error'
		}, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		// Verify authentication
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
		const userId = decodedClaims.uid;

		const memorialId = url.searchParams.get('memorialId');

		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		// Verify user has access to this memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorialData = memorialDoc.data();
		
		// Check permissions using the same pattern as other memorial APIs
		const hasPermission = 
			decodedClaims.role === 'admin' ||
			memorialData?.ownerUid === userId ||
			memorialData?.funeralDirectorUid === userId;
			
		if (!hasPermission) {
			console.log('🔒 [DRAFT API GET] Insufficient permissions for user:', userId, 'role:', decodedClaims.role);
			console.log('🔒 [DRAFT API GET] Memorial owner:', memorialData?.ownerUid, 'funeral director:', memorialData?.funeralDirectorUid);
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Load draft from Firestore
		const draftRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshow_drafts')
			.doc(userId);

		const draftDoc = await draftRef.get();

		if (!draftDoc.exists) {
			return json({ 
				success: true, 
				draft: null,
				message: 'No draft found'
			});
		}

		const draftData = draftDoc.data();

		console.log(`✅ Draft loaded for memorial ${memorialId}, user ${userId}`);

		return json({ 
			success: true, 
			draft: draftData
		});

	} catch (error) {
		console.error('❌ Error loading draft:', error);
		return json({ error: 'Failed to load draft' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url, cookies }) => {
	try {
		// Verify authentication
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
		const userId = decodedClaims.uid;

		const memorialId = url.searchParams.get('memorialId');

		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		// Verify user has access to this memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorialData = memorialDoc.data();
		
		// Check permissions using the same pattern as other memorial APIs
		const hasPermission = 
			decodedClaims.role === 'admin' ||
			memorialData?.ownerUid === userId ||
			memorialData?.funeralDirectorUid === userId;
			
		if (!hasPermission) {
			console.log('🔒 [DRAFT API DELETE] Insufficient permissions for user:', userId, 'role:', decodedClaims.role);
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// Delete draft from Firestore
		const draftRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('slideshow_drafts')
			.doc(userId);

		await draftRef.delete();

		console.log(`🗑️ Draft deleted for memorial ${memorialId}, user ${userId}`);

		return json({ 
			success: true, 
			message: 'Draft deleted successfully'
		});

	} catch (error) {
		console.error('❌ Error deleting draft:', error);
		return json({ error: 'Failed to delete draft' }, { status: 500 });
	}
};
