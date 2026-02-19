import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase Firestore - must be defined before imports
const mockGet = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockCollection = vi.fn();

vi.mock('$lib/server/firebase', () => ({
	adminDb: {
		collection: mockCollection
	}
}));

import { 
	generateBaseSlug, 
	checkSlugExists, 
	generateUniqueMemorialSlug,
	generateTimestampSlug,
	isValidSlugFormat,
	validateCustomSlug
} from './memorial-slug';

describe('Memorial Slug Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Setup mock chain
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

	describe('generateBaseSlug', () => {
		it('should generate proper slug from name', () => {
			expect(generateBaseSlug('John Doe')).toBe('celebration-of-life-for-john-doe');
			expect(generateBaseSlug('Mary Jane Smith')).toBe('celebration-of-life-for-mary-jane-smith');
		});

		it('should handle special characters', () => {
			expect(generateBaseSlug('José María')).toBe('celebration-of-life-for-jos-mara');
			expect(generateBaseSlug('O\'Connor')).toBe('celebration-of-life-for-oconnor');
		});

		it('should handle multiple spaces and hyphens', () => {
			expect(generateBaseSlug('John   Doe')).toBe('celebration-of-life-for-john-doe');
			expect(generateBaseSlug('John--Doe')).toBe('celebration-of-life-for-john-doe');
		});

		it('should trim and limit length', () => {
			const longName = 'A'.repeat(100);
			const result = generateBaseSlug(longName);
			expect(result.length).toBeLessThanOrEqual(80);
		});

		it('should handle edge cases', () => {
			expect(generateBaseSlug('')).toBe('celebration-of-life-for');
			expect(generateBaseSlug('   ')).toBe('celebration-of-life-for');
			expect(generateBaseSlug('123')).toBe('celebration-of-life-for-123');
		});
	});

	describe('checkSlugExists', () => {
		it('should return true when slug exists', async () => {
			mockGet.mockResolvedValue({ empty: false });
			
			const result = await checkSlugExists('existing-slug');
			expect(result).toBe(true);
			expect(mockCollection).toHaveBeenCalledWith('memorials');
			expect(mockWhere).toHaveBeenCalledWith('fullSlug', '==', 'existing-slug');
		});

		it('should return false when slug does not exist', async () => {
			mockGet.mockResolvedValue({ empty: true });
			
			const result = await checkSlugExists('new-slug');
			expect(result).toBe(false);
		});

		it('should return true on database error (safe default)', async () => {
			mockGet.mockRejectedValue(new Error('Database error'));
			
			const result = await checkSlugExists('error-slug');
			expect(result).toBe(true);
		});
	});

	describe('generateUniqueMemorialSlug', () => {
		it('should return base slug when unique', async () => {
			mockGet.mockResolvedValue({ empty: true });
			
			const result = await generateUniqueMemorialSlug('John Doe');
			expect(result).toBe('celebration-of-life-for-john-doe');
		});

		it('should add counter when base slug exists', async () => {
			mockGet
				.mockResolvedValueOnce({ empty: false }) // Base slug exists
				.mockResolvedValueOnce({ empty: true });  // Counter slug is unique
			
			const result = await generateUniqueMemorialSlug('John Doe');
			expect(result).toBe('celebration-of-life-for-john-doe-1');
		});

		it('should increment counter until unique', async () => {
			mockGet
				.mockResolvedValueOnce({ empty: false }) // Base slug exists
				.mockResolvedValueOnce({ empty: false }) // Counter 1 exists
				.mockResolvedValueOnce({ empty: false }) // Counter 2 exists
				.mockResolvedValueOnce({ empty: true });  // Counter 3 is unique
			
			const result = await generateUniqueMemorialSlug('John Doe');
			expect(result).toBe('celebration-of-life-for-john-doe-3');
		});

		it('should use timestamp fallback after max attempts', async () => {
			mockGet.mockResolvedValue({ empty: false }); // Always exists
			
			const result = await generateUniqueMemorialSlug('John Doe', 3);
			expect(result).toMatch(/celebration-of-life-for-john-doe-\d{6}$/);
		});
	});

	describe('generateTimestampSlug', () => {
		it('should generate slug with timestamp', () => {
			const result = generateTimestampSlug('John Doe');
			expect(result).toMatch(/^celebration-of-life-for-john-doe-\d{4}$/);
		});
	});

	describe('isValidSlugFormat', () => {
		it('should validate correct slug formats', () => {
			expect(isValidSlugFormat('valid-slug')).toBe(true);
			expect(isValidSlugFormat('slug-with-numbers-123')).toBe(true);
			expect(isValidSlugFormat('a')).toBe(false); // Too short
			expect(isValidSlugFormat('a'.repeat(101))).toBe(false); // Too long
		});

		it('should reject invalid formats', () => {
			expect(isValidSlugFormat('-starts-with-hyphen')).toBe(false);
			expect(isValidSlugFormat('ends-with-hyphen-')).toBe(false);
			expect(isValidSlugFormat('has_underscore')).toBe(false);
			expect(isValidSlugFormat('has spaces')).toBe(false);
			expect(isValidSlugFormat('HAS-CAPS')).toBe(false);
		});
	});

	describe('validateCustomSlug', () => {
		it('should validate and clean custom slugs', () => {
			const result = validateCustomSlug('My Custom Slug');
			expect(result.isValid).toBe(true);
			expect(result.cleanedSlug).toBe('my-custom-slug');
		});

		it('should reject empty slugs', () => {
			const result = validateCustomSlug('');
			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Slug cannot be empty');
		});

		it('should reject slugs with only invalid characters', () => {
			const result = validateCustomSlug('!@#$%');
			expect(result.isValid).toBe(false);
			expect(result.error).toBe('Slug contains only invalid characters');
		});

		it('should handle special characters', () => {
			const result = validateCustomSlug('José\'s Memorial!');
			expect(result.isValid).toBe(true);
			expect(result.cleanedSlug).toBe('joss-memorial');
		});
	});
});
