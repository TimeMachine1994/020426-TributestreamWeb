/**
 * Centralized error handling utilities for the role-based portal system
 */

export interface ErrorContext {
	component?: string;
	action?: string;
	uid?: string;
	memorialId?: string;
	role?: string;
	timestamp?: string;
	userAgent?: string;
	url?: string;
}

export interface AppError {
	code: string;
	message: string;
	details?: any;
	context?: ErrorContext;
	recoverable?: boolean;
}

/**
 * Standard error codes for the application
 */
export const ErrorCodes = {
	// Authentication & Authorization
	AUTH_REQUIRED: 'AUTH_REQUIRED',
	INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
	INVALID_ROLE: 'INVALID_ROLE',

	// Memorial Access
	MEMORIAL_NOT_FOUND: 'MEMORIAL_NOT_FOUND',
	MEMORIAL_ACCESS_DENIED: 'MEMORIAL_ACCESS_DENIED',
	INVITATION_REQUIRED: 'INVITATION_REQUIRED',

	// Data Operations
	SAVE_FAILED: 'SAVE_FAILED',
	LOAD_FAILED: 'LOAD_FAILED',
	VALIDATION_ERROR: 'VALIDATION_ERROR',

	// Network & External Services
	NETWORK_ERROR: 'NETWORK_ERROR',
	FIREBASE_ERROR: 'FIREBASE_ERROR',

	// General
	UNKNOWN_ERROR: 'UNKNOWN_ERROR',
	TIMEOUT_ERROR: 'TIMEOUT_ERROR'
} as const;

/**
 * User-friendly error messages
 */
export const ErrorMessages = {
	[ErrorCodes.AUTH_REQUIRED]: 'Please sign in to continue',
	[ErrorCodes.INSUFFICIENT_PERMISSIONS]: "You don't have permission to perform this action",
	[ErrorCodes.INVALID_ROLE]: 'Your account role is not recognized',
	[ErrorCodes.MEMORIAL_NOT_FOUND]: 'Memorial not found or no longer available',
	[ErrorCodes.MEMORIAL_ACCESS_DENIED]: "You don't have access to this memorial",
	[ErrorCodes.INVITATION_REQUIRED]: 'You need an invitation to access this memorial',
	[ErrorCodes.SAVE_FAILED]: 'Failed to save changes. Please try again',
	[ErrorCodes.LOAD_FAILED]: 'Failed to load data. Please refresh the page',
	[ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again',
	[ErrorCodes.NETWORK_ERROR]: 'Network connection issue. Please check your internet',
	[ErrorCodes.FIREBASE_ERROR]: 'Database connection issue. Please try again',
	[ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred',
	[ErrorCodes.TIMEOUT_ERROR]: 'Request timed out. Please try again'
} as const;

/**
 * Create a standardized application error
 */
export function createAppError(
	code: keyof typeof ErrorCodes,
	details?: any,
	context?: ErrorContext
): AppError {
	return {
		code,
		message: ErrorMessages[code],
		details,
		context: {
			timestamp: new Date().toISOString(),
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
			url: typeof window !== 'undefined' ? window.location.href : undefined,
			...context
		},
		recoverable: isRecoverableError(code)
	};
}

/**
 * Determine if an error is recoverable (user can retry)
 */
function isRecoverableError(code: keyof typeof ErrorCodes): boolean {
	const recoverableErrors: (keyof typeof ErrorCodes)[] = [
		'NETWORK_ERROR',
		'FIREBASE_ERROR',
		'SAVE_FAILED',
		'LOAD_FAILED',
		'TIMEOUT_ERROR'
	];

	return recoverableErrors.includes(code);
}

/**
 * Handle Firebase errors and convert to app errors
 */
export function handleFirebaseError(error: any, context?: ErrorContext): AppError {
	console.error('Firebase error:', error);

	// Map Firebase error codes to app error codes
	const firebaseErrorMap: Record<string, keyof typeof ErrorCodes> = {
		'permission-denied': ErrorCodes.INSUFFICIENT_PERMISSIONS,
		'not-found': ErrorCodes.MEMORIAL_NOT_FOUND,
		unauthenticated: ErrorCodes.AUTH_REQUIRED,
		unavailable: ErrorCodes.FIREBASE_ERROR,
		'deadline-exceeded': ErrorCodes.TIMEOUT_ERROR
	};

	const appErrorCode = firebaseErrorMap[error.code] || ErrorCodes.FIREBASE_ERROR;

	return createAppError(
		appErrorCode,
		{
			firebaseCode: error.code,
			firebaseMessage: error.message
		},
		context
	);
}

/**
 * Handle network/fetch errors
 */
export function handleNetworkError(error: any, context?: ErrorContext): AppError {
	console.error('Network error:', error);

	if (error.name === 'AbortError') {
		return createAppError(ErrorCodes.TIMEOUT_ERROR, error, context);
	}

	return createAppError(
		ErrorCodes.NETWORK_ERROR,
		{
			networkError: error.message,
			status: error.status
		},
		context
	);
}

/**
 * Handle validation errors
 */
export function handleValidationError(
	errors: Record<string, string>,
	context?: ErrorContext
): AppError {
	return createAppError(
		ErrorCodes.VALIDATION_ERROR,
		{
			validationErrors: errors
		},
		context
	);
}

/**
 * Log error for monitoring and debugging
 */
export function logError(error: AppError): void {
	// In production, send to error monitoring service (Sentry, LogRocket, etc.)
	console.error('Application Error:', {
		code: error.code,
		message: error.message,
		details: error.details,
		context: error.context
	});

	// Example: Send to external monitoring service
	// if (import.meta.env.PROD) {
	//   Sentry.captureException(new Error(error.message), {
	//     tags: { errorCode: error.code },
	//     extra: { details: error.details, context: error.context }
	//   });
	// }
}

/**
 * Show user-friendly error notification
 */
export function showErrorNotification(error: AppError): void {
	// This would integrate with your notification system
	console.warn('User notification:', error.message);

	// Example: Show toast notification
	// toast.error(error.message, {
	//   action: error.recoverable ? {
	//     label: 'Retry',
	//     onClick: () => window.location.reload()
	//   } : undefined
	// });
}

/**
 * Comprehensive error handler that logs and notifies
 */
export function handleError(error: any, context?: ErrorContext): AppError {
	let appError: AppError;

	// Convert different error types to AppError
	if (error.code && ErrorMessages[error.code as keyof typeof ErrorCodes]) {
		// Already an app error
		appError = error as AppError;
	} else if (error.code && error.code.startsWith('auth/')) {
		// Firebase Auth error
		appError = handleFirebaseError(error, context);
	} else if (
		error.code &&
		(error.code.startsWith('firestore/') || error.code.startsWith('functions/'))
	) {
		// Firebase Firestore/Functions error
		appError = handleFirebaseError(error, context);
	} else if (error.name === 'TypeError' && error.message.includes('fetch')) {
		// Network error
		appError = handleNetworkError(error, context);
	} else {
		// Unknown error
		appError = createAppError(
			ErrorCodes.UNKNOWN_ERROR,
			{
				originalError: error.message,
				stack: error.stack
			},
			context
		);
	}

	// Log error
	logError(appError);

	// Show user notification
	showErrorNotification(appError);

	return appError;
}

/**
 * Async wrapper that handles errors automatically
 */
export async function withErrorHandling<T>(
	operation: () => Promise<T>,
	context?: ErrorContext
): Promise<T | null> {
	try {
		return await operation();
	} catch (error) {
		handleError(error, context);
		return null;
	}
}

/**
 * Role-specific error messages
 */
export function getRoleSpecificErrorMessage(error: AppError, userRole: string): string {
	const roleMessages: Record<string, Record<string, string>> = {
		viewer: {
			[ErrorCodes.MEMORIAL_ACCESS_DENIED]:
				'This memorial is private. You need to follow it or receive an invitation to view it.',
			[ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Viewers can only view memorials, not edit them.'
		},
		family_member: {
			[ErrorCodes.INVITATION_REQUIRED]:
				'You need an invitation from the memorial owner to access this memorial.',
			[ErrorCodes.INSUFFICIENT_PERMISSIONS]:
				'You can view and add photos, but cannot edit memorial details.'
		},
		funeral_director: {
			[ErrorCodes.MEMORIAL_ACCESS_DENIED]:
				'You can only access memorials that have been assigned to you.',
			[ErrorCodes.INSUFFICIENT_PERMISSIONS]:
				'You can manage assigned memorials but cannot access others.'
		},
		owner: {
			[ErrorCodes.INSUFFICIENT_PERMISSIONS]:
				'As the memorial owner, you should have full access. Please contact support.'
		}
	};

	return roleMessages[userRole]?.[error.code] || error.message;
}
