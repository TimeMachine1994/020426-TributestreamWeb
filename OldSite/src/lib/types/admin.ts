export interface AdminUser {
	uid: string;
	email: string;
	role: 'admin';
	isAdmin: true;
	createdAt: Date;
	lastLoginAt?: Date;
}

// V1: Funeral director applications removed - auto-approved registration

export interface UserManagementData {
	uid: string;
	email: string;
	displayName?: string;
	role: 'admin' | 'owner' | 'funeral_director';
	isAdmin: boolean;
	suspended: boolean;
	suspendedReason?: string;
	createdAt: Date;
	lastLoginAt?: Date;
	memorialCount?: number;
}

export interface AdminDashboardStats {
	totalUsers: number;
	totalMemorials: number;
	publicMemorials: number;
	newUsersThisWeek: number;
	newMemorialsThisWeek: number;
}

export interface AdminAction {
	id: string;
	adminId: string;
	action: 'user_created' | 'user_suspended' | 'user_deleted' | 'role_changed';
	targetType: 'user' | 'memorial' | 'application';
	targetId: string;
	details: Record<string, any>;
	timestamp: Date;
	ipAddress?: string;
}
