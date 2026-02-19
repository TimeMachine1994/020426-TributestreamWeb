import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params }) => {
	const { roomName } = params;
	
	// Construct the Daily room URL
	// The domain should match what's configured in Daily dashboard
	const dailyDomain = env.PUBLIC_DAILY_DOMAIN || 'tributestream';
	const roomUrl = `https://${dailyDomain}.daily.co/${roomName}`;
	
	return {
		roomUrl,
		roomName
	};
};
