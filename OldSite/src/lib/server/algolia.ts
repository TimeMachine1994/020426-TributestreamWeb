import { algoliasearch } from 'algoliasearch';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const ALGOLIA_ADMIN_KEY = env.ALGOLIA_ADMIN_KEY;
const PUBLIC_ALGOLIA_APP_ID = publicEnv.PUBLIC_ALGOLIA_APP_ID;

let client: ReturnType<typeof algoliasearch> | null = null;

if (ALGOLIA_ADMIN_KEY && PUBLIC_ALGOLIA_APP_ID) {
	client = algoliasearch(PUBLIC_ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
} else {
	console.warn('⚠️ [ALGOLIA] Environment variables not set - search functionality disabled');
}

export { client };
export default client;
