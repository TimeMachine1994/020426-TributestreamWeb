import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as table from './schema.js';
import { hash } from '@node-rs/argon2';
import 'dotenv/config';

const client = createClient({
	url: process.env.DATABASE_URL!,
	authToken: process.env.DATABASE_AUTH_TOKEN
});
const db = drizzle(client, { schema: table });

const SEED_USERS = [
	{ email: 'admin@test.com', password: 'admin', role: 'admin' as const, displayName: 'Admin' },
	{ email: 'funeral_director@test.com', password: 'funeral_director', role: 'funeral_director' as const, displayName: 'Funeral Director' },
	{ email: 'videographer@test.com', password: 'videographer', role: 'videographer' as const, displayName: 'Videographer' },
	{ email: 'family_member@test.com', password: 'family_member', role: 'family_member' as const, displayName: 'Family Member' },
	{ email: 'contributor@test.com', password: 'contributor', role: 'contributor' as const, displayName: 'Contributor' },
	{ email: 'viewer@test.com', password: 'viewer', role: 'viewer' as const, displayName: 'Viewer' }
];

export async function seed() {
	console.log('🌱 Seeding database...');

	for (const user of SEED_USERS) {
		const existingUser = await db
			.select()
			.from(table.user)
			.where(eq(table.user.email, user.email))
			.limit(1);

		if (existingUser.length > 0) {
			console.log(`  ⏭️  User "${user.email}" already exists, skipping`);
			continue;
		}

		const passwordHash = await hash(user.password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		const userId = generateId();

		await db.insert(table.user).values({
			id: userId,
			email: user.email,
			displayName: user.displayName,
			passwordHash,
			role: user.role,
			createdAt: new Date()
		});

		console.log(`  ✅ Created user "${user.email}" with role "${user.role}"`);
	}

	console.log('🌱 Seeding complete!');
}

function generateId(): string {
	const bytes = new Uint8Array(15);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

// Run if executed directly
seed().catch(console.error);
