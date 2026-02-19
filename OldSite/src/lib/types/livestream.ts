// Livestream and Calculator Types

/**
 * Available package tiers for memorial livestream services
 * - record: Basic recording service
 * - live: Live streaming with professional support
 * - legacy: Premium package with editing and USB drive
 * - standard: Alias for 'live' (backwards compatibility)
 * - premium: Alias for 'legacy' (backwards compatibility)
 */
export type Tier = 'record' | 'live' | 'legacy' | 'standard' | 'premium';

export interface CalculatorFormData {
	selectedTier: Tier;
	memorialId?: string;
	hours?: number;
	additionalLocation?: boolean;
	additionalDay?: boolean;
	addons: {
		photography?: boolean;
		audioVisualSupport?: boolean;
		liveMusician?: boolean;
		woodenUsbDrives?: number;
		// Legacy fields for backwards compatibility
		usbDrive?: boolean;
		additionalHours?: number;
	};
	createdAt?: Date;
	updatedAt?: Date;
	autoSaved?: boolean;
}

export interface BookingItem {
	id?: string;
	name: string;
	package?: string;
	price: number;
	quantity?: number;
	total?: number;
}

export interface TierInfo {
	name: string;
	price: number;
	features: string[];
	popular?: boolean;
}

export interface LivestreamConfig {
	id?: string;
	memorialId?: string;
	calculatorData?: CalculatorFormData;
	services?: any;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * @deprecated Use TIER_PRICES from $lib/config/pricing instead
 * This constant is kept for backwards compatibility only
 * 
 * For current pricing, import from:
 * import { TIER_PRICES, TIER_FEATURES } from '$lib/config/pricing';
 */
export const TIER_PRICING: Record<Tier, TierInfo> = {
	record: {
		name: 'Tributestream Record',
		price: 699,
		features: [
			'2 Hours of Record Time',
			'Custom Link',
			'Complimentary Download',
			'One Year Hosting',
			'Posted Online within 24 Hours'
		]
	},
	live: {
		name: 'Tributestream Live',
		price: 1299,
		features: [
			'2 Hours of Broadcast Time',
			'Custom Link',
			'Complimentary Download',
			'One Year Hosting',
			'Professional Videographer',
			'Professional Livestream Tech'
		],
		popular: true
	},
	legacy: {
		name: 'Tributestream Legacy',
		price: 1599,
		features: [
			'2 Hours of Broadcast Time',
			'Custom Link',
			'Complimentary Download',
			'One Year Hosting',
			'Professional Videographer',
			'Professional Livestream Tech',
			'Video Editing',
			'Engraved USB Drive and Wooden Keepsake Box'
		]
	},
	// Aliases for backwards compatibility
	standard: {
		name: 'Tributestream Live',
		price: 1299,
		features: [
			'2 Hours of Broadcast Time',
			'Custom Link',
			'Complimentary Download',
			'One Year Hosting',
			'Professional Videographer',
			'Professional Livestream Tech'
		],
		popular: true
	},
	premium: {
		name: 'Tributestream Legacy',
		price: 1599,
		features: [
			'2 Hours of Broadcast Time',
			'Custom Link',
			'Complimentary Download',
			'One Year Hosting',
			'Professional Videographer',
			'Professional Livestream Tech',
			'Video Editing',
			'Engraved USB Drive and Wooden Keepsake Box'
		]
	}
};
