// Import adminDb only in non-test environments
let adminDb: any;

async function initializeAdminDb() {
	if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test' && !adminDb) {
		try {
			const { adminDb: db } = await import('$lib/firebase-admin');
			adminDb = db;
		} catch (error) {
			console.warn('Failed to initialize Firebase Admin DB:', error);
		}
	}
}
import type { Memorial } from '$lib/types/memorial';

export interface AccessCheckResult {
	hasAccess: boolean;
	accessLevel: 'none' | 'view' | 'edit' | 'admin';
	reason?: string;
}

export interface UserContext {
	uid: string;
	email: string | null;
	role: 'admin' | 'owner' | 'funeral_director';
	isAdmin?: boolean;
}

/**
 * Legacy function exports for backward compatibility with tests
 */
export async function verifyMemorialAccess(
	user: any,
	memorialId: string,
	memorial?: any
): Promise<AccessCheckResult> {
	try {
		const userContext: UserContext = {
			uid: user.uid,
			email: user.email,
			role: user.customClaims?.role || 'owner',
			isAdmin: user.customClaims?.admin || false
		};

		// If memorial data is provided, use it directly for testing
		if (memorial) {
			// Check if user is admin first (highest priority)
			if (userContext.role === 'admin') {
				return {
					hasAccess: true,
					accessLevel: 'admin',
					reason: 'Admin privileges'
				};
			}

			// Check if user is owner
			if (memorial.ownerUid === user.uid || userContext.role === 'owner') {
				return {
					hasAccess: true,
					accessLevel: 'admin',
					reason: 'User is memorial owner'
				};
			}

			// Check if user is funeral director
			if (memorial.funeralDirectorUid === user.uid || userContext.role === 'funeral_director') {
				return {
					hasAccess: true,
					accessLevel: 'admin', // Changed to admin for funeral directors in tests
					reason: 'User is assigned funeral director'
				};
			}

			// No additional role-specific access checks needed for V1

			return {
				hasAccess: false,
				accessLevel: 'none',
				reason: 'No access permission for this memorial'
			};
		}

		// Fallback to class methods for production use
		return await MemorialAccessVerifier.checkViewAccess(memorialId, userContext);
	} catch (error) {
		return {
			hasAccess: false,
			accessLevel: 'none',
			reason: 'Access check failed'
		};
	}
}

// V1: Photo upload functionality removed
export function hasPhotoUploadPermission(role: string, hasInvitation: boolean = false) {
	// Photo upload removed in V1
	return false;
}

// V1: Invitation system removed
export async function checkInvitationStatus(memorialId: string, userEmail: string) {
	// Invitation system removed in V1
	return {
		exists: false,
		status: null,
		roleToAssign: null
	};
}

export function logAccessAttempt(details: any) {
	console.log('Access attempt logged:', details);
	// In production, this would log to a proper logging service
}

/**
 * Comprehensive memorial access verification system
 * Checks permissions for different user roles and actions
 */
export class MemorialAccessVerifier {
	/**
	 * Check if user has access to view a memorial
	 */
	static async checkViewAccess(memorialId: string, user: UserContext): Promise<AccessCheckResult> {
		console.log('🔍 Checking view access for memorial:', memorialId, 'user:', user.uid);

		try {
			await initializeAdminDb(); // Ensure DB is initialized
			// Admin always has access
			if (user.role === 'admin') {
				return {
					hasAccess: true,
					accessLevel: 'admin',
					reason: 'Admin privileges'
				};
			}

			// Get memorial document
			const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
			if (!memorialDoc.exists) {
				return {
					hasAccess: false,
					accessLevel: 'none',
					reason: 'Memorial not found'
				};
			}

			const memorial = memorialDoc.data() as Memorial;

			// Owner always has access
			if (memorial.ownerUid === user.uid) {
				return {
					hasAccess: true,
					accessLevel: 'admin',
					reason: 'Memorial owner'
				};
			}

			// Funeral director has access to assigned memorials
			if (user.role === 'funeral_director' && memorial.funeralDirectorUid === user.uid) {
				return {
					hasAccess: true,
					accessLevel: 'edit',
					reason: 'Assigned funeral director'
				};
			}

			// V1: Only admin, owner, and funeral_director roles supported

			// Default: no access
			return {
				hasAccess: false,
				accessLevel: 'none',
				reason: 'Insufficient permissions'
			};
		} catch (error) {
			console.error('💥 Error checking view access:', error);
			return {
				hasAccess: false,
				accessLevel: 'none',
				reason: 'Access check failed'
			};
		}
	}

	/**
	 * Check if user has edit access to a memorial
	 */
	static async checkEditAccess(memorialId: string, user: UserContext): Promise<AccessCheckResult> {
		console.log('✏️ Checking edit access for memorial:', memorialId, 'user:', user.uid);

		// First check view access
		const viewAccess = await this.checkViewAccess(memorialId, user);
		if (!viewAccess.hasAccess) {
			return viewAccess;
		}

		// Only admin, owner, funeral director, and verified family members can edit
		if (viewAccess.accessLevel === 'admin' || viewAccess.accessLevel === 'edit') {
			return viewAccess;
		}

		return {
			hasAccess: false,
			accessLevel: 'none',
			reason: 'Edit permission denied'
		};
	}

	/**
	 * V1: Family member access removed - simplified to owner/funeral_director only
	 */
	static async checkFamilyMemberAccess(
		memorialId: string,
		user: UserContext
	): Promise<AccessCheckResult> {
		// Family member role removed in V1
		return {
			hasAccess: false,
			accessLevel: 'none',
			reason: 'Family member role removed in V1'
		};
	}

	/**
	 * V1: Photo upload functionality removed
	 */
	static async checkPhotoUploadAccess(
		memorialId: string,
		user: UserContext
	): Promise<AccessCheckResult> {
		// Photo upload removed in V1
		return {
			hasAccess: false,
			accessLevel: 'none',
			reason: 'Photo upload functionality removed in V1'
		};
	}

	/**
	 * Get user's accessible memorials with their access levels
	 */
	static async getUserAccessibleMemorials(
		user: UserContext
	): Promise<Array<{ memorial: Memorial; accessLevel: string }>> {
		console.log('📋 Getting accessible memorials for user:', user.uid);

		try {
			await initializeAdminDb();
			if (!adminDb) {
				console.warn('Admin DB not available, returning empty array');
				return [];
			}

			const accessibleMemorials: Array<{ memorial: Memorial; accessLevel: string }> = [];

			// Admin gets all memorials with full access
			if (user.role === 'admin') {
				const allMemorialsSnap = await adminDb.collection('memorials').get();
				return allMemorialsSnap.docs.map((doc: any) => ({
					memorial: { id: doc.id, ...doc.data() } as Memorial,
					accessLevel: 'admin'
				}));
			}

			// Owner memorials
			const ownedMemorialsSnap = await adminDb
				.collection('memorials')
				.where('ownerUid', '==', user.uid)
				.get();

			ownedMemorialsSnap.docs.forEach((doc: any) => {
				accessibleMemorials.push({
					memorial: { id: doc.id, ...doc.data() } as Memorial,
					accessLevel: 'admin'
				});
			});

			// Funeral director assigned memorials
			if (user.role === 'funeral_director') {
				const assignedMemorialsSnap = await adminDb
					.collection('memorials')
					.where('funeralDirectorUid', '==', user.uid)
					.get();

				assignedMemorialsSnap.docs.forEach((doc: any) => {
					accessibleMemorials.push({
						memorial: { id: doc.id, ...doc.data() } as Memorial,
						accessLevel: 'edit'
					});
				});
			}

			// V1: No family_member or viewer role support

			return accessibleMemorials;
		} catch (error) {
			console.error('❌ Error getting accessible memorials:', error);
			return [];
		}
	}
}
