// Payment status checking and management utilities

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface PaymentStatusResult {
	status: PaymentStatus;
	paymentIntentId?: string;
	error?: string;
	canRetry?: boolean;
}

// Check payment status from Stripe
export async function checkPaymentStatus(paymentIntentId: string): Promise<PaymentStatusResult> {
	try {
		const response = await fetch('/api/check-payment-status', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ paymentIntentId })
		});

		const result = await response.json();

		if (!response.ok) {
			return {
				status: 'failed',
				error: result.error || 'Failed to check payment status',
				canRetry: true
			};
		}

		return result;
	} catch (error) {
		console.error('Payment status check failed:', error);
		return {
			status: 'failed',
			error: 'Network error while checking payment status',
			canRetry: true
		};
	}
}

// Retry payment with exponential backoff
export async function retryPayment(
	retryFunction: () => Promise<any>,
	maxRetries: number = 3,
	baseDelay: number = 1000
): Promise<any> {
	let lastError: Error;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await retryFunction();
		} catch (error) {
			lastError = error as Error;

			if (attempt === maxRetries - 1) {
				throw lastError;
			}

			// Exponential backoff: 1s, 2s, 4s
			const delay = baseDelay * Math.pow(2, attempt);
			await new Promise((resolve) => setTimeout(resolve, delay));

			console.log(`Payment retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
		}
	}

	throw lastError!;
}

// Get user-friendly error messages
export function getPaymentErrorMessage(error: any): string {
	if (typeof error === 'string') {
		return error;
	}

	const errorCode = error?.code || error?.type;
	const errorMessage = error?.message || '';

	// Stripe-specific error handling
	switch (errorCode) {
		case 'card_declined':
			return 'Your card was declined. Please try a different payment method or contact your bank.';

		case 'expired_card':
			return 'Your card has expired. Please use a different card.';

		case 'incorrect_cvc':
			return 'The security code (CVC) you entered is incorrect. Please check and try again.';

		case 'processing_error':
			return 'There was an error processing your payment. Please try again in a few moments.';

		case 'insufficient_funds':
			return 'Your card has insufficient funds. Please try a different payment method.';

		case 'authentication_required':
			return 'Your bank requires additional authentication. Please complete the verification and try again.';

		case 'network_error':
			return 'Network connection error. Please check your internet connection and try again.';

		default:
			// Generic error messages
			if (errorMessage.toLowerCase().includes('network')) {
				return 'Connection error. Please check your internet and try again.';
			}

			if (errorMessage.toLowerCase().includes('timeout')) {
				return 'Request timed out. Please try again.';
			}

			return errorMessage || 'An unexpected error occurred. Please try again or contact support.';
	}
}

// Validate payment amount
export function validatePaymentAmount(amount: number): { isValid: boolean; error?: string } {
	if (!amount || amount <= 0) {
		return { isValid: false, error: 'Invalid payment amount' };
	}

	if (amount < 0.5) {
		return { isValid: false, error: 'Payment amount must be at least $0.50' };
	}

	if (amount > 999999.99) {
		return { isValid: false, error: 'Payment amount exceeds maximum limit' };
	}

	return { isValid: true };
}

// Format payment status for display
export function formatPaymentStatus(status: PaymentStatus): {
	text: string;
	color: string;
	icon: string;
} {
	switch (status) {
		case 'pending':
			return { text: 'Pending', color: 'text-yellow-600', icon: '⏳' };

		case 'processing':
			return { text: 'Processing', color: 'text-blue-600', icon: '🔄' };

		case 'succeeded':
			return { text: 'Completed', color: 'text-green-600', icon: '✅' };

		case 'failed':
			return { text: 'Failed', color: 'text-red-600', icon: '❌' };

		case 'canceled':
			return { text: 'Canceled', color: 'text-gray-600', icon: '🚫' };

		default:
			return { text: 'Unknown', color: 'text-gray-600', icon: '❓' };
	}
}
