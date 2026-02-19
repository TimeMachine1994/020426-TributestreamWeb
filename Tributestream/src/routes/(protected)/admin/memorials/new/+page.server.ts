import { fail, redirect } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import { sendRegistrationEmail } from '$lib/server/email';

export const load: PageServerLoad = async () => {
	const videographers = await db
		.select({ id: table.user.id, email: table.user.email, displayName: table.user.displayName })
		.from(table.user)
		.where(eq(table.user.role, 'videographer'));

	return { videographers };
};

function generatePassword(length = 12): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(bytes)
		.map((b) => chars[b % chars.length])
		.join('');
}

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const title = formData.get('title') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string | null;
		const scheduledAtStr = formData.get('scheduledAt') as string | null;
		const assignedVideographerId = formData.get('assignedVideographerId') as string | null;
		const chatEnabled = formData.get('chatEnabled') === 'on';
		const lovedOneName = (formData.get('lovedOneName') as string)?.trim() || null;

		// Customer account fields (optional)
		const customerName = (formData.get('customerName') as string)?.trim() || null;
		const customerEmail = (formData.get('customerEmail') as string)?.trim().toLowerCase() || null;
		const customerPhone = (formData.get('customerPhone') as string)?.trim() || null;

		if (!title || !slug) {
			return fail(400, { error: 'Title and slug are required' });
		}

		if (!/^[a-z0-9-]+$/.test(slug)) {
			return fail(400, { error: 'Slug can only contain lowercase letters, numbers, and hyphens' });
		}

		if (customerEmail) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(customerEmail)) {
				return fail(400, { error: 'Please enter a valid customer email address' });
			}

			const [existing] = await db
				.select({ id: table.user.id })
				.from(table.user)
				.where(eq(table.user.email, customerEmail));

			if (existing) {
				return fail(400, { error: `An account with email "${customerEmail}" already exists` });
			}
		}

		const now = new Date();
		const scheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : null;
		const memorialId = generateId();
		let ownerId: string | null = null;

		try {
			// If customer fields provided, create user account
			if (customerEmail) {
				const plainPassword = generatePassword();
				const passwordHash = await hash(plainPassword, {
					memoryCost: 19456,
					timeCost: 2,
					outputLen: 32,
					parallelism: 1
				});

				ownerId = generateId();

				await db.insert(table.user).values({
					id: ownerId,
					email: customerEmail,
					displayName: customerName,
					phone: customerPhone,
					passwordHash,
					role: 'family_member',
					createdAt: now
				});

				await sendRegistrationEmail({
					email: customerEmail,
					displayName: customerName || 'Customer',
					password: plainPassword,
					lovedOneName: lovedOneName || title,
					memorialUrl: `${url.origin}/${slug}`
				});
			}

			await db.insert(table.memorial).values({
				id: memorialId,
				slug,
				title,
				lovedOneName,
				description: description || null,
				scheduledAt,
				status: scheduledAt ? 'scheduled' : 'draft',
				ownerId,
				familyContactName: customerName,
				familyContactEmail: customerEmail,
				familyContactPhone: customerPhone,
				funeralDirectorId: locals.user?.id || null,
				assignedVideographerId: assignedVideographerId || null,
				chatEnabled,
				isPublic: true,
				createdAt: now,
				updatedAt: now
			});
		} catch (e) {
			console.error('Admin create memorial error:', e);
			return fail(400, { error: 'A memorial with this slug already exists or user creation failed' });
		}

		throw redirect(303, '/admin/memorials');
	}
};
