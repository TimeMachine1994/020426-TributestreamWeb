import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserManagementData } from '$lib/types/admin';

// Mock Firebase Admin first
const mockAdminDb = {
	collection: vi.fn(() => ({
		get: vi.fn(),
		doc: vi.fn(() => ({
			get: vi.fn(),
			set: vi.fn(),
			update: vi.fn()
		})),
		where: vi.fn(() => ({
			get: vi.fn(),
			where: vi.fn(() => ({
				get: vi.fn(),
				orderBy: vi.fn(() => ({
					get: vi.fn()
				}))
			})),
			orderBy: vi.fn(() => ({
				get: vi.fn()
			}))
		}))
	}))
};

vi.mock('$lib/firebase-admin', () => ({
	adminDb: mockAdminDb
}));

// Import after mocking
const { AdminService } = await import('$lib/server/admin');

describe('AdminService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getAllUsers', () => {
		it('should fetch and format all users correctly', async () => {
			const mockUsers = [
				{
					id: 'user1',
					data: () => ({
						email: 'user1@test.com',
						displayName: 'User One',
						role: 'owner',
						isAdmin: false,
						suspended: false,
						createdAt: { toDate: () => new Date('2024-01-01') }
					})
				},
				{
					id: 'user2',
					data: () => ({
						email: 'admin@test.com',
						displayName: 'Admin User',
						role: 'admin',
						isAdmin: true,
						suspended: false,
						createdAt: { toDate: () => new Date('2024-01-02') }
					})
				}
			];

			const mockMemorials = { size: 2 };

			mockAdminDb.collection.mockReturnValueOnce({
				get: vi.fn().mockResolvedValue({ docs: mockUsers })
			});

			// Mock memorial count queries
			mockAdminDb.collection.mockReturnValue({
				where: vi.fn().mockReturnValue({
					get: vi.fn().mockResolvedValue(mockMemorials)
				})
			});

			const result = await AdminService.getAllUsers();

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				uid: 'user2',
				email: 'admin@test.com',
				role: 'admin',
				isAdmin: true,
				suspended: false,
				memorialCount: 2
			});
			expect(result[1]).toMatchObject({
				uid: 'user1',
				email: 'user1@test.com',
				role: 'owner',
				isAdmin: false,
				suspended: false,
				memorialCount: 2
			});
		});

		it('should handle errors gracefully', async () => {
			mockAdminDb.collection.mockReturnValueOnce({
				get: vi.fn().mockRejectedValue(new Error('Database error'))
			});

			await expect(AdminService.getAllUsers()).rejects.toThrow('Failed to fetch users');
		});
	});

	describe('createUser', () => {
		it('should create a new user with correct data', async () => {
			const mockDocRef = {
				set: vi.fn().mockResolvedValue(undefined)
			};

			mockAdminDb.collection.mockReturnValueOnce({
				doc: vi.fn().mockReturnValue(mockDocRef)
			});

			const userData = {
				email: 'newuser@test.com',
				displayName: 'New User',
				role: 'funeral_director' as const,
				isAdmin: false
			};

			await AdminService.createUser(userData);

			expect(mockDocRef.set).toHaveBeenCalledWith({
				...userData,
				createdAt: expect.any(Date),
				suspended: false,
				isAdmin: false
			});
		});

		it('should set isAdmin to true for admin role', async () => {
			const mockDocRef = {
				set: vi.fn().mockResolvedValue(undefined)
			};

			mockAdminDb.collection.mockReturnValueOnce({
				doc: vi.fn().mockReturnValue(mockDocRef)
			});

			const userData = {
				email: 'admin@test.com',
				role: 'admin' as const
			};

			await AdminService.createUser(userData);

			expect(mockDocRef.set).toHaveBeenCalledWith({
				...userData,
				createdAt: expect.any(Date),
				suspended: false,
				isAdmin: true
			});
		});
	});

	describe('suspendUser', () => {
		it('should suspend user with reason', async () => {
			const mockDocRef = {
				update: vi.fn().mockResolvedValue(undefined)
			};

			mockAdminDb.collection.mockReturnValueOnce({
				doc: vi.fn().mockReturnValue(mockDocRef)
			});

			await AdminService.suspendUser('user123', 'Policy violation');

			expect(mockDocRef.update).toHaveBeenCalledWith({
				suspended: true,
				suspendedReason: 'Policy violation',
				suspendedAt: expect.any(Date)
			});
		});
	});

	describe('activateUser', () => {
		it('should activate suspended user', async () => {
			const mockDocRef = {
				update: vi.fn().mockResolvedValue(undefined)
			};

			mockAdminDb.collection.mockReturnValueOnce({
				doc: vi.fn().mockReturnValue(mockDocRef)
			});

			await AdminService.activateUser('user123');

			expect(mockDocRef.update).toHaveBeenCalledWith({
				suspended: false,
				suspendedReason: null,
				suspendedAt: null,
				reactivatedAt: expect.any(Date)
			});
		});
	});

	// V1: Removed getPendingApplications test - auto-approval workflow

	// V1: Removed approveApplication and rejectApplication tests - auto-approval workflow

	describe('getDashboardStats', () => {
		it('should calculate dashboard statistics correctly', async () => {
			const mockUsers = { size: 150 };
			const mockMemorials = { size: 75 };
			const mockNewUsers = { size: 12 };
			const mockNewMemorials = { size: 8 };
			const mockActiveStreams = { size: 3 };

			// Mock the Promise.all calls
			mockAdminDb.collection
				.mockReturnValueOnce({
					where: vi.fn().mockReturnValue({
						get: vi.fn().mockResolvedValue(mockUsers)
					})
				})
				.mockReturnValueOnce({
					get: vi.fn().mockResolvedValue(mockMemorials)
				})
				.mockReturnValueOnce({
					where: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							get: vi.fn().mockResolvedValue(mockNewUsers)
						})
					})
				})
				.mockReturnValueOnce({
					where: vi.fn().mockReturnValue({
						get: vi.fn().mockResolvedValue(mockNewMemorials)
					})
				})
				.mockReturnValueOnce({
					where: vi.fn().mockReturnValue({
						get: vi.fn().mockResolvedValue(mockActiveStreams)
					})
				});

			const result = await AdminService.getDashboardStats();

			expect(result).toEqual({
				totalUsers: 150,
				totalMemorials: 75,
				activeStreams: 3,
				newUsersThisWeek: 12,
				newMemorialsThisWeek: 8
			});
		});
	});

	describe('logAdminAction', () => {
		it('should log admin action without throwing on failure', async () => {
			const mockDocRef = {
				set: vi.fn().mockResolvedValue(undefined)
			};

			mockAdminDb.collection.mockReturnValueOnce({
				doc: vi.fn().mockReturnValue(mockDocRef)
			});

			// Should not throw even if logging fails
			await expect(
				AdminService.logAdminAction('admin123', 'user_suspended', 'user', 'user456', {
					reason: 'Test suspension'
				})
			).resolves.toBeUndefined();

			expect(mockDocRef.set).toHaveBeenCalledWith({
				adminId: 'admin123',
				action: 'user_suspended',
				targetType: 'user',
				targetId: 'user456',
				details: { reason: 'Test suspension' },
				timestamp: expect.any(Date)
			});
		});

		it('should not throw error if logging fails', async () => {
			const mockDocRef = {
				set: vi.fn().mockRejectedValue(new Error('Logging failed'))
			};

			mockAdminDb.collection.mockReturnValueOnce({
				doc: vi.fn().mockReturnValue(mockDocRef)
			});

			// Should not throw
			await expect(
				AdminService.logAdminAction('admin123', 'user_created', 'user', 'user456', {})
			).resolves.toBeUndefined();
		});
	});
});
