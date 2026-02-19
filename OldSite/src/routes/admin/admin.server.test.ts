import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';

// Mock SvelteKit redirect
vi.mock('@sveltejs/kit', () => ({
	redirect: vi.fn()
}));

// Mock Firebase Admin
vi.mock('$lib/server/firebase', () => ({
	adminDb: {
		collection: vi.fn()
	}
}));

describe('Admin Page Server Load', () => {
	let mockRedirect: any;
	let mockAdminDb: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		// Get the mocked functions
		const { redirect } = await import('@sveltejs/kit');
		const { adminDb } = await import('$lib/server/firebase');
		mockRedirect = vi.mocked(redirect);
		mockAdminDb = vi.mocked(adminDb);
	});

	it('should redirect to login if user is not authenticated', async () => {
		const locals = { user: null };

		// Mock redirect to throw (simulating SvelteKit behavior)
		mockRedirect.mockImplementation(() => {
			throw new Error('Redirect');
		});

		await expect(load({ locals } as any)).rejects.toThrow();
		expect(mockRedirect).toHaveBeenCalledWith(302, '/login');
	});

	it('should redirect to profile if user is not admin', async () => {
		const locals = {
			user: {
				email: 'user@test.com',
				admin: false,
				role: 'owner'
			}
		};

		// Mock redirect to throw (simulating SvelteKit behavior)
		mockRedirect.mockImplementation(() => {
			throw new Error('Redirect');
		});

		await expect(load({ locals } as any)).rejects.toThrow();
		expect(mockRedirect).toHaveBeenCalledWith(302, '/profile');
	});

	it('should allow access for admin users with admin flag', async () => {
		const locals = {
			user: {
				email: 'admin@test.com',
				admin: true,
				role: 'owner',
				uid: 'admin-123'
			}
		};

		// Mock Firestore collections to return empty results
		mockAdminDb.collection.mockReturnValue({
			get: vi.fn().mockResolvedValue({
				docs: [],
				size: 0
			})
		});

		const result = await load({ locals } as any);

		expect(result).toHaveProperty('adminUser');
		expect(result).toHaveProperty('recentMemorials');
		expect(result).toHaveProperty('pendingFuneralDirectors');
		expect(result).toHaveProperty('stats');
		expect(result.adminUser.email).toBe('admin@test.com');
	});

	it('should allow access for admin users with admin role', async () => {
		const locals = {
			user: {
				email: 'admin@test.com',
				admin: true,
				role: 'admin',
				uid: 'admin-456'
			}
		};

		// Mock basic Firestore responses
		mockAdminDb.collection.mockReturnValue({
			get: vi.fn().mockResolvedValue({
				docs: [],
				size: 0
			})
		});

		const result = await load({ locals } as any);

		expect(result).toHaveProperty('adminUser');
		expect(result.adminUser.email).toBe('admin@test.com');
	});

	it('should handle database errors gracefully', async () => {
		const locals = {
			user: {
				email: 'admin@test.com',
				admin: true,
				role: 'admin',
				uid: 'admin-789'
			}
		};

		// Mock database error
		mockAdminDb.collection.mockReturnValue({
			get: vi.fn().mockRejectedValue(new Error('Database connection failed'))
		});

		// Should not throw an error, but return error state
		const result = await load({ locals } as any);

		expect(result).toHaveProperty('error');
		expect(result).toHaveProperty('adminUser');
		expect(result.adminUser.email).toBe('admin@test.com');
	});
});
