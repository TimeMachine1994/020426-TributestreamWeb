import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { logAuditEvent, logMemorialAction, logUserAction, logAdminAction } from './auditLogger';

// Mock Firebase Admin
vi.mock('./firebase', () => ({
	adminDb: {
		collection: vi.fn(() => ({
			add: vi.fn().mockResolvedValue({ id: 'mock-doc-id' })
		}))
	}
}));

describe('Audit Logger', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock console methods to avoid noise in tests
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('logAuditEvent', () => {
		it('should log basic audit event successfully', async () => {
			const mockEvent = {
				uid: 'user-123',
				action: 'memorial_created' as const,
				userEmail: 'test@example.com',
				userRole: 'owner' as const,
				resourceType: 'memorial' as const,
				resourceId: 'memorial-123',
				details: { name: 'Test Memorial' },
				ipAddress: '127.0.0.1',
				success: true
			};

			await expect(logAuditEvent(mockEvent)).resolves.not.toThrow();
		});

		it('should handle missing optional fields', async () => {
			const mockEvent = {
				uid: 'user-456',
				action: 'user_login' as const,
				userEmail: 'test@example.com',
				userRole: 'admin' as const,
				resourceType: 'user' as const,
				resourceId: 'user-456',
				details: {},
				success: true
			};

			await expect(logAuditEvent(mockEvent)).resolves.not.toThrow();
		});

		it('should handle logging errors gracefully', async () => {
			// Mock Firebase to throw an error
			const { adminDb } = await import('./firebase');
			vi.mocked(adminDb.collection).mockReturnValue({
				add: vi.fn().mockRejectedValue(new Error('Firebase error'))
			} as any);

			const mockEvent = {
				uid: 'user-789',
				action: 'memorial_created' as const,
				userEmail: 'test@example.com',
				userRole: 'owner' as const,
				resourceType: 'memorial' as const,
				resourceId: 'memorial-456',
				details: {},
				success: true
			};

			// Should not throw, but handle error internally
			await expect(logAuditEvent(mockEvent)).resolves.not.toThrow();
			expect(console.error).toHaveBeenCalledWith(
				expect.stringContaining('Failed to log audit event'),
				expect.any(Error)
			);
		});
	});

	describe('logMemorialAction', () => {
		it('should log memorial creation', async () => {
			const userContext = {
				uid: 'user-123',
				userEmail: 'test@example.com',
				userRole: 'owner' as const,
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent'
			};

			await expect(
				logMemorialAction(userContext, 'memorial_created', 'memorial-123', {
					name: 'Test Memorial'
				})
			).resolves.not.toThrow();
		});

		it('should log memorial updates', async () => {
			const userContext = {
				uid: 'user-456',
				userEmail: 'director@example.com',
				userRole: 'funeral_director' as const,
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent'
			};

			await expect(
				logMemorialAction(userContext, 'memorial_updated', 'memorial-123', {
					field: 'description',
					oldValue: 'old',
					newValue: 'new'
				})
			).resolves.not.toThrow();
		});
	});

	describe('logUserAction', () => {
		it('should log user login', async () => {
			const userContext = {
				uid: 'user-123',
				userEmail: 'test@example.com',
				userRole: 'admin' as const,
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent'
			};

			await expect(
				logUserAction(userContext, 'user_login', 'user-123', { loginMethod: 'email' })
			).resolves.not.toThrow();
		});

		it('should log role changes', async () => {
			const userContext = {
				uid: 'admin-123',
				userEmail: 'admin@example.com',
				userRole: 'admin' as const,
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent'
			};

			await expect(
				logUserAction(userContext, 'role_changed', 'user-123', {
					oldRole: 'owner',
					newRole: 'funeral_director'
				})
			).resolves.not.toThrow();
		});
	});

	describe('logAdminAction', () => {
		it('should log funeral director approval', async () => {
			const userContext = {
				uid: 'admin-123',
				userEmail: 'admin@example.com',
				userRole: 'admin' as const,
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent'
			};

			await expect(
				logAdminAction(userContext, 'funeral_director_approved', 'user-123', {
					approvedBy: 'admin@example.com'
				})
			).resolves.not.toThrow();
		});

		it('should log system configuration changes', async () => {
			const userContext = {
				uid: 'admin-456',
				userEmail: 'admin@example.com',
				userRole: 'admin' as const,
				ipAddress: '127.0.0.1',
				userAgent: 'test-agent'
			};

			await expect(
				logAdminAction(userContext, 'system_config_changed', 'config-key', {
					setting: 'max_memorials',
					oldValue: 100,
					newValue: 200
				})
			).resolves.not.toThrow();
		});
	});
});
