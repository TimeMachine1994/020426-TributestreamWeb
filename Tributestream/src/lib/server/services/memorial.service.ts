/**
 * Memorial Service — Drizzle queries for memorial CRUD + calculator data.
 * Handles JSON serialization/deserialization of services and calculator config,
 * using the shared types from booking/types.ts as the contract.
 */

import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { generateId } from '$lib/server/auth';
import type {
	MemorialServices,
	CalculatorConfig,
	CustomPricing
} from '$lib/features/booking/types';

// ============================================================================
// READ
// ============================================================================

export async function getMemorialById(id: string) {
	const [row] = await db.select().from(table.memorial).where(eq(table.memorial.id, id));
	if (!row) return null;
	return parseMemorialJsonFields(row);
}

export async function getMemorialBySlug(slug: string) {
	const [row] = await db.select().from(table.memorial).where(eq(table.memorial.slug, slug));
	if (!row) return null;
	return parseMemorialJsonFields(row);
}

export async function getMemorialByFullSlug(fullSlug: string) {
	const [row] = await db
		.select()
		.from(table.memorial)
		.where(eq(table.memorial.fullSlug, fullSlug));
	if (!row) return null;
	return parseMemorialJsonFields(row);
}

// ============================================================================
// WRITE — Calculator / Booking
// ============================================================================

export async function updateMemorialServices(
	memorialId: string,
	services: MemorialServices,
	userId: string
) {
	await db
		.update(table.memorial)
		.set({
			servicesJson: JSON.stringify(services),
			updatedAt: new Date()
		})
		.where(eq(table.memorial.id, memorialId));
}

export async function updateCalculatorConfig(
	memorialId: string,
	config: CalculatorConfig,
	totalPrice: number,
	userId: string
) {
	await db
		.update(table.memorial)
		.set({
			calculatorConfigJson: JSON.stringify(config),
			totalPrice,
			updatedAt: new Date()
		})
		.where(eq(table.memorial.id, memorialId));
}

export async function updateMemorialBooking(
	memorialId: string,
	data: {
		services: MemorialServices;
		calculatorConfig: CalculatorConfig;
		totalPrice: number;
		lovedOneName?: string;
		directorFullName?: string;
		funeralHomeName?: string;
	},
	userId: string
) {
	const setData: Record<string, unknown> = {
		servicesJson: JSON.stringify(data.services),
		calculatorConfigJson: JSON.stringify(data.calculatorConfig),
		totalPrice: data.totalPrice,
		updatedAt: new Date()
	};

	if (data.lovedOneName !== undefined) setData.lovedOneName = data.lovedOneName;
	if (data.directorFullName !== undefined) setData.directorFullName = data.directorFullName;
	if (data.funeralHomeName !== undefined) setData.funeralHomeName = data.funeralHomeName;

	await db.update(table.memorial).set(setData).where(eq(table.memorial.id, memorialId));
}

export async function setCustomPricing(
	memorialId: string,
	pricing: CustomPricing,
	adminId: string
) {
	await db
		.update(table.memorial)
		.set({
			customPricingJson: JSON.stringify(pricing),
			updatedAt: new Date()
		})
		.where(eq(table.memorial.id, memorialId));
}

export async function markMemorialPaid(memorialId: string) {
	await db
		.update(table.memorial)
		.set({
			isPaid: true,
			paymentStatus: 'paid',
			updatedAt: new Date()
		})
		.where(eq(table.memorial.id, memorialId));
}

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

export function canEditMemorial(
	memorial: table.Memorial,
	user: { id: string; role: string }
): boolean {
	if (user.role === 'admin') return true;
	if (memorial.ownerId === user.id) return true;
	if (memorial.funeralDirectorId === user.id) return true;
	if (memorial.assignedVideographerId === user.id) return true;
	return false;
}

// ============================================================================
// JSON PARSING HELPER
// ============================================================================

export interface ParsedMemorial extends Omit<table.Memorial, 'servicesJson' | 'calculatorConfigJson' | 'customPricingJson'> {
	services: MemorialServices | null;
	calculatorConfig: CalculatorConfig | null;
	customPricing: CustomPricing | null;
	// Keep raw JSON fields too for completeness
	servicesJson: string | null;
	calculatorConfigJson: string | null;
	customPricingJson: string | null;
}

function parseMemorialJsonFields(row: table.Memorial): ParsedMemorial {
	return {
		...row,
		services: row.servicesJson ? (JSON.parse(row.servicesJson) as MemorialServices) : null,
		calculatorConfig: row.calculatorConfigJson
			? (JSON.parse(row.calculatorConfigJson) as CalculatorConfig)
			: null,
		customPricing: row.customPricingJson
			? (JSON.parse(row.customPricingJson) as CustomPricing)
			: null
	};
}
