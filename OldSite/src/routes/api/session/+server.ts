import { adminAuth } from '$lib/server/firebase';
import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	console.log('Starting session creation...');
	console.log('FIREBASE_AUTH_EMULATOR_HOST:', process.env.FIREBASE_AUTH_EMULATOR_HOST || 'NOT SET');
	const { idToken, fullSlug } = await request.json();

	if (typeof idToken !== 'string' || !idToken) {
		console.error('idToken is missing or not a string');
		return json({ message: 'idToken is required' }, { status: 400 });
	}

	const expiresIn = 60 * 60 * 24 * 1000; // 24 hours

	try {
		console.log('Creating session cookie...');
		const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
		const options = {
			maxAge: expiresIn,
			httpOnly: true,
			secure: false, // Allow non-HTTPS in development
			sameSite: 'lax' as const,
			path: '/'
		};
		cookies.set('session', sessionCookie, options);
		console.log('Session cookie created and set successfully.');

		// Verify the token and get user claims to determine role
		const decodedToken = await adminAuth.verifyIdToken(idToken);
		console.log('User role claims:', decodedToken.role);

		// Add a small delay to allow for user record propagation in Firebase
		console.log('Adding 1.5s delay for Firebase user propagation...');
		await new Promise((resolve) => setTimeout(resolve, 1500));
		console.log('Delay complete.');

		// Redirect based on user role
		if (decodedToken.role === 'admin') {
			console.log('Admin user detected, redirecting to admin dashboard...');
			return json({ redirectTo: '/admin' });
		} else if (fullSlug && typeof fullSlug === 'string') {
			console.log(`Redirecting to /${fullSlug}...`);
			return json({ redirectTo: `/${fullSlug}` });
		} else {
			console.log('Regular user, redirecting to my-portal...');
			return json({ redirectTo: '/my-portal' });
		}
	} catch (error: any) {
		console.error('Session cookie creation failed:', error);
		return json({ message: 'Could not create session cookie.' }, { status: 401 });
	}
};
