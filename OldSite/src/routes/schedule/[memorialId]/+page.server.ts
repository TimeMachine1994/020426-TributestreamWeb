import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';
import { error } from '@sveltejs/kit';

// Helper function to convert Timestamps and Dates to strings
function sanitizeData(data: any): any {
	if (!data) return data;
	if (Array.isArray(data)) return data.map(sanitizeData);
	if (typeof data === 'object') {
		if (data.toDate) return data.toDate().toISOString(); // Firestore Timestamp
		if (data instanceof Date) return data.toISOString(); // JavaScript Date

		const sanitized: { [key: string]: any } = {};
		for (const key in data) {
			sanitized[key] = sanitizeData(data[key]);
		}
		return sanitized;
	}
	return data;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { memorialId } = params;

	// Check authentication
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	try {
		console.log('📅 [SCHEDULE LOAD] Starting load for memorial:', memorialId);
		
		// Get memorial data
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [SCHEDULE LOAD] Memorial not found:', memorialId);
			throw error(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();

		if (!memorial) {
			console.log('❌ [SCHEDULE LOAD] Memorial data is empty:', memorialId);
			throw error(404, 'Memorial data not found');
		}

		console.log('✅ [SCHEDULE LOAD] Memorial loaded:', memorial.lovedOneName);

		// Check permissions
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		console.log('🛡️ [SCHEDULE LOAD] Permission Check:');
		console.log(`   - User ID: ${userId}, Role: ${userRole}`);
		console.log(`   - Memorial Owner UID: ${memorial.ownerUid || 'undefined'}`);
		console.log(`   - Memorial FD UID: ${memorial.funeralDirectorUid || 'undefined'}`);

		const hasPermission =
			userRole === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('🚫 [SCHEDULE LOAD] Permission denied for user:', userId);
			throw error(403, 'Insufficient permissions to access this memorial');
		}

		console.log('✅ [SCHEDULE LOAD] Permission granted');

		// Check for custom pricing
		if (memorial.customPricing) {
			console.log('💰 [SCHEDULE LOAD] Custom pricing detected!');
			console.log('   - Enabled:', memorial.customPricing.enabled);
			if (memorial.customPricing.enabled) {
				console.log('   - Custom tiers:', memorial.customPricing.tiers);
				console.log('   - Custom addons:', memorial.customPricing.addons);
				console.log('   - Custom rates:', memorial.customPricing.rates);
				console.log('   - Notes:', memorial.customPricing.notes);
			}
		} else {
			console.log('💰 [SCHEDULE LOAD] No custom pricing - using defaults');
		}

		// Return memorial data and any existing calculator config
		const responseData = sanitizeData({
			memorial: {
				id: memorialId,
				lovedOneName: memorial?.lovedOneName || 'Unnamed Memorial',
				ownerUid: memorial?.ownerUid,
				funeralDirectorUid: memorial?.funeralDirectorUid,
				services: memorial?.services || null, // Include services data
				isPaid: memorial?.isPaid || false, // Payment status
				paymentStatus: memorial?.paymentStatus || 'unpaid',
				paidAt: memorial?.paidAt || null,
				manualPayment: memorial?.manualPayment || null,
				fullSlug: memorial?.fullSlug || null,
				customPricing: memorial?.customPricing || null // ← CRITICAL: Pass custom pricing to page
			},
			calculatorConfig: memorial?.calculatorConfig || null,
			role: locals.user.role, // Pass role to the page
			user: {
				email: locals.user.email,
				uid: locals.user.uid
			}
		});

		console.log('📤 [SCHEDULE LOAD] Sending data to page with customPricing:', 
			responseData.memorial.customPricing ? 'YES' : 'NO');

		return responseData;
	} catch (err) {
		console.error('Error loading memorial data:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to load memorial data');
	}
};
