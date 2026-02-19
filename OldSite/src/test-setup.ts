import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
	browser: false,
	dev: true,
	building: false,
	version: '1.0.0'
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn((callback) => {
			callback({
				url: new URL('http://localhost:5173/'),
				params: {},
				data: {},
				route: { id: '/' }
			});
			return () => {};
		})
	},
	navigating: {
		subscribe: vi.fn((callback) => {
			callback(null);
			return () => {};
		})
	},
	updated: {
		subscribe: vi.fn((callback) => {
			callback(false);
			return () => {};
		})
	}
}));

// Mock Firebase
vi.mock('$lib/firebase', () => ({
	auth: {
		currentUser: null,
		signInWithEmailAndPassword: vi.fn(),
		createUserWithEmailAndPassword: vi.fn(),
		signOut: vi.fn(),
		onAuthStateChanged: vi.fn()
	},
	db: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				get: vi.fn(),
				set: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			})),
			add: vi.fn(),
			where: vi.fn(),
			orderBy: vi.fn(),
			limit: vi.fn()
		}))
	}
}));

// Mock Firebase Admin
vi.mock('$lib/server/firebase', () => ({
	adminAuth: {
		verifyIdToken: vi.fn(),
		createCustomToken: vi.fn(),
		setCustomUserClaims: vi.fn()
	},
	adminDb: {
		collection: vi.fn(() => ({
			doc: vi.fn(() => ({
				get: vi.fn(),
				set: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			})),
			add: vi.fn(),
			where: vi.fn(),
			orderBy: vi.fn(),
			limit: vi.fn()
		}))
	}
}));

// Mock external services
vi.mock('stripe', () => ({
	default: vi.fn(() => ({
		paymentIntents: {
			create: vi.fn(),
			confirm: vi.fn()
		},
		customers: {
			create: vi.fn()
		}
	}))
}));

vi.mock('@sendgrid/mail', () => ({
	setApiKey: vi.fn(),
	send: vi.fn()
}));

// Mock auto-save composable
vi.mock('$lib/composables/useAutoSave', () => ({
	useAutoSave: vi.fn(() => ({
		triggerAutoSave: vi.fn(),
		saveNow: vi.fn(() => Promise.resolve()),
		loadAutoSavedData: vi.fn(() => Promise.resolve(null)),
		loadCalculatorConfig: vi.fn(() => Promise.resolve(null)),
		isSaving: vi.fn(() => false),
		lastSaved: vi.fn(() => null),
		hasUnsavedChanges: vi.fn(() => false)
	}))
}));

// Mock DOM APIs
Object.defineProperty(window, 'localStorage', {
	value: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn()
	}
});

Object.defineProperty(window, 'sessionStorage', {
	value: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn()
	}
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

// Mock window methods
window.alert = vi.fn();
window.confirm = vi.fn(() => true);
window.prompt = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Mock MediaDevices for streaming tests
Object.defineProperty(navigator, 'mediaDevices', {
	value: {
		getUserMedia: vi.fn(() => Promise.resolve({
			getTracks: () => [],
			getVideoTracks: () => [],
			getAudioTracks: () => []
		}))
	}
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
	value: {
		writeText: vi.fn(() => Promise.resolve()),
		readText: vi.fn(() => Promise.resolve(''))
	}
});
