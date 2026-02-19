import { adminDb } from '$lib/server/firebase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET - List streams for debugging/testing purposes
export const GET: RequestHandler = async () => {
	console.log('🔍 [DEBUG] Listing streams for testing');

	try {
		const streamsSnapshot = await adminDb.collection('streams').limit(10).get();

		if (streamsSnapshot.empty) {
			return json({
				success: true,
				message: 'No streams found in database',
				streams: [],
				count: 0,
				testCommand: null
			});
		}

		const streams: any[] = [];
		const streamIds: string[] = [];

		streamsSnapshot.forEach((doc) => {
			const data = doc.data();
			streamIds.push(doc.id);

			streams.push({
				id: doc.id,
				title: data.title || 'N/A',
				status: data.status || 'N/A',
				memorialId: data.memorialId || 'N/A',
				cloudflareInputId: data.cloudflareInputId || 'N/A',
				createdAt: data.createdAt || 'N/A',
				isVisible: data.isVisible !== false
			});
		});

		const testCommand = `curl -X POST "http://localhost:5173/api/streams/check-live-status" -H "Content-Type: application/json" -d '{"streamIds": ${JSON.stringify(streamIds)}}' | jq .`;

		console.log('✅ [DEBUG] Found', streams.length, 'streams');

		return json({
			success: true,
			message: `Found ${streams.length} streams`,
			streams,
			streamIds,
			count: streams.length,
			testCommand
		});
	} catch (error: any) {
		console.error('❌ [DEBUG] Error listing streams:', error);

		return json(
			{
				success: false,
				message: 'Failed to list streams',
				error: error.message
			},
			{ status: 500 }
		);
	}
};
