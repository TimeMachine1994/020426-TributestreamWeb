// Stream Creation Mapping Utilities
// Converts schedule component data into stream creation API requests

import type { StreamCreateRequest, StreamSyncResult, Stream } from '$lib/types/stream';
import type { ServiceDetails, AdditionalServiceDetails } from '$lib/types/memorial';

// Schedule component data structures
export interface ScheduleServiceData {
	location: {
		name: string;
		address: string;
		isUnknown: boolean;
	};
	time: {
		date: string | null;
		time: string | null;
		isUnknown: boolean;
	};
	hours: number;
}

export interface ScheduleData {
	services: {
		main: ScheduleServiceData;
		additional: Array<{
			type: 'location' | 'day';
			location: ScheduleServiceData['location'];
			time: ScheduleServiceData['time'];
			hours: number;
		}>;
	};
	calculatorData?: {
		selectedTier?: string;
		addons?: Record<string, any>;
	};
	memorialName?: string;
}

// Enhanced stream creation request with calculator linking
export interface EnhancedStreamCreateRequest extends StreamCreateRequest {
	calculatorServiceType?: 'main' | 'location' | 'day';
	calculatorServiceIndex?: number | null;
}

/**
 * Maps schedule component data to stream creation requests
 * @param scheduleData - The schedule data from the component
 * @returns Array of stream creation requests
 */
export function mapScheduleToStreams(scheduleData: ScheduleData): EnhancedStreamCreateRequest[] {
	const streamsToCreate: EnhancedStreamCreateRequest[] = [];
	const { services, memorialName } = scheduleData;

	console.log('🔄 [STREAM_MAPPER] Processing schedule data:', {
		mainService: services.main,
		additionalServices: services.additional.length,
		memorialName
	});

	// 1. Process main service
	const mainStreamRequest = createStreamFromService(
		services.main,
		'main',
		null,
		memorialName
	);

	if (mainStreamRequest) {
		streamsToCreate.push(mainStreamRequest);
		console.log('✅ [STREAM_MAPPER] Main service stream created:', mainStreamRequest.title);
	} else {
		console.log('⚠️ [STREAM_MAPPER] Main service missing required data');
	}

	// 2. Process additional services
	services.additional.forEach((service, index) => {
		const additionalStreamRequest = createStreamFromService(
			service,
			service.type,
			index,
			memorialName
		);

		if (additionalStreamRequest) {
			streamsToCreate.push(additionalStreamRequest);
			console.log(
				`✅ [STREAM_MAPPER] Additional ${service.type} stream created:`,
				additionalStreamRequest.title
			);
		} else {
			console.log(
				`⚠️ [STREAM_MAPPER] Additional ${service.type} service missing required data`
			);
		}
	});

	console.log(`🎬 [STREAM_MAPPER] Generated ${streamsToCreate.length} stream requests`);
	return streamsToCreate;
}

/**
 * Creates a stream request from a service data object
 * @param service - Service data (main or additional)
 * @param serviceType - Type of service ('main', 'location', 'day')
 * @param serviceIndex - Index for additional services (null for main)
 * @param memorialName - Name of the memorial for context
 * @returns Stream creation request or null if invalid
 */
function createStreamFromService(
	service: ScheduleServiceData | { type: 'location' | 'day'; location: any; time: any; hours: number },
	serviceType: 'main' | 'location' | 'day',
	serviceIndex: number | null,
	memorialName?: string
): EnhancedStreamCreateRequest | null {
	// Extract location and time data
	const location = service.location;
	const time = service.time;
	const hours = service.hours;

	// Auto-generate location name if missing
	let locationName = location?.name;
	if (!locationName || locationName.trim() === '') {
		// Generate default location names based on service type
		switch (serviceType) {
			case 'main':
				locationName = 'Location 1';
				break;
			case 'location':
				locationName = `Location ${(serviceIndex || 0) + 2}`; // Location 2, 3, etc.
				break;
			case 'day':
				locationName = `Location ${(serviceIndex || 0) + 2}`; // Location 2, 3, etc.
				break;
			default:
				locationName = 'Location 1';
		}
		console.log(`🔧 [STREAM_MAPPER] Auto-generated location name: "${locationName}" for service type: ${serviceType}`);
	}

	console.log('✅ [STREAM_MAPPER] Using location name:', locationName);

	// Create scheduled start time only if both date and time are provided
	let scheduledStartTime: string | undefined;
	if (time?.date && time?.time) {
		scheduledStartTime = new Date(`${time.date}T${time.time}`).toISOString();
		console.log('✅ [STREAM_MAPPER] Scheduled start time created:', scheduledStartTime);
	} else {
		console.log('ℹ️ [STREAM_MAPPER] No date/time provided, creating unscheduled stream');
	}

	// Generate title based on service type using the locationName (auto-generated or provided)
	let title: string;
	let description: string;

	switch (serviceType) {
		case 'main':
			title = `${locationName} Service`;
			description = `Memorial service at ${locationName}`;
			break;
		case 'location':
			title = `Additional Location - ${locationName}`;
			description = `Additional location service at ${locationName}`;
			break;
		case 'day':
			title = `Additional Day - ${locationName}`;
			description = `Additional day service at ${locationName}`;
			break;
		default:
			title = `${locationName} Service`;
			description = `Service at ${locationName}`;
	}

	// Add address to description if available
	if (location.address) {
		description += ` - ${location.address}`;
	}

	// Add memorial context if available
	if (memorialName) {
		description += ` (${memorialName})`;
	}

	// Add duration information
	if (hours && hours !== 2) {
		description += ` - ${hours} hour${hours !== 1 ? 's' : ''}`;
	}

	return {
		title,
		description,
		scheduledStartTime,
		calculatorServiceType: serviceType,
		calculatorServiceIndex: serviceIndex
	};
}

/**
 * Validates schedule data before stream creation
 * @param scheduleData - The schedule data to validate
 * @returns Validation result with errors if any
 */
export function validateScheduleData(scheduleData: ScheduleData): {
	isValid: boolean;
	errors: string[];
	warnings: string[];
} {
	const errors: string[] = [];
	const warnings: string[] = [];

	console.log('🔍 [STREAM_MAPPER] Validating schedule data:', {
		hasServices: !!scheduleData.services,
		hasMain: !!scheduleData.services?.main,
		mainLocation: scheduleData.services?.main?.location?.name,
		additionalCount: scheduleData.services?.additional?.length || 0
	});

	// Check main service
	if (!scheduleData.services?.main) {
		errors.push('Main service data is missing');
	} else {
		const main = scheduleData.services.main;
		if (!main.location?.name) {
			warnings.push('Main service location name is missing');
		}
		if (!main.time?.date || !main.time?.time) {
			warnings.push('Main service date/time is missing - stream will not be scheduled');
		}
	}

	// Check additional services
	if (scheduleData.services?.additional) {
		scheduleData.services.additional.forEach((service, index) => {
			if (!service.location?.name) {
				warnings.push(`Additional service ${index + 1} location name is missing`);
			}
			if (!service.time?.date || !service.time?.time) {
				warnings.push(
					`Additional service ${index + 1} date/time is missing - stream will not be scheduled`
				);
			}
		});
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Generates a hash for service data to detect changes
 * @param service - Service data to hash
 * @returns Simple hash string
 */
function generateServiceHash(service: ServiceDetails | AdditionalServiceDetails): string {
	const hashData = {
		location: service.location,
		time: service.time,
		hours: service.hours
	};
	const jsonString = JSON.stringify(hashData);
	
	// Simple hash function for browser compatibility
	let hash = 0;
	for (let i = 0; i < jsonString.length; i++) {
		const char = jsonString.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash).toString(36);
}

/**
 * Synchronizes streams with schedule data (create, update, delete as needed)
 * @param memorialId - Memorial ID
 * @param scheduleData - Schedule data to sync
 * @returns Promise with sync results
 */
export async function syncStreamsWithSchedule(
	memorialId: string,
	scheduleData: ScheduleData
): Promise<StreamSyncResult> {
	const result: StreamSyncResult = {
		success: true,
		operations: {
			created: [],
			updated: [],
			deleted: []
		},
		errors: []
	};

	if (!memorialId) {
		result.success = false;
		result.errors.push('Memorial ID is required');
		return result;
	}

	try {
		// Get existing streams for this memorial
		const existingStreamsResponse = await fetch(`/api/memorials/${memorialId}/streams`);
		const existingStreamsData = await existingStreamsResponse.json();
		const existingStreams: Stream[] = existingStreamsData.streams || [];

		// Generate stream requests from current schedule
		const desiredStreams = mapScheduleToStreams(scheduleData);

		// Sync logic: compare desired vs existing
		console.log('🔄 [SYNC] Starting sync with', existingStreams.length, 'existing streams and', desiredStreams.length, 'desired streams');
		
		for (const desiredStream of desiredStreams) {
			const serviceHash = generateServiceHash(getServiceFromStream(scheduleData, desiredStream));
			
			console.log('🔍 [SYNC] Looking for existing stream:', {
				serviceType: desiredStream.calculatorServiceType,
				serviceIndex: desiredStream.calculatorServiceIndex,
				title: desiredStream.title
			});
			
			// Find existing stream for this service
			const existingStream = existingStreams.find(stream => {
				const typeMatch = stream.calculatorServiceType === desiredStream.calculatorServiceType;
				// Treat null and undefined as equivalent for index matching
				const normalizeIndex = (val: any) => (val === null || val === undefined) ? null : val;
				const indexMatch = normalizeIndex(stream.calculatorServiceIndex) === normalizeIndex(desiredStream.calculatorServiceIndex);
				
				console.log('🔍 [SYNC] Checking stream:', {
					streamId: stream.id,
					streamType: stream.calculatorServiceType,
					streamIndex: stream.calculatorServiceIndex,
					typeMatch,
					indexMatch,
					bothMatch: typeMatch && indexMatch
				});
				
				return typeMatch && indexMatch;
			});

			if (existingStream) {
				console.log('✅ [SYNC] Found existing stream:', existingStream.id);
				// Check if update is needed
				if (existingStream.serviceHash !== serviceHash) {
					console.log('🔄 [SYNC] Stream needs update (hash changed)');
					// Update existing stream
					const updateResult = await updateStream(existingStream.id, {
						...desiredStream,
						serviceHash,
						lastSyncedAt: new Date().toISOString(),
						syncStatus: 'synced'
					});
					
					if (updateResult.success) {
						result.operations.updated.push(updateResult.stream!);
						console.log('✅ [SYNC] Stream updated successfully');
					} else {
						result.errors.push(`Failed to update stream: ${updateResult.error}`);
						console.error('❌ [SYNC] Update failed:', updateResult.error);
					}
				} else {
					console.log('ℹ️ [SYNC] Stream unchanged, skipping update');
				}
			} else {
				console.log('➕ [SYNC] No existing stream found, creating new one');
				// Create new stream
				const createResult = await createStream(memorialId, {
					...desiredStream,
					serviceHash,
					lastSyncedAt: new Date().toISOString(),
					syncStatus: 'synced'
				});
				
				if (createResult.success) {
					result.operations.created.push(createResult.stream!);
					console.log('✅ [SYNC] Stream created successfully:', createResult.stream!.id);
				} else {
					result.errors.push(`Failed to create stream: ${createResult.error}`);
					console.error('❌ [SYNC] Create failed:', createResult.error);
				}
			}
		}

		// Find orphaned streams (exist but no longer in schedule)
		// ONLY consider streams with calculator linking fields as candidates for deletion
		const normalizeIndex = (val: any) => (val === null || val === undefined) ? null : val;
		const orphanedStreams = existingStreams.filter(existing => {
			// Skip streams without calculator linking fields (manually created or legacy)
			if (!existing.calculatorServiceType) {
				console.log(' [SYNC] Skipping stream without calculator linking:', existing.id, existing.title);
				return false;
			}
			
			// Check if this stream matches any desired stream (using normalized comparison)
			const isOrphaned = !desiredStreams.some(desired => 
				desired.calculatorServiceType === existing.calculatorServiceType &&
				normalizeIndex(desired.calculatorServiceIndex) === normalizeIndex(existing.calculatorServiceIndex)
			);
			
			if (isOrphaned) {
				console.log(' [SYNC] Found orphaned stream:', {
					id: existing.id,
					title: existing.title,
					serviceType: existing.calculatorServiceType,
					serviceIndex: existing.calculatorServiceIndex
				});
			}
			
			return isOrphaned;
		});

		// DISABLED: Delete orphaned streams (no DELETE endpoint exists yet)
		// TODO: Create DELETE endpoint at /api/memorials/[memorialId]/streams/[streamId]
		if (orphanedStreams.length > 0) {
			console.log(' [SYNC] Found', orphanedStreams.length, 'orphaned streams but deletion is disabled (no API endpoint)');
			console.log(' [SYNC] Orphaned streams will remain in database until DELETE endpoint is created');
		}
		// Commenting out deletion code until endpoint exists:
		/*
		console.log(' [SYNC] Deleting', orphanedStreams.length, 'orphaned streams');
		for (const orphanedStream of orphanedStreams) {
			const deleteResult = await deleteStream(orphanedStream.id);
			if (deleteResult.success) {
				result.operations.deleted.push(orphanedStream.id);
				console.log(' [SYNC] Deleted orphaned stream:', orphanedStream.id);
			} else {
				result.errors.push(`Failed to delete orphaned stream: ${deleteResult.error}`);
				console.error(' [SYNC] Delete failed:', deleteResult.error);
			}
		}
		*/

		result.success = result.errors.length === 0;
		return result;

	} catch (error) {
		result.success = false;
		result.errors.push(`Sync error: ${error}`);
		return result;
	}
}

/**
 * Creates streams via API from schedule data (DEPRECATED - use syncStreamsWithSchedule)
 * @param memorialId - Memorial ID
 * @param scheduleData - Schedule data to convert
 * @returns Promise with creation results
 */
export async function createStreamsFromSchedule(
	memorialId: string,
	scheduleData: ScheduleData
): Promise<{
	success: boolean;
	createdStreams: any[];
	failedStreams: any[];
	errors: string[];
}> {
	console.log('🎬 [STREAM_MAPPER] ========== CREATE STREAMS FROM SCHEDULE STARTED ==========');
	console.log('🎬 [STREAM_MAPPER] Memorial ID:', memorialId);
	console.log('🎬 [STREAM_MAPPER] Schedule data received:', JSON.stringify(scheduleData, null, 2));
	
	const results = {
		success: true,
		createdStreams: [] as any[],
		failedStreams: [] as any[],
		errors: [] as string[]
	};

	if (!memorialId) {
		console.log('❌ [STREAM_MAPPER] Memorial ID is required');
		results.success = false;
		results.errors.push('Memorial ID is required');
		return results;
	}

	// Validate schedule data
	console.log('🔍 [STREAM_MAPPER] Validating schedule data...');
	const validation = validateScheduleData(scheduleData);
	console.log('🔍 [STREAM_MAPPER] Validation result:', {
		isValid: validation.isValid,
		errors: validation.errors,
		warnings: validation.warnings
	});
	
	if (!validation.isValid) {
		console.log('❌ [STREAM_MAPPER] Validation failed');
		results.success = false;
		results.errors.push(...validation.errors);
		return results;
	}

	// Log warnings
	validation.warnings.forEach((warning) => {
		console.warn('⚠️ [STREAM_MAPPER]', warning);
	});

	// Generate stream requests
	console.log('🎬 [STREAM_MAPPER] Generating stream requests...');
	const streamRequests = mapScheduleToStreams(scheduleData);
	console.log('🎬 [STREAM_MAPPER] Generated stream requests:', JSON.stringify(streamRequests, null, 2));

	if (streamRequests.length === 0) {
		console.log('ℹ️ [STREAM_MAPPER] No streams to create - no services with complete data');
		return results;
	}

	// Create streams via API
	console.log(`🎬 [STREAM_MAPPER] Creating ${streamRequests.length} streams for memorial:`, memorialId);

	for (const streamRequest of streamRequests) {
		try {
			console.log('📡 [STREAM_MAPPER] Creating stream:', streamRequest.title);
			console.log('📡 [STREAM_MAPPER] Stream request data:', JSON.stringify(streamRequest, null, 2));

			const response = await fetch(`/api/memorials/${memorialId}/streams`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(streamRequest)
			});

			console.log('📡 [STREAM_MAPPER] API response status:', response.status);
			console.log('📡 [STREAM_MAPPER] API response ok:', response.ok);

			if (response.ok) {
				const result = await response.json();
				console.log('📡 [STREAM_MAPPER] API response data:', JSON.stringify(result, null, 2));
				results.createdStreams.push(result.stream);
				console.log('✅ [STREAM_MAPPER] Stream created successfully:', result.stream.title);
			} else {
				const errorText = await response.text();
				console.log('📡 [STREAM_MAPPER] API error response:', errorText);
				const error = `Failed to create stream "${streamRequest.title}": ${response.status} ${errorText}`;
				results.failedStreams.push({ streamRequest, error });
				results.errors.push(error);
				console.error('❌ [STREAM_MAPPER]', error);
			}
		} catch (error) {
			const errorMsg = `Error creating stream "${streamRequest.title}": ${error}`;
			results.failedStreams.push({ streamRequest, error: errorMsg });
			results.errors.push(errorMsg);
			console.error('❌ [STREAM_MAPPER]', errorMsg);
		}
	}

	// Determine overall success
	results.success = results.errors.length === 0;

	console.log('🎬 [STREAM_MAPPER] Stream creation completed:', {
		success: results.success,
		created: results.createdStreams.length,
		failed: results.failedStreams.length,
		errorCount: results.errors.length
	});

	return results;
}

/**
 * Helper function to get service data from stream request
 */
function getServiceFromStream(scheduleData: ScheduleData, streamRequest: EnhancedStreamCreateRequest): ServiceDetails | AdditionalServiceDetails {
	if (streamRequest.calculatorServiceType === 'main') {
		return scheduleData.services.main;
	} else {
		const index = streamRequest.calculatorServiceIndex!;
		return scheduleData.services.additional[index];
	}
}

/**
 * Create a new stream via API
 */
async function createStream(memorialId: string, streamData: any): Promise<{ success: boolean; stream?: Stream; error?: string }> {
	try {
		const response = await fetch(`/api/memorials/${memorialId}/streams`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(streamData)
		});

		if (response.ok) {
			const result = await response.json();
			return { success: true, stream: result.stream };
		} else {
			const errorText = await response.text();
			return { success: false, error: `${response.status} ${errorText}` };
		}
	} catch (error) {
		return { success: false, error: `${error}` };
	}
}

/**
 * Update an existing stream via API (uses new /api/streams/management/[id] endpoint)
 */
async function updateStream(streamId: string, streamData: any): Promise<{ success: boolean; stream?: Stream; error?: string }> {
	try {
		const response = await fetch(`/api/streams/management/${streamId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(streamData)
		});

		if (response.ok) {
			const result = await response.json();
			// The management API returns success: true, but no stream object
			// We'll need to fetch the updated stream separately if needed
			return { success: true };
		} else {
			const errorText = await response.text();
			return { success: false, error: `${response.status} ${errorText}` };
		}
	} catch (error) {
		return { success: false, error: `${error}` };
	}
}

/**
 * Delete a stream via API (uses new /api/streams/management/[id] endpoint)
 */
async function deleteStream(streamId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch(`/api/streams/management/${streamId}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			return { success: true };
		} else {
			const errorText = await response.text();
			return { success: false, error: `${response.status} ${errorText}` };
		}
	} catch (error) {
		return { success: false, error: `${error}` };
	}
}
