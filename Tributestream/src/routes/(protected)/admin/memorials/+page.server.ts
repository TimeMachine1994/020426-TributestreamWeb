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
			lovedOneName: table.memorial.lovedOneName,
			status: table.memorial.status,
			scheduledAt: table.memorial.scheduledAt,
			chatEnabled: table.memorial.chatEnabled,
			createdAt: table.memorial.createdAt,
			assignedVideographerId: table.memorial.assignedVideographerId,
			ownerId: table.memorial.ownerId,
			calculatorConfig: table.memorial.calculatorConfigJson
		})
		.from(table.memorial)
		.orderBy(table.memorial.createdAt);

	// Fetch owner names
	const ownerIds = memorials.map((m) => m.ownerId).filter((id): id is string => id !== null);
	const owners =
		ownerIds.length > 0
			? await db
					.select({ id: table.user.id, email: table.user.email, displayName: table.user.displayName })
					.from(table.user)
			: [];
	const ownerMap = new Map(owners.map((o) => [o.id, o.displayName || o.email]));

	// Fetch videographer names for assigned memorials
	const videographerIds = memorials
		.map((m) => m.assignedVideographerId)
		.filter((id): id is string => id !== null);

	const videographers =
		videographerIds.length > 0
			? await db
					.select({ id: table.user.id, email: table.user.email, displayName: table.user.displayName })
					.from(table.user)
					.where(eq(table.user.role, 'videographer'))
			: [];

	const videographerMap = new Map(videographers.map((v) => [v.id, v.displayName || v.email]));

	return {
		memorials: memorials.map((m) => ({
			id: m.id,
			slug: m.slug,
			title: m.title,
			lovedOneName: m.lovedOneName,
			status: m.status,
			scheduledAt: m.scheduledAt?.toISOString() ?? null,
			createdAt: m.createdAt.toISOString(),
			ownerName: m.ownerId ? ownerMap.get(m.ownerId) ?? null : null,
			ownerId: m.ownerId,
			hasBooking: !!m.calculatorConfig,
			videographerName: m.assignedVideographerId
				? videographerMap.get(m.assignedVideographerId) ?? null
				: null
		}))
	};
};
