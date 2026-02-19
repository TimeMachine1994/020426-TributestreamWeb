import { error } from '@sveltejs/kit';
import {
	MemorialAccessVerifier,
	type UserContext,
	type AccessCheckResult,
	logAccessAttempt
} from '$lib/utils/memorialAccess';

export interface MemorialRequest {
	memorialId: string;
	user: UserContext;
}

export async function requireViewAccess(request: MemorialRequest): Promise<AccessCheckResult> {
	const accessResult = await MemorialAccessVerifier.checkViewAccess(
		request.memorialId,
		request.user
	);

	if (!accessResult.hasAccess) {
		console.error('❌ View access denied:', accessResult.reason);
		throw error(403, `Access denied: ${accessResult.reason}`);
	}

	return accessResult;
}

export async function requireEditAccess(request: MemorialRequest): Promise<AccessCheckResult> {
	const accessResult = await MemorialAccessVerifier.checkEditAccess(
		request.memorialId,
		request.user
	);

	if (!accessResult.hasAccess) {
		console.error('❌ Edit access denied:', accessResult.reason);
		throw error(403, `Edit access denied: ${accessResult.reason}`);
	}

	return accessResult;
}

export async function requirePhotoUploadAccess(
	request: MemorialRequest
): Promise<AccessCheckResult> {
	const accessResult = await MemorialAccessVerifier.checkPhotoUploadAccess(
		request.memorialId,
		request.user
	);

	if (!accessResult.hasAccess) {
		console.error('❌ Photo upload access denied:', accessResult.reason);
		throw error(403, `Photo upload access denied: ${accessResult.reason}`);
	}

	return accessResult;
}

export function createUserContext(user: any): UserContext {
	return {
		uid: user.uid,
		email: user.email,
		role: user.role,
		isAdmin: user.admin || user.role === 'admin'
	};
}

export async function verifyMemorialPermissions(event: any): Promise<AccessCheckResult> {
	if (!event.locals?.user) {
		return {
			hasAccess: false,
			accessLevel: 'none',
			reason: 'Authentication required'
		};
	}

	const memorialId = event.params?.memorialId || 'unknown';
	const request = createMemorialRequest(memorialId, event.locals);

	logAccessAttempt({
		userId: request.user.uid,
		memorialId: request.memorialId,
		action: 'view',
		timestamp: new Date().toISOString()
	});

	return await requireViewAccess(request);
}

export function createMemorialRequest(memorialId: string, locals: any): MemorialRequest {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	if (!memorialId) {
		throw error(400, 'Memorial ID is required');
	}

	return {
		memorialId,
		user: createUserContext(locals.user)
	};
}
