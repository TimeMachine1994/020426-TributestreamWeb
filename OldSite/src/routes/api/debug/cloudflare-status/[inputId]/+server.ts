import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// GET - Debug Cloudflare Live Input status
export const GET: RequestHandler = async ({ params }) => {
	const { inputId } = params;

	console.log('🔍 [DEBUG] Checking Cloudflare status for input:', inputId);

	try {
		const cloudflareUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${inputId}`;

		console.log('🔍 [DEBUG] Cloudflare URL:', cloudflareUrl);

		const response = await fetch(cloudflareUrl, {
			headers: {
				Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			console.log('❌ [DEBUG] Cloudflare API error:', response.status);
			return json(
				{
					success: false,
					error: `Cloudflare API error: ${response.status}`,
					inputId
				},
				{ status: response.status }
			);
		}

		const data = await response.json();
		console.log('📡 [DEBUG] Full Cloudflare response:', JSON.stringify(data, null, 2));

		const liveInput = data.result;

		// Analyze the status structure
		const statusAnalysis = {
			hasStatus: !!liveInput?.status,
			hasCurrent: !!liveInput?.status?.current,
			connected: liveInput?.status?.current?.connected,
			statusStructure: liveInput?.status,
			fullResult: liveInput
		};

		console.log('🔍 [DEBUG] Status analysis:', JSON.stringify(statusAnalysis, null, 2));

		return json({
			success: true,
			inputId,
			cloudflareResponse: data,
			statusAnalysis,
			isLiveDetected: liveInput?.status?.current?.connected || false,
			timestamp: new Date().toISOString()
		});
	} catch (error: any) {
		console.error('❌ [DEBUG] Error checking Cloudflare status:', error);

		return json(
			{
				success: false,
				error: error.message,
				inputId
			},
			{ status: 500 }
		);
	}
};
