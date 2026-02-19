import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';

// GET - Retrieve receipt note
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	const { receiptId } = params;

	try {
		const memorialDoc = await adminDb.collection('memorials').doc(receiptId).get();

		if (!memorialDoc.exists) {
			return json({ error: 'Receipt not found' }, { status: 404 });
		}

		const data = memorialDoc.data();
		return json({
			success: true,
			note: data?.receiptNote || null
		});
	} catch (error) {
		console.error('Error fetching receipt note:', error);
		return json({ error: 'Failed to fetch note' }, { status: 500 });
	}
};

// POST - Save or update receipt note
export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	const { receiptId } = params;

	try {
		const { note } = await request.json();

		const memorialRef = adminDb.collection('memorials').doc(receiptId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Receipt not found' }, { status: 404 });
		}

		// Save the note with metadata
		await memorialRef.update({
			receiptNote: {
				content: note || '',
				updatedAt: Timestamp.now(),
				updatedBy: locals.user.uid,
				updatedByEmail: locals.user.email
			}
		});

		return json({
			success: true,
			message: 'Note saved successfully'
		});
	} catch (error) {
		console.error('Error saving receipt note:', error);
		return json({ error: 'Failed to save note' }, { status: 500 });
	}
};

// DELETE - Remove receipt note
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Admin access required' }, { status: 403 });
	}

	const { receiptId } = params;

	try {
		const memorialRef = adminDb.collection('memorials').doc(receiptId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Receipt not found' }, { status: 404 });
		}

		// Remove the note
		await memorialRef.update({
			receiptNote: null
		});

		return json({
			success: true,
			message: 'Note deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting receipt note:', error);
		return json({ error: 'Failed to delete note' }, { status: 500 });
	}
};
