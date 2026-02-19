import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const users = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			displayName: table.user.displayName,
			phone: table.user.phone,
			role: table.user.role,
			createdAt: table.user.createdAt
		})
		.from(table.user)
		.orderBy(table.user.createdAt);

	// Count memorials per user
	const memorialCounts = await db
		.select({
			ownerId: table.memorial.ownerId,
			count: sql<number>`count(*)`.as('count')
		})
		.from(table.memorial)
		.groupBy(table.memorial.ownerId);

	const countMap = new Map(memorialCounts.map((r) => [r.ownerId, r.count]));

	return {
		users: users.map((u) => ({
			...u,
			createdAt: u.createdAt.toISOString(),
			memorialCount: countMap.get(u.id) ?? 0
		}))
	};
};
