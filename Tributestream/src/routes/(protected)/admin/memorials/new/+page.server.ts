import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const title = formData.get('title') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string | null;
		const scheduledAtStr = formData.get('scheduledAt') as string | null;
		const chatEnabled = formData.get('chatEnabled') === 'on';

		if (!title || !slug) {
			return fail(400, { error: 'Title and slug are required' });
		}

		// Validate slug format
		if (!/^[a-z0-9-]+$/.test(slug)) {
			return fail(400, { error: 'Slug can only contain lowercase letters, numbers, and hyphens' });
		}

		const now = new Date();
		const scheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : null;

		try {
			await db.insert(table.memorial).values({
				id: generateId(),
				slug,
				title,
				description: description || null,
				scheduledAt,
				status: scheduledAt ? 'scheduled' : 'draft',
				funeralDirectorId: locals.user?.id || null,
				chatEnabled,
				createdAt: now,
				updatedAt: now
			});
		} catch (e) {
			return fail(400, { error: 'A memorial with this slug already exists' });
		}

		throw redirect(303, '/admin/memorials');
	}
};
