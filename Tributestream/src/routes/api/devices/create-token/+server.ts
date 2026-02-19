import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

function generateToken(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function generateId(): string {
	const bytes = new Uint8Array(15);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('[API /devices/create-token] Request received');
	if (!locals.user) {
		console.log('[API /devices/create-token] ERROR: Unauthorized');
		throw error(401, 'Unauthorized');
	}
	console.log('[API /devices/create-token] User:', locals.user.email);

	const { memorialId } = await request.json();
	console.log('[API /devices/create-token] Memorial ID:', memorialId);

	if (!memorialId) {
		throw error(400, 'Memorial ID is required');
	}

	// Verify memorial exists and user has access
	const [memorial] = await db
		.select()
		.from(table.memorial)
		.where(eq(table.memorial.id, memorialId));

	if (!memorial) {
		throw error(404, 'Memorial not found');
	}

	if (locals.user.role !== 'admin' && memorial.assignedVideographerId !== locals.user.id) {
		throw error(403, 'You do not have access to this memorial');
	}

	const token = generateToken();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
	console.log('[API /devices/create-token] Generated token:', token.substring(0, 8) + '...');
	console.log('[API /devices/create-token] Expires at:', expiresAt.toISOString());

	const deviceId = generateId();
	console.log('[API /devices/create-token] Device ID:', deviceId);

	await db.insert(table.device).values({
		id: deviceId,
		token,
		memorialId,
		userId: locals.user.id,
		status: 'pending',
		tokenExpiresAt: expiresAt,
		createdAt: now
	});

	console.log('[API /devices/create-token] Device created successfully');
	return json({
		token,
		deviceId,
		expiresAt: expiresAt.toISOString()
	});
};
