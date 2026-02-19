/**
 * Admin User Store
 * 
 * Manages authenticated admin user state and permissions
 */

import { writable, derived } from 'svelte/store';
import type { AdminUser } from '$lib/admin/permissions';
import { getUserRole, hasPermission } from '$lib/admin/permissions';

// Create writable store for admin user
export const adminUser = writable<AdminUser | null>(null);

// Derived store for user's role
export const adminRole = derived(adminUser, ($user) => {
	return $user ? getUserRole($user) : null;
});

// Derived store for permission checking function
export const can = derived(adminUser, ($user) => {
	return (resource: string, action: string, target?: any) => {
		if (!$user) return false;
		return hasPermission($user, resource, action, target);
	};
});

// Initialize admin user from page data
export function initAdminUser(user: AdminUser | null) {
	adminUser.set(user);
}
