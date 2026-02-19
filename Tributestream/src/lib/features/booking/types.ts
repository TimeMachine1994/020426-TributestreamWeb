/**
 * Shared Booking & Calculator Types
 *
 * THE CONTRACT: These types are the single source of truth shared between
 * the calculator write path and the memorial page read path.
 * If you change a type here, both paths will fail at compile time
 * until they handle the new shape.
 */

// ============================================================================
// TIERS
// ============================================================================

export const TIERS = ['record', 'live', 'legacy'] as const;
export type Tier = (typeof TIERS)[number];

/** Legacy tier aliases — only used for data migration from Firestore */
export const LEGACY_TIER_ALIASES: Record<string, Tier> = {
	standard: 'live',
	premium: 'legacy'
};

// ============================================================================
// ADD-ONS
// ============================================================================

export interface Addons {
	photography: boolean;
	audioVisualSupport: boolean;
	liveMusician: boolean;
	woodenUsbDrives: number;
}

export const DEFAULT_ADDONS: Addons = {
	photography: false,
	audioVisualSupport: false,
	liveMusician: false,
	woodenUsbDrives: 0
};

// ============================================================================
// SERVICE DETAILS (location, time, hours for each service)
// ============================================================================

export interface ServiceLocation {
	name: string;
	address: string;
	isUnknown: boolean;
}

export interface ServiceTime {
	date: string | null;
	time: string | null;
	isUnknown: boolean;
}

export interface ServiceDetails {
	location: ServiceLocation;
	time: ServiceTime;
	hours: number;
}

export type AdditionalServiceType = 'location' | 'day';

export interface AdditionalService extends ServiceDetails {
	type: AdditionalServiceType;
}

/**
 * MemorialServices — the services JSON shape stored on the memorial row.
 * Both the calculator (writer) and memorial page (reader) use this type.
 */
export interface MemorialServices {
	main: ServiceDetails;
	additional: AdditionalService[];
}

// ============================================================================
// BOOKING ITEMS (line items on the invoice / summary)
// ============================================================================

export interface BookingItem {
	id: string;
	name: string;
	package: string;
	price: number;
	quantity: number;
	total: number;
}

// ============================================================================
// CALCULATOR FORM DATA (what the user selected in the calculator UI)
// ============================================================================

export interface CalculatorFormData {
	memorialId: string;
	selectedTier: Tier;
	addons: Addons;
	updatedAt?: string;
	autoSaved?: boolean;
}

// ============================================================================
// CALCULATOR CONFIG (persisted in memorial.calculator_config_json)
// ============================================================================

export type CalculatorStatus = 'draft' | 'saved' | 'paid' | 'cancelled';

export interface CalculatorConfig {
	status: CalculatorStatus;
	isPaid: boolean;
	bookingItems: BookingItem[];
	total: number;
	formData: CalculatorFormData;
	lastModified: string;
	lastModifiedBy: string;
	autoSave?: {
		formData: CalculatorFormData;
		lastModified: string;
		lastModifiedBy: string;
		timestamp: number;
	};
}

// ============================================================================
// CUSTOM PRICING (admin override per memorial)
// ============================================================================

export interface CustomPricing {
	enabled: boolean;
	tiers?: Partial<Record<Tier, number>>;
	addons?: Partial<{
		photography: number;
		audioVisualSupport: number;
		liveMusician: number;
		woodenUsbDrives: number;
	}>;
	rates?: {
		hourlyOverage?: number;
		additionalServiceFee?: number;
	};
	notes?: string;
	setBy?: string;
	setAt?: string;
}

// ============================================================================
// PAYMENT
// ============================================================================

export type PaymentStatus = 'unpaid' | 'paid' | 'manual' | 'refunded';

// ============================================================================
// STREAM (one per service location/day)
// ============================================================================

export type StreamStatus = 'idle' | 'scheduled' | 'live' | 'ended' | 'archived';
export type CalculatorServiceType = 'main' | 'location' | 'day';

export interface StreamRecord {
	id: string;
	memorialId: string;
	title: string;
	description: string | null;
	status: StreamStatus;
	scheduledStartTime: string | null;
	muxLiveStreamId: string | null;
	muxStreamKey: string | null;
	muxPlaybackId: string | null;
	muxRecordingReady: boolean;
	calculatorServiceType: CalculatorServiceType | null;
	calculatorServiceIndex: number | null;
	createdBy: string | null;
	createdAt: string;
	updatedAt: string;
}

// ============================================================================
// DEFAULT SERVICE DATA (used by calculator init)
// ============================================================================

export const DEFAULT_SERVICE_DETAILS: ServiceDetails = {
	location: { name: '', address: '', isUnknown: false },
	time: { date: null, time: null, isUnknown: false },
	hours: 2
};

export const DEFAULT_MEMORIAL_SERVICES: MemorialServices = {
	main: { ...DEFAULT_SERVICE_DETAILS },
	additional: []
};

export function createDefaultCalculatorFormData(memorialId: string): CalculatorFormData {
	return {
		memorialId,
		selectedTier: 'record',
		addons: { ...DEFAULT_ADDONS }
	};
}
