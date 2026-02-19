import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './+server';

// Mock Firebase Admin with simplified approach
const mockGet = vi.fn();
const mockLimit = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('$lib/server/firebase', () => ({
	adminDb: {
		collection: vi.fn(() => ({
			orderBy: mockOrderBy.mockReturnThis(),
			where: mockWhere.mockReturnThis(),
			limit: mockLimit.mockReturnValue({
				get: mockGet.mockResolvedValue({
					docs: [
						{
							id: 'log1',
							data: () => ({
								action: 'memorial_created',
								userEmail: 'test@example.com',
								userRole: 'owner',
								timestamp: new Date(),
								resourceType: 'memorial',
								resourceId: 'memorial-123'
							})
						}
					]
				})
			})
		}))
	}
}));

// Mock audit logger
vi.mock('$lib/server/auditLogger', () => ({
	logAuditEvent: vi.fn().mockResolvedValue(undefined)
}));

describe('Audit Logs API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const createMockRequest = (searchParams: Record<string, string> = {}) => {
		const url = new URL('http://localhost/api/admin/audit-logs');
		Object.entries(searchParams).forEach(([key, value]) => {
			url.searchParams.set(key, value);
		});

		return {
			request: {
				url: url.toString(),
				headers: {
					get: vi.fn().mockReturnValue('test-user-agent')
				}
			},
			locals: {
				user: {
					uid: 'admin-uid',
					isAdmin: true,
					email: 'admin@test.com',
					role: 'admin'
				}
			},
			getClientAddress: vi.fn().mockReturnValue('127.0.0.1')
		};
	};

	it('should return audit logs for admin user', async () => {
		const mockEvent = createMockRequest();

		const response = await GET(mockEvent as any);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.success).toBe(true);
		expect(result.logs).toHaveLength(1);
		expect(result.logs[0].action).toBe('memorial_created');
	});

	it('should deny access for non-admin users', async () => {
		const mockEvent = createMockRequest();
		mockEvent.locals.user.isAdmin = false;

		const response = await GET(mockEvent as any);
		const result = await response.json();

		expect(response.status).toBe(403);
		expect(result.error).toBe('Admin access required');
	});

	it('should apply action filter', async () => {
		const mockEvent = createMockRequest({ action: 'memorial_created' });

		await GET(mockEvent as any);

		expect(mockWhere).toHaveBeenCalledWith('action', '==', 'memorial_created');
	});

	it('should apply user email filter', async () => {
		const mockEvent = createMockRequest({ userEmail: 'test@example.com' });

		await GET(mockEvent as any);

		expect(mockWhere).toHaveBeenCalledWith('userEmail', '==', 'test@example.com');
	});

	it('should apply resource type filter', async () => {
		const mockEvent = createMockRequest({ resourceType: 'memorial' });

		await GET(mockEvent as any);

		expect(mockWhere).toHaveBeenCalledWith('resourceType', '==', 'memorial');
	});

	it('should apply date range filters', async () => {
		const mockEvent = createMockRequest({
			dateFrom: '2024-01-01',
			dateTo: '2024-01-31'
		});

		await GET(mockEvent as any);

		expect(mockWhere).toHaveBeenCalledWith('timestamp', '>=', expect.any(Date));
		expect(mockWhere).toHaveBeenCalledWith('timestamp', '<=', expect.any(Date));
	});

	it('should apply limit with maximum cap', async () => {
		const mockEvent = createMockRequest({ limit: '2000' });

		await GET(mockEvent as any);

		// Should cap at 1000
		expect(mockLimit).toHaveBeenCalledWith(1000);
	});

	it('should handle database errors gracefully', async () => {
		const mockEvent = createMockRequest();
		mockGet.mockRejectedValueOnce(new Error('Database error'));

		const response = await GET(mockEvent as any);
		const result = await response.json();

		expect(response.status).toBe(500);
		expect(result.error).toBe('Failed to load audit logs');
	});

	it('should log audit access', async () => {
		const mockEvent = createMockRequest();
		const { logAuditEvent } = await import('$lib/server/auditLogger');

		await GET(mockEvent as any);

		expect(logAuditEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'admin_audit_logs_accessed',
				userEmail: 'admin@test.com',
				userRole: 'admin'
			})
		);
	});
});
