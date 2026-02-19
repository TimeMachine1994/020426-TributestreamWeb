import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { CustomPricing } from '$lib/config/pricing';

/**
 * GET - Fetch current custom pricing for a memorial
 * Admin only endpoint
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	// Check admin authentication
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	const memorialId = params.id;
	if (!memorialId) {
		throw error(400, 'Memorial ID required');
	}

	try {
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const customPricing = memorialDoc.data()?.customPricing || null;

		return json({
			success: true,
			customPricing
		});
	} catch (err: any) {
		console.error('Error fetching custom pricing:', err);
		const status = err.status || 500;
		const message = err.body?.message || err.message || 'Failed to fetch custom pricing';
		return json({ success: false, message }, { status });
	}
};

/**
 * POST - Set custom pricing for a memorial
 * Admin only endpoint
 */
export const POST: RequestHandler = async ({ params, locals, request }) => {
	// Check admin authentication
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	const memorialId = params.id;
	if (!memorialId) {
		throw error(400, 'Memorial ID required');
	}

	try {
		const { customPricing } = await request.json();

		// Validate customPricing structure
		if (!customPricing || typeof customPricing.enabled !== 'boolean') {
			throw error(400, 'Invalid custom pricing data');
		}

		// Validate price values if provided
		if (customPricing.tiers) {
			for (const [tier, price] of Object.entries(customPricing.tiers)) {
				if (typeof price !== 'number' || price < 0 || price > 50000) {
					throw error(400, `Invalid price for tier ${tier}: must be between 0 and 50000`);
				}
			}
		}

		if (customPricing.addons) {
			for (const [addon, price] of Object.entries(customPricing.addons)) {
				if (typeof price !== 'number' || price < 0 || price > 50000) {
					throw error(400, `Invalid price for addon ${addon}: must be between 0 and 50000`);
				}
			}
		}

		if (customPricing.rates) {
			if (
				customPricing.rates.hourlyOverage &&
				(customPricing.rates.hourlyOverage < 0 || customPricing.rates.hourlyOverage > 5000)
			) {
				throw error(
					400,
					'Invalid hourly overage rate: must be between 0 and 5000'
				);
			}
			if (
				customPricing.rates.additionalServiceFee &&
				(customPricing.rates.additionalServiceFee < 0 ||
					customPricing.rates.additionalServiceFee > 5000)
			) {
				throw error(
					400,
					'Invalid additional service fee: must be between 0 and 5000'
				);
			}
		}

		// Add metadata
		const pricingData: CustomPricing = {
			...customPricing,
			setBy: locals.user.uid,
			setAt: new Date()
		};

		// Check if memorial exists
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		// Update memorial with custom pricing
		await adminDb.collection('memorials').doc(memorialId).update({
			customPricing: pricingData,
			updatedAt: new Date()
		});

		// Log audit trail
		await adminDb.collection('auditLogs').add({
			action: 'UPDATE_CUSTOM_PRICING',
			performedBy: locals.user.uid,
			performedByEmail: locals.user.email,
			targetId: memorialId,
			targetType: 'memorial',
			changes: {
				customPricing: pricingData
			},
			timestamp: new Date()
		});

		return json({
			success: true,
			customPricing: pricingData,
			message: 'Custom pricing updated successfully'
		});
	} catch (err: any) {
		console.error('Error setting custom pricing:', err);
		const status = err.status || 500;
		const message = err.body?.message || err.message || 'Failed to set custom pricing';
		return json({ success: false, message }, { status });
	}
};

/**
 * DELETE - Remove custom pricing (revert to defaults)
 * Admin only endpoint
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	// Check admin authentication
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}

	const memorialId = params.id;
	if (!memorialId) {
		throw error(400, 'Memorial ID required');
	}

	try {
		// Check if memorial exists
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		// Remove custom pricing
		await adminDb.collection('memorials').doc(memorialId).update({
			customPricing: null,
			updatedAt: new Date()
		});

		// Log audit trail
		await adminDb.collection('auditLogs').add({
			action: 'DELETE_CUSTOM_PRICING',
			performedBy: locals.user.uid,
			performedByEmail: locals.user.email,
			targetId: memorialId,
			targetType: 'memorial',
			timestamp: new Date()
		});

		return json({
			success: true,
			message: 'Custom pricing removed, reverted to defaults'
		});
	} catch (err: any) {
		console.error('Error removing custom pricing:', err);
		const status = err.status || 500;
		const message = err.body?.message || err.message || 'Failed to remove custom pricing';
		return json({ success: false, message }, { status });
	}
};
