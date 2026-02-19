/**
 * Environment Detection Tests
 * 
 * Tests for environment.ts utility functions
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Environment Detection', () => {
	
	describe('Environment Flags', () => {
		it('should have valid environment flags', async () => {
			const { isDevelopment, isProduction, isTest } = await import('./environment');
			
			// At least one should be true
			expect(isDevelopment || isProduction || isTest).toBe(true);
			
			// They should be booleans
			expect(typeof isDevelopment).toBe('boolean');
			expect(typeof isProduction).toBe('boolean');
			expect(typeof isTest).toBe('boolean');
		});
	});
	
	describe('Helper Functions', () => {
		it('shouldBypassRecaptcha returns boolean', async () => {
			const { shouldBypassRecaptcha } = await import('./environment');
			expect(typeof shouldBypassRecaptcha()).toBe('boolean');
		});
		
		it('shouldMockEmails returns boolean', async () => {
			const { shouldMockEmails } = await import('./environment');
			expect(typeof shouldMockEmails()).toBe('boolean');
		});
		
		it('shouldUseTestAccounts returns boolean', async () => {
			const { shouldUseTestAccounts } = await import('./environment');
			expect(typeof shouldUseTestAccounts()).toBe('boolean');
		});
		
		it('shouldShowDevUI returns boolean', async () => {
			const { shouldShowDevUI } = await import('./environment');
			expect(typeof shouldShowDevUI()).toBe('boolean');
		});
		
		it('getEnvironmentName returns valid environment', async () => {
			const { getEnvironmentName } = await import('./environment');
			const validEnvironments = ['development', 'production', 'test', 'unknown'];
			expect(validEnvironments).toContain(getEnvironmentName());
		});
	});
	
	describe('Development Mode Functions', () => {
		it('assertDevelopmentOnly should not throw in test mode', async () => {
			const { assertDevelopmentOnly, isProduction } = await import('./environment');
			
			if (!isProduction) {
				expect(() => assertDevelopmentOnly()).not.toThrow();
			}
		});
		
		it('runInDevelopmentOnly executes callback in dev mode', async () => {
			const { runInDevelopmentOnly, isDevelopment, isLocalhost } = await import('./environment');
			
			let callbackExecuted = false;
			const result = runInDevelopmentOnly(() => {
				callbackExecuted = true;
				return 'test-value';
			});
			
			if (isDevelopment || isLocalhost) {
				expect(callbackExecuted).toBe(true);
				expect(result).toBe('test-value');
			} else {
				expect(callbackExecuted).toBe(false);
				expect(result).toBeUndefined();
			}
		});
	});
});

describe('Dev Mode Configuration', () => {
	
	describe('Test Accounts', () => {
		it('should have valid test accounts', async () => {
			const { DEV_TEST_ACCOUNTS } = await import('$lib/config/dev-mode');
			
			expect(Array.isArray(DEV_TEST_ACCOUNTS)).toBe(true);
			expect(DEV_TEST_ACCOUNTS.length).toBeGreaterThan(0);
			
			DEV_TEST_ACCOUNTS.forEach(account => {
				expect(account).toHaveProperty('email');
				expect(account).toHaveProperty('password');
				expect(account).toHaveProperty('role');
				expect(account).toHaveProperty('displayName');
				expect(account.email).toContain('@dev.test');
			});
		});
		
		it('should have all required roles', async () => {
			const { DEV_TEST_ACCOUNTS } = await import('$lib/config/dev-mode');
			
			const roles = DEV_TEST_ACCOUNTS.map(a => a.role);
			expect(roles).toContain('admin');
			expect(roles).toContain('owner');
			expect(roles).toContain('funeral_director');
			expect(roles).toContain('viewer');
		});
		
		it('getTestAccountByRole should return correct account', async () => {
			const { getTestAccountByRole } = await import('$lib/config/dev-mode');
			
			const adminAccount = getTestAccountByRole('admin');
			expect(adminAccount).toBeDefined();
			expect(adminAccount?.role).toBe('admin');
			expect(adminAccount?.email).toContain('@dev.test');
		});
		
		it('getTestAccountByEmail should return correct account', async () => {
			const { getTestAccountByEmail } = await import('$lib/config/dev-mode');
			
			const account = getTestAccountByEmail('admin@dev.test');
			expect(account).toBeDefined();
			expect(account?.role).toBe('admin');
		});
		
		it('isTestAccountEmail should correctly identify test accounts', async () => {
			const { isTestAccountEmail } = await import('$lib/config/dev-mode');
			
			expect(isTestAccountEmail('admin@dev.test')).toBe(true);
			expect(isTestAccountEmail('user@example.com')).toBe(false);
		});
	});
	
	describe('Configuration', () => {
		it('should have valid dev mode config', async () => {
			const { DEV_MODE_CONFIG } = await import('$lib/config/dev-mode');
			
			expect(typeof DEV_MODE_CONFIG.bypassRecaptcha).toBe('boolean');
			expect(typeof DEV_MODE_CONFIG.mockEmails).toBe('boolean');
			expect(typeof DEV_MODE_CONFIG.useTestAccounts).toBe('boolean');
			expect(typeof DEV_MODE_CONFIG.showDevBanner).toBe('boolean');
			expect(typeof DEV_MODE_CONFIG.verboseLogging).toBe('boolean');
		});
		
		it('getActiveBypasses should return array of strings', async () => {
			const { getActiveBypasses } = await import('$lib/config/dev-mode');
			
			const bypasses = getActiveBypasses();
			expect(Array.isArray(bypasses)).toBe(true);
			bypasses.forEach(bypass => {
				expect(typeof bypass).toBe('string');
			});
		});
		
		it('getDevModeSummary should return valid summary', async () => {
			const { getDevModeSummary } = await import('$lib/config/dev-mode');
			
			const summary = getDevModeSummary();
			expect(summary).toHaveProperty('environment');
			expect(summary).toHaveProperty('localhost');
			expect(summary).toHaveProperty('activeBypasses');
			expect(summary).toHaveProperty('testAccountsCount');
			expect(summary).toHaveProperty('config');
		});
	});
	
	describe('Logging Helpers', () => {
		it('devLog should have all required methods', async () => {
			const { devLog } = await import('$lib/config/dev-mode');
			
			expect(typeof devLog.info).toBe('function');
			expect(typeof devLog.success).toBe('function');
			expect(typeof devLog.warning).toBe('function');
			expect(typeof devLog.error).toBe('function');
			expect(typeof devLog.bypass).toBe('function');
			expect(typeof devLog.mock).toBe('function');
			expect(typeof devLog.debug).toBe('function');
		});
	});
});
