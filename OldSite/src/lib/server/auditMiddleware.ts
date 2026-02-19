// Audit middleware for automatic logging of API requests
import type { Handle } from '@sveltejs/kit';
import { extractUserContext, logAuditEvent, logAccessDenied } from './auditLogger';

/**
 * Middleware to automatically log API requests and responses
 */
export const auditMiddleware: Handle = async ({ event, resolve }) => {
	const startTime = Date.now();
	const userContext = extractUserContext(event);

	// Only log API routes and authenticated actions
	const isApiRoute = event.url.pathname.startsWith('/api/');
	const isAuthenticatedRoute =
		event.url.pathname.startsWith('/admin') ||
		event.url.pathname.startsWith('/profile') ||
		event.url.pathname.startsWith('/schedule');

	if (!isApiRoute && !isAuthenticatedRoute) {
		return resolve(event);
	}

	let response: Response | undefined;
	let error: Error | null = null;

	try {
		response = await resolve(event);
	} catch (e) {
		error = e as Error;
		throw e;
	} finally {
		// Log the request if user is authenticated
		if (userContext && (isApiRoute || isAuthenticatedRoute)) {
			const duration = Date.now() - startTime;
			const success = !error && (!response || response.status < 400);

			// Determine action based on route and method
			const action = determineAuditAction(event.url.pathname, event.request.method);
			const resourceInfo = extractResourceInfo(event.url.pathname);

			if (action) {
				await logAuditEvent({
					...userContext,
					action: action as any, // Type assertion for audit action
					resourceType: resourceInfo.type,
					resourceId: resourceInfo.id,
					details: {
						method: event.request.method,
						path: event.url.pathname,
						duration,
						statusCode: response?.status,
						...(event.request.method === 'POST' && { hasBody: true })
					},
					success,
					...(error?.message && { errorMessage: error.message })
				});
			}

			// Log access denied specifically
			if (response?.status === 403 && userContext) {
				await logAccessDenied(userContext, resourceInfo.type, resourceInfo.id, 'Access denied', {
					method: event.request.method,
					path: event.url.pathname,
					statusCode: response.status
				});
			}
		}
	}

	return response!;
};

/**
 * Determine audit action based on route and HTTP method
 */
function determineAuditAction(pathname: string, method: string): string | null {
	// Memorial routes
	if (pathname.includes('/memorials/')) {
		if (method === 'POST' && pathname.endsWith('/memorials')) return 'memorial_created';
		if (method === 'PUT' || method === 'PATCH') return 'memorial_updated';
		if (method === 'DELETE') return 'memorial_deleted';
		if (method === 'GET') return 'memorial_viewed';
	}

	// Schedule routes
	if (pathname.includes('/schedule')) {
		if (method === 'POST' || method === 'PUT' || method === 'PATCH') return 'schedule_updated';
	}

	// Payment routes
	if (pathname.includes('/payment') || pathname.includes('/create-payment-intent')) {
		if (method === 'POST') return 'payment_completed';
	}

	// Admin routes
	if (pathname.includes('/admin/')) {
		if (pathname.includes('create-memorial')) return 'admin_memorial_created';
	}

	// User routes
	if (pathname.includes('/register') || pathname.includes('/create-user')) {
		if (method === 'POST') return 'user_created';
	}

	if (pathname.includes('/set-role-claim')) {
		if (method === 'POST') return 'role_changed';
	}

	// Session routes
	if (pathname.includes('/session')) {
		if (method === 'POST') return 'session_created';
	}

	// Generic API access for other routes
	if (pathname.startsWith('/api/')) {
		return 'api_accessed'; // Generic API access logging
	}

	return null;
}

/**
 * Extract resource type and ID from pathname
 */
function extractResourceInfo(pathname: string): {
	type: 'memorial' | 'user' | 'schedule' | 'payment' | 'system';
	id: string;
} {
	// Extract memorial ID from various routes
	const memorialMatch = pathname.match(/\/memorials\/([^\/]+)/);
	if (memorialMatch) {
		return { type: 'memorial', id: memorialMatch[1] };
	}

	// Extract schedule memorial ID
	const scheduleMatch = pathname.match(/\/schedule\/([^\/]+)/);
	if (scheduleMatch) {
		return { type: 'schedule', id: scheduleMatch[1] };
	}

	// Extract user ID from admin routes
	const userMatch =
		pathname.match(/\/(approve|reject)-funeral-director/) || pathname.match(/\/users\/([^\/]+)/);
	if (userMatch || pathname.includes('funeral-director') || pathname.includes('/register')) {
		return { type: 'user', id: 'unknown' };
	}

	// Payment routes
	if (pathname.includes('payment')) {
		return { type: 'payment', id: 'unknown' };
	}

	// Default to system
	return { type: 'system', id: pathname };
}
