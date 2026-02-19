/**
 * Booking Service — Orchestrates calculator save operations.
 * Re-validates pricing server-side to prevent client tampering.
 */

import {
	updateMemorialServices,
	updateCalculatorConfig,
	updateMemorialBooking,
	getMemorialById
} from './memorial.service';
import { syncStreamsWithSchedule } from './stream.service';
import {
	calculateBookingItems,
	calculateTotal,
	getPricingForMemorial
} from '$lib/config/pricing';
import type {
	MemorialServices,
	CalculatorFormData,
	BookingItem,
	CalculatorConfig,
	Tier
} from '$lib/features/booking/types';

// ============================================================================
// SAVE BOOKING (full save — validates pricing server-side)
// ============================================================================

export interface SaveBookingInput {
	memorialId: string;
	services: MemorialServices;
	calculatorData: CalculatorFormData;
	lovedOneName?: string;
	directorFullName?: string;
	funeralHomeName?: string;
}

export interface SaveBookingResult {
	success: boolean;
	bookingItems: BookingItem[];
	total: number;
	errors: string[];
}

export async function saveBooking(
	input: SaveBookingInput,
	userId: string
): Promise<SaveBookingResult> {
	const errors: string[] = [];

	// 1. Get memorial to check custom pricing
	const memorial = await getMemorialById(input.memorialId);
	if (!memorial) {
		return { success: false, bookingItems: [], total: 0, errors: ['Memorial not found'] };
	}

	// 2. Re-calculate pricing server-side (prevents client-side tampering)
	const pricing = getPricingForMemorial(memorial.customPricing);
	const bookingItems = calculateBookingItems(
		input.calculatorData.selectedTier as Tier,
		input.services,
		input.calculatorData.addons,
		pricing
	);
	const total = calculateTotal(bookingItems);

	// 3. Build calculator config
	const calculatorConfig: CalculatorConfig = {
		status: 'saved',
		isPaid: memorial.isPaid ?? false,
		bookingItems,
		total,
		formData: {
			...input.calculatorData,
			updatedAt: new Date().toISOString()
		},
		lastModified: new Date().toISOString(),
		lastModifiedBy: userId
	};

	// 4. Save to memorial
	try {
		await updateMemorialBooking(
			input.memorialId,
			{
				services: input.services,
				calculatorConfig,
				totalPrice: total,
				lovedOneName: input.lovedOneName,
				directorFullName: input.directorFullName,
				funeralHomeName: input.funeralHomeName
			},
			userId
		);
	} catch (e) {
		errors.push(`Failed to save booking: ${e}`);
		return { success: false, bookingItems, total, errors };
	}

	// 5. Sync streams with schedule
	try {
		const syncResult = await syncStreamsWithSchedule(
			input.memorialId,
			input.services,
			userId
		);
		if (syncResult.errors.length > 0) {
			errors.push(...syncResult.errors);
		}
	} catch (e) {
		errors.push(`Stream sync warning: ${e}`);
	}

	return {
		success: errors.length === 0,
		bookingItems,
		total,
		errors
	};
}

// ============================================================================
// AUTO-SAVE (lightweight draft save — no stream sync)
// ============================================================================

export interface AutoSaveInput {
	memorialId: string;
	services?: MemorialServices;
	calculatorData?: CalculatorFormData;
}

export async function autoSaveBooking(
	input: AutoSaveInput,
	userId: string
): Promise<{ success: boolean; timestamp: number; error?: string }> {
	const timestamp = Date.now();

	try {
		const memorial = await getMemorialById(input.memorialId);
		if (!memorial) {
			return { success: false, timestamp, error: 'Memorial not found' };
		}

		// Save services if provided
		if (input.services) {
			await updateMemorialServices(input.memorialId, input.services, userId);
		}

		// Save calculator config as draft if provided
		if (input.calculatorData) {
			const pricing = getPricingForMemorial(memorial.customPricing);
			const services = input.services ?? memorial.services;

			let bookingItems: BookingItem[] = [];
			let total = 0;

			if (services) {
				bookingItems = calculateBookingItems(
					input.calculatorData.selectedTier as Tier,
					services,
					input.calculatorData.addons,
					pricing
				);
				total = calculateTotal(bookingItems);
			}

			const config: CalculatorConfig = {
				status: 'draft',
				isPaid: memorial.isPaid ?? false,
				bookingItems,
				total,
				formData: {
					...input.calculatorData,
					updatedAt: new Date().toISOString(),
					autoSaved: true
				},
				lastModified: new Date().toISOString(),
				lastModifiedBy: userId,
				autoSave: {
					formData: input.calculatorData,
					lastModified: new Date().toISOString(),
					lastModifiedBy: userId,
					timestamp
				}
			};

			await updateCalculatorConfig(input.memorialId, config, total, userId);
		}

		return { success: true, timestamp };
	} catch (e) {
		return { success: false, timestamp, error: `${e}` };
	}
}
