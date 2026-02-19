import { adminAuth } from '$lib/server/firebase';

/**
 * Check if an email address already exists in Firebase Auth
 * @param email - Email address to check
 * @returns Promise<boolean> - true if email exists, false if available
 */
export async function checkEmailExists(email: string): Promise<boolean> {
	try {
		await adminAuth.getUserByEmail(email);
		return true; // Email exists
	} catch (error: any) {
		if (error.code === 'auth/user-not-found') {
			return false; // Email available
		}
		// Re-throw other errors (network issues, etc.)
		throw error;
	}
}

/**
 * Get standardized error message for duplicate email
 * @param email - The duplicate email address
 * @returns Consistent error message across all registration flows
 */
export function getStandardEmailExistsMessage(email: string): string {
	return `An account with email ${email} already exists. Please use a different email or sign in to your existing account.`;
}

/**
 * Validate email format using regex
 * @param email - Email address to validate
 * @returns boolean - true if valid format
 */
export function isValidEmailFormat(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Comprehensive email validation (format + existence check)
 * @param email - Email address to validate
 * @returns Promise<{isValid: boolean, error?: string, field?: string}>
 */
export async function validateEmail(email: string, fieldName = 'email'): Promise<{
	isValid: boolean;
	error?: string;
	field?: string;
}> {
	// Check format first (fast)
	if (!isValidEmailFormat(email)) {
		return {
			isValid: false,
			error: 'Please enter a valid email address.',
			field: fieldName
		};
	}

	// Check if email already exists (API call)
	try {
		const exists = await checkEmailExists(email);
		if (exists) {
			return {
				isValid: false,
				error: getStandardEmailExistsMessage(email),
				field: fieldName
			};
		}

		return { isValid: true };
	} catch (error) {
		console.error('Email validation error:', error);
		// Network or other errors - allow registration to proceed but log error
		return {
			isValid: false,
			error: 'Unable to verify email availability. Please try again.',
			field: fieldName
		};
	}
}

/**
 * Validate multiple emails in a registration form
 * @param emails - Array of {email: string, fieldName: string} objects
 * @returns Promise<{isValid: boolean, errors: Array<{field: string, error: string}>}>
 */
export async function validateMultipleEmails(emails: Array<{email: string, fieldName: string}>): Promise<{
	isValid: boolean;
	errors: Array<{field: string, error: string}>;
}> {
	const errors: Array<{field: string, error: string}> = [];
	
	for (const {email, fieldName} of emails) {
		if (email && email.trim()) { // Only validate if email is provided
			const result = await validateEmail(email.trim(), fieldName);
			if (!result.isValid && result.error && result.field) {
				errors.push({
					field: result.field,
					error: result.error
				});
			}
		}
	}
	
	return {
		isValid: errors.length === 0,
		errors
	};
}
