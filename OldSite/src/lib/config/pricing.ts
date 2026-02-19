/**
 * Centralized Pricing Configuration for TributeStream
 * 
 * This file contains all pricing constants for memorial livestream services.
 * Any changes to pricing should be made here to ensure consistency across the application.
 * 
 * Last Updated: December 2025
 */

import type { Tier } from '$lib/types/livestream';

/**
 * Base package pricing for memorial livestream services
 * All packages include 2 hours of coverage
 */
export const TIER_PRICES: Record<Tier, number> = {
	record: 699,   // Tributestream Record - Basic recording service
	live: 1299,    // Tributestream Live - Live streaming with professional support
	legacy: 1599,  // Tributestream Legacy - Premium package with editing and USB drive
	
	// Legacy tier aliases (not actively used but kept for backwards compatibility)
	standard: 1299,  // Alias for 'live'
	premium: 1599    // Alias for 'legacy'
} as const;

/**
 * Add-on service pricing
 */
export const ADDON_PRICES = {
	photography: 400,           // Professional photography service
	audioVisualSupport: 200,    // Audio/Visual technical support
	liveMusician: 500,          // Live musician for service
	woodenUsbDrives: 300        // First wooden USB drive ($100 for additional)
} as const;

/**
 * Hourly overage rate
 * Applied after the first 2 hours of included coverage
 */
export const HOURLY_OVERAGE_RATE = 125;

/**
 * Additional service fees
 * Base fee for additional locations or days (before hourly overages)
 */
export const ADDITIONAL_SERVICE_FEE = 325;

/**
 * USB Drive Pricing Rules
 */
export const USB_DRIVE_PRICING = {
	firstDrive: 300,      // Price for first USB drive
	additionalDrive: 100, // Price for each additional drive
	legacyIncluded: 1     // Number of drives included free with Legacy tier
} as const;

/**
 * Package feature descriptions for display
 */
export const TIER_FEATURES = {
	record: [
		'2 Hours of Record Time',
		'Custom Link',
		'Complimentary Download',
		'One Year Hosting',
		'Posted Online within 24 Hours'
	],
	live: [
		'2 Hours of Broadcast Time',
		'Custom Link',
		'Complimentary Download',
		'One Year Hosting',
		'Professional Videographer',
		'Professional Livestream Tech'
	],
	legacy: [
		'2 Hours of Broadcast Time',
		'Custom Link',
		'Complimentary Download',
		'One Year Hosting',
		'Professional Videographer',
		'Professional Livestream Tech',
		'Video Editing',
		'Engraved USB Drive and Wooden Keepsake Box'
	]
} as const;

/**
 * Calculate hourly overage charges
 * @param totalHours - Total hours requested
 * @param includedHours - Hours included in base package (default: 2)
 * @returns Overage cost
 */
export function calculateHourlyOverage(totalHours: number, includedHours: number = 2): number {
	const overageHours = Math.max(0, totalHours - includedHours);
	return overageHours * HOURLY_OVERAGE_RATE;
}

/**
 * Calculate USB drive pricing based on quantity and tier
 * @param quantity - Number of USB drives requested
 * @param tier - Selected package tier
 * @returns Total USB drive cost
 */
export function calculateUsbDriveCost(quantity: number, tier: Tier): number {
	if (quantity <= 0) return 0;
	
	const includedDrives = tier === 'legacy' ? USB_DRIVE_PRICING.legacyIncluded : 0;
	const billableDrives = Math.max(0, quantity - includedDrives);
	
	if (billableDrives === 0) return 0;
	
	// If no drives were included, charge full price for first drive
	if (includedDrives === 0) {
		const firstDriveCost = USB_DRIVE_PRICING.firstDrive;
		const additionalDrivesCost = Math.max(0, billableDrives - 1) * USB_DRIVE_PRICING.additionalDrive;
		return firstDriveCost + additionalDrivesCost;
	}
	
	// If some drives were included, charge additional drive price for all billable drives
	return billableDrives * USB_DRIVE_PRICING.additionalDrive;
}

/**
 * Get display name for a tier
 * @param tier - Package tier
 * @returns Formatted display name
 */
export function getTierDisplayName(tier: Tier): string {
	const names: Record<Tier, string> = {
		record: 'Tributestream Record',
		live: 'Tributestream Live',
		legacy: 'Tributestream Legacy',
		standard: 'Tributestream Live', // Alias
		premium: 'Tributestream Legacy'  // Alias
	};
	return names[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * Type definitions for booking calculations
 */
export interface PricingCalculation {
	baseTier: number;
	mainServiceOverage: number;
	additionalServices: number;
	addons: number;
	total: number;
}

/**
 * Calculate total pricing for a memorial service
 * This is a helper function that can be used for quick calculations
 */
export function calculateTotalPrice(params: {
	tier: Tier;
	mainHours: number;
	additionalServices?: Array<{ hours: number }>;
	addons?: {
		photography?: boolean;
		audioVisualSupport?: boolean;
		liveMusician?: boolean;
		woodenUsbDrives?: number;
	};
}): PricingCalculation {
	const { tier, mainHours, additionalServices = [], addons = {} } = params;
	
	// Base tier price
	const baseTier = TIER_PRICES[tier];
	
	// Main service hourly overage
	const mainServiceOverage = calculateHourlyOverage(mainHours);
	
	// Additional services (location/day fees + overages)
	const additionalServicesCost = additionalServices.reduce((total, service) => {
		const baseFee = ADDITIONAL_SERVICE_FEE;
		const overage = calculateHourlyOverage(service.hours);
		return total + baseFee + overage;
	}, 0);
	
	// Add-ons
	let addonsCost = 0;
	if (addons.photography) addonsCost += ADDON_PRICES.photography;
	if (addons.audioVisualSupport) addonsCost += ADDON_PRICES.audioVisualSupport;
	if (addons.liveMusician) addonsCost += ADDON_PRICES.liveMusician;
	if (addons.woodenUsbDrives) {
		addonsCost += calculateUsbDriveCost(addons.woodenUsbDrives, tier);
	}
	
	const total = baseTier + mainServiceOverage + additionalServicesCost + addonsCost;
	
	return {
		baseTier,
		mainServiceOverage,
		additionalServices: additionalServicesCost,
		addons: addonsCost,
		total
	};
}

// Export all pricing constants as a single object for convenience
export const PRICING = {
	tiers: TIER_PRICES,
	addons: ADDON_PRICES,
	hourlyOverage: HOURLY_OVERAGE_RATE,
	additionalService: ADDITIONAL_SERVICE_FEE,
	usbDrives: USB_DRIVE_PRICING,
	features: TIER_FEATURES
} as const;

/**
 * Custom Pricing Override Interface
 * Allows admins to set custom pricing for individual memorials
 */
export interface CustomPricing {
	enabled: boolean;
	tiers?: Partial<Record<Tier, number>>;
	addons?: {
		photography?: number;
		audioVisualSupport?: number;
		liveMusician?: number;
		woodenUsbDrives?: number;
	};
	rates?: {
		hourlyOverage?: number;
		additionalServiceFee?: number;
	};
	notes?: string;
	setBy?: string;
	setAt?: any; // Firestore Timestamp
}

/**
 * Get pricing for a specific memorial
 * Merges custom pricing with defaults (custom takes precedence)
 * 
 * @param customPricing - Optional custom pricing configuration from memorial document
 * @returns Resolved pricing object with custom values merged with defaults
 * 
 * @example
 * // Memorial with custom Live tier pricing
 * const pricing = getPricingForMemorial({
 *   enabled: true,
 *   tiers: { live: 1000 },
 *   notes: "Phone quote - special discount"
 * });
 * // Returns: { tiers: { record: 699, live: 1000, legacy: 1599, ... }, ... }
 */
export function getPricingForMemorial(customPricing?: CustomPricing | null) {
	console.log('🔧 [PRICING CONFIG] getPricingForMemorial called');
	console.log('   - Has customPricing:', !!customPricing);
	console.log('   - Is enabled:', customPricing?.enabled);

	// If no custom pricing or not enabled, return defaults
	if (!customPricing?.enabled) {
		console.log('   → Returning DEFAULT pricing');
		return PRICING;
	}

	console.log('   → Merging CUSTOM pricing with defaults');
	console.log('   - Custom tiers:', customPricing.tiers);
	console.log('   - Custom addons:', customPricing.addons);
	console.log('   - Custom rates:', customPricing.rates);

	// Merge custom pricing with defaults (custom takes precedence)
	const mergedPricing = {
		tiers: { ...TIER_PRICES, ...customPricing.tiers },
		addons: { ...ADDON_PRICES, ...customPricing.addons },
		hourlyOverage: customPricing.rates?.hourlyOverage ?? HOURLY_OVERAGE_RATE,
		additionalService: customPricing.rates?.additionalServiceFee ?? ADDITIONAL_SERVICE_FEE,
		usbDrives: USB_DRIVE_PRICING, // USB drive rules don't change
		features: TIER_FEATURES // Features don't change
	};

	console.log('   ✅ Merged pricing:', {
		tiers: mergedPricing.tiers,
		addons: mergedPricing.addons,
		hourlyOverage: mergedPricing.hourlyOverage,
		additionalService: mergedPricing.additionalService
	});

	return mergedPricing;
}
