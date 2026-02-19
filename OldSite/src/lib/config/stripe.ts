import { dev } from '$app/environment';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

// Get Stripe key from environment or browser globals
function getStripePublishableKey(): string {
	const PUBLIC_STRIPE_PUBLISHABLE_KEY = env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
	
	// Debug logging
	console.log('🔍 Checking for Stripe key...');
	console.log(
		'PUBLIC_STRIPE_PUBLISHABLE_KEY from $env/dynamic/public:',
		PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Found' : 'Not found'
	);

	// First try SvelteKit's environment system
	if (PUBLIC_STRIPE_PUBLISHABLE_KEY) {
		console.log('✅ Using Stripe key from $env/dynamic/public');
		return PUBLIC_STRIPE_PUBLISHABLE_KEY;
	}

	// Try to get from process.env as fallback
	if (typeof process !== 'undefined' && process.env?.PUBLIC_STRIPE_PUBLISHABLE_KEY) {
		console.log('✅ Using Stripe key from process.env');
		return process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY;
	}

	// In browser, try to get from window object (set by server)
	if (browser && typeof window !== 'undefined') {
		const key = (window as any).__STRIPE_PUBLISHABLE_KEY__;
		if (key) {
			console.log('✅ Using Stripe key from window object');
			return key;
		}
	}

	// Fallback for development - return empty to force proper configuration
	console.log('❌ No Stripe key found, using empty string');
	return '';
}

// Stripe configuration with environment variable handling
export const stripeConfig = {
	publishableKey: getStripePublishableKey(),

	// Stripe Elements appearance configuration
	appearance: {
		theme: 'stripe' as const,
		variables: {
			colorPrimary: '#f59e0b',
			colorBackground: '#ffffff',
			colorText: '#1f2937',
			colorDanger: '#ef4444',
			fontFamily: 'system-ui, sans-serif',
			spacingUnit: '4px',
			borderRadius: '8px'
		}
	},

	// Card element styling
	cardElementOptions: {
		style: {
			base: {
				fontSize: '16px',
				color: '#1f2937',
				'::placeholder': {
					color: '#9ca3af'
				}
			},
			invalid: {
				color: '#ef4444'
			}
		}
	}
};

// Validation function for Stripe configuration
export function validateStripeConfig(): { isValid: boolean; error?: string } {
	if (!stripeConfig.publishableKey) {
		return {
			isValid: false,
			error:
				'Stripe publishable key is not configured. Please set PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.'
		};
	}

	if (dev && stripeConfig.publishableKey === 'pk_test_development_key_placeholder') {
		return {
			isValid: false,
			error: 'Please configure your Stripe test publishable key in the environment variables.'
		};
	}

	if (!dev && !stripeConfig.publishableKey.startsWith('pk_live_')) {
		console.warn('⚠️ Using test Stripe key in production environment');
	}

	return { isValid: true };
}
