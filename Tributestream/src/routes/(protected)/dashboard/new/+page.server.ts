import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';

function slugify(name: string): string {
	const base = name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	const suffix = Math.random().toString(36).slice(2, 6);
	return `${base}-${suffix}`;
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		const formData = await request.formData();
		const lovedOneName = (formData.get('lovedOneName') as string)?.trim();
		const funeralHomeName = (formData.get('funeralHomeName') as string)?.trim() || null;

		if (!lovedOneName) {
			return fail(400, { error: "Loved one's name is required" });
		}

		const now = new Date();
		const memorialId = generateId();
		const slug = slugify(lovedOneName);
		const title = `Memorial for ${lovedOneName}`;

		try {
			await db.insert(table.memorial).values({
				id: memorialId,
				slug,
				title,
				lovedOneName,
				funeralHomeName,
				ownerId: locals.user.id,
				status: 'draft',
				chatEnabled: true,
				createdAt: now,
				updatedAt: now
			});
		} catch (e) {
			return fail(400, { error: 'Could not create memorial. Please try again.' });
		}

		throw redirect(303, `/schedule/${memorialId}`);
	}
};
