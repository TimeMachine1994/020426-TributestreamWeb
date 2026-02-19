/**
 * ADMIN PERMISSION SYSTEM
 * 
 * 5-tier role-based access control (RBAC) for admin operations
 * Based on ADMIN_REFACTOR_3_SAFETY.md
 */

export interface Permission {
	resource: 'memorial' | 'stream' | 'user' | 'funeral_director' | 'blog' | 'audit_log' | 'system' | '*';
	action: 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export' | '*';
	scope?: 'own' | 'team' | 'all';
	conditions?: PermissionCondition[];
}

export interface PermissionCondition {
	field: string;
	operator: 'eq' | 'ne' | 'in' | 'gt' | 'gte' | 'lt' | 'lte';
	value: any;
}

export interface Role {
	id: string;
	name: string;
	description: string;
	permissions: Permission[];
	inherits?: string[];
}

export interface AdminUser {
	uid: string;
	email: string;
	adminRole?: string;
	[key: string]: any;
}

/**
 * 5-Tier Admin Role Hierarchy
 */
export const ADMIN_ROLES: Record<string, Role> = {
	// Level 1: Full System Access
	super_admin: {
		id: 'super_admin',
		name: 'Super Administrator',
		description: 'Full system access - all resources and actions',
		permissions: [
			{ resource: '*', action: '*', scope: 'all' }
		]
	},

	// Level 2: Content Management
	content_admin: {
		id: 'content_admin',
		name: 'Content Administrator',
		description: 'Manage memorials, streams, blog, and users',
		permissions: [
			{ resource: 'memorial', action: '*', scope: 'all' },
			{ resource: 'stream', action: '*', scope: 'all' },
			{ resource: 'blog', action: '*', scope: 'all' },
			{ resource: 'user', action: 'read', scope: 'all' },
			{ resource: 'user', action: 'update', scope: 'all' },
			{ resource: 'funeral_director', action: 'read', scope: 'all' },
			{ resource: 'funeral_director', action: 'approve', scope: 'all' },
			{ resource: 'audit_log', action: 'read', scope: 'all' }
		]
	},

	// Level 3: Financial Operations
	financial_admin: {
		id: 'financial_admin',
		name: 'Financial Administrator',
		description: 'Payment management and financial reporting',
		permissions: [
			{ resource: 'memorial', action: 'read', scope: 'all' },
			{ 
				resource: 'memorial', 
				action: 'update', 
				scope: 'all',
				conditions: [
					{ field: 'action', operator: 'in', value: ['markPaid', 'markUnpaid', 'editPaymentNotes'] }
				]
			},
			{ resource: 'audit_log', action: 'read', scope: 'all' },
			{ resource: 'audit_log', action: 'export', scope: 'all' }
		]
	},

	// Level 4: Customer Support
	customer_support: {
		id: 'customer_support',
		name: 'Customer Support',
		description: 'Limited editing for customer support tasks',
		permissions: [
			{ resource: 'memorial', action: 'read', scope: 'all' },
			{ 
				resource: 'memorial', 
				action: 'update', 
				scope: 'all',
				conditions: [
					{ field: 'isPaid', operator: 'eq', value: false } // Can only edit unpaid
				]
			},
			{ resource: 'stream', action: 'read', scope: 'all' },
			{ resource: 'user', action: 'read', scope: 'all' },
			{ 
				resource: 'user', 
				action: 'update', 
				scope: 'all',
				conditions: [
					{ field: 'role', operator: 'ne', value: 'admin' } // Cannot edit admins
				]
			},
			{ resource: 'funeral_director', action: 'read', scope: 'all' },
			{ resource: 'audit_log', action: 'read', scope: 'own' }
		]
	},

	// Level 5: Read-Only
	readonly_admin: {
		id: 'readonly_admin',
		name: 'Read-Only Administrator',
		description: 'View-only access to all resources',
		permissions: [
			{ resource: '*', action: 'read', scope: 'all' }
		]
	}
};

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
	return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Evaluate a permission condition against a target resource
 */
function evaluateCondition(condition: PermissionCondition, target: any): boolean {
	const value = getNestedValue(target, condition.field);

	switch (condition.operator) {
		case 'eq':
			return value === condition.value;
		case 'ne':
			return value !== condition.value;
		case 'in':
			return Array.isArray(condition.value) && condition.value.includes(value);
		case 'gt':
			return value > condition.value;
		case 'gte':
			return value >= condition.value;
		case 'lt':
			return value < condition.value;
		case 'lte':
			return value <= condition.value;
		default:
			return false;
	}
}

/**
 * Check if user has permission for a specific action on a resource
 * 
 * @param user - Admin user with role information
 * @param resource - Resource type (memorial, stream, user, etc.)
 * @param action - Action to perform (read, create, update, delete, etc.)
 * @param target - Optional target resource for condition checking
 * @returns true if user has permission, false otherwise
 */
export function hasPermission(
	user: AdminUser,
	resource: string,
	action: string,
	target?: any
): boolean {
	// No role = no access
	if (!user?.adminRole) {
		return false;
	}

	const role = ADMIN_ROLES[user.adminRole];
	if (!role) {
		return false;
	}

	// Check direct permissions
	for (const permission of role.permissions) {
		// Check resource match (exact or wildcard)
		if (permission.resource !== '*' && permission.resource !== resource) {
			continue;
		}

		// Check action match (exact or wildcard)
		if (permission.action !== '*' && permission.action !== action) {
			continue;
		}

		// Check scope (if target provided)
		if (target && permission.scope === 'own' && target.ownerId !== user.uid) {
			continue;
		}

		// Check conditions (if any)
		if (permission.conditions && permission.conditions.length > 0) {
			const meetsConditions = permission.conditions.every((condition) =>
				evaluateCondition(condition, target)
			);
			if (!meetsConditions) {
				continue;
			}
		}

		// All checks passed
		return true;
	}

	// Check inherited roles
	if (role.inherits && role.inherits.length > 0) {
		for (const inheritedRoleId of role.inherits) {
			if (hasPermission({ ...user, adminRole: inheritedRoleId }, resource, action, target)) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Get user's role object
 */
export function getUserRole(user: AdminUser): Role | null {
	if (!user?.adminRole) {
		return null;
	}
	return ADMIN_ROLES[user.adminRole] || null;
}

/**
 * Check if user has any admin role
 */
export function isAdmin(user: any): boolean {
	return user?.role === 'admin' || !!user?.adminRole;
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: AdminUser): Permission[] {
	const role = getUserRole(user);
	if (!role) {
		return [];
	}

	let permissions = [...role.permissions];

	// Add inherited permissions
	if (role.inherits && role.inherits.length > 0) {
		for (const inheritedRoleId of role.inherits) {
			const inheritedRole = ADMIN_ROLES[inheritedRoleId];
			if (inheritedRole) {
				permissions = [...permissions, ...inheritedRole.permissions];
			}
		}
	}

	return permissions;
}
