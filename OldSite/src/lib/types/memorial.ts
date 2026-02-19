import type { Timestamp } from 'firebase/firestore';
import type { CustomPricing } from '$lib/config/pricing';

export interface Embed {
	id: string;
	title: string;
	type: 'youtube' | 'vimeo';
	embedUrl: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

// Service Detail Interfaces
export interface ServiceDetails {
	location: LocationInfo; // Service location
	time: TimeInfo; // Service time
	hours: number; // Duration in hours
	streamId?: string; // Associated stream ID for bidirectional linking
	streamHash?: string; // Hash of service data for change detection
}

export interface AdditionalServiceDetails {
	type: 'location' | 'day'; // Service type
	location: LocationInfo; // Service location
	time: TimeInfo; // Service time
	hours: number; // Duration in hours
	streamId?: string; // Associated stream ID for bidirectional linking
	streamHash?: string; // Hash of service data for change detection
}

export interface LocationInfo {
	name: string; // Location name
	address: string; // Location address
	isUnknown: boolean; // Unknown location flag
}

export interface TimeInfo {
	date: string | null; // Service date
	time: string | null; // Service time
	isUnknown: boolean; // Unknown time flag
}

export interface Memorial {
	id?: string; // Document ID from Firestore
	lovedOneName: string;
	slug: string;
	fullSlug: string;
	ownerUid: string;
	creatorEmail: string;
	creatorName: string;
	directorFullName?: string;
	funeralHomeName?: string;

	// Service Details - consolidated structure
	services: {
		main: ServiceDetails; // Primary service details
		additional: AdditionalServiceDetails[]; // Additional locations/days
	};

	// Legacy fields (deprecated - will be removed after migration)
	memorialDate?: string;
	memorialTime?: string;
	memorialLocationName?: string;
	memorialLocationAddress?: string;
	isPublic: boolean;
	isComplete: boolean;
	content: string;
	custom_html: string | null;
	isLegacy?: boolean; // Indicates if this memorial uses custom_html instead of structured data
	createdByUserId?: string; // Used to identify migration script created memorials
	createdAt: Timestamp;
	imageUrl?: string; // Adding optional fields that might be missing from schema but used in code
	birthDate?: string;
	deathDate?: string;
	photos?: string[];
	embeds?: Embed[];

	// New fields for Phase 1 refactoring - Family contact information
	familyContactName?: string;
	familyContactEmail?: string;
	familyContactPhone?: string;
	familyContactPreference?: 'phone' | 'email';

	// New fields for Phase 1 refactoring - Director information
	directorEmail?: string;

	// New fields for Phase 1 refactoring - Additional notes
	additionalNotes?: string;

	// Missing properties used in ViewerPortal and other components
	serviceDate?: string;
	serviceTime?: string;
	location?: string;
	duration?: number;
	followerCount?: number;

	// Access control - required fields
	funeralDirectorUid?: string;
	funeralDirector?: {
		id: string;
		companyName: string;
		contactPerson: string;
		phone: string;
		email: string;
		licenseNumber?: string;
	};

	// Payment status fields
	isPaid?: boolean;
	paymentStatus?: 'paid' | 'unpaid';
	paidAt?: Timestamp | string;
	manualPayment?: ManualPaymentInfo;
	calculatorConfig?: CalculatorConfig;
	totalPrice?: number;
	
	// Schedule data (parsed from calculatorConfig for admin editor)
	schedule?: {
		selectedTier?: string;
		mainService?: {
			location?: { name?: string; address?: string };
			time?: { date?: string; time?: string };
			hours?: number;
		};
		additionalLocation?: {
			enabled?: boolean;
			location?: { name?: string };
			time?: { date?: string; time?: string };
			hours?: number;
		};
		additionalDay?: {
			enabled?: boolean;
			location?: { name?: string };
			time?: { date?: string; time?: string };
			hours?: number;
		};
		addons?: {
			photography?: boolean;
			audioVisualSupport?: boolean;
			liveMusician?: boolean;
			woodenUsbDrives?: number;
		};
	};
	
	// Contact info
	funeralDirectorName?: string;

	// Custom pricing override (admin only)
	customPricing?: CustomPricing;

	// Admin display overrides
	customTitle?: string; // Override for the memorial page title (replaces lovedOneName in display)

	// Content blocks (block editor) — primary content management system
	contentBlocks?: any[];
	contentBlocksVersion?: number;

	// ─── REMOVED FIELDS (Feb 2026) ───────────────────────────────────
	// These fields may still exist on older Firestore documents but are
	// no longer loaded by the app. Use the block editor equivalents:
	//   publicNote       → contentBlocks with type 'text', style 'note'
	//   emergencyEmbed   → contentBlocks with type 'embed', embedType 'video'
	//   emergencyChatEmbed → contentBlocks with type 'embed', embedType 'chat'
	//   videoFile        → contentBlocks with type 'embed', embedType 'video'
	// ─────────────────────────────────────────────────────────────────
	/** @deprecated REMOVED — Use contentBlocks with type 'text' instead. No longer loaded by server. */
	publicNote?: string;
	/** @deprecated REMOVED — Use contentBlocks with type 'embed' instead. No longer loaded by server. */
	emergencyEmbed?: { embedCode: string; title: string; createdAt: string; createdBy: string; createdByEmail?: string } | null;
	/** @deprecated REMOVED — Use contentBlocks with type 'embed' (embedType: chat) instead. No longer loaded by server. */
	emergencyChatEmbed?: { embedCode: string; title?: string; createdAt: string; createdBy: string } | null;
	/** @deprecated REMOVED — Use contentBlocks with type 'embed' instead. No longer loaded by server. */
	videoFile?: { url: string; title: string; createdAt: string; createdBy: string } | null;
}

export interface ManualPaymentInfo {
	markedPaidBy: string;
	markedPaidAt: Timestamp | string;
	method: 'cash' | 'check' | 'venmo' | 'zelle' | 'manual';
	notes?: string;
}

export interface CalculatorConfig {
	status?: 'draft' | 'paid';
	isPaid?: boolean;
	paidAt?: Timestamp | string;
	bookingItems?: Array<{
		name: string;
		price: number;
		quantity?: number;
		total: number;
	}>;
	total?: number;
	paymentIntentId?: string;
	checkoutSessionId?: string;
	formData?: any;
	lastModified?: Timestamp | string;
	lastModifiedBy?: string;
}
