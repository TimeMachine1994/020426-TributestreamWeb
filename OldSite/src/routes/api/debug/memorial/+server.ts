import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

/**
 * Debug endpoint to investigate memorial data issues
 * Usage: GET /api/debug/memorial?name=Derenne Marie DeCuir
 * or: GET /api/debug/memorial?id=MEMORIAL_ID
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	// Optional: Add auth check for admins only
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const memorialName = url.searchParams.get('name');
	const memorialId = url.searchParams.get('id');

	if (!memorialName && !memorialId) {
		return json({ 
			error: 'Please provide either ?name=Memorial Name or ?id=memorialId' 
		}, { status: 400 });
	}

	try {
		let memorialDoc;
		let queryMethod = '';

		// Search by ID
		if (memorialId) {
			queryMethod = 'ID lookup';
			console.log(`🔍 [DEBUG] Looking up memorial by ID: ${memorialId}`);
			memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

			if (!memorialDoc.exists) {
				return json({ 
					error: 'Memorial not found', 
					queryMethod,
					memorialId 
				}, { status: 404 });
			}
		}
		// Search by name
		else if (memorialName) {
			queryMethod = 'Name search';
			console.log(`🔍 [DEBUG] Searching for memorial by name: ${memorialName}`);
			const snapshot = await adminDb
				.collection('memorials')
				.where('lovedOneName', '==', memorialName)
				.limit(1)
				.get();

			if (snapshot.empty) {
				return json({ 
					error: 'Memorial not found', 
					queryMethod,
					searchedName: memorialName 
				}, { status: 404 });
			}

			memorialDoc = snapshot.docs[0];
		}

		// Get the raw data
		const rawData = memorialDoc!.data();
		const memorialDocId = memorialDoc!.id;

		console.log(`✅ [DEBUG] Found memorial: ${memorialDocId}`);

		// Try to process each field safely
		const diagnostics: any = {
			memorialId: memorialDocId,
			queryMethod,
			rawFieldCount: Object.keys(rawData || {}).length,
			fields: {},
			errors: [],
			timestamps: {},
			nested: {}
		};

		// Check each field
		for (const [key, value] of Object.entries(rawData || {})) {
			try {
				// Check if it's a Firestore timestamp
				if (value && typeof value === 'object' && 'toDate' in value) {
					diagnostics.timestamps[key] = {
						type: 'Firestore Timestamp',
						value: value.toDate?.()?.toISOString() || 'Failed to convert'
					};
				} 
				// Check if it's an object
				else if (value && typeof value === 'object' && !Array.isArray(value)) {
					diagnostics.nested[key] = {
						type: 'Object',
						keys: Object.keys(value),
						stringifiable: true
					};
					// Try to stringify it
					JSON.stringify(value);
				}
				// Regular field
				else {
					diagnostics.fields[key] = {
						type: typeof value,
						isNull: value === null,
						isUndefined: value === undefined,
						valuePreview: Array.isArray(value) 
							? `Array(${value.length})` 
							: String(value).substring(0, 100)
					};
				}
			} catch (err: any) {
				diagnostics.errors.push({
					field: key,
					error: err.message,
					fieldType: typeof value
				});
			}
		}

		// Try to load related data
		try {
			const [streamsSnap, slideshowsSnap, followersSnap] = await Promise.all([
				adminDb.collection('streams').where('memorialId', '==', memorialDocId).get(),
				adminDb.collection('memorials').doc(memorialDocId).collection('slideshows').get(),
				adminDb.collection('memorials').doc(memorialDocId).collection('followers').get()
			]);

			diagnostics.relatedData = {
				streamsCount: streamsSnap.size,
				slideshowsCount: slideshowsSnap.size,
				followersCount: followersSnap.size
			};
		} catch (err: any) {
			diagnostics.errors.push({
				section: 'relatedData',
				error: err.message
			});
		}

		// Try to process like the actual page does
		try {
			const processedMemorial = {
				id: memorialDocId,
				lovedOneName: rawData.lovedOneName || 'Unknown',
				fullSlug: rawData.fullSlug || '',
				createdBy: rawData.createdBy || '',
				creatorEmail: rawData.creatorEmail || '',
				creatorName: rawData.creatorName || '',
				createdAt: rawData.createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: rawData.updatedAt?.toDate?.()?.toISOString() || null,
				isPublic: rawData.isPublic !== false,
				isComplete: rawData.isComplete || false,
				services: rawData.services || null,
				calculatorConfig: rawData.calculatorConfig || null,
				isPaid: rawData.isPaid || rawData.calculatorConfig?.isPaid || false
			};

			diagnostics.processedMemorial = processedMemorial;
			diagnostics.processingSuccess = true;

		} catch (err: any) {
			diagnostics.processingSuccess = false;
			diagnostics.errors.push({
				section: 'processing',
				error: err.message,
				stack: err.stack
			});
		}

		return json({
			success: true,
			diagnostics,
			tip: 'Check the errors array for any field-specific issues. Check timestamps for conversion problems.'
		});

	} catch (err: any) {
		console.error('💥 [DEBUG] Error in debug endpoint:', err);
		return json({
			error: 'Debug endpoint failed',
			message: err.message,
			stack: err.stack,
			memorialName,
			memorialId
		}, { status: 500 });
	}
};
