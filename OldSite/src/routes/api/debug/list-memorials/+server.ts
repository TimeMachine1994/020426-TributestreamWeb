import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

export const GET: RequestHandler = async () => {
	try {
		console.log('🔍 [DEBUG] Listing memorials...');

		const memorialsSnapshot = await adminDb.collection('memorials').limit(10).get();

		const memorials = memorialsSnapshot.docs.map((doc) => {
			const data = doc.data();
			
			// Analyze custom_html field
			const customHtmlAnalysis = {
				exists: 'custom_html' in data,
				type: typeof data.custom_html,
				length: data.custom_html?.length || 0,
				isTruthy: !!data.custom_html,
				isValidString: typeof data.custom_html === 'string' && data.custom_html.trim().length > 0,
				preview: data.custom_html ? data.custom_html.substring(0, 50) + '...' : null
			};

			// Legacy detection
			const legacyFlags = {
				strictLegacy: !!(data.custom_html && data.createdByUserId === 'MIGRATION_SCRIPT'),
				hasCustomHtml: customHtmlAnalysis.isValidString,
				createdByUserId: data.createdByUserId,
				isMigrationScript: data.createdByUserId === 'MIGRATION_SCRIPT'
			};

			return {
				id: doc.id,
				lovedOneName: data.lovedOneName,
				fullSlug: data.fullSlug,
				ownerUid: data.ownerUid,
				funeralDirectorUid: data.funeralDirectorUid,
				serviceDate: data.serviceDate,
				createdAt: data.createdAt,
				customHtmlAnalysis,
				legacyFlags
			};
		});

		console.log('✅ [DEBUG] Found', memorials.length, 'memorials');

		return json({
			count: memorials.length,
			memorials
		});
	} catch (error) {
		console.error('❌ [DEBUG] Error listing memorials:', error);
		return json(
			{
				error: 'Failed to list memorials',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
