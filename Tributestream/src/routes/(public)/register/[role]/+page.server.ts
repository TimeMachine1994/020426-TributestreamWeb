import { fail, redirect } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';

const ALLOWED_REGISTRATION_ROLES: table.UserRole[] = ['viewer', 'family_member', 'contributor'];

export const load: PageServerLoad = async ({ params, locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}

	const role = params.role as table.UserRole;
	if (!ALLOWED_REGISTRATION_ROLES.includes(role)) {
		throw redirect(303, '/register/viewer');
	}

	return { role };
};

export const actions: Actions = {
	default: async ({ request, params, cookies }) => {
		const role = params.role as table.UserRole;

		if (!ALLOWED_REGISTRATION_ROLES.includes(role)) {
			return fail(400, { error: 'Invalid registration type' });
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Please enter a valid email address' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		const userId = auth.generateId();

		try {
			await db.insert(table.user).values({
				id: userId,
				email,
				passwordHash,
				role,
				createdAt: new Date()
			});
		} catch (e) {
			return fail(400, { error: 'An account with this email already exists' });
		}

		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, userId, {
			deviceType: 'browser'
		});

		auth.setSessionTokenCookie({ cookies } as any, sessionToken, session.expiresAt);

		throw redirect(303, '/dashboard');
	}
};
