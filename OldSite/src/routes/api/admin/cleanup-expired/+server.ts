import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, adminAuth } from '$lib/server/firebase';

/**
 * POST /api/admin/cleanup-expired
 * 
 * Automatically cleanup items that have been soft-deleted for more than 30 days
 * This endpoint can be called manually or via a cron job
 */
export const POST: RequestHandler = async ({ locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Check admin privileges
		if (locals.user.role !== 'admin') {
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		console.log('🧹 [CLEANUP] Starting expired items cleanup...');
		
		// Calculate 30 days ago
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const collections = ['memorials', 'streams', 'users', 'blog', 'slideshows'];
		let totalDeleted = 0;
		const deletedByCollection: Record<string, number> = {};

		for (const collectionName of collections) {
			try {
				console.log(`🔍 [CLEANUP] Checking ${collectionName} collection...`);
				
				const snapshot = await adminDb
					.collection(collectionName)
					.where('isDeleted', '==', true)
					.where('deletedAt', '<', thirtyDaysAgo)
					.get();

				if (snapshot.empty) {
					console.log(`✅ [CLEANUP] No expired items in ${collectionName}`);
					deletedByCollection[collectionName] = 0;
					continue;
				}

				console.log(`📝 [CLEANUP] Found ${snapshot.size} expired items in ${collectionName}`);

				// Delete each expired item
				for (const doc of snapshot.docs) {
					try {
						const data = doc.data();
						
						// Perform collection-specific cleanup
						await performCleanup(collectionName, doc.id, data);
						
						// Delete the document
						await doc.ref.delete();
						totalDeleted++;
						
						console.log(`✅ [CLEANUP] Deleted expired item: ${collectionName}/${doc.id}`);
					} catch (error: any) {
						console.error(`❌ [CLEANUP] Failed to delete ${collectionName}/${doc.id}:`, error.message);
					}
				}

				deletedByCollection[collectionName] = snapshot.size;
			} catch (error: any) {
				console.error(`❌ [CLEANUP] Error processing ${collectionName}:`, error);
				deletedByCollection[collectionName] = 0;
			}
		}

		console.log(`🧹 [CLEANUP] Completed: ${totalDeleted} items permanently deleted`);
		console.log(`📊 [CLEANUP] Breakdown:`, deletedByCollection);

		return json({
			success: true,
			deletedCount: totalDeleted,
			deletedByCollection,
			message: `Permanently deleted ${totalDeleted} expired items`,
			cutoffDate: thirtyDaysAgo.toISOString()
		});
	} catch (error: any) {
		console.error('❌ [CLEANUP] Error:', error);

		return json(
			{
				error: 'Failed to cleanup expired items',
				details: error.message
			},
			{ status: 500 }
		);
	}
};

/**
 * Perform resource-specific cleanup before permanent deletion
 */
async function performCleanup(
	collectionName: string,
	docId: string,
	data: any
): Promise<void> {
	// Cleanup for streams - remove Cloudflare resources
	if (collectionName === 'streams') {
		if (data.streamCredentials?.cloudflareInputId) {
			try {
				const cloudflareInputId = data.streamCredentials.cloudflareInputId;
				console.log(`🧹 [CLEANUP] Cleaning Cloudflare stream: ${cloudflareInputId}`);
				
				// TODO: Add Cloudflare Live Input deletion API call
				// For now, just log it
				console.log(`⚠️ [CLEANUP] Cloudflare stream cleanup placeholder`);
			} catch (error: any) {
				console.warn(`⚠️ [CLEANUP] Cloudflare cleanup failed:`, error.message);
			}
		}
	}

	// Cleanup for users - remove from Firebase Auth
	if (collectionName === 'users') {
		try {
			console.log(`🧹 [CLEANUP] Deleting Firebase Auth user: ${docId}`);
			await adminAuth.deleteUser(docId);
			console.log(`✅ [CLEANUP] Firebase Auth user deleted`);
		} catch (error: any) {
			// User might not exist in Auth
			console.warn(`⚠️ [CLEANUP] Firebase Auth deletion failed:`, error.message);
		}
	}

	// For slideshows and memorials, no special cleanup needed
	// Firestore subcollections are automatically handled or referenced elsewhere
}
