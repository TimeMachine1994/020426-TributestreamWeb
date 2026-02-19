import { adminAuth } from '$lib/server/firebase';
import { auditMiddleware } from '$lib/server/auditMiddleware';
import { logUserAction, extractUserContext } from '$lib/server/auditLogger';
import type { Handle } from '@sveltejs/kit';

const authHandle: Handle = async ({ event, resolve }) => {
	// Skip authentication middleware for logout endpoint and static assets
	if (event.url.pathname === '/logout' || 
		event.url.pathname.startsWith('/_app/') ||
		event.url.pathname.includes('mockServiceWorker.js') ||
		event.url.pathname.endsWith('.js') ||
		event.url.pathname.endsWith('.css') ||
		event.url.pathname.endsWith('.map') ||
		event.url.pathname.endsWith('.webmanifest') ||
		event.url.pathname.endsWith('.ico') ||
		event.url.pathname.endsWith('.png') ||
		event.url.pathname.endsWith('.jpg') ||
		event.url.pathname.endsWith('.jpeg') ||
		event.url.pathname.endsWith('.svg') ||
		event.url.pathname.endsWith('.woff') ||
		event.url.pathname.endsWith('.woff2') ||
		event.url.pathname.endsWith('.ttf') ||
		event.url.pathname.endsWith('.eot') ||
		event.url.pathname.startsWith('/favicon') ||
		event.url.pathname.startsWith('/apple-touch-icon')) {
		return resolve(event);
	}

	const sessionCookie = event.cookies.get('session');

	if (sessionCookie) {
		try {
			// Add timeout to prevent hanging
			const verificationPromise = adminAuth.verifySessionCookie(sessionCookie, true);
			const timeoutPromise = new Promise<never>((_, reject) => 
				setTimeout(() => reject(new Error('Session verification timeout')), 5000)
			);

			const decodedClaims = await Promise.race([verificationPromise, timeoutPromise]);

			// Get user record with timeout
			const userRecordPromise = adminAuth.getUser(decodedClaims.uid);
			const userTimeoutPromise = new Promise<never>((_, reject) => 
				setTimeout(() => reject(new Error('User fetch timeout')), 3000)
			);

			const userRecord = await Promise.race([userRecordPromise, userTimeoutPromise]);

			console.log('🔍 [AUTH] User custom claims:', userRecord.customClaims);
			console.log('🔍 [AUTH] User email:', userRecord.email);

			event.locals.user = {
				uid: userRecord.uid,
				email: userRecord.email || null,
				displayName: userRecord.displayName,
				role: userRecord.customClaims?.role || 'owner',
				isAdmin: userRecord.customClaims?.role === 'admin'
			};

			console.log('🔍 [AUTH] Final user object:', event.locals.user);

		} catch (error) {
			console.error('❌ Session verification failed:', error);

			// Clear expired or invalid session cookies
			if (error instanceof Error && (
				error.message.includes('expired') || 
				error.message.includes('invalid signature') ||
				error.message.includes('session-cookie-expired') ||
				error.message.includes('timeout')
			)) {
				event.cookies.delete('session', { path: '/' });
			}

			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};

// Use only authentication middleware for now (audit disabled to prevent timeouts)
export const handle: Handle = authHandle;
