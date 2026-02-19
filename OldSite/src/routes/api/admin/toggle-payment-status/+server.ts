import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

/**
 * TOGGLE MEMORIAL PAYMENT STATUS
 * Admin endpoint to manually mark memorials as paid/unpaid
 */
export async function POST({ request, locals }: any) {
	console.log('💳 [ADMIN API] Toggle payment status request received');

	try {
		// === AUTHENTICATION ===
		if (!locals.user) {
			console.log('🚫 [ADMIN API] No authenticated user');
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		if (locals.user.role !== 'admin') {
			console.log('🚫 [ADMIN API] User lacks admin privileges');
			return json({ error: 'Admin privileges required' }, { status: 403 });
		}

		// === PARSE REQUEST ===
		const { memorialId, isPaid, paymentMethod, paymentNotes } = await request.json();
		console.log('💳 [ADMIN API] Toggling payment for memorial:', memorialId, 'to:', isPaid);

		if (!memorialId) {
			return json({ error: 'Memorial ID is required' }, { status: 400 });
		}

		if (typeof isPaid !== 'boolean') {
			return json({ error: 'isPaid must be a boolean value' }, { status: 400 });
		}

		// === UPDATE MEMORIAL PAYMENT STATUS ===
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.log('❌ [ADMIN API] Memorial not found');
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const updateData: any = {
			isPaid,
			paymentStatus: isPaid ? 'paid' : 'unpaid',
			updatedAt: new Date()
		};

		// If marking as paid, add payment details
		if (isPaid) {
			updateData['calculatorConfig.isPaid'] = true;
			updateData['calculatorConfig.status'] = 'paid';
			updateData.manualPayment = {
				markedPaidBy: locals.user.email,
				markedPaidAt: new Date(),
				method: paymentMethod || 'manual',
				notes: paymentNotes || 'Manually marked as paid by admin'
			};
		} else {
			// If marking as unpaid, clear manual payment data
			updateData['calculatorConfig.isPaid'] = false;
			updateData['calculatorConfig.status'] = 'unpaid';
			updateData.manualPayment = null;
		}

		await memorialRef.update(updateData);

		console.log(`✅ [ADMIN API] Memorial payment status updated to: ${isPaid ? 'PAID' : 'UNPAID'}`);

		// Log the action for audit trail
		try {
			await adminDb.collection('audit_logs').add({
				action: isPaid ? 'mark_paid' : 'mark_unpaid',
				resourceType: 'memorial',
				resourceId: memorialId,
				performedBy: locals.user.email,
				performedAt: new Date(),
				details: {
					memorialId,
					isPaid,
					paymentMethod: paymentMethod || 'manual',
					notes: paymentNotes
				}
			});
		} catch (logError) {
			console.error('⚠️ [ADMIN API] Failed to create audit log:', logError);
		}

		return json({
			success: true,
			message: `Memorial marked as ${isPaid ? 'paid' : 'unpaid'}`,
			memorialId,
			isPaid
		});
	} catch (error: any) {
		console.error('💥 [ADMIN API] Error toggling payment status:', error);
		return json(
			{
				error: 'Failed to update payment status',
				details: error.message
			},
			{ status: 500 }
		);
	}
}
