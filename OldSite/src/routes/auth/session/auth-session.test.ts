import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import AuthSessionPage from './+page.svelte';

// Mock Firebase
const mockSignInWithCustomToken = vi.fn();
const mockGetIdToken = vi.fn();
const mockAuth = {};

vi.mock('$lib/firebase', () => ({
	auth: mockAuth
}));

vi.mock('firebase/auth', () => ({
	signInWithCustomToken: mockSignInWithCustomToken
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
Object.defineProperty(window, 'location', {
	value: {
		href: '',
		assign: vi.fn(),
		reload: vi.fn()
	},
	writable: true
});

describe('Auth Session Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockClear();
		mockSignInWithCustomToken.mockClear();
		mockGetIdToken.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should display loading state initially', () => {
		const mockData = {
			token: 'mock-custom-token',
			slug: 'test-memorial',
			error: null
		};

		render(AuthSessionPage, { props: { data: mockData } });

		expect(screen.getByText('Signing in...')).toBeInTheDocument();
		expect(screen.getByText('Please wait while we securely sign you in.')).toBeInTheDocument();
	});

	it('should show error when no token is provided', async () => {
		const mockData = {
			token: null,
			slug: null,
			error: 'missing-token'
		};

		render(AuthSessionPage, { props: { data: mockData } });

		await waitFor(() => {
			expect(screen.getByText('No authentication token provided.')).toBeInTheDocument();
		});
	});

	it('should process custom token and redirect on successful authentication', async () => {
		const mockData = {
			token: 'mock-custom-token-12345',
			slug: 'test-memorial',
			error: null
		};

		const mockUserCredential = {
			user: {
				uid: 'test-user-id',
				getIdToken: mockGetIdToken
			}
		};

		const mockIdToken = 'mock-id-token-67890';
		const mockSessionResponse = {
			redirectTo: '/tributes/test-memorial'
		};

		mockSignInWithCustomToken.mockResolvedValue(mockUserCredential);
		mockGetIdToken.mockResolvedValue(mockIdToken);
		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockSessionResponse)
		});

		render(AuthSessionPage, { props: { data: mockData } });

		await waitFor(() => {
			expect(mockSignInWithCustomToken).toHaveBeenCalledWith(mockAuth, 'mock-custom-token-12345');
		});

		await waitFor(() => {
			expect(mockGetIdToken).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith('/api/session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					idToken: mockIdToken,
					slug: 'test-memorial'
				})
			});
		});

		await waitFor(() => {
			expect(window.location.href).toBe('/tributes/test-memorial');
		});
	});

	it('should handle Firebase authentication errors', async () => {
		const mockData = {
			token: 'invalid-custom-token',
			slug: null,
			error: null
		};

		const firebaseError = new Error('Firebase: Error (auth/invalid-custom-token).') as any;
		firebaseError.code = 'auth/invalid-custom-token';

		mockSignInWithCustomToken.mockRejectedValue(firebaseError);

		render(AuthSessionPage, { props: { data: mockData } });

		await waitFor(() => {
			expect(
				screen.getByText('Authentication failed. Please try logging in manually.')
			).toBeInTheDocument();
		});
	});

	it('should handle session API errors', async () => {
		const mockData = {
			token: 'mock-custom-token',
			slug: null,
			error: null
		};

		const mockUserCredential = {
			user: {
				uid: 'test-user-id',
				getIdToken: mockGetIdToken
			}
		};

		mockSignInWithCustomToken.mockResolvedValue(mockUserCredential);
		mockGetIdToken.mockResolvedValue('mock-id-token');
		mockFetch.mockResolvedValue({
			ok: false,
			status: 401,
			json: () => Promise.resolve({ message: 'Could not create session cookie.' })
		});

		render(AuthSessionPage, { props: { data: mockData } });

		await waitFor(() => {
			expect(screen.getByText('Could not create session cookie.')).toBeInTheDocument();
		});
	});

	it('should redirect to my-portal when no slug is provided', async () => {
		const mockData = {
			token: 'mock-custom-token',
			slug: null,
			error: null
		};

		const mockUserCredential = {
			user: {
				uid: 'test-user-id',
				getIdToken: mockGetIdToken
			}
		};

		const mockSessionResponse = {
			redirectTo: '/my-portal'
		};

		mockSignInWithCustomToken.mockResolvedValue(mockUserCredential);
		mockGetIdToken.mockResolvedValue('mock-id-token');
		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockSessionResponse)
		});

		render(AuthSessionPage, { props: { data: mockData } });

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith('/api/session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					idToken: 'mock-id-token',
					slug: null
				})
			});
		});

		await waitFor(() => {
			expect(window.location.href).toBe('/my-portal');
		});
	});

	it('should handle network errors gracefully', async () => {
		const mockData = {
			token: 'mock-custom-token',
			slug: null,
			error: null
		};

		const mockUserCredential = {
			user: {
				uid: 'test-user-id',
				getIdToken: mockGetIdToken
			}
		};

		mockSignInWithCustomToken.mockResolvedValue(mockUserCredential);
		mockGetIdToken.mockResolvedValue('mock-id-token');
		mockFetch.mockRejectedValue(new Error('Network error'));

		render(AuthSessionPage, { props: { data: mockData } });

		await waitFor(() => {
			expect(
				screen.getByText('Authentication failed. Please try logging in manually.')
			).toBeInTheDocument();
		});
	});
});
