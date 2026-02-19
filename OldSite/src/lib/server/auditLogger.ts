// Site-wide audit logging system for Tributestream V1
import { adminDb } from './firebase';
import type { RequestEvent } from '@sveltejs/kit';

export interface AuditEvent {
	id?: string;
	timestamp: Date;
	uid: string;
	userEmail: string;
	userRole: 'admin' | 'owner' | 'funeral_director';
	action: AuditAction;
	resourceType: 'memorial' | 'user' | 'schedule' | 'payment' | 'system';
	resourceId: string;
	details: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
	success: boolean;
	errorMessage?: string;
}

export type AuditAction =
	// Memorial actions
	| 'memorial_created'
	| 'memorial_updated'
	| 'memorial_deleted'
	| 'memorial_viewed'
	// User actions
	| 'user_login'
	| 'user_logout'
	| 'user_created'
	| 'role_changed'
	// Schedule actions
	| 'schedule_updated'
	| 'schedule_locked'
	| 'payment_completed'
	| 'payment_failed'
	// Admin actions
	| 'funeral_director_auto_approved'
	| 'funeral_director_suspended'
	| 'admin_memorial_created'
	| 'system_config_changed'
	// Admin deletion actions (soft delete system)
	| 'admin_memorial_soft_deleted'
	| 'admin_memorial_delete_error'
	| 'admin_user_deleted'
	| 'admin_user_delete_error'
	| 'stream_soft_deleted'
	| 'resource_restored'
	| 'resource_permanent_delete'
	// API actions
	| 'api_access_denied'
	| 'api_error';

/**
 * Main audit logging function
 */
export async function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
	try {
		// Clean undefined values to prevent Firestore errors
		const cleanEvent = Object.fromEntries(
			Object.entries(event).map(([key, value]) => [
				key,
				value === undefined ? null : value
			])
		);

		const auditEvent: AuditEvent = {
			...cleanEvent,
			timestamp: new Date(),
			// Ensure required fields are never undefined
			errorMessage: cleanEvent.errorMessage || null,
			ipAddress: cleanEvent.ipAddress || null,
			userAgent: cleanEvent.userAgent || null
		};

		// Log to console for development
		console.log(
			`🔍 [AUDIT] ${auditEvent.action} by ${auditEvent.userEmail} (${auditEvent.userRole}) on ${auditEvent.resourceType}:${auditEvent.resourceId}`
		);

		// Save to Firestore
		await adminDb.collection('audit_logs').add(auditEvent);
	} catch (error) {
		console.error('❌ [AUDIT] Failed to log audit event:', error);
		// Don't throw - audit logging should not break the main flow
	}
}

/**
 * Extract user context from SvelteKit request event
 */
export function extractUserContext(
	event: RequestEvent
): Pick<AuditEvent, 'uid' | 'userEmail' | 'userRole' | 'ipAddress' | 'userAgent'> | null {
	if (!event.locals.user) {
		return null;
	}

	// Safely get client address with fallback
	let ipAddress = 'unknown';
	try {
		ipAddress = event.getClientAddress();
	} catch (error) {
		console.warn('⚠️ Could not determine client address:', error);
		// Try to get from headers as fallback
		ipAddress =
			event.request.headers.get('x-forwarded-for') ||
			event.request.headers.get('x-real-ip') ||
			'localhost';
	}

	return {
		uid: event.locals.user.uid,
		userEmail: event.locals.user.email || 'unknown',
		userRole: (event.locals.user.role as 'admin' | 'owner' | 'funeral_director') || 'owner',
		ipAddress,
		userAgent: event.request.headers.get('user-agent') || 'unknown'
	};
}

/**
 * Convenience function for logging memorial actions
 */
export async function logMemorialAction(
	userContext: ReturnType<typeof extractUserContext>,
	action: Extract<
		AuditAction,
		'memorial_created' | 'memorial_updated' | 'memorial_deleted' | 'memorial_viewed'
	>,
	memorialId: string,
	details: Record<string, any> = {},
	success: boolean = true,
	errorMessage?: string
): Promise<void> {
	if (!userContext) return;

	await logAuditEvent({
		...userContext,
		action,
		resourceType: 'memorial',
		resourceId: memorialId,
		details,
		success,
		errorMessage
	});
}

/**
 * Convenience function for logging user actions
 */
export async function logUserAction(
	userContext: ReturnType<typeof extractUserContext>,
	action: Extract<AuditAction, 'user_login' | 'user_logout' | 'user_created' | 'role_changed'>,
	targetUserId: string,
	details: Record<string, any> = {},
	success: boolean = true,
	errorMessage?: string
): Promise<void> {
	if (!userContext) return;

	await logAuditEvent({
		...userContext,
		action,
		resourceType: 'user',
		resourceId: targetUserId,
		details,
		success,
		errorMessage
	});
}

/**
 * Convenience function for logging admin actions
 */
export async function logAdminAction(
	userContext: ReturnType<typeof extractUserContext>,
	action: Extract<
		AuditAction,
		| 'funeral_director_auto_approved'
		| 'funeral_director_suspended'
		| 'admin_memorial_created'
		| 'system_config_changed'
	>,
	resourceId: string,
	details: Record<string, any> = {},
	success: boolean = true,
	errorMessage?: string
): Promise<void> {
	if (!userContext) return;

	await logAuditEvent({
		...userContext,
		action,
		resourceType: action.includes('funeral_director') ? 'user' : 'system',
		resourceId,
		details,
		success,
		errorMessage
	});
}

/**
 * Convenience function for logging schedule actions
 */
export async function logScheduleAction(
	userContext: ReturnType<typeof extractUserContext>,
	action: Extract<AuditAction, 'schedule_updated' | 'schedule_locked'>,
	memorialId: string,
	details: Record<string, any> = {},
	success: boolean = true,
	errorMessage?: string
): Promise<void> {
	if (!userContext) return;

	await logAuditEvent({
		...userContext,
		action,
		resourceType: 'schedule',
		resourceId: memorialId,
		details,
		success,
		errorMessage
	});
}

/**
 * Convenience function for logging payment actions
 */
export async function logPaymentAction(
	userContext: ReturnType<typeof extractUserContext>,
	action: Extract<AuditAction, 'payment_completed' | 'payment_failed'>,
	paymentId: string,
	details: Record<string, any> = {},
	success: boolean = true,
	errorMessage?: string
): Promise<void> {
	if (!userContext) return;

	await logAuditEvent({
		...userContext,
		action,
		resourceType: 'payment',
		resourceId: paymentId,
		details,
		success,
		errorMessage
	});
}

/**
 * Convenience function for logging API access denials
 */
export async function logAccessDenied(
	userContext: ReturnType<typeof extractUserContext>,
	resourceType: AuditEvent['resourceType'],
	resourceId: string,
	reason: string,
	details: Record<string, any> = {}
): Promise<void> {
	if (!userContext) return;

	await logAuditEvent({
		...userContext,
		action: 'api_access_denied',
		resourceType,
		resourceId,
		details: { reason, ...details },
		success: false,
		errorMessage: reason
	});
}
