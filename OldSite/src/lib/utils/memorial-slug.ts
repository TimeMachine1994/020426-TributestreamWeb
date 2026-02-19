import { adminDb } from '$lib/server/firebase';

/**
 * Generate a base slug from loved one's name
 * @param lovedOneName - Name of the deceased
 * @returns string - Base slug without uniqueness guarantee
 */
export function generateBaseSlug(lovedOneName: string): string {
	const baseSlug = `celebration-of-life-for-${lovedOneName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single
		.replace(/^-|-$/g, '')}` // Remove leading/trailing hyphens
		.substring(0, 80); // Limit length
	
	return baseSlug;
}

/**
 * Check if a memorial slug already exists in Firestore
 * @param slug - Slug to check
 * @returns Promise<boolean> - true if slug exists, false if available
 */
export async function checkSlugExists(slug: string): Promise<boolean> {
	try {
		const existingMemorial = await adminDb
			.collection('memorials')
			.where('fullSlug', '==', slug)
			.limit(1)
			.get();
		
		return !existingMemorial.empty;
	} catch (error) {
		console.error('Error checking slug existence:', error);
		// On error, assume slug exists to be safe
		return true;
	}
}

/**
 * Generate a unique memorial slug by checking Firestore and adding counter if needed
 * @param lovedOneName - Name of the deceased
 * @param maxAttempts - Maximum number of attempts to find unique slug (default: 100)
 * @returns Promise<string> - Unique slug guaranteed to not exist in database
 */
export async function generateUniqueMemorialSlug(
	lovedOneName: string, 
	maxAttempts: number = 100
): Promise<string> {
	console.log('🔗 Generating unique slug for:', lovedOneName);
	
	const baseSlug = generateBaseSlug(lovedOneName);
	let fullSlug = baseSlug;
	let counter = 1;
	let attempts = 0;

	while (attempts < maxAttempts) {
		const exists = await checkSlugExists(fullSlug);
		
		if (!exists) {
			console.log('🔗 Generated unique slug:', fullSlug);
			return fullSlug;
		}
		
		// Slug exists, try with counter
		fullSlug = `${baseSlug}-${counter}`;
		counter++;
		attempts++;
	}

	// Fallback: use timestamp if we can't find unique slug after maxAttempts
	const timestamp = Date.now().toString().slice(-6);
	const fallbackSlug = `${baseSlug}-${timestamp}`;
	console.warn('🔗 Using timestamp fallback slug:', fallbackSlug);
	
	return fallbackSlug;
}

/**
 * Generate a simple slug with timestamp (for quick operations)
 * @param lovedOneName - Name of the deceased
 * @returns string - Slug with timestamp suffix
 */
export function generateTimestampSlug(lovedOneName: string): string {
	const baseSlug = generateBaseSlug(lovedOneName);
	const timestamp = Date.now().toString().slice(-4);
	return `${baseSlug}-${timestamp}`;
}

/**
 * Validate slug format
 * @param slug - Slug to validate
 * @returns boolean - true if valid format
 */
export function isValidSlugFormat(slug: string): boolean {
	// Slug should only contain lowercase letters, numbers, and hyphens
	// Should not start or end with hyphen
	// Should be between 3 and 100 characters
	const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
	return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
}

/**
 * Clean and validate a custom slug
 * @param customSlug - User-provided slug
 * @returns {isValid: boolean, cleanedSlug?: string, error?: string}
 */
export function validateCustomSlug(customSlug: string): {
	isValid: boolean;
	cleanedSlug?: string;
	error?: string;
} {
	if (!customSlug || !customSlug.trim()) {
		return {
			isValid: false,
			error: 'Slug cannot be empty'
		};
	}

	// Clean the slug
	const cleaned = customSlug
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.substring(0, 100);

	if (!cleaned) {
		return {
			isValid: false,
			error: 'Slug contains only invalid characters'
		};
	}

	if (!isValidSlugFormat(cleaned)) {
		return {
			isValid: false,
			error: 'Slug must contain only letters, numbers, and hyphens'
		};
	}

	return {
		isValid: true,
		cleanedSlug: cleaned
	};
}
