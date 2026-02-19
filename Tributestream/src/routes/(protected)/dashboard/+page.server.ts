import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	// Role-aware redirect to appropriate dashboard
	switch (user.role) {
		case 'admin':
			throw redirect(303, '/admin');
		case 'videographer':
			throw redirect(303, '/switcher');
		case 'funeral_director':
			// TODO: Create funeral director dashboard
			break;
		case 'family_member':
		case 'contributor':
		case 'viewer':
		default:
			break;
	}

	// Fetch memorials owned by this user
	const memorials = await db
		.select({
			id: table.memorial.id,
			title: table.memorial.title,
			slug: table.memorial.slug,
			lovedOneName: table.memorial.lovedOneName,
			status: table.memorial.status,
			isPaid: table.memorial.isPaid,
			totalPrice: table.memorial.totalPrice,
			createdAt: table.memorial.createdAt,
			updatedAt: table.memorial.updatedAt
		})
		.from(table.memorial)
		.where(eq(table.memorial.ownerId, user.id))
		.orderBy(desc(table.memorial.updatedAt));

	return { user, memorials };
};
