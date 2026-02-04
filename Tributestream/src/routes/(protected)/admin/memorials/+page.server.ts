import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const memorials = await db
		.select({
			id: table.memorial.id,
			slug: table.memorial.slug,
			title: table.memorial.title,
			status: table.memorial.status,
			scheduledAt: table.memorial.scheduledAt,
			chatEnabled: table.memorial.chatEnabled,
			createdAt: table.memorial.createdAt,
			assignedVideographerId: table.memorial.assignedVideographerId
		})
		.from(table.memorial)
		.orderBy(table.memorial.createdAt);

	// Fetch videographer names for assigned memorials
	const videographerIds = memorials
		.map((m) => m.assignedVideographerId)
		.filter((id): id is string => id !== null);

	const videographers =
		videographerIds.length > 0
			? await db
					.select({ id: table.user.id, username: table.user.username })
					.from(table.user)
					.where(eq(table.user.role, 'videographer'))
			: [];

	const videographerMap = new Map(videographers.map((v) => [v.id, v.username]));

	return {
		memorials: memorials.map((m) => ({
			...m,
			scheduledAt: m.scheduledAt?.toISOString() ?? null,
			createdAt: m.createdAt.toISOString(),
			videographerName: m.assignedVideographerId
				? videographerMap.get(m.assignedVideographerId) ?? null
				: null
		}))
	};
};
