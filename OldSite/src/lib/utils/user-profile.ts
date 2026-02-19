import type { Timestamp } from 'firebase-admin/firestore';

/**
 * Standardized user profile interface
 */
export interface UserProfile {
	email: string;
	displayName: string;
	role: 'admin' | 'owner' | 'funeral_director' | 'viewer';
	phone?: string;
	
	// Owner-specific fields
	memorialCount?: number;
	hasPaidForMemorial?: boolean;
	
	// Funeral Director-specific fields
	funeralHomeName?: string;
	directorEmail?: string;
	
	// Family contact fields (for FD-created accounts)
	familyContactName?: string;
	familyContactPhone?: string;
	contactPreference?: 'phone' | 'email';
	
	// Metadata
	createdAt: Date | Timestamp;
	updatedAt: Date | Timestamp;
	createdBy?: string; // UID of creator (for FD-created accounts)
	createdByFuneralDirector?: boolean;
}

/**
 * Input data for creating user profiles
 */
export interface UserProfileInput {
	email: string;
	displayName: string;
	role: 'admin' | 'owner' | 'funeral_director' | 'viewer';
	phone?: string;
	funeralHomeName?: string;
	directorEmail?: string;
	familyContactName?: string;
	familyContactPhone?: string;
	contactPreference?: 'phone' | 'email';
	createdBy?: string;
	createdByFuneralDirector?: boolean;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
	isValid: boolean;
	errors: Array<{field: string, message: string}>;
}

/**
 * Create a standardized user profile object
 * @param userData - Input data for user profile
 * @returns UserProfile - Standardized profile object
 */
export function createStandardUserProfile(userData: UserProfileInput): UserProfile {
	const now = new Date();
	
	const baseProfile: UserProfile = {
		email: userData.email.toLowerCase().trim(),
		displayName: userData.displayName.trim(),
		role: userData.role,
		createdAt: now,
		updatedAt: now
	};

	// Add optional fields if provided
	if (userData.phone) {
		baseProfile.phone = userData.phone.trim();
	}

	// Role-specific fields
	switch (userData.role) {
		case 'owner':
			baseProfile.memorialCount = 0;
			baseProfile.hasPaidForMemorial = false;
			
			// Family contact fields (for FD-created accounts)
			if (userData.familyContactName) {
				baseProfile.familyContactName = userData.familyContactName.trim();
			}
			if (userData.familyContactPhone) {
				baseProfile.familyContactPhone = userData.familyContactPhone.trim();
			}
			if (userData.contactPreference) {
				baseProfile.contactPreference = userData.contactPreference;
			}
			break;

		case 'funeral_director':
			if (userData.funeralHomeName) {
				baseProfile.funeralHomeName = userData.funeralHomeName.trim();
			}
			if (userData.directorEmail) {
				baseProfile.directorEmail = userData.directorEmail.toLowerCase().trim();
			}
			break;
	}

	// Creator tracking
	if (userData.createdBy) {
		baseProfile.createdBy = userData.createdBy;
	}
	if (userData.createdByFuneralDirector) {
		baseProfile.createdByFuneralDirector = userData.createdByFuneralDirector;
	}

	return baseProfile;
}

/**
 * Validate user profile data
 * @param userData - User data to validate
 * @returns ValidationResult - Validation results with errors
 */
export function validateUserProfileData(userData: any): ValidationResult {
	const errors: Array<{field: string, message: string}> = [];

	// Required fields
	if (!userData.email || !userData.email.trim()) {
		errors.push({field: 'email', message: 'Email is required'});
	}

	if (!userData.displayName || !userData.displayName.trim()) {
		errors.push({field: 'displayName', message: 'Display name is required'});
	}

	if (!userData.role) {
		errors.push({field: 'role', message: 'Role is required'});
	} else if (!['admin', 'owner', 'funeral_director', 'viewer'].includes(userData.role)) {
		errors.push({field: 'role', message: 'Invalid role specified'});
	}

	// Email format validation
	if (userData.email && userData.email.trim()) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(userData.email.trim())) {
			errors.push({field: 'email', message: 'Invalid email format'});
		}
	}

	// Phone format validation (if provided)
	if (userData.phone && userData.phone.trim()) {
		const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
		const cleanPhone = userData.phone.replace(/[\s\-\(\)]/g, '');
		if (!phoneRegex.test(cleanPhone)) {
			errors.push({field: 'phone', message: 'Invalid phone number format'});
		}
	}

	// Role-specific validation
	if (userData.role === 'funeral_director') {
		if (!userData.funeralHomeName || !userData.funeralHomeName.trim()) {
			errors.push({field: 'funeralHomeName', message: 'Funeral home name is required for funeral directors'});
		}
	}

	// Director email validation (if provided)
	if (userData.directorEmail && userData.directorEmail.trim()) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(userData.directorEmail.trim())) {
			errors.push({field: 'directorEmail', message: 'Invalid director email format'});
		}
	}

	// Contact preference validation
	if (userData.contactPreference && !['phone', 'email'].includes(userData.contactPreference)) {
		errors.push({field: 'contactPreference', message: 'Contact preference must be phone or email'});
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

/**
 * Get role-specific default values
 * @param role - User role
 * @returns Partial<UserProfile> - Default values for the role
 */
export function getRoleDefaults(role: 'admin' | 'owner' | 'funeral_director' | 'viewer'): Partial<UserProfile> {
	switch (role) {
		case 'owner':
			return {
				memorialCount: 0,
				hasPaidForMemorial: false
			};
		case 'funeral_director':
			return {
				// No specific defaults for funeral directors
			};
		case 'viewer':
			return {
				// No specific defaults for viewers
			};
		case 'admin':
			return {
				// No specific defaults for admins
			};
		default:
			return {};
	}
}

/**
 * Update user profile with new data
 * @param existingProfile - Current profile data
 * @param updates - New data to merge
 * @returns UserProfile - Updated profile
 */
export function updateUserProfile(existingProfile: UserProfile, updates: Partial<UserProfileInput>): UserProfile {
	const updatedProfile = { ...existingProfile };
	
	// Update timestamp
	updatedProfile.updatedAt = new Date();
	
	// Update fields if provided
	if (updates.displayName !== undefined) {
		updatedProfile.displayName = updates.displayName.trim();
	}
	if (updates.phone !== undefined) {
		updatedProfile.phone = updates.phone ? updates.phone.trim() : undefined;
	}
	if (updates.funeralHomeName !== undefined) {
		updatedProfile.funeralHomeName = updates.funeralHomeName ? updates.funeralHomeName.trim() : undefined;
	}
	if (updates.directorEmail !== undefined) {
		updatedProfile.directorEmail = updates.directorEmail ? updates.directorEmail.toLowerCase().trim() : undefined;
	}
	if (updates.familyContactName !== undefined) {
		updatedProfile.familyContactName = updates.familyContactName ? updates.familyContactName.trim() : undefined;
	}
	if (updates.familyContactPhone !== undefined) {
		updatedProfile.familyContactPhone = updates.familyContactPhone ? updates.familyContactPhone.trim() : undefined;
	}
	if (updates.contactPreference !== undefined) {
		updatedProfile.contactPreference = updates.contactPreference;
	}
	
	return updatedProfile;
}
