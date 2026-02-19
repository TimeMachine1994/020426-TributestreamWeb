import { sql, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const [memorialStats] = await db
		.select({
			total: sql<number>`count(*)`,
			scheduled: sql<number>`sum(case when ${table.memorial.status} = 'scheduled' then 1 else 0 end)`,
			live: sql<number>`sum(case when ${table.memorial.status} = 'live' then 1 else 0 end)`
		})
		.from(table.memorial);

	const [userStats] = await db
		.select({ total: sql<number>`count(*)` })
		.from(table.user);

	const [streamStats] = await db
		.select({
			active: sql<number>`sum(case when ${table.stream.status} = 'live' then 1 else 0 end)`
		})
		.from(table.stream);

	return {
		stats: {
			totalMemorials: memorialStats?.total ?? 0,
			scheduledMemorials: memorialStats?.scheduled ?? 0,
			liveMemorials: memorialStats?.live ?? 0,
			totalUsers: userStats?.total ?? 0,
			activeStreams: streamStats?.active ?? 0
		}
	};
};
