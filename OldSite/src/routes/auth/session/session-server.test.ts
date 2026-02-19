import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server.js';

describe('Auth Session Server Load Function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return token and slug when both are provided', async () => {
		const mockUrl = new URL('http://localhost/auth/session?token=test-token&slug=test-slug');
		const mockEvent = {
			url: mockUrl
		};

		const result = await load(mockEvent as any);

		expect(result).toEqual({
			token: 'test-token',
			slug: 'test-slug',
			error: null
		});
	});

	it('should return token without slug when only token is provided', async () => {
		const mockUrl = new URL('http://localhost/auth/session?token=test-token');
		const mockEvent = {
			url: mockUrl
		};

		const result = await load(mockEvent as any);

		expect(result).toEqual({
			token: 'test-token',
			slug: null,
			error: null
		});
	});

	it('should return error when no token is provided', async () => {
		const mockUrl = new URL('http://localhost/auth/session');
		const mockEvent = {
			url: mockUrl
		};

		const result = await load(mockEvent as any);

		expect(result).toEqual({
			token: null,
			slug: null,
			error: 'missing-token'
		});
	});

	it('should return error when token is empty string', async () => {
		const mockUrl = new URL('http://localhost/auth/session?token=');
		const mockEvent = {
			url: mockUrl
		};

		const result = await load(mockEvent as any);

		expect(result).toEqual({
			token: null,
			slug: null,
			error: 'missing-token'
		});
	});

	it('should handle slug with special characters', async () => {
		const mockUrl = new URL(
			'http://localhost/auth/session?token=test-token&slug=test-memorial-with-dashes'
		);
		const mockEvent = {
			url: mockUrl
		};

		const result = await load(mockEvent as any);

		expect(result).toEqual({
			token: 'test-token',
			slug: 'test-memorial-with-dashes',
			error: null
		});
	});

	it('should handle multiple query parameters', async () => {
		const mockUrl = new URL(
			'http://localhost/auth/session?token=test-token&slug=test-slug&extra=ignored'
		);
		const mockEvent = {
			url: mockUrl
		};

		const result = await load(mockEvent as any);

		expect(result).toEqual({
			token: 'test-token',
			slug: 'test-slug',
			error: null
		});
	});
});
