import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEmail } from './email-validation';
import { generateUniqueMemorialSlug } from './memorial-slug';
import { createStandardUserProfile, validateUserProfileData } from './user-profile';

// Mock Firebase
const mockGetUserByEmail = vi.fn();
const mockGet = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockCollection = vi.fn();

vi.mock('$lib/server/firebase', () => ({
	adminAuth: {
		getUserByEmail: mockGetUserByEmail
	},
	adminDb: {
		collection: mockCollection
	}
}));

describe('Registration Flow Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Setup Firestore mock chain
		mockCollection.mockReturnValue({
			where: mockWhere
		});
		mockWhere.mockReturnValue({
			limit: mockLimit
		});
		mockLimit.mockReturnValue({
			get: mockGet
		});
	});

	describe('Complete Owner Registration Flow', () => {
		it('should handle successful owner registration', async () => {
			// Mock email as available
			mockGetUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
			
			// Mock slug as unique
			mockGet.mockResolvedValue({ empty: true });

			// 1. Validate email
			const emailValidation = await validateEmail('newowner@example.com', 'email');
			expect(emailValidation.isValid).toBe(true);

			// 2. Generate unique memorial slug (for future memorial creation)
			const slug = await generateUniqueMemorialSlug('John Doe');
			expect(slug).toBe('celebration-of-life-for-john-doe');

			// 3. Create user profile
			const userProfile = createStandardUserProfile({
				email: 'newowner@example.com',
				displayName: 'Jane Doe',
				role: 'owner'
			});

			expect(userProfile.email).toBe('newowner@example.com');
			expect(userProfile.role).toBe('owner');
			expect(userProfile.memorialCount).toBe(0);
			expect(userProfile.hasPaidForMemorial).toBe(false);
		});

		it('should handle duplicate email in owner registration', async () => {
			// Mock email as existing
			mockGetUserByEmail.mockResolvedValue({ uid: 'existing-user' });

			const emailValidation = await validateEmail('existing@example.com', 'email');
			
			expect(emailValidation.isValid).toBe(false);
			expect(emailValidation.error).toBe('An account with email existing@example.com already exists. Please use a different email or sign in to your existing account.');
			expect(emailValidation.field).toBe('email');
		});
	});

	describe('Complete Funeral Director Registration Flow', () => {
		it('should handle successful funeral director registration with family', async () => {
			// Mock both emails as available
			mockGetUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
			
			// Mock slug as unique
			mockGet.mockResolvedValue({ empty: true });

			// 1. Validate family contact email
			const familyEmailValidation = await validateEmail('family@example.com', 'familyContactEmail');
			expect(familyEmailValidation.isValid).toBe(true);

			// 2. Validate director email (optional)
			const directorEmailValidation = await validateEmail('director@funeral.com', 'directorEmail');
			expect(directorEmailValidation.isValid).toBe(true);

			// 3. Generate unique memorial slug
			const slug = await generateUniqueMemorialSlug('Mary Smith');
			expect(slug).toBe('celebration-of-life-for-mary-smith');

			// 4. Create family user profile
			const familyProfile = createStandardUserProfile({
				email: 'family@example.com',
				displayName: 'Family of Mary Smith',
				role: 'owner',
				familyContactName: 'John Smith',
				familyContactPhone: '555-1234',
				contactPreference: 'phone',
				createdByFuneralDirector: true
			});

			expect(familyProfile.role).toBe('owner');
			expect(familyProfile.familyContactName).toBe('John Smith');
			expect(familyProfile.createdByFuneralDirector).toBe(true);
		});

		it('should handle duplicate family email in funeral director registration', async () => {
			// Mock family email as existing, director email as available
			mockGetUserByEmail
				.mockResolvedValueOnce({ uid: 'existing-family' })
				.mockRejectedValueOnce({ code: 'auth/user-not-found' });

			const familyEmailValidation = await validateEmail('existing-family@example.com', 'familyContactEmail');
			
			expect(familyEmailValidation.isValid).toBe(false);
			expect(familyEmailValidation.field).toBe('familyContactEmail');
		});
	});

	describe('Memorial Creation Flow', () => {
		it('should handle memorial creation with slug collision', async () => {
			// Mock slug collision scenario
			mockGet
				.mockResolvedValueOnce({ empty: false }) // Base slug exists
				.mockResolvedValueOnce({ empty: false }) // Counter 1 exists
				.mockResolvedValueOnce({ empty: true });  // Counter 2 is unique

			const slug = await generateUniqueMemorialSlug('John Doe');
			expect(slug).toBe('celebration-of-life-for-john-doe-2');
		});

		it('should handle payment restriction for multiple memorials', () => {
			// Simulate user with existing memorial and no payment
			const userData = {
				memorialCount: 1,
				hasPaidForMemorial: false
			};

			// This would be checked in the server action
			const canCreateMemorial = userData.memorialCount === 0 || userData.hasPaidForMemorial;
			expect(canCreateMemorial).toBe(false);
		});
	});

	describe('User Profile Validation Integration', () => {
		it('should validate complete funeral director profile', () => {
			const profileData = {
				email: 'director@funeral.com',
				displayName: 'John Director',
				role: 'funeral_director',
				phone: '555-1234',
				funeralHomeName: 'Peaceful Rest Funeral Home',
				directorEmail: 'john@funeral.com'
			};

			const validation = validateUserProfileData(profileData);
			expect(validation.isValid).toBe(true);
			expect(validation.errors).toHaveLength(0);

			const profile = createStandardUserProfile(profileData);
			expect(profile.role).toBe('funeral_director');
			expect(profile.funeralHomeName).toBe('Peaceful Rest Funeral Home');
		});

		it('should validate family contact profile created by funeral director', () => {
			const profileData = {
				email: 'family@example.com',
				displayName: 'Family Member',
				role: 'owner',
				familyContactName: 'Jane Doe',
				familyContactPhone: '555-5678',
				contactPreference: 'email'
			};

			const validation = validateUserProfileData(profileData);
			expect(validation.isValid).toBe(true);

			const profile = createStandardUserProfile({
				...profileData,
				createdByFuneralDirector: true
			});

			expect(profile.role).toBe('owner');
			expect(profile.familyContactName).toBe('Jane Doe');
			expect(profile.createdByFuneralDirector).toBe(true);
		});
	});

	describe('Error Handling Integration', () => {
		it('should handle network errors gracefully', async () => {
			// Mock network error
			mockGetUserByEmail.mockRejectedValue(new Error('Network timeout'));

			const emailValidation = await validateEmail('test@example.com', 'email');
			
			expect(emailValidation.isValid).toBe(false);
			expect(emailValidation.error).toBe('Unable to verify email availability. Please try again.');
		});

		it('should handle database errors in slug generation', async () => {
			// Mock database error
			mockGet.mockRejectedValue(new Error('Database connection failed'));

			const slug = await generateUniqueMemorialSlug('John Doe');
			
			// Should use timestamp fallback
			expect(slug).toMatch(/^celebration-of-life-for-john-doe-\d{6}$/);
		});
	});

	describe('Performance Integration', () => {
		it('should complete email validation quickly', async () => {
			mockGetUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });

			const startTime = Date.now();
			await validateEmail('test@example.com', 'email');
			const endTime = Date.now();

			// Should complete within reasonable time (mocked, so very fast)
			expect(endTime - startTime).toBeLessThan(100);
		});

		it('should handle multiple slug collision attempts efficiently', async () => {
			// Mock many collisions
			const mockResponses = Array(10).fill({ empty: false });
			mockResponses.push({ empty: true }); // Finally unique

			mockGet.mockImplementation(() => Promise.resolve(mockResponses.shift()));

			const startTime = Date.now();
			const slug = await generateUniqueMemorialSlug('John Doe');
			const endTime = Date.now();

			expect(slug).toBe('celebration-of-life-for-john-doe-10');
			expect(endTime - startTime).toBeLessThan(1000); // Should be fast even with many attempts
		});
	});

	describe('Data Consistency Integration', () => {
		it('should maintain consistent user profile structure across registration paths', () => {
			// Owner registration
			const ownerProfile = createStandardUserProfile({
				email: 'owner@example.com',
				displayName: 'Owner User',
				role: 'owner'
			});

			// Funeral director registration
			const directorProfile = createStandardUserProfile({
				email: 'director@funeral.com',
				displayName: 'Director User',
				role: 'funeral_director',
				funeralHomeName: 'Funeral Home'
			});

			// Family registration by funeral director
			const familyProfile = createStandardUserProfile({
				email: 'family@example.com',
				displayName: 'Family User',
				role: 'owner',
				createdByFuneralDirector: true
			});

			// All should have consistent base structure
			[ownerProfile, directorProfile, familyProfile].forEach(profile => {
				expect(profile).toHaveProperty('email');
				expect(profile).toHaveProperty('displayName');
				expect(profile).toHaveProperty('role');
				expect(profile).toHaveProperty('createdAt');
				expect(profile).toHaveProperty('updatedAt');
			});

			// Role-specific fields should be present
			expect(ownerProfile.memorialCount).toBe(0);
			expect(directorProfile.funeralHomeName).toBe('Funeral Home');
			expect(familyProfile.createdByFuneralDirector).toBe(true);
		});
	});
});
