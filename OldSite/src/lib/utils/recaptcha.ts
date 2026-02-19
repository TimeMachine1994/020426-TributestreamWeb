/**
 * reCAPTCHA v3 Utilities for Tributestream
 * Provides client and server-side reCAPTCHA verification functions
 */

import { env } from '$env/dynamic/public';
import { shouldBypassRecaptcha } from './environment';
import { devLog } from '$lib/config/dev-mode';

const PUBLIC_RECAPTCHA_SITE_KEY = env.PUBLIC_RECAPTCHA_SITE_KEY;

// reCAPTCHA v3 score thresholds
export const RECAPTCHA_THRESHOLDS = {
	HIGH_SECURITY: 0.7,    // For registration, memorial creation
	MEDIUM_SECURITY: 0.5,  // For contact forms, demo booking
	LOW_SECURITY: 0.3      // For search, newsletter signup
} as const;

/**
 * Dynamically load reCAPTCHA script
 */
async function loadRecaptchaScript(): Promise<void> {
	if (typeof window === 'undefined') return;
	
	// Skip if already loaded
	if (window.grecaptcha) return;
	
	// Skip if site key is not configured
	if (!PUBLIC_RECAPTCHA_SITE_KEY || PUBLIC_RECAPTCHA_SITE_KEY === 'your_site_key_here') {
		console.warn('reCAPTCHA site key not configured, skipping script loading');
		return;
	}

	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = `https://www.google.com/recaptcha/api.js?render=${PUBLIC_RECAPTCHA_SITE_KEY}`;
		script.async = true;
		script.defer = true;
		
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
		
		document.head.appendChild(script);
	});
}

/**
 * Client-side: Execute reCAPTCHA and get token
 */
export async function executeRecaptcha(action: string): Promise<string | null> {
	if (typeof window === 'undefined') {
		console.error('executeRecaptcha called on server side');
		return null;
	}

	// DEV MODE BYPASS: Return mock token in development
	if (shouldBypassRecaptcha()) {
		devLog.bypass('reCAPTCHA', `Client-side execution bypassed for action: ${action}`);
		return 'dev-mode-mock-token';
	}

	// Skip reCAPTCHA if site key is not configured
	if (!PUBLIC_RECAPTCHA_SITE_KEY || PUBLIC_RECAPTCHA_SITE_KEY === 'your_site_key_here') {
		console.warn('reCAPTCHA site key not configured, skipping verification');
		return null;
	}

	try {
		// Load reCAPTCHA script if not already loaded
		await loadRecaptchaScript();

		// Wait for reCAPTCHA to be ready with timeout
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('reCAPTCHA loading timeout'));
			}, 10000); // 10 second timeout

			const checkReady = () => {
				if (window.grecaptcha && window.grecaptcha.ready) {
					clearTimeout(timeout);
					window.grecaptcha.ready(() => resolve());
				} else {
					setTimeout(checkReady, 100);
				}
			};
			checkReady();
		});

		// Execute reCAPTCHA with timeout
		const token = await Promise.race([
			window.grecaptcha.execute(PUBLIC_RECAPTCHA_SITE_KEY, { action }),
			new Promise<never>((_, reject) => 
				setTimeout(() => reject(new Error('reCAPTCHA execution timeout')), 5000)
			)
		]);
		
		return token;
	} catch (error) {
		console.error('reCAPTCHA execution failed:', error);
		return null;
	}
}

/**
 * Server-side: Verify reCAPTCHA token
 */
export async function verifyRecaptcha(
	token: string,
	action: string,
	threshold: number = 0.5
): Promise<{
	success: boolean;
	score?: number;
	action: string;
	error?: string;
}> {
	// DEV MODE BYPASS: Always return success in development
	if (shouldBypassRecaptcha()) {
		devLog.bypass('reCAPTCHA', `Server-side verification bypassed for action: ${action}`);
		return {
			success: true,
			score: 1.0,
			action: action
		};
	}

	// Note: This function should only be called server-side
	// The secret key should be accessed via process.env in server context
	const secretKey = process.env.RECAPTCHA_SECRET_KEY;

	if (!secretKey) {
		console.error('[RECAPTCHA] Secret key not configured');
		return {
			success: false,
			score: 0,
			action: '',
			error: 'reCAPTCHA not configured',
		};
	}

	try {
		const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				secret: secretKey,
				response: token,
			}),
		});

		const result = await response.json();

		if (!result.success) {
			return { 
				success: false,
				action,
				error: `reCAPTCHA verification failed: ${result['error-codes']?.join(', ') || 'Unknown error'}` 
			};
		}

		// Check action matches
		if (result.action !== action) {
			return { 
				success: false,
				action,
				error: `Action mismatch: expected ${action}, got ${result.action}` 
			};
		}

		// Check score threshold
		const score = result.score || 0;
		if (score < threshold) {
			return { 
				success: false,
				action,
				score,
				error: `Score too low: ${score} < ${threshold}` 
			};
		}

		return { success: true, action, score };
	} catch (error) {
		console.error('reCAPTCHA verification error:', error);
		return { success: false, action, error: 'Verification request failed' };
	}
}

/**
 * reCAPTCHA actions used throughout the application
 */
export const RECAPTCHA_ACTIONS = {
	REGISTER_OWNER: 'register_owner',
	REGISTER_VIEWER: 'register_viewer',
	REGISTER_ADMIN: 'register_admin',
	REGISTER_FUNERAL_DIRECTOR: 'register_funeral_director',
	CREATE_MEMORIAL: 'create_memorial',
	CONTACT_FORM: 'contact_form',
	BOOK_DEMO: 'book_demo',
	LOGIN: 'login',
	SEARCH: 'search'
} as const;

/**
 * Get appropriate score threshold for an action
 */
export function getScoreThreshold(action: string): number {
	switch (action) {
		case RECAPTCHA_ACTIONS.REGISTER_OWNER:
		case RECAPTCHA_ACTIONS.REGISTER_VIEWER:
		case RECAPTCHA_ACTIONS.REGISTER_ADMIN:
		case RECAPTCHA_ACTIONS.REGISTER_FUNERAL_DIRECTOR:
		case RECAPTCHA_ACTIONS.CREATE_MEMORIAL:
			return RECAPTCHA_THRESHOLDS.HIGH_SECURITY;
		
		case RECAPTCHA_ACTIONS.CONTACT_FORM:
		case RECAPTCHA_ACTIONS.BOOK_DEMO:
		case RECAPTCHA_ACTIONS.LOGIN:
			return RECAPTCHA_THRESHOLDS.MEDIUM_SECURITY;
		
		case RECAPTCHA_ACTIONS.SEARCH:
		default:
			return RECAPTCHA_THRESHOLDS.LOW_SECURITY;
	}
}

// Type declarations for window.grecaptcha
declare global {
	interface Window {
		grecaptcha: {
			ready: (callback: () => void) => void;
			execute: (siteKey: string, options: { action: string }) => Promise<string>;
		};
	}
}
