import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q') || '';

	const memorials = await db
		.select({
			id: table.memorial.id,
			slug: table.memorial.slug,
			title: table.memorial.title,
			lovedOneName: table.memorial.lovedOneName,
			funeralHomeName: table.memorial.funeralHomeName,
			status: table.memorial.status,
			createdAt: table.memorial.createdAt
		})
		.from(table.memorial)
		.where(eq(table.memorial.isPublic, true))
		.orderBy(table.memorial.createdAt);

	return {
		query,
		memorials: memorials.map((m) => ({
			...m,
			createdAt: m.createdAt.toISOString()
		}))
	};
};
