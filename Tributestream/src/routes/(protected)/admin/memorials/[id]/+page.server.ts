import { fail, redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getMemorialById } from '$lib/server/services/memorial.service';

export const load: PageServerLoad = async ({ params }) => {
	const memorial = await getMemorialById(params.id);

	if (!memorial) {
		throw error(404, 'Memorial not found');
	}

	const videographers = await db
		.select({ id: table.user.id, username: table.user.username })
		.from(table.user)
		.where(eq(table.user.role, 'videographer'));

	return {
		memorial: {
			...memorial,
			scheduledAt: memorial.scheduledAt?.toISOString().slice(0, 16) ?? null,
			createdAt: memorial.createdAt.toISOString(),
			updatedAt: memorial.updatedAt.toISOString()
		},
		videographers
	};
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const formData = await request.formData();
		const title = formData.get('title') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string | null;
		const scheduledAtStr = formData.get('scheduledAt') as string | null;
		const assignedVideographerId = formData.get('assignedVideographerId') as string | null;
		const status = formData.get('status') as string;
		const chatEnabled = formData.get('chatEnabled') === 'on';
		const lovedOneName = formData.get('lovedOneName') as string | null;
		const directorFullName = formData.get('directorFullName') as string | null;
		const funeralHomeName = formData.get('funeralHomeName') as string | null;

		if (!title || !slug) {
			return fail(400, { error: 'Title and slug are required' });
		}

		if (!/^[a-z0-9-]+$/.test(slug)) {
			return fail(400, { error: 'Slug can only contain lowercase letters, numbers, and hyphens' });
		}

		const scheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : null;

		try {
			await db
				.update(table.memorial)
				.set({
					title,
					slug,
					description: description || null,
					scheduledAt,
					status: status as table.MemorialStatus,
					assignedVideographerId: assignedVideographerId || null,
					chatEnabled,
					lovedOneName: lovedOneName || null,
					directorFullName: directorFullName || null,
					funeralHomeName: funeralHomeName || null,
					updatedAt: new Date()
				})
				.where(eq(table.memorial.id, params.id));
		} catch (e) {
			return fail(400, { error: 'A memorial with this slug already exists' });
		}

		throw redirect(303, '/admin/memorials');
	},

	delete: async ({ params }) => {
		await db.delete(table.memorial).where(eq(table.memorial.id, params.id));
		throw redirect(303, '/admin/memorials');
	}
};
