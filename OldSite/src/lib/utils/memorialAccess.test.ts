import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyMemorialAccess, hasPhotoUploadPermission } from './memorialAccess';
import type { User } from 'firebase/auth';

describe('Memorial Access Verification', () => {
	const mockUser: Partial<User> = {
		uid: 'test-user-123',
		email: 'test@example.com'
	};

	const mockMemorial = {
		id: 'memorial-123',
		ownerUid: 'test-user-123', // V1: Updated field name
		funeralDirectorUid: 'fd-789' // V1: Updated field name
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	// Mock checkInvitationStatus function
	vi.mock('./memorialAccess', async () => {
		const actual = await vi.importActual('./memorialAccess');
		return {
			...actual,
			checkInvitationStatus: vi.fn()
		};
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('verifyMemorialAccess', () => {
		it('should allow owner access', async () => {
			const userWithOwnerRole = {
				...mockUser,
				customClaims: { role: 'owner' }
			};

			const result = await verifyMemorialAccess(
				userWithOwnerRole as User,
				mockMemorial.id,
				mockMemorial
			);

			expect(result.hasAccess).toBe(true);
			expect(result.accessLevel).toBe('admin');
		});

		it('should allow funeral director access', async () => {
			const userWithFDRole = {
				...mockUser,
				customClaims: { role: 'funeral_director' }
			};

			// Mock memorial where user is funeral director
			const fdMemorial = {
				...mockMemorial,
				funeralDirectorUid: mockUser.uid
			};

			const result = await verifyMemorialAccess(userWithFDRole as User, fdMemorial.id, fdMemorial);

			expect(result.hasAccess).toBe(true);
			expect(result.accessLevel).toBe('admin');
		});

		it('should allow admin access to any memorial', async () => {
			const adminUser = {
				...mockUser,
				uid: 'different-user-456', // Different UID to test admin override
				customClaims: { role: 'admin', admin: true }
			};

			// Mock the memorial with V1 field structure
			const v1Memorial = {
				...mockMemorial,
				ownerUid: 'test-user-123',
				funeralDirectorUid: 'fd-789'
			};

			const result = await verifyMemorialAccess(adminUser as User, v1Memorial.id, v1Memorial);

			expect(result.hasAccess).toBe(true);
			expect(result.accessLevel).toBe('admin');
		});

		it('should deny access for users without valid roles', async () => {
			const unauthorizedUser = {
				...mockUser,
				uid: 'different-user-456',
				customClaims: { role: 'unknown' }
			};

			const result = await verifyMemorialAccess(
				unauthorizedUser as User,
				mockMemorial.id,
				mockMemorial
			);

			expect(result.hasAccess).toBe(false);
			expect(result.reason).toContain('No access permission');
		});
	});

	describe('hasPhotoUploadPermission - V1 (Photo uploads disabled)', () => {
		it('should deny photo upload for all roles in V1', () => {
			expect(hasPhotoUploadPermission('owner', true)).toBe(false);
			expect(hasPhotoUploadPermission('admin', true)).toBe(false);
			expect(hasPhotoUploadPermission('funeral_director', true)).toBe(false);
		});

		it('should deny photo upload for unknown roles', () => {
			const result = hasPhotoUploadPermission('unknown_role' as any, false);
			expect(result).toBe(false);
		});
	});
});
