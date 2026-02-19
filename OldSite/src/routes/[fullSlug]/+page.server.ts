import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { fullSlug } = params;

	console.log('🏠 [MEMORIAL_PAGE] Loading memorial page for slug:', fullSlug);

	// Filter out non-memorial requests (service workers, assets, etc.)
	if (fullSlug.includes('.') || fullSlug.startsWith('_') || fullSlug === 'favicon.ico') {
		console.log('🏠 [MEMORIAL_PAGE] Skipping non-memorial request:', fullSlug);
		throw error(404, 'Not a memorial page');
	}

	try {
		// Find memorial by fullSlug only - no legacy slug fallback
		console.log('🏠 [MEMORIAL_PAGE] Querying memorials collection for fullSlug:', fullSlug);
		const memorialsRef = adminDb.collection('memorials');
		const snapshot = await memorialsRef.where('fullSlug', '==', fullSlug).limit(1).get();
		
		console.log('🏠 [MEMORIAL_PAGE] Memorial query completed, found docs:', snapshot.docs.length);

		if (snapshot.empty) {
			console.log('🏠 [MEMORIAL_PAGE] No memorial found for fullSlug:', fullSlug);
			throw error(404, 'Memorial not found');
		}

		const memorialDoc = snapshot.docs[0];
		const memorialData = memorialDoc.data();
		console.log('🏠 [MEMORIAL_PAGE] Memorial data keys:', Object.keys(memorialData));

		// Simplified legacy detection - just check for valid custom_html content
		const hasCustomHtml = !!(memorialData.custom_html && 
			typeof memorialData.custom_html === 'string' && 
			memorialData.custom_html.trim().length > 0);
		
		console.log('🏠 [MEMORIAL_PAGE] Memorial type:', hasCustomHtml ? 'Legacy (custom_html)' : 'Standard');
		console.log('🏠 [MEMORIAL_PAGE] Has custom_html:', !!memorialData.custom_html);
		console.log('🏠 [MEMORIAL_PAGE] Custom HTML length:', memorialData.custom_html?.length || 0);

		// Helper function for defensive timestamp handling
		const convertTimestamp = (timestamp: any) => {
			if (!timestamp) return null;
			if (typeof timestamp === 'string') return timestamp;
			if (timestamp.toDate) return timestamp.toDate().toISOString();
			if (timestamp instanceof Date) return timestamp.toISOString();
			try {
				return new Date(timestamp).toISOString();
			} catch {
				return null;
			}
		};

		// Create memorial object with proper serialization (no Firestore objects)
		const memorial = {
			id: memorialDoc.id,
			lovedOneName: memorialData.lovedOneName || '',
			fullSlug: memorialData.fullSlug || fullSlug,
			content: memorialData.content || '',
			isPublic: memorialData.isPublic || false,
			services: memorialData.services || null,
			imageUrl: memorialData.imageUrl || null,
			birthDate: memorialData.birthDate || null,
			deathDate: memorialData.deathDate || null,
			photos: memorialData.photos || [],
			embeds: memorialData.embeds || [],
			familyContactName: memorialData.familyContactName || null,
			familyContactEmail: memorialData.familyContactEmail || null,
			familyContactPhone: memorialData.familyContactPhone || null,
			familyContactPreference: memorialData.familyContactPreference || null,
			funeralHomeName: memorialData.funeralHomeName || null,
			directorFullName: memorialData.directorFullName || null,
			directorEmail: memorialData.directorEmail || null,
			additionalNotes: memorialData.additionalNotes || null,
			custom_html: memorialData.custom_html || null,
			hasCustomHtml: hasCustomHtml,
			createdByUserId: memorialData.createdByUserId || null,
			// Admin display overrides
			customTitle: memorialData.customTitle || null,
			// Content blocks for WYSIWYG editor
			contentBlocks: memorialData.contentBlocks || [],
			contentBlocksVersion: memorialData.contentBlocksVersion || 0,
			// Access control fields
			ownerUid: memorialData.ownerUid || null,
			funeralDirectorUid: memorialData.funeralDirectorUid || null,
			// Convert Firestore timestamps to strings for serialization
			createdAt: convertTimestamp(memorialData.createdAt),
			updatedAt: convertTimestamp(memorialData.updatedAt)
		};

		console.log('🏠 [MEMORIAL_PAGE] Memorial found:', {
			id: memorial.id,
			lovedOneName: memorial.lovedOneName,
			fullSlug: memorial.fullSlug,
			isPublic: memorial.isPublic,
			contentBlocks: memorial.contentBlocks?.length || 0
		});

		// Load streams for this memorial
		console.log('🎬 [MEMORIAL_PAGE] Loading streams for memorial:', memorial.id);
		let streams = [];
		try {
			const streamsSnapshot = await adminDb
				.collection('streams')
				.where('memorialId', '==', memorial.id)
				.get();
		
			streams = streamsSnapshot.docs
				.filter(doc => doc.data().isDeleted !== true) // Filter deleted in JS (avoids Firestore index requirement)
				.map(doc => {
					const data = doc.data();
					const stream = {
						id: doc.id,
						...data,
						// Mux streaming platform data (explicit for serialization)
						mux: data.mux || null,
						chat: data.chat || null,
						// Timestamp conversions
						createdAt: convertTimestamp(data.createdAt),
						updatedAt: convertTimestamp(data.updatedAt),
						scheduledStartTime: convertTimestamp(data.scheduledStartTime),
						startedAt: convertTimestamp(data.startedAt),
						endedAt: convertTimestamp(data.endedAt)
					};
					
					// DEBUG: Log each stream's details including Mux recording data
					console.log('📺 [STREAM DEBUG]', {
						id: stream.id,
						title: stream.title,
						status: stream.status,
						isVisible: stream.isVisible,
						scheduledStartTime: stream.scheduledStartTime,
						// Mux recording fields
						muxRecordingReady: stream.mux?.recordingReady,
						muxVodPlaybackId: stream.mux?.vodPlaybackId,
						muxAssetId: stream.mux?.assetId,
						recordingReady: stream.recordingReady,
						// Legacy fields
						playbackUrl: stream.playbackUrl,
						embedUrl: stream.embedUrl,
						cloudflareInputId: stream.streamCredentials?.cloudflareInputId || stream.cloudflareInputId
					});
					
					return stream;
				})
				// Filter out hidden streams
				.filter(stream => stream.isVisible !== false);
			
			console.log('🎬 [MEMORIAL_PAGE] Loaded', streams.length, 'streams after filtering');
		} catch (error) {
			console.error('🎬 [MEMORIAL_PAGE] Error loading streams:', error);
			// Don't fail the entire page load if streams fail
			streams = [];
		}

		// Load slideshows for this memorial
		console.log('📸 [MEMORIAL_PAGE] Loading slideshows for memorial:', memorial.id);
		let slideshows = [];
		try {
			const slideshowsSnapshot = await adminDb
				.collection('memorials')
				.doc(memorial.id)
				.collection('slideshows')
				.orderBy('createdAt', 'desc')
				.get();
			
			slideshows = slideshowsSnapshot.docs.map(doc => {
				const data = doc.data();
				console.log('📸 [MEMORIAL_PAGE] Processing slideshow:', {
					id: doc.id,
					title: data.title,
					status: data.status,
					hasPhotos: Array.isArray(data.photos) && data.photos.length > 0
				});
				return {
					id: doc.id,
					title: data.title || 'Memorial Slideshow',
					memorialId: data.memorialId || memorial.id,
					cloudflareStreamId: data.cloudflareStreamId || null,
					firebaseStoragePath: data.firebaseStoragePath || null,
					embedUrl: data.embedUrl || null,
					playbackUrl: data.playbackUrl || null,
					thumbnailUrl: data.thumbnailUrl || null,
					status: data.status || 'processing',
					isCloudflareHosted: data.isCloudflareHosted || false,
					isFirebaseHosted: data.isFirebaseHosted || false,
					photos: Array.isArray(data.photos) ? data.photos : [],
					settings: data.settings || {
						photoDuration: 3,
						transitionType: 'fade',
						videoQuality: 'medium',
						aspectRatio: '16:9'
					},
					createdBy: data.createdBy || '',
					createdAt: convertTimestamp(data.createdAt) || new Date().toISOString(),
					updatedAt: convertTimestamp(data.updatedAt) || new Date().toISOString()
				};
			});
			
			console.log('📸 [MEMORIAL_PAGE] Loaded', slideshows.length, 'slideshows');
		} catch (error) {
			console.error('📸 [MEMORIAL_PAGE] Error loading slideshows:', error);
			// Don't fail the entire page load if slideshows fail
			slideshows = [];
		}

		// Check if user has permission to view private memorial content
		const userId = locals.user?.uid;
		const userRole = locals.user?.role;
		const hasPermission = 
			memorial.isPublic === true || 
			userRole === 'admin' ||
			memorialData.ownerUid === userId ||
			memorialData.funeralDirectorUid === userId;

		console.log('🔒 [MEMORIAL_PAGE] Permission check:', {
			isPublic: memorial.isPublic,
			userId: userId || 'anonymous',
			userRole: userRole || 'none',
			hasPermission
		});

		// Security check: Only show full content to authorized users
		if (!hasPermission) {
			console.log('🔒 [MEMORIAL_PAGE] Memorial is private and user lacks permission, returning basic info only');
			return {
				memorial: {
					id: memorial.id,
					lovedOneName: memorial.lovedOneName,
					fullSlug: memorial.fullSlug,
					content: memorial.content,
					isPublic: false,
					services: null,
					imageUrl: memorial.imageUrl,
					birthDate: memorial.birthDate,
					deathDate: memorial.deathDate,
					createdAt: memorial.createdAt,
					updatedAt: memorial.updatedAt,
					ownerUid: null, // Don't expose for unauthorized users
					funeralDirectorUid: null // Don't expose for unauthorized users
				},
				streams: [], // No streams for unauthorized users
				slideshows: [] // No slideshows for unauthorized users
			};
		}

		// Return full memorial data, streams, and slideshows for authorized users
		return {
			memorial,
			streams,
			slideshows,
			user: locals.user ? {
				uid: locals.user.uid,
				role: locals.user.role,
				email: locals.user.email
			} : null
		};
	} catch (err: any) {
		console.error('🏠 [MEMORIAL_PAGE] Error loading memorial:', err);
		console.error('🏠 [MEMORIAL_PAGE] Error details:', {
			message: err?.message,
			code: err?.code,
			stack: err?.stack
		});
		
		// More specific error handling
		if (err?.code === 'permission-denied') {
			console.error('🏠 [MEMORIAL_PAGE] Firebase permission denied - check service account');
			throw error(500, 'Database access denied');
		} else if (err?.code === 'unavailable') {
			console.error('🏠 [MEMORIAL_PAGE] Firebase unavailable - connection issue');
			throw error(500, 'Database temporarily unavailable');
		} else {
			throw error(500, `Failed to load memorial: ${err?.message || 'Unknown error'}`);
		}
	}
};
