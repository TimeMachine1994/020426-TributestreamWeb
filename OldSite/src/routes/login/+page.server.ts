import { adminAuth } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		console.log('Starting login action...');
		const data = await request.formData();
		const idToken = data.get('idToken');

		if (typeof idToken !== 'string' || !idToken) {
			console.error('idToken is missing or not a string');
			return fail(400, { message: 'idToken is required' });
		}

		const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

		try {
			console.log('Creating session cookie...');
			const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
			const options = { maxAge: expiresIn, httpOnly: true, secure: true, path: '/' };
			cookies.set('session', sessionCookie, options);
			console.log('Session cookie created and set successfully.');
		} catch (error: any) {
			console.error('Session cookie creation failed:', error);
			return fail(401, { message: 'Could not create session cookie.' });
		}

		// For AJAX calls (like from registration), return success. For form submissions, redirect.
		if (request.headers.get('accept')?.includes('application/json')) {
			return new Response(JSON.stringify({ success: true, message: 'Login successful' }), {
				headers: { 'Content-Type': 'application/json' },
				status: 200
			});
		}

		console.log('Redirecting to home for standard form submission...');
		redirect(303, '/');
	}
};
