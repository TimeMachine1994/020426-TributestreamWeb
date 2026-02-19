import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	console.log('🗑️ Clearing session cookie...');

	// Clear the session cookie
	cookies.delete('session', { path: '/' });

	console.log('✅ Session cookie cleared, redirecting to login');
	throw redirect(303, '/login?message=session-cleared');
};

export const POST: RequestHandler = async ({ cookies }) => {
	console.log('🗑️ Clearing session cookie...');

	// Clear the session cookie
	cookies.delete('session', { path: '/' });

	console.log('✅ Session cookie cleared, redirecting to login');
	throw redirect(303, '/login?message=session-cleared');
};
