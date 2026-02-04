import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	// Fetch memorials assigned to this videographer (or all if admin)
	const memorials = await db
		.select({
			id: table.memorial.id,
			slug: table.memorial.slug,
			title: table.memorial.title,
			description: table.memorial.description,
			status: table.memorial.status,
			scheduledAt: table.memorial.scheduledAt,
			chatEnabled: table.memorial.chatEnabled
		})
		.from(table.memorial)
		.where(
			user.role === 'admin'
				? inArray(table.memorial.status, ['scheduled', 'live', 'draft'])
				: and(
						eq(table.memorial.assignedVideographerId, user.id),
						inArray(table.memorial.status, ['scheduled', 'live'])
					)
		)
		.orderBy(table.memorial.scheduledAt);

	return {
		memorials: memorials.map((m) => ({
			...m,
			scheduledAt: m.scheduledAt?.toISOString() ?? null
		}))
	};
};
