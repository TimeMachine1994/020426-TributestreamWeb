import { error, fail } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { sendRegistrationEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ params }) => {
	const [user] = await db
		.select({
			id: table.user.id,
			email: table.user.email,
			displayName: table.user.displayName,
			phone: table.user.phone,
			role: table.user.role,
			createdAt: table.user.createdAt
		})
		.from(table.user)
		.where(eq(table.user.id, params.id));

	if (!user) {
		throw error(404, 'User not found');
	}

	const memorials = await db
		.select({
			id: table.memorial.id,
			slug: table.memorial.slug,
			title: table.memorial.title,
			lovedOneName: table.memorial.lovedOneName,
			status: table.memorial.status,
			calculatorConfig: table.memorial.calculatorConfigJson,
			createdAt: table.memorial.createdAt
		})
		.from(table.memorial)
		.where(eq(table.memorial.ownerId, params.id))
		.orderBy(table.memorial.createdAt);

	return {
		targetUser: {
			...user,
			createdAt: user.createdAt.toISOString()
		},
		memorials: memorials.map((m) => ({
			...m,
			createdAt: m.createdAt.toISOString(),
			hasBooking: !!m.calculatorConfig
		}))
	};
};

function generatePassword(length = 12): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(bytes)
		.map((b) => chars[b % chars.length])
		.join('');
}

export const actions: Actions = {
	updateRole: async ({ request, params }) => {
		const formData = await request.formData();
		const role = formData.get('role') as string;

		const validRoles: table.UserRole[] = [
			'admin', 'funeral_director', 'videographer', 'family_member', 'contributor', 'viewer'
		];

		if (!validRoles.includes(role as table.UserRole)) {
			return fail(400, { error: 'Invalid role' });
		}

		await db.update(table.user).set({ role: role as table.UserRole }).where(eq(table.user.id, params.id));
		return { success: true, message: 'Role updated' };
	},

	resetPassword: async ({ params }) => {
		const [user] = await db
			.select({ email: table.user.email, displayName: table.user.displayName })
			.from(table.user)
			.where(eq(table.user.id, params.id));

		if (!user) {
			return fail(404, { error: 'User not found' });
		}

		const plainPassword = generatePassword();
		const passwordHash = await hash(plainPassword, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		await db.update(table.user).set({ passwordHash }).where(eq(table.user.id, params.id));

		// Log the new password (stub email)
		console.log('');
		console.log('═══════════════════════════════════════════════════');
		console.log('🔑  PASSWORD RESET (STUB)');
		console.log('═══════════════════════════════════════════════════');
		console.log(`  User:      ${user.email}`);
		console.log(`  New Pass:  ${plainPassword}`);
		console.log('═══════════════════════════════════════════════════');
		console.log('');

		return { success: true, message: `Password reset. New password logged to console.` };
	}
};
