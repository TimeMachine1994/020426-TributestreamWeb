import { describe, it, expect } from 'vitest';
import { 
	createStandardUserProfile, 
	validateUserProfileData,
	updateUserProfile,
	getRoleDefaults
} from './user-profile';
import type { UserProfileInput } from './user-profile';

describe('User Profile Utilities', () => {
	describe('createStandardUserProfile', () => {
		it('should create basic user profile', () => {
			const input: UserProfileInput = {
				email: 'test@example.com',
				displayName: 'Test User',
				role: 'owner'
			};

			const profile = createStandardUserProfile(input);

			expect(profile.email).toBe('test@example.com');
			expect(profile.displayName).toBe('Test User');
			expect(profile.role).toBe('owner');
			expect(profile.memorialCount).toBe(0);
			expect(profile.hasPaidForMemorial).toBe(false);
			expect(profile.createdAt).toBeInstanceOf(Date);
			expect(profile.updatedAt).toBeInstanceOf(Date);
		});

		it('should create funeral director profile with additional fields', () => {
			const input: UserProfileInput = {
				email: 'director@funeral.com',
				displayName: 'John Director',
				role: 'funeral_director',
				phone: '555-1234',
				funeralHomeName: 'Peaceful Rest Funeral Home',
				directorEmail: 'john@funeral.com'
			};

			const profile = createStandardUserProfile(input);

			expect(profile.role).toBe('funeral_director');
			expect(profile.phone).toBe('555-1234');
			expect(profile.funeralHomeName).toBe('Peaceful Rest Funeral Home');
			expect(profile.directorEmail).toBe('john@funeral.com');
		});

		it('should create owner profile with family contact info', () => {
			const input: UserProfileInput = {
				email: 'family@example.com',
				displayName: 'Family Member',
				role: 'owner',
				familyContactName: 'Jane Doe',
				familyContactPhone: '555-5678',
				contactPreference: 'phone',
				createdByFuneralDirector: true
			};

			const profile = createStandardUserProfile(input);

			expect(profile.familyContactName).toBe('Jane Doe');
			expect(profile.familyContactPhone).toBe('555-5678');
			expect(profile.contactPreference).toBe('phone');
			expect(profile.createdByFuneralDirector).toBe(true);
		});

		it('should trim whitespace from string fields', () => {
			const input: UserProfileInput = {
				email: '  test@example.com  ',
				displayName: '  Test User  ',
				role: 'viewer',
				phone: '  555-1234  '
			};

			const profile = createStandardUserProfile(input);

			expect(profile.email).toBe('test@example.com');
			expect(profile.displayName).toBe('Test User');
			expect(profile.phone).toBe('555-1234');
		});
	});

	describe('validateUserProfileData', () => {
		it('should validate complete valid profile', () => {
			const userData = {
				email: 'test@example.com',
				displayName: 'Test User',
				role: 'owner',
				phone: '555-1234'
			};

			const result = validateUserProfileData(userData);

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should require email', () => {
			const userData = {
				displayName: 'Test User',
				role: 'owner'
			};

			const result = validateUserProfileData(userData);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContainEqual({
				field: 'email',
				message: 'Email is required'
			});
		});

		it('should require display name', () => {
			const userData = {
				email: 'test@example.com',
				role: 'owner'
			};

			const result = validateUserProfileData(userData);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContainEqual({
				field: 'displayName',
				message: 'Display name is required'
			});
		});

		it('should require valid role', () => {
			const userData = {
				email: 'test@example.com',
				displayName: 'Test User',
				role: 'invalid_role'
			};

			const result = validateUserProfileData(userData);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContainEqual({
				field: 'role',
				message: 'Invalid role specified'
			});
		});

		it('should validate email format', () => {
			const userData = {
				email: 'invalid-email',
				displayName: 'Test User',
				role: 'owner'
			};

			const result = validateUserProfileData(userData);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContainEqual({
				field: 'email',
				message: 'Invalid email format'
			});
		});

		it('should validate phone format when provided', () => {
			const userData = {
				email: 'test@example.com',
				displayName: 'Test User',
				role: 'owner',
				phone: 'invalid-phone'
			};

			const result = validateUserProfileData(userData);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContainEqual({
				field: 'phone',
				message: 'Invalid phone number format'
			});
		});

		it('should require funeral home name for funeral directors', () => {
			const userData = {
				email: 'director@funeral.com',
				displayName: 'John Director',
				role: 'funeral_director'
			};

			const result = validateUserProfileData(userData);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContainEqual({
				field: 'funeralHomeName',
				message: 'Funeral home name is required for funeral directors'
			});
		});

		it('should validate director email format when provided', () => {
			const userData = {
				email: 'director@funeral.com',
				displayName: 'John Director',
				role: 'funeral_director',
				funeralHomeName: 'Peaceful Rest',
				directorEmail: 'invalid-email'
			};

			const result = validateUserProfileData(userData);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContainEqual({
				field: 'directorEmail',
				message: 'Invalid director email format'
			});
		});

		it('should validate contact preference', () => {
			const userData = {
				email: 'test@example.com',
				displayName: 'Test User',
				role: 'owner',
				contactPreference: 'invalid'
			};

			const result = validateUserProfileData(userData);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContainEqual({
				field: 'contactPreference',
				message: 'Contact preference must be phone or email'
			});
		});
	});

	describe('getRoleDefaults', () => {
		it('should return owner defaults', () => {
			const defaults = getRoleDefaults('owner');
			expect(defaults).toEqual({
				memorialCount: 0,
				hasPaidForMemorial: false
			});
		});

		it('should return empty defaults for other roles', () => {
			expect(getRoleDefaults('viewer')).toEqual({});
			expect(getRoleDefaults('funeral_director')).toEqual({});
			expect(getRoleDefaults('admin')).toEqual({});
		});
	});

	describe('updateUserProfile', () => {
		it('should update profile with new data', () => {
			const existingProfile = createStandardUserProfile({
				email: 'test@example.com',
				displayName: 'Old Name',
				role: 'owner'
			});

			const updates = {
				displayName: 'New Name',
				phone: '555-1234'
			};

			const updatedProfile = updateUserProfile(existingProfile, updates);

			expect(updatedProfile.displayName).toBe('New Name');
			expect(updatedProfile.phone).toBe('555-1234');
			expect(updatedProfile.email).toBe('test@example.com'); // Unchanged
			expect(updatedProfile.updatedAt).toBeInstanceOf(Date);
		});

		it('should handle empty string values by setting to undefined', () => {
			const existingProfile = createStandardUserProfile({
				email: 'test@example.com',
				displayName: 'Test User',
				role: 'owner',
				phone: '555-1234'
			});

			const updates = {
				phone: '' // Empty string should become undefined
			};

			const updatedProfile = updateUserProfile(existingProfile, updates);

			// The function sets phone to undefined when passed empty string
			expect(updatedProfile.phone).toBeUndefined();
		});

		it('should trim whitespace from updated string fields', () => {
			const existingProfile = createStandardUserProfile({
				email: 'test@example.com',
				displayName: 'Test User',
				role: 'owner'
			});

			const updates = {
				displayName: '  Updated Name  ',
				familyContactName: '  Jane Doe  '
			};

			const updatedProfile = updateUserProfile(existingProfile, updates);

			expect(updatedProfile.displayName).toBe('Updated Name');
			expect(updatedProfile.familyContactName).toBe('Jane Doe');
		});
	});
});
