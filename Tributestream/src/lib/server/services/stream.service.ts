/**
 * Stream Service — Drizzle queries for stream CRUD + Mux integration.
 * Manages one stream per service location/day, linked via calculator fields.
 */

import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';
import { createLiveStream, deleteLiveStream } from '$lib/server/mux';
import type { MemorialServices } from '$lib/features/booking/types';

// ============================================================================
// READ
// ============================================================================

export async function getStreamsForMemorial(memorialId: string) {
	return db.select().from(table.stream).where(eq(table.stream.memorialId, memorialId));
}

export async function getStreamById(streamId: string) {
	const [row] = await db.select().from(table.stream).where(eq(table.stream.id, streamId));
	return row ?? null;
}

// ============================================================================
// CREATE
// ============================================================================

export interface CreateStreamInput {
	memorialId: string;
	title: string;
	description?: string;
	scheduledStartTime?: Date;
	calculatorServiceType?: string;
	calculatorServiceIndex?: number | null;
	createdBy?: string;
}

export async function createStream(input: CreateStreamInput) {
	const now = new Date();
	const id = generateId();

	// Get memorial slug for Mux passthrough
	const [memorial] = await db
		.select({ slug: table.memorial.slug })
		.from(table.memorial)
		.where(eq(table.memorial.id, input.memorialId));

	const slug = memorial?.slug ?? input.memorialId;

	// Create Mux live stream
	const muxResult = await createLiveStream(slug);

	const newStream: table.NewStream = {
		id,
		memorialId: input.memorialId,
		title: input.title,
		description: input.description ?? null,
		status: input.scheduledStartTime ? 'scheduled' : 'idle',
		scheduledStartTime: input.scheduledStartTime ?? null,
		muxLiveStreamId: muxResult?.liveStreamId ?? null,
		muxStreamKey: muxResult?.streamKey ?? null,
		muxPlaybackId: muxResult?.playbackId ?? null,
		muxRecordingReady: false,
		calculatorServiceType: input.calculatorServiceType ?? null,
		calculatorServiceIndex: input.calculatorServiceIndex ?? null,
		createdBy: input.createdBy ?? null,
		createdAt: now,
		updatedAt: now
	};

	await db.insert(table.stream).values(newStream);

	return { ...newStream, muxCreated: !!muxResult };
}

// ============================================================================
// UPDATE
// ============================================================================

export async function updateStream(
	streamId: string,
	data: Partial<Pick<table.NewStream, 'title' | 'description' | 'status' | 'scheduledStartTime'>>
) {
	await db
		.update(table.stream)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(table.stream.id, streamId));
}

// ============================================================================
// DELETE
// ============================================================================

export async function deleteStreamById(streamId: string) {
	const stream = await getStreamById(streamId);
	if (!stream) return false;

	// Cleanup Mux live stream if it exists
	if (stream.muxLiveStreamId) {
		await deleteLiveStream(stream.muxLiveStreamId);
	}

	await db.delete(table.stream).where(eq(table.stream.id, streamId));
	return true;
}

// ============================================================================
// SYNC — diff existing streams vs current schedule
// ============================================================================

interface StreamSyncResult {
	created: table.Stream[];
	updated: string[];
	deleted: string[];
	errors: string[];
}

export async function syncStreamsWithSchedule(
	memorialId: string,
	services: MemorialServices,
	userId: string
): Promise<StreamSyncResult> {
	const result: StreamSyncResult = { created: [], updated: [], deleted: [], errors: [] };

	const existingStreams = await getStreamsForMemorial(memorialId);

	// Build desired streams from services
	const desiredStreams: CreateStreamInput[] = [];

	// Main service
	const main = services.main;
	let scheduledTime: Date | undefined;
	if (main.time.date && main.time.time) {
		scheduledTime = new Date(`${main.time.date}T${main.time.time}`);
	}

	const mainLocationName = main.location.name || 'Location 1';
	desiredStreams.push({
		memorialId,
		title: `${mainLocationName} Service`,
		description: `Memorial service at ${mainLocationName}${main.location.address ? ` - ${main.location.address}` : ''}`,
		scheduledStartTime: scheduledTime,
		calculatorServiceType: 'main',
		calculatorServiceIndex: null,
		createdBy: userId
	});

	// Additional services
	services.additional.forEach((service, index) => {
		const typeLabel = service.type === 'location' ? 'Additional Location' : 'Additional Day';
		const locationName = service.location.name || `Location ${index + 2}`;
		let addlScheduledTime: Date | undefined;
		if (service.time.date && service.time.time) {
			addlScheduledTime = new Date(`${service.time.date}T${service.time.time}`);
		}

		desiredStreams.push({
			memorialId,
			title: `${typeLabel} - ${locationName}`,
			description: `${typeLabel} service at ${locationName}${service.location.address ? ` - ${service.location.address}` : ''}`,
			scheduledStartTime: addlScheduledTime,
			calculatorServiceType: service.type,
			calculatorServiceIndex: index,
			createdBy: userId
		});
	});

	// Match desired vs existing by calculator_service_type + calculator_service_index
	const normalize = (val: number | null | undefined) =>
		val === null || val === undefined ? null : val;

	for (const desired of desiredStreams) {
		const existing = existingStreams.find(
			(s) =>
				s.calculatorServiceType === desired.calculatorServiceType &&
				normalize(s.calculatorServiceIndex) === normalize(desired.calculatorServiceIndex)
		);

		if (existing) {
			// Update title/description/scheduledTime if changed
			const needsUpdate =
				existing.title !== desired.title ||
				existing.description !== (desired.description ?? null);

			if (needsUpdate) {
				try {
					await updateStream(existing.id, {
						title: desired.title,
						description: desired.description ?? null,
						scheduledStartTime: desired.scheduledStartTime ?? null
					});
					result.updated.push(existing.id);
				} catch (e) {
					result.errors.push(`Failed to update stream ${existing.id}: ${e}`);
				}
			}
		} else {
			// Create new stream
			try {
				const created = await createStream(desired);
				result.created.push(created as unknown as table.Stream);
			} catch (e) {
				result.errors.push(`Failed to create stream for ${desired.title}: ${e}`);
			}
		}
	}

	// Find orphaned streams (have calculator linking but no longer match any desired)
	const orphaned = existingStreams.filter((existing) => {
		if (!existing.calculatorServiceType) return false;
		return !desiredStreams.some(
			(d) =>
				d.calculatorServiceType === existing.calculatorServiceType &&
				normalize(d.calculatorServiceIndex) === normalize(existing.calculatorServiceIndex)
		);
	});

	for (const orphan of orphaned) {
		try {
			await deleteStreamById(orphan.id);
			result.deleted.push(orphan.id);
		} catch (e) {
			result.errors.push(`Failed to delete orphaned stream ${orphan.id}: ${e}`);
		}
	}

	return result;
}
