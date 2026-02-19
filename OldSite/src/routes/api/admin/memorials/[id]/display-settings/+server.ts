import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

/**
 * GET - Fetch current display settings for a memorial
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

		const data = memorialDoc.data();

		return json({
			success: true,
			customTitle: data?.customTitle || null
		});
	} catch (err: any) {
		console.error('Error fetching display settings:', err);
		throw error(err.status || 500, err.message || 'Failed to fetch display settings');
	}
};

/**
 * POST - Set display settings (customTitle) for a memorial
 * Admin only endpoint
 * NOTE: publicNote is deprecated and managed via text blocks now.
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
		const { customTitle } = await request.json();

		// Validate inputs
		if (customTitle !== undefined && customTitle !== null && typeof customTitle !== 'string') {
			throw error(400, 'Custom title must be a string');
		}

		// Limit lengths
		if (customTitle && customTitle.length > 200) {
			throw error(400, 'Custom title must be 200 characters or less');
		}

		// Check if memorial exists
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		// Build update object - only include fields that were provided
		const updateData: Record<string, any> = {
			updatedAt: new Date()
		};

		if (customTitle !== undefined) {
			updateData.customTitle = customTitle || null; // Convert empty string to null
		}

		// Update memorial
		await adminDb.collection('memorials').doc(memorialId).update(updateData);

		// Log audit trail
		await adminDb.collection('auditLogs').add({
			action: 'UPDATE_DISPLAY_SETTINGS',
			performedBy: locals.user.uid,
			performedByEmail: locals.user.email,
			targetId: memorialId,
			targetType: 'memorial',
			changes: {
				customTitle: customTitle !== undefined ? customTitle : '(unchanged)'
			},
			timestamp: new Date()
		});

		return json({
			success: true,
			customTitle: customTitle || null,
			message: 'Display settings updated successfully'
		});
	} catch (err: any) {
		console.error('Error setting display settings:', err);
		throw error(err.status || 500, err.message || 'Failed to set display settings');
	}
};

/**
 * DELETE - Clear display settings (revert to defaults)
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

		// Clear display settings
		await adminDb.collection('memorials').doc(memorialId).update({
			customTitle: null,
			updatedAt: new Date()
		});

		// Log audit trail
		await adminDb.collection('auditLogs').add({
			action: 'DELETE_DISPLAY_SETTINGS',
			performedBy: locals.user.uid,
			performedByEmail: locals.user.email,
			targetId: memorialId,
			targetType: 'memorial',
			timestamp: new Date()
		});

		return json({
			success: true,
			message: 'Display settings cleared'
		});
	} catch (err: any) {
		console.error('Error clearing display settings:', err);
		throw error(err.status || 500, err.message || 'Failed to clear display settings');
	}
};
