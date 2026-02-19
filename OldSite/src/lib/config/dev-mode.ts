/**
 * Development Mode Configuration
 * 
 * Centralized configuration for all development mode features and bypasses.
 * This file controls which development features are enabled and provides
 * test account credentials for local development.
 * 
 * @module dev-mode
 */

import { isDevelopment, isLocalhost } from '$lib/utils/environment';

/**
 * Development mode feature flags
 * All features are automatically disabled in production
 */
export const DEV_MODE_CONFIG = {
	/**
	 * Bypass reCAPTCHA verification in development
	 * When true, all reCAPTCHA verifications return success
	 */
	bypassRecaptcha: isDevelopment || isLocalhost,
	
	/**
	 * Mock email sending (log to console instead)
	 * When true, emails are logged to console instead of sent via SendGrid
	 */
	mockEmails: isDevelopment || isLocalhost,
	
	/**
	 * Enable test accounts for quick login
	 * When true, test accounts can be used for authentication
	 */
	useTestAccounts: isDevelopment || isLocalhost,
	
	/**
	 * Show development mode banner at top of pages
	 * When true, displays warning banner indicating dev mode is active
	 */
	showDevBanner: isDevelopment || isLocalhost,
	
	/**
	 * Enable verbose console logging
	 * When true, additional debug information is logged to console
	 */
	verboseLogging: isDevelopment || isLocalhost,
	
	/**
	 * Show quick login component
	 * When true, displays floating quick login widget
	 */
	showQuickLogin: isDevelopment || isLocalhost,
	
	/**
	 * Enable dev tools page at /dev
	 * When true, /dev route is accessible
	 */
	enableDevTools: isDevelopment || isLocalhost,
	
	/**
	 * Auto-seed test users on startup
	 * When true, attempts to create test users if they don't exist
	 */
	autoSeedUsers: false, // Keep false to avoid API calls on every reload
	
	/**
	 * Skip Firebase Auth email verification
	 * When true, users don't need to verify email addresses
	 */
	skipEmailVerification: isDevelopment || isLocalhost,
	
	/**
	 * Use Stripe test mode
	 * When true, uses Stripe test API keys
	 */
	stripeTestMode: isDevelopment || isLocalhost
} as const;

/**
 * Test account credentials for development
 * These accounts should be seeded in Firebase for local testing
 */
export interface TestAccount {
	email: string;
	password: string;
	role: 'admin' | 'owner' | 'funeral_director' | 'viewer';
	displayName: string;
	companyName?: string;
	description: string;
}

export const DEV_TEST_ACCOUNTS: TestAccount[] = [
	{
		email: 'admin@dev.test',
		password: 'dev123',
		role: 'admin',
		displayName: 'Dev Admin User',
		description: 'Full admin access to all features and data'
	},
	{
		email: 'funeral@dev.test',
		password: 'dev123',
		role: 'funeral_director',
		displayName: 'Dev Funeral Director',
		companyName: 'Dev Funeral Home',
		description: 'Can create memorials and manage funeral services'
	},
	{
		email: 'owner@dev.test',
		password: 'dev123',
		role: 'owner',
		displayName: 'Dev Memorial Owner',
		description: 'Can manage their own memorial pages'
	},
	{
		email: 'viewer@dev.test',
		password: 'dev123',
		role: 'viewer',
		displayName: 'Dev Viewer User',
		description: 'Can view public memorial pages'
	}
];

/**
 * Get test account by role
 */
export function getTestAccountByRole(role: TestAccount['role']): TestAccount | undefined {
	return DEV_TEST_ACCOUNTS.find(account => account.role === role);
}

/**
 * Get test account by email
 */
export function getTestAccountByEmail(email: string): TestAccount | undefined {
	return DEV_TEST_ACCOUNTS.find(account => account.email === email);
}

/**
 * Check if email is a test account
 */
export function isTestAccountEmail(email: string): boolean {
	return DEV_TEST_ACCOUNTS.some(account => account.email === email);
}

/**
 * Get list of all test account emails
 */
export function getAllTestAccountEmails(): string[] {
	return DEV_TEST_ACCOUNTS.map(account => account.email);
}

/**
 * Development mode logging prefix
 * Consistent prefix for all dev mode console messages
 */
export const DEV_LOG_PREFIX = {
	INFO: 'ℹ️ [DEV MODE]',
	SUCCESS: '✅ [DEV MODE]',
	WARNING: '⚠️ [DEV MODE]',
	ERROR: '❌ [DEV MODE]',
	BYPASS: '🔓 [DEV BYPASS]',
	MOCK: '🎭 [DEV MOCK]',
	DEBUG: '🐛 [DEV DEBUG]'
} as const;

/**
 * Development mode console logging helpers
 */
export const devLog = {
	info: (...args: any[]) => {
		if (DEV_MODE_CONFIG.verboseLogging) {
			console.log(DEV_LOG_PREFIX.INFO, ...args);
		}
	},
	
	success: (...args: any[]) => {
		if (DEV_MODE_CONFIG.verboseLogging) {
			console.log(DEV_LOG_PREFIX.SUCCESS, ...args);
		}
	},
	
	warning: (...args: any[]) => {
		if (DEV_MODE_CONFIG.verboseLogging) {
			console.warn(DEV_LOG_PREFIX.WARNING, ...args);
		}
	},
	
	error: (...args: any[]) => {
		if (DEV_MODE_CONFIG.verboseLogging) {
			console.error(DEV_LOG_PREFIX.ERROR, ...args);
		}
	},
	
	bypass: (service: string, ...args: any[]) => {
		if (DEV_MODE_CONFIG.verboseLogging) {
			console.log(DEV_LOG_PREFIX.BYPASS, `${service} bypassed`, ...args);
		}
	},
	
	mock: (service: string, ...args: any[]) => {
		if (DEV_MODE_CONFIG.verboseLogging) {
			console.log(DEV_LOG_PREFIX.MOCK, `${service} mocked`, ...args);
		}
	},
	
	debug: (...args: any[]) => {
		if (DEV_MODE_CONFIG.verboseLogging) {
			console.log(DEV_LOG_PREFIX.DEBUG, ...args);
		}
	}
};

/**
 * Get active bypasses as string array
 * Useful for displaying in dev mode banner
 */
export function getActiveBypasses(): string[] {
	const bypasses: string[] = [];
	
	if (DEV_MODE_CONFIG.bypassRecaptcha) bypasses.push('reCAPTCHA');
	if (DEV_MODE_CONFIG.mockEmails) bypasses.push('Email');
	if (DEV_MODE_CONFIG.useTestAccounts) bypasses.push('Test Accounts');
	if (DEV_MODE_CONFIG.skipEmailVerification) bypasses.push('Email Verification');
	
	return bypasses;
}

/**
 * Get development mode summary
 * Returns object with all active features and configurations
 */
export function getDevModeSummary() {
	return {
		environment: isDevelopment ? 'development' : 'production',
		localhost: isLocalhost,
		activeBypasses: getActiveBypasses(),
		testAccountsCount: DEV_TEST_ACCOUNTS.length,
		config: DEV_MODE_CONFIG
	};
}

/**
 * Log development mode configuration to console
 */
export function logDevModeConfig(): void {
	if (!isDevelopment) return;
	
	console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('🛠️ Development Mode Configuration');
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	
	console.log('\n📋 Active Features:');
	Object.entries(DEV_MODE_CONFIG).forEach(([key, value]) => {
		const icon = value ? '✅' : '❌';
		console.log(`  ${icon} ${key}: ${value}`);
	});
	
	console.log('\n👥 Test Accounts:');
	DEV_TEST_ACCOUNTS.forEach(account => {
		console.log(`  • ${account.role}: ${account.email} / ${account.password}`);
	});
	
	console.log('\n🔓 Active Bypasses:', getActiveBypasses().join(', ') || 'None');
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
