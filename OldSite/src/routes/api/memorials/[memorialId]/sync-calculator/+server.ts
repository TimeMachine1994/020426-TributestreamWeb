import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';

// POST - Sync stream changes back to calculator data
export const POST: RequestHandler = async ({ request, locals, params }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { memorialId } = params;
		const { streamId, scheduledStartTime } = await request.json();

		if (!streamId || !scheduledStartTime) {
			return json({ error: 'Stream ID and scheduled start time are required' }, { status: 400 });
		}

		// Get the stream to find calculator linking info
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();
		
		if (!streamDoc.exists) {
			return json({ error: 'Stream not found' }, { status: 404 });
		}

		const stream = streamDoc.data()!;

		// Check if stream belongs to this memorial
		if (stream.memorialId !== memorialId) {
			return json({ error: 'Stream does not belong to this memorial' }, { status: 400 });
		}

		// Check if stream has calculator linking info
		if (!stream.calculatorServiceType) {
			return json({ error: 'Stream is not linked to calculator data' }, { status: 400 });
		}

		// Get memorial to verify ownership and update calculator data
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data()!;

		// Check if user has permission to edit this memorial
		const canEdit =
			memorial.ownerUid === locals.user.uid ||
			memorial.funeralDirectorUid === locals.user.uid ||
			locals.user.role === 'admin';

		if (!canEdit) {
			return json({ error: 'Permission denied' }, { status: 403 });
		}

		// Parse the new date/time
		const newDateTime = new Date(scheduledStartTime);
		const newDate = newDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
		const newTime = newDateTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

		// Update the appropriate service in memorial.services
		const updateData: any = {
			updatedAt: Timestamp.now()
		};

		if (stream.calculatorServiceType === 'main') {
			// Update main service
			updateData['services.main.time.date'] = newDate;
			updateData['services.main.time.time'] = newTime;
		} else if (stream.calculatorServiceType === 'location' || stream.calculatorServiceType === 'day') {
			// Update additional service
			const serviceIndex = stream.calculatorServiceIndex;
			if (serviceIndex !== null && serviceIndex !== undefined) {
				updateData[`services.additional.${serviceIndex}.time.date`] = newDate;
				updateData[`services.additional.${serviceIndex}.time.time`] = newTime;
			}
		}

		// Update memorial with new calculator data
		await adminDb.collection('memorials').doc(memorialId).update(updateData);

		console.log('🔄 [SYNC] Updated calculator data from stream change:', {
			streamId,
			serviceType: stream.calculatorServiceType,
			serviceIndex: stream.calculatorServiceIndex,
			newDate,
			newTime
		});

		return json({
			success: true,
			message: 'Calculator data synced successfully',
			updatedService: {
				type: stream.calculatorServiceType,
				index: stream.calculatorServiceIndex,
				date: newDate,
				time: newTime
			}
		});
	} catch (error) {
		console.error('Calculator sync error:', error);
		return json({ error: 'Failed to sync calculator data' }, { status: 500 });
	}
};
