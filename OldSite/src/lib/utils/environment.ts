/**
 * Environment Detection Utility
 * 
 * Provides consistent environment detection across client and server contexts.
 * Used to enable development mode features like service bypasses and test accounts.
 * 
 * @module environment
 */

/**
 * Detect if running in development mode
 * Uses SvelteKit's built-in environment detection
 */
export const isDevelopment: boolean = import.meta.env.DEV;

/**
 * Detect if running in production mode
 * Uses SvelteKit's built-in environment detection
 */
export const isProduction: boolean = import.meta.env.PROD;

/**
 * Detect if running in test mode
 * Checks for common test environment indicators
 */
export const isTest: boolean = 
	import.meta.env.MODE === 'test' || 
	(typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');

/**
 * Detect if running on localhost
 * Works in both browser and server contexts
 */
export const isLocalhost: boolean = (() => {
	// Server-side detection
	if (typeof window === 'undefined') {
		// In server context, check various environment indicators
		if (typeof process !== 'undefined') {
			const host = process.env.HOST || process.env.HOSTNAME || '';
			return host.includes('localhost') || host.includes('127.0.0.1');
		}
		// If we can't determine server-side, assume localhost in dev mode
		return isDevelopment;
	}
	
	// Client-side detection
	const hostname = window.location.hostname;
	return hostname === 'localhost' || 
	       hostname === '127.0.0.1' || 
	       hostname === '[::1]' || // IPv6 localhost
	       hostname.startsWith('192.168.') || // Common local network
	       hostname.startsWith('10.') || // Private network
	       hostname.endsWith('.local'); // mDNS local domain
})();

/**
 * Check if reCAPTCHA should be bypassed
 * Returns true in development/localhost, false in production
 */
export function shouldBypassRecaptcha(): boolean {
	return isDevelopment || isLocalhost || isTest;
}

/**
 * Check if emails should be mocked (logged to console instead of sent)
 * Returns true in development/localhost, false in production
 */
export function shouldMockEmails(): boolean {
	return isDevelopment || isLocalhost || isTest;
}

/**
 * Check if test accounts should be available
 * Returns true in development/localhost, false in production
 */
export function shouldUseTestAccounts(): boolean {
	return isDevelopment || isLocalhost || isTest;
}

/**
 * Check if development UI components should be shown
 * Returns true in development/localhost, false in production
 */
export function shouldShowDevUI(): boolean {
	return isDevelopment || isLocalhost;
}

/**
 * Check if verbose development logging should be enabled
 * Returns true in development/localhost, false in production
 */
export function shouldEnableVerboseLogging(): boolean {
	return isDevelopment || isLocalhost;
}

/**
 * Get current environment name for logging
 */
export function getEnvironmentName(): string {
	if (isProduction) return 'production';
	if (isTest) return 'test';
	if (isDevelopment) return 'development';
	return 'unknown';
}

/**
 * Log environment information to console (dev mode only)
 */
export function logEnvironmentInfo(): void {
	if (!isDevelopment) return;
	
	console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('🌍 Environment Information');
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
	console.log('Environment:', getEnvironmentName());
	console.log('Development:', isDevelopment);
	console.log('Production:', isProduction);
	console.log('Test:', isTest);
	console.log('Localhost:', isLocalhost);
	console.log('\n🔧 Development Mode Features:');
	console.log('  - reCAPTCHA Bypass:', shouldBypassRecaptcha());
	console.log('  - Email Mocking:', shouldMockEmails());
	console.log('  - Test Accounts:', shouldUseTestAccounts());
	console.log('  - Dev UI:', shouldShowDevUI());
	console.log('  - Verbose Logging:', shouldEnableVerboseLogging());
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Type guard to ensure code only runs in development
 * Throws error in production to prevent accidental execution
 */
export function assertDevelopmentOnly(message: string = 'This code should only run in development'): void {
	if (isProduction) {
		throw new Error(`${message} (attempted in production)`);
	}
}

/**
 * Safe wrapper for development-only code
 * Executes callback only in development, silently skips in production
 */
export function runInDevelopmentOnly<T>(callback: () => T): T | undefined {
	if (isDevelopment || isLocalhost) {
		return callback();
	}
	return undefined;
}
