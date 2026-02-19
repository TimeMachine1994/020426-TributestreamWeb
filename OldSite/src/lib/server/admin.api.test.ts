import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as statsGET } from '../routes/api/admin/stats/+server';
import { GET as usersGET, POST as usersPOST } from '../routes/api/admin/users/+server';
import { GET as applicationsGET } from '../routes/api/admin/applications/+server';
import { POST as approveApplication } from '../routes/api/admin/applications/[id]/approve/+server';
import { POST as rejectApplication } from '../routes/api/admin/applications/[id]/reject/+server';
import { POST as suspendUser } from '../routes/api/admin/users/[uid]/suspend/+server';
import { POST as activateUser } from '../routes/api/admin/users/[uid]/activate/+server';

// Mock AdminService
vi.mock('$lib/server/admin', () => ({
	AdminService: {
		getDashboardStats: vi.fn(),
		getAllUsers: vi.fn(),
		createUser: vi.fn(),
		suspendUser: vi.fn(),
		activateUser: vi.fn(),
		getPendingApplications: vi.fn(),
		approveApplication: vi.fn(),
		rejectApplication: vi.fn(),
		logAdminAction: vi.fn()
	}
}));

import { AdminService } from '$lib/server/admin';

describe('Admin API Endpoints', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('/api/admin/stats', () => {
		it('should return dashboard stats for admin user', async () => {
			const mockStats = {
				totalUsers: 150,
				totalMemorials: 75,
				pendingApplications: 5,
				activeStreams: 3,
				newUsersThisWeek: 12,
				newMemorialsThisWeek: 8
			};

			(AdminService.getDashboardStats as any).mockResolvedValue(mockStats);

			const mockLocals = {
				user: { uid: 'admin123', role: 'admin' }
			};

			const response = await statsGET({ locals: mockLocals } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(mockStats);
			expect(AdminService.getDashboardStats).toHaveBeenCalled();
		});

		it('should return 403 for non-admin user', async () => {
			const mockLocals = {
				user: { uid: 'user123', role: 'owner' }
			};

			const response = await statsGET({ locals: mockLocals } as any);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.error).toBe('Unauthorized');
			expect(AdminService.getDashboardStats).not.toHaveBeenCalled();
		});

		it('should return 403 for unauthenticated user', async () => {
			const mockLocals = { user: null };

			const response = await statsGET({ locals: mockLocals } as any);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.error).toBe('Unauthorized');
		});

		it('should handle service errors', async () => {
			(AdminService.getDashboardStats as any).mockRejectedValue(new Error('Service error'));

			const mockLocals = {
				user: { uid: 'admin123', role: 'admin' }
			};

			const response = await statsGET({ locals: mockLocals } as any);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Failed to fetch statistics');
		});
	});

	describe('/api/admin/users', () => {
		it('should return all users for admin', async () => {
			const mockUsers = [
				{
					uid: 'user1',
					email: 'user1@test.com',
					role: 'owner',
					isAdmin: false,
					suspended: false,
					memorialCount: 2
				}
			];

			(AdminService.getAllUsers as any).mockResolvedValue(mockUsers);

			const mockLocals = {
				user: { uid: 'admin123', role: 'admin' }
			};

			const response = await usersGET({ locals: mockLocals } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(mockUsers);
			expect(AdminService.getAllUsers).toHaveBeenCalled();
		});

		it('should create new user via POST', async () => {
			const userData = {
				email: 'newuser@test.com',
				displayName: 'New User',
				role: 'funeral_director'
			};

			(AdminService.createUser as any).mockResolvedValue(undefined);
			(AdminService.logAdminAction as any).mockResolvedValue(undefined);

			const mockRequest = {
				json: () => Promise.resolve(userData)
			};

			const mockLocals = {
				user: { uid: 'admin123', role: 'admin' }
			};

			const response = await usersPOST({
				request: mockRequest,
				locals: mockLocals
			} as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(AdminService.createUser).toHaveBeenCalledWith(userData);
			expect(AdminService.logAdminAction).toHaveBeenCalledWith(
				'admin123',
				'user_created',
				'user',
				'newuser@test.com',
				{ userData }
			);
		});

		it('should reject non-admin user creation', async () => {
			const mockLocals = {
				user: { uid: 'user123', role: 'owner' }
			};

			const response = await usersPOST({
				request: { json: () => Promise.resolve({}) },
				locals: mockLocals
			} as any);

			expect(response.status).toBe(403);
			expect(AdminService.createUser).not.toHaveBeenCalled();
		});
	});

	describe('/api/admin/applications', () => {
		it('should return pending applications for admin', async () => {
			const mockApplications = [
				{
					id: 'app1',
					userId: 'user1',
					userEmail: 'director@test.com',
					businessName: 'Test Funeral Home',
					status: 'pending_review'
				}
			];

			(AdminService.getPendingApplications as any).mockResolvedValue(mockApplications);

			const mockLocals = {
				user: { uid: 'admin123', role: 'admin' }
			};

			const response = await applicationsGET({ locals: mockLocals } as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(mockApplications);
			expect(AdminService.getPendingApplications).toHaveBeenCalled();
		});

		it('should reject non-admin access to applications', async () => {
			const mockLocals = {
				user: { uid: 'user123', role: 'funeral_director' }
			};

			const response = await applicationsGET({ locals: mockLocals } as any);

			expect(response.status).toBe(403);
			expect(AdminService.getPendingApplications).not.toHaveBeenCalled();
		});
	});

	describe('/api/admin/applications/[id]/approve', () => {
		it('should approve application for admin', async () => {
			(AdminService.approveApplication as any).mockResolvedValue(undefined);
			(AdminService.logAdminAction as any).mockResolvedValue(undefined);

			const mockParams = { id: 'app123' };
			const mockLocals = {
				user: { uid: 'admin123', role: 'admin' }
			};

			const response = await approveApplication({
				params: mockParams,
				locals: mockLocals
			} as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(AdminService.approveApplication).toHaveBeenCalledWith('app123', 'admin123');
			expect(AdminService.logAdminAction).toHaveBeenCalledWith(
				'admin123',
				'application_approved',
				'application',
				'app123',
				{}
			);
		});

		it('should reject non-admin approval attempt', async () => {
			const mockParams = { id: 'app123' };
			const mockLocals = {
				user: { uid: 'user123', role: 'owner' }
			};

			const response = await approveApplication({
				params: mockParams,
				locals: mockLocals
			} as any);

			expect(response.status).toBe(403);
			expect(AdminService.approveApplication).not.toHaveBeenCalled();
		});
	});

	describe('/api/admin/applications/[id]/reject', () => {
		it('should reject application for admin', async () => {
			(AdminService.rejectApplication as any).mockResolvedValue(undefined);
			(AdminService.logAdminAction as any).mockResolvedValue(undefined);

			const mockParams = { id: 'app123' };
			const mockRequest = {
				json: () => Promise.resolve({ reason: 'Incomplete documentation' })
			};
			const mockLocals = {
				user: { uid: 'admin123', role: 'admin' }
			};

			const response = await rejectApplication({
				params: mockParams,
				request: mockRequest,
				locals: mockLocals
			} as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(AdminService.rejectApplication).toHaveBeenCalledWith(
				'app123',
				'admin123',
				'Incomplete documentation'
			);
			expect(AdminService.logAdminAction).toHaveBeenCalledWith(
				'admin123',
				'application_rejected',
				'application',
				'app123',
				{ reason: 'Incomplete documentation' }
			);
		});
	});

	describe('/api/admin/users/[uid]/suspend', () => {
		it('should suspend user for admin', async () => {
			(AdminService.suspendUser as any).mockResolvedValue(undefined);
			(AdminService.logAdminAction as any).mockResolvedValue(undefined);

			const mockParams = { uid: 'user123' };
			const mockRequest = {
				json: () => Promise.resolve({ reason: 'Policy violation' })
			};
			const mockLocals = {
				user: { uid: 'admin123', role: 'admin' }
			};

			const response = await suspendUser({
				params: mockParams,
				request: mockRequest,
				locals: mockLocals
			} as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(AdminService.suspendUser).toHaveBeenCalledWith('user123', 'Policy violation');
			expect(AdminService.logAdminAction).toHaveBeenCalledWith(
				'admin123',
				'user_suspended',
				'user',
				'user123',
				{ reason: 'Policy violation' }
			);
		});

		it('should reject non-admin suspension attempt', async () => {
			const mockParams = { uid: 'user123' };
			const mockLocals = {
				user: { uid: 'user456', role: 'owner' }
			};

			const response = await suspendUser({
				params: mockParams,
				request: { json: () => Promise.resolve({}) },
				locals: mockLocals
			} as any);

			expect(response.status).toBe(403);
			expect(AdminService.suspendUser).not.toHaveBeenCalled();
		});
	});

	describe('/api/admin/users/[uid]/activate', () => {
		it('should activate user for admin', async () => {
			(AdminService.activateUser as any).mockResolvedValue(undefined);
			(AdminService.logAdminAction as any).mockResolvedValue(undefined);

			const mockParams = { uid: 'user123' };
			const mockLocals = {
				user: { uid: 'admin123', role: 'admin' }
			};

			const response = await activateUser({
				params: mockParams,
				locals: mockLocals
			} as any);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(AdminService.activateUser).toHaveBeenCalledWith('user123');
			expect(AdminService.logAdminAction).toHaveBeenCalledWith(
				'admin123',
				'user_activated',
				'user',
				'user123',
				{}
			);
		});

		it('should handle service errors gracefully', async () => {
			(AdminService.activateUser as any).mockRejectedValue(new Error('Database error'));

			const mockParams = { uid: 'user123' };
			const mockLocals = {
				user: { uid: 'admin123', role: 'admin' }
			};

			const response = await activateUser({
				params: mockParams,
				locals: mockLocals
			} as any);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('Failed to activate user');
		});
	});

	describe('Authorization Edge Cases', () => {
		it('should handle missing user in locals', async () => {
			const mockLocals = {};

			const response = await statsGET({ locals: mockLocals } as any);

			expect(response.status).toBe(403);
		});

		it('should handle null user in locals', async () => {
			const mockLocals = { user: null };

			const response = await usersGET({ locals: mockLocals } as any);

			expect(response.status).toBe(403);
		});

		it('should handle undefined role', async () => {
			const mockLocals = {
				user: { uid: 'user123' } // No role property
			};

			const response = await applicationsGET({ locals: mockLocals } as any);

			expect(response.status).toBe(403);
		});
	});
});
