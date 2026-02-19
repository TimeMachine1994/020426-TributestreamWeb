import { error, redirect } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { PageServerLoad } from './$types';

/**
 * Memorial Detail Page Server Load
 * Loads comprehensive data for a single memorial including:
 * - Memorial document
 * - Associated streams
 * - Slideshows (subcollection)
 * - Followers count
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	const { memorialId } = params;

	console.log('🏛️ [MEMORIAL DETAIL] Loading memorial:', memorialId);

	// Check authentication
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('🚫 [MEMORIAL DETAIL] Unauthorized access attempt');
		throw redirect(302, '/admin');
	}

	try {
		// Load all data in parallel for performance
		const [memorialDoc, streamsSnap, slideshowsSnap, followersSnap] = await Promise.all([
			adminDb.collection('memorials').doc(memorialId).get(),
			adminDb.collection('streams')
				.where('memorialId', '==', memorialId)
				.get(),
			adminDb.collection('memorials').doc(memorialId).collection('slideshows').get(),
			adminDb.collection('memorials').doc(memorialId).collection('followers').get()
		]);

		// Check if memorial exists
		if (!memorialDoc.exists) {
			console.log('❌ [MEMORIAL DETAIL] Memorial not found:', memorialId);
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		if (!memorialData) {
			console.log('❌ [MEMORIAL DETAIL] Memorial data is empty:', memorialId);
			throw error(404, 'Memorial data not found');
		}

		// Helper function to convert any timestamp format to ISO string
		const convertTimestamp = (value: any): string | null => {
			if (!value) return null;
			
			// Firestore Timestamp with toDate method
			if (value.toDate && typeof value.toDate === 'function') {
				return value.toDate().toISOString();
			}
			
			// Raw timestamp object with _seconds
			if (value._seconds !== undefined) {
				return new Date(value._seconds * 1000).toISOString();
			}
			
			// Already a string
			if (typeof value === 'string') {
				return value;
			}
			
			// Try to parse as Date
			try {
				return new Date(value).toISOString();
			} catch {
				return null;
			}
		};

		// Helper function to clean custom pricing timestamps
		const cleanCustomPricing = (pricing: any) => {
			if (!pricing) return null;
			
			return {
				...pricing,
				setAt: convertTimestamp(pricing.setAt)
			};
		};

		// Helper function to clean calculator config timestamps
		const cleanCalculatorConfig = (config: any) => {
			if (!config) return null;
			
			const cleaned = { ...config };
			
			// Convert timestamps in formData
			if (cleaned.formData) {
				cleaned.formData = { ...cleaned.formData };
				if (cleaned.formData.updatedAt) {
					cleaned.formData.updatedAt = convertTimestamp(cleaned.formData.updatedAt);
				}
				if (cleaned.formData.createdAt) {
					cleaned.formData.createdAt = convertTimestamp(cleaned.formData.createdAt);
				}
			}
			
			// Convert top-level timestamps
			if (cleaned.lastModified) {
				cleaned.lastModified = convertTimestamp(cleaned.lastModified);
			}
			if (cleaned.paymentDate) {
				cleaned.paymentDate = convertTimestamp(cleaned.paymentDate);
			}
			if (cleaned.paidAt) {
				cleaned.paidAt = convertTimestamp(cleaned.paidAt);
			}
			
			// Convert timestamps in autoSave
			if (cleaned.autoSave) {
				cleaned.autoSave = { ...cleaned.autoSave };
				if (cleaned.autoSave.lastModified) {
					cleaned.autoSave.lastModified = convertTimestamp(cleaned.autoSave.lastModified);
				}
				if (cleaned.autoSave.timestamp) {
					cleaned.autoSave.timestamp = convertTimestamp(cleaned.autoSave.timestamp);
				}
				if (cleaned.autoSave.formData?.updatedAt) {
					cleaned.autoSave.formData.updatedAt = convertTimestamp(cleaned.autoSave.formData.updatedAt);
				}
				if (cleaned.autoSave.formData?.createdAt) {
					cleaned.autoSave.formData.createdAt = convertTimestamp(cleaned.autoSave.formData.createdAt);
				}
			}
			
			return cleaned;
		};

		// Process memorial data
		const memorial = {
			id: memorialDoc.id,
			lovedOneName: memorialData.lovedOneName || 'Unknown',
			fullSlug: memorialData.fullSlug || '',
			createdBy: memorialData.createdBy || '',
			ownerUid: memorialData.ownerUid || '',
			creatorEmail: memorialData.creatorEmail || '',
			creatorName: memorialData.creatorName || '',
			createdAt: convertTimestamp(memorialData.createdAt),
			updatedAt: convertTimestamp(memorialData.updatedAt),
			
			// Status flags
			isPublic: memorialData.isPublic !== false,
			isComplete: memorialData.isComplete || false,
			
			// Services (new structure)
			services: memorialData.services || null,
			
			// Legacy service fields
			memorialDate: memorialData.memorialDate || null,
			memorialTime: memorialData.memorialTime || null,
			memorialLocationName: memorialData.memorialLocationName || null,
			memorialLocationAddress: memorialData.memorialLocationAddress || null,
			
			// Livestream legacy field (mostly replaced by streams collection)
			livestream: memorialData.livestream || null,
			
			// Admin display overrides
			customTitle: memorialData.customTitle || null,
			
			// Calculator/Payment - properly cleaned
			calculatorConfig: cleanCalculatorConfig(memorialData.calculatorConfig),
			isPaid: memorialData.isPaid || memorialData.calculatorConfig?.isPaid || false,
			paymentStatus: memorialData.calculatorConfig?.status || 'draft',
			totalPrice: memorialData.calculatorConfig?.totalPrice || memorialData.totalPrice || 0,
			paymentDate: convertTimestamp(memorialData.calculatorConfig?.paymentDate),
			
			// Schedule data for admin editor
			schedule: memorialData.calculatorConfig?.autoSave?.formData || memorialData.calculatorConfig?.formData || null,
			
			// Custom pricing overrides
			customPricing: cleanCustomPricing(memorialData.customPricing),
			
			// Contact info
			funeralDirectorName: memorialData.funeralDirectorName || memorialData.calculatorConfig?.formData?.funeralDirectorName || '',
			
			// Content blocks for WYSIWYG editor
			contentBlocks: memorialData.contentBlocks || [],
			contentBlocksVersion: memorialData.contentBlocksVersion || 0
		};

		// Process streams - filter deleted in JS to handle missing isDeleted field
		const streams = streamsSnap.docs
			.filter(doc => doc.data().isDeleted !== true)
			.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				memorialId: data.memorialId,
				title: data.title || 'Untitled Stream',
				description: data.description || '',
				status: data.status || 'scheduled',
				visibility: data.visibility || 'public',
				scheduledStartTime: data.scheduledStartTime || null,
				startedAt: data.startedAt || null,
				endedAt: data.endedAt || null,
				liveStartedAt: data.liveStartedAt || null,
				liveEndedAt: data.liveEndedAt || null,
				
				// Legacy credentials
				streamCredentials: data.streamCredentials || null,
				
				// Mux streaming platform data
				mux: data.mux || null,
				
				// Legacy streaming config
				streamingMethod: data.streamingMethod || null,
				cloudflareStreamId: data.cloudflareStreamId || null,
				rtmpUrl: data.rtmpUrl || null,
				streamKey: data.streamKey || null,
				playbackUrl: data.playbackUrl || null,
				embedUrl: data.embedUrl || null,
				
				// Phone source (dual stream)
				phoneSourceStreamId: data.phoneSourceStreamId || null,
				phoneSourcePlaybackUrl: data.phoneSourcePlaybackUrl || null,
				phoneSourceWhipUrl: data.phoneSourceWhipUrl || null,
				
				// Recording
				recordingReady: data.recordingReady || false,
				recordingUrl: data.recordingUrl || null,
				recordingPlaybackUrl: data.recordingPlaybackUrl || null,
				recordingDuration: data.recordingDuration || null,
				
				// Analytics
				viewerCount: data.viewerCount || 0,
				peakViewerCount: data.peakViewerCount || 0,
				totalViews: data.totalViews || 0,
				
				// Calculator linking
				calculatorServiceType: data.calculatorServiceType || null,
				calculatorServiceIndex: data.calculatorServiceIndex || null,
				
				// Chat configuration
				chat: data.chat ? {
					enabled: data.chat.enabled ?? true,
					locked: data.chat.locked ?? false,
					archived: data.chat.archived ?? false,
					messageCount: data.chat.messageCount ?? 0,
					participantCount: data.chat.participantCount ?? 0
				} : null,
				
				createdAt: data.createdAt || null,
				updatedAt: data.updatedAt || null
			};
		});

		// Process slideshows
		const slideshows = slideshowsSnap.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				title: data.title || 'Untitled Slideshow',
				status: data.status || 'ready',
				playbackUrl: data.playbackUrl || null,
				thumbnailUrl: data.thumbnailUrl || null,
				photos: data.photos || [],
				audio: data.audio || null,
				settings: data.settings || {},
				createdBy: data.createdBy || '',
				createdAt: data.createdAt || null,
				updatedAt: data.updatedAt || null
			};
		});

		// Get follower count
		const followerCount = followersSnap.size;

		console.log('✅ [MEMORIAL DETAIL] Data loaded successfully:', {
			memorialId,
			streams: streams.length,
			slideshows: slideshows.length,
			followers: followerCount
		});

		return {
			memorial,
			streams,
			slideshows,
			followerCount,
			adminUser: {
				email: locals.user.email,
				uid: locals.user.uid
			}
		};
	} catch (err: any) {
		console.error('💥 [MEMORIAL DETAIL] Error loading memorial:', {
			error: err.message,
			stack: err.stack,
			memorialId
		});

		// If it's already an error we threw, re-throw it
		if (err.status) {
			throw err;
		}

		// Otherwise return generic error
		throw error(500, `Failed to load memorial: ${err.message}`);
	}
};
