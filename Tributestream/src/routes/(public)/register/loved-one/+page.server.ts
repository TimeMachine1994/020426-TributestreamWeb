import { fail, redirect } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import * as auth from '$lib/server/auth';
import { sendRegistrationEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}

	return {
		lovedOneName: url.searchParams.get('name') || ''
	};
};

function slugify(name: string): string {
	const base = name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	const suffix = Math.random().toString(36).slice(2, 6);
	return `${base}-${suffix}`;
}

function generatePassword(length = 12): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(bytes)
		.map((b) => chars[b % chars.length])
		.join('');
}

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const lovedOneName = (formData.get('lovedOneName') as string)?.trim();
		const displayName = (formData.get('displayName') as string)?.trim();
		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const phone = (formData.get('phone') as string)?.trim() || null;

		// Validation
		if (!lovedOneName) {
			return fail(400, { error: "Loved one's name is required", lovedOneName, displayName, email, phone });
		}
		if (!displayName) {
			return fail(400, { error: 'Your name is required', lovedOneName, displayName, email, phone });
		}
		if (!email) {
			return fail(400, { error: 'Email is required', lovedOneName, displayName, email, phone });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Please enter a valid email address', lovedOneName, displayName, email, phone });
		}

		// Check if email already exists
		const [existingUser] = await db
			.select({ id: table.user.id })
			.from(table.user)
			.where(eq(table.user.email, email));

		if (existingUser) {
			return fail(400, {
				error: 'An account with this email already exists. Please sign in instead.',
				lovedOneName,
				displayName,
				email,
				phone
			});
		}

		// Generate password and hash it
		const plainPassword = generatePassword();
		const passwordHash = await hash(plainPassword, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		const userId = auth.generateId();
		const memorialId = auth.generateId();
		const slug = slugify(lovedOneName);
		const title = `Memorial for ${lovedOneName}`;
		const now = new Date();

		try {
			// Create user
			await db.insert(table.user).values({
				id: userId,
				email,
				displayName,
				phone,
				passwordHash,
				role: 'family_member',
				createdAt: now
			});

			// Create memorial
			await db.insert(table.memorial).values({
				id: memorialId,
				slug,
				title,
				lovedOneName,
				ownerId: userId,
				familyContactName: displayName,
				familyContactEmail: email,
				familyContactPhone: phone,
				status: 'draft',
				chatEnabled: true,
				isPublic: true,
				createdAt: now,
				updatedAt: now
			});
		} catch (e) {
			console.error('Registration error:', e);
			return fail(500, { error: 'Something went wrong. Please try again.', lovedOneName, displayName, email, phone });
		}

		// Send registration email (stub for now)
		const baseUrl = url.origin;
		await sendRegistrationEmail({
			email,
			displayName,
			password: plainPassword,
			lovedOneName,
			memorialUrl: `${baseUrl}/${slug}`
		});

		// Auto-login: create session and set cookie
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, userId, {
			deviceType: 'browser'
		});
		auth.setSessionTokenCookie({ cookies } as any, sessionToken, session.expiresAt);

		// Redirect to the memorial page (a banner will prompt them to complete booking)
		throw redirect(303, `/${slug}?booking=${memorialId}`);
	}
};
