import { json, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import type { RequestHandler } from './$types';

// Helper function to check for admin privileges
function requireAdmin(locals: App.Locals) {
	if (!locals.user?.admin) {
		throw error(403, 'Permission denied. You must be an admin to perform this action.');
	}
}

export const POST: RequestHandler = async ({ locals, params, request }) => {
	console.log('POST /api/memorials/[memorialId]/embeds called POST 🚀');
	requireAdmin(locals);

	const { memorialId } = params;
	const { title, type, embedUrl } = await request.json();

	if (!title || !type || !embedUrl) {
		throw error(400, 'Missing required fields: title, type, and embedUrl are required.');
	}

	try {
		const embedRef = await adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('embeds')
			.add({
				title,
				type,
				embedUrl,
				createdAt: FieldValue.serverTimestamp(),
				updatedAt: FieldValue.serverTimestamp()
			});

		const newEmbed = await embedRef.get();
		return json({ id: newEmbed.id, ...newEmbed.data() }, { status: 201 });
	} catch (err) {
		console.error('Error creating embed:', err);
		throw error(500, 'Failed to create embed.');
	}
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	console.log('PUT /api/memorials/[memorialId]/embeds called PUT 🚀');
	requireAdmin(locals);

	const { memorialId } = params;
	const { embedId, data } = await request.json();

	if (!embedId || !data) {
		throw error(400, 'Missing required fields: embedId and data are required.');
	}

	try {
		const embedRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('embeds')
			.doc(embedId);
		await embedRef.update({
			...data,
			updatedAt: FieldValue.serverTimestamp()
		});

		const updatedEmbed = await embedRef.get();
		return json({ id: updatedEmbed.id, ...updatedEmbed.data() });
	} catch (err) {
		console.error('Error updating embed:', err);
		throw error(500, 'Failed to update embed.');
	}
};

export const DELETE: RequestHandler = async ({ locals, params, request }) => {
	console.log('DELETE /api/memorials/[memorialId]/embeds called DELETE 🚀');
	requireAdmin(locals);

	const { memorialId } = params;
	const { embedId } = await request.json();

	if (!embedId) {
		throw error(400, 'Missing required field: embedId is required.');
	}

	try {
		await adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('embeds')
			.doc(embedId)
			.delete();
		return json({ success: true }, { status: 200 });
	} catch (err) {
		console.error('Error deleting embed:', err);
		throw error(500, 'Failed to delete embed.');
	}
};
