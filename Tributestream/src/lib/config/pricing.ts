/**
 * Centralized Pricing Configuration for TributeStream
 *
 * This file contains all pricing constants and pure calculation functions.
 * Used by BOTH client (calculator display) and server (validation).
 * Server re-calculates on save to prevent client-side price tampering.
 */

import type {
	Tier,
	Addons,
	BookingItem,
	MemorialServices,
	CustomPricing
} from '$lib/features/booking/types';

// ============================================================================
// PRICING CONSTANTS
// ============================================================================

export const TIER_PRICES: Record<Tier, number> = {
	record: 699,
	live: 1299,
	legacy: 1599
} as const;

export const ADDON_PRICES = {
	photography: 400,
	audioVisualSupport: 200,
	liveMusician: 500,
	woodenUsbDrives: 300
} as const;

export const HOURLY_OVERAGE_RATE = 125;
export const ADDITIONAL_SERVICE_FEE = 325;

export const USB_DRIVE_PRICING = {
	firstDrive: 300,
	additionalDrive: 100,
	legacyIncluded: 1
} as const;

export const TIER_FEATURES: Record<Tier, string[]> = {
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

// ============================================================================
// PRICING CONFIG OBJECT (for passing around as a bundle)
// ============================================================================

export interface AddonPrices {
	photography: number;
	audioVisualSupport: number;
	liveMusician: number;
	woodenUsbDrives: number;
}

export interface UsbDrivePricing {
	firstDrive: number;
	additionalDrive: number;
	legacyIncluded: number;
}

export interface PricingConfig {
	tiers: Record<Tier, number>;
	addons: AddonPrices;
	hourlyOverage: number;
	additionalService: number;
	usbDrives: UsbDrivePricing;
	features: Record<Tier, string[]>;
}

export const DEFAULT_PRICING: PricingConfig = {
	tiers: TIER_PRICES,
	addons: ADDON_PRICES,
	hourlyOverage: HOURLY_OVERAGE_RATE,
	additionalService: ADDITIONAL_SERVICE_FEE,
	usbDrives: USB_DRIVE_PRICING,
	features: TIER_FEATURES
};

// ============================================================================
// PURE CALCULATION FUNCTIONS
// ============================================================================

export function calculateHourlyOverage(totalHours: number, includedHours: number = 2): number {
	const overageHours = Math.max(0, totalHours - includedHours);
	return overageHours * HOURLY_OVERAGE_RATE;
}

export function calculateUsbDriveCost(quantity: number, tier: Tier): number {
	if (quantity <= 0) return 0;

	const includedDrives = tier === 'legacy' ? USB_DRIVE_PRICING.legacyIncluded : 0;
	const billableDrives = Math.max(0, quantity - includedDrives);

	if (billableDrives === 0) return 0;

	if (includedDrives === 0) {
		const firstDriveCost = USB_DRIVE_PRICING.firstDrive;
		const additionalDrivesCost =
			Math.max(0, billableDrives - 1) * USB_DRIVE_PRICING.additionalDrive;
		return firstDriveCost + additionalDrivesCost;
	}

	return billableDrives * USB_DRIVE_PRICING.additionalDrive;
}

export function getTierDisplayName(tier: Tier): string {
	const names: Record<Tier, string> = {
		record: 'Tributestream Record',
		live: 'Tributestream Live',
		legacy: 'Tributestream Legacy'
	};
	return names[tier];
}

/**
 * Calculate booking items from services + tier + addons.
 * This is the CORE function used by both client (display) and server (validation).
 * Both sides must produce identical results.
 */
export function calculateBookingItems(
	tier: Tier,
	services: MemorialServices,
	addons: Addons,
	pricing: PricingConfig = DEFAULT_PRICING
): BookingItem[] {
	const items: BookingItem[] = [];
	const tierDisplayName = getTierDisplayName(tier);

	// 1. Base tier package
	items.push({
		id: 'tier-base',
		name: `${tierDisplayName} Package`,
		package: tierDisplayName,
		price: pricing.tiers[tier],
		quantity: 1,
		total: pricing.tiers[tier]
	});

	// 2. Main service hourly overage
	const mainOverageHours = Math.max(0, services.main.hours - 2);
	if (mainOverageHours > 0) {
		const overageCost = mainOverageHours * pricing.hourlyOverage;
		items.push({
			id: 'main-overage',
			name: `Additional Hours (Main Service)`,
			package: tierDisplayName,
			price: pricing.hourlyOverage,
			quantity: mainOverageHours,
			total: overageCost
		});
	}

	// 3. Additional services
	services.additional.forEach((service, index) => {
		const typeLabel = service.type === 'location' ? 'Location' : 'Day';

		// Base fee for additional service
		items.push({
			id: `additional-${service.type}-${index}-base`,
			name: `Additional ${typeLabel}`,
			package: `Additional ${typeLabel}`,
			price: pricing.additionalService,
			quantity: 1,
			total: pricing.additionalService
		});

		// Hourly overage for additional service
		const additionalOverageHours = Math.max(0, service.hours - 2);
		if (additionalOverageHours > 0) {
			const overageCost = additionalOverageHours * pricing.hourlyOverage;
			items.push({
				id: `additional-${service.type}-${index}-overage`,
				name: `Additional Hours (${typeLabel})`,
				package: `Additional ${typeLabel}`,
				price: pricing.hourlyOverage,
				quantity: additionalOverageHours,
				total: overageCost
			});
		}
	});

	// 4. Add-ons
	if (addons.photography) {
		items.push({
			id: 'addon-photography',
			name: 'Photography',
			package: 'Add-ons',
			price: pricing.addons.photography,
			quantity: 1,
			total: pricing.addons.photography
		});
	}

	if (addons.audioVisualSupport) {
		items.push({
			id: 'addon-av',
			name: 'Audio/Visual Support',
			package: 'Add-ons',
			price: pricing.addons.audioVisualSupport,
			quantity: 1,
			total: pricing.addons.audioVisualSupport
		});
	}

	if (addons.liveMusician) {
		items.push({
			id: 'addon-musician',
			name: 'Live Musician',
			package: 'Add-ons',
			price: pricing.addons.liveMusician,
			quantity: 1,
			total: pricing.addons.liveMusician
		});
	}

	if (addons.woodenUsbDrives > 0) {
		const usbCost = calculateUsbDriveCost(addons.woodenUsbDrives, tier);
		if (usbCost > 0) {
			items.push({
				id: 'addon-usb',
				name: 'Wooden USB Drive(s)',
				package: 'Add-ons',
				price: usbCost,
				quantity: addons.woodenUsbDrives,
				total: usbCost
			});
		}
	}

	return items;
}

/**
 * Sum up all booking items to get the total price.
 */
export function calculateTotal(items: BookingItem[]): number {
	return items.reduce((sum, item) => sum + item.total, 0);
}

/**
 * Merge custom pricing with defaults (custom takes precedence).
 */
export function getPricingForMemorial(customPricing?: CustomPricing | null): PricingConfig {
	if (!customPricing?.enabled) {
		return DEFAULT_PRICING;
	}

	return {
		tiers: { ...TIER_PRICES, ...customPricing.tiers },
		addons: { ...ADDON_PRICES, ...customPricing.addons },
		hourlyOverage: customPricing.rates?.hourlyOverage ?? HOURLY_OVERAGE_RATE,
		additionalService: customPricing.rates?.additionalServiceFee ?? ADDITIONAL_SERVICE_FEE,
		usbDrives: USB_DRIVE_PRICING,
		features: TIER_FEATURES
	};
}
