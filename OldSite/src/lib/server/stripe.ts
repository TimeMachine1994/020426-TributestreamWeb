import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

let stripeInstance: Stripe | null = null;

function getStripeClient(): Stripe {
	if (!stripeInstance) {
		const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
		if (!STRIPE_SECRET_KEY) {
			throw new Error('STRIPE_SECRET_KEY environment variable is not set');
		}
		stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
			apiVersion: '2025-08-27.basil'
		});
	}
	return stripeInstance;
}

// Export a lazy-initialized stripe instance
export const stripe = new Proxy({} as Stripe, {
	get(target, prop) {
		const client = getStripeClient();
		const value = client[prop as keyof Stripe];
		if (typeof value === 'function') {
			return value.bind(client);
		}
		return value;
	}
});
