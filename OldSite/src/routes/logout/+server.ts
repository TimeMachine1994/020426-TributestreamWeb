import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase';

export const GET: RequestHandler = async ({ cookies }) => {
	const sessionCookie = cookies.get('session');

	if (sessionCookie) {
		try {
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
			await adminAuth.revokeRefreshTokens(decodedClaims.sub);
		} catch (error) {
			console.warn('⚠️ Session cookie invalid or expired, continuing with logout');
		}
	}

	cookies.delete('session', { path: '/' });

	throw redirect(303, '/');
};

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionCookie = cookies.get('session');

	if (sessionCookie) {
		try {
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
			await adminAuth.revokeRefreshTokens(decodedClaims.sub);
		} catch (error) {
			console.warn('⚠️ Session cookie invalid or expired, continuing with logout');
		}
	}

	cookies.delete('session', { path: '/' });

	throw redirect(303, '/');
};
