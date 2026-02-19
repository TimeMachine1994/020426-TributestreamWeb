import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase Admin Auth - must be defined before imports
const mockGetUserByEmail = vi.fn();
vi.mock('$lib/server/firebase', () => ({
	adminAuth: {
		getUserByEmail: mockGetUserByEmail
	}
}));

import { 
	checkEmailExists, 
	isValidEmailFormat, 
	validateEmail, 
	validateMultipleEmails,
	getStandardEmailExistsMessage 
} from './email-validation';

describe('Email Validation Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('isValidEmailFormat', () => {
		it('should return true for valid email formats', () => {
			expect(isValidEmailFormat('test@example.com')).toBe(true);
			expect(isValidEmailFormat('user.name@domain.co.uk')).toBe(true);
			expect(isValidEmailFormat('user+tag@example.org')).toBe(true);
		});

		it('should return false for invalid email formats', () => {
			expect(isValidEmailFormat('invalid-email')).toBe(false);
			expect(isValidEmailFormat('test@')).toBe(false);
			expect(isValidEmailFormat('@example.com')).toBe(false);
			expect(isValidEmailFormat('test.example.com')).toBe(false);
			expect(isValidEmailFormat('')).toBe(false);
		});
	});

	describe('getStandardEmailExistsMessage', () => {
		it('should return consistent error message', () => {
			const email = 'test@example.com';
			const message = getStandardEmailExistsMessage(email);
			expect(message).toBe(`An account with email ${email} already exists. Please use a different email or sign in to your existing account.`);
		});
	});

	describe('checkEmailExists', () => {
		it('should return true when email exists', async () => {
			mockGetUserByEmail.mockResolvedValue({ uid: 'test-uid' });
			
			const result = await checkEmailExists('existing@example.com');
			expect(result).toBe(true);
			expect(mockGetUserByEmail).toHaveBeenCalledWith('existing@example.com');
		});

		it('should return false when email does not exist', async () => {
			mockGetUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
			
			const result = await checkEmailExists('new@example.com');
			expect(result).toBe(false);
		});

		it('should throw error for other Firebase Auth errors', async () => {
			const networkError = new Error('Network error');
			mockGetUserByEmail.mockRejectedValue(networkError);
			
			await expect(checkEmailExists('test@example.com')).rejects.toThrow('Network error');
		});
	});

	describe('validateEmail', () => {
		it('should return invalid for malformed email', async () => {
			const result = await validateEmail('invalid-email', 'email');
			
			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Please enter a valid email address.');
			expect(result.field).toBe('email');
		});

		it('should return invalid for existing email', async () => {
			mockGetUserByEmail.mockResolvedValue({ uid: 'test-uid' });
			
			const result = await validateEmail('existing@example.com', 'email');
			
			expect(result.isValid).toBe(false);
			expect(result.error).toBe('An account with email existing@example.com already exists. Please use a different email or sign in to your existing account.');
			expect(result.field).toBe('email');
		});

		it('should return valid for new, well-formed email', async () => {
			mockGetUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
			
			const result = await validateEmail('new@example.com', 'email');
			
			expect(result.isValid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should handle network errors gracefully', async () => {
			mockGetUserByEmail.mockRejectedValue(new Error('Network error'));
			
			const result = await validateEmail('test@example.com', 'email');
			
			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Unable to verify email availability. Please try again.');
			expect(result.field).toBe('email');
		});
	});

	describe('validateMultipleEmails', () => {
		it('should validate multiple emails successfully', async () => {
			mockGetUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
			
			const emails = [
				{ email: 'user1@example.com', fieldName: 'email1' },
				{ email: 'user2@example.com', fieldName: 'email2' }
			];
			
			const result = await validateMultipleEmails(emails);
			
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should return errors for invalid emails', async () => {
			mockGetUserByEmail
				.mockResolvedValueOnce({ uid: 'test-uid' }) // First email exists
				.mockRejectedValueOnce({ code: 'auth/user-not-found' }); // Second email is new
			
			const emails = [
				{ email: 'existing@example.com', fieldName: 'email1' },
				{ email: 'invalid-email', fieldName: 'email2' }
			];
			
			const result = await validateMultipleEmails(emails);
			
			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(2);
			expect(result.errors[0].field).toBe('email1');
			expect(result.errors[1].field).toBe('email2');
		});

		it('should skip empty emails', async () => {
			const emails = [
				{ email: '', fieldName: 'email1' },
				{ email: 'valid@example.com', fieldName: 'email2' }
			];
			
			mockGetUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
			
			const result = await validateMultipleEmails(emails);
			
			expect(result.isValid).toBe(true);
			expect(mockGetUserByEmail).toHaveBeenCalledTimes(1);
		});
	});
});
