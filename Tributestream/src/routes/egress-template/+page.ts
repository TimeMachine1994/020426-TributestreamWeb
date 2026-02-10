/**
 * Egress Template Page Loader
 *
 * LiveKit headless Chrome loads this page with query params:
 *   ?url={livekit_wss_url}&token={recorder_token}&layout={layout}
 */

import type { PageLoad } from './$types';

export const ssr = false;

export const load: PageLoad = ({ url }) => {
	const livekitUrl = url.searchParams.get('url') ?? '';
	const token = url.searchParams.get('token') ?? '';
	const layout = url.searchParams.get('layout') ?? 'single';

	return {
		livekitUrl,
		token,
		layout
	};
};
