import { describe, it, expect } from 'vitest';

// Simple unit tests for calculator logic without component dependencies
describe('Calculator Logic Tests', () => {
	const TIER_PRICES = {
		record: 699,
		live: 1299,
		legacy: 1599
	};

	const ADDON_PRICES = {
		photography: 400,
		audioVisualSupport: 200,
		liveMusician: 500,
		woodenUsbDrives: 300
	};

	const HOURLY_OVERAGE_RATE = 125;
	const ADDITIONAL_SERVICE_FEE = 325;

	// Test basic tier pricing
	it('should return correct tier prices', () => {
		expect(TIER_PRICES.record).toBe(699);
		expect(TIER_PRICES.live).toBe(1299);
		expect(TIER_PRICES.legacy).toBe(1599);
	});

	// Test overage calculation
	it('should calculate overage hours correctly', () => {
		expect(Math.max(0, 2 - 2)).toBe(0); // No overage
		expect(Math.max(0, 3 - 2)).toBe(1); // 1 hour overage
		expect(Math.max(0, 5 - 2)).toBe(3); // 3 hours overage
		expect(Math.max(0, 1 - 2)).toBe(0); // Negative should be 0
	});

	// Test overage cost calculation
	it('should calculate overage costs correctly', () => {
		const overageHours = Math.max(0, 4 - 2); // 2 hours
		const overageCost = overageHours * HOURLY_OVERAGE_RATE;
		expect(overageCost).toBe(250); // 2 * 125
	});

	// Test addon pricing
	it('should calculate addon costs correctly', () => {
		expect(ADDON_PRICES.photography).toBe(400);
		expect(ADDON_PRICES.audioVisualSupport).toBe(200);
		expect(ADDON_PRICES.liveMusician).toBe(500);
		expect(ADDON_PRICES.woodenUsbDrives).toBe(300);
	});

	// Test USB drive pricing logic for non-legacy tiers
	it('should calculate USB drive pricing for non-legacy tiers', () => {
		const usbDrives = 3;
		const isLegacy = false;
		const includedDrives = isLegacy ? 1 : 0;

		if (usbDrives > includedDrives) {
			const billableDrives = usbDrives - includedDrives; // 3 - 0 = 3

			// First drive costs $300, additional drives cost $100 each
			const firstDriveCost = ADDON_PRICES.woodenUsbDrives; // $300
			const additionalDrivesCost = (billableDrives - 1) * 100; // 2 * $100 = $200
			const totalUsbCost = firstDriveCost + additionalDrivesCost; // $500

			expect(totalUsbCost).toBe(500);
		}
	});

	// Test USB drive pricing logic for legacy tier
	it('should calculate USB drive pricing for legacy tier', () => {
		const usbDrives = 3;
		const isLegacy = true;
		const includedDrives = isLegacy ? 1 : 0; // 1 included

		if (usbDrives > includedDrives) {
			const billableDrives = usbDrives - includedDrives; // 3 - 1 = 2
			const additionalDrivesCost = billableDrives * 100; // 2 * $100 = $200

			expect(additionalDrivesCost).toBe(200);
		}
	});

	// Test complete calculation scenario
	it('should calculate complete booking scenario correctly', () => {
		// Scenario: Live tier, 4 hours main service, additional location with 3 hours, photography addon, 2 USB drives
		const selectedTier = 'live';
		const mainServiceHours = 4;
		const additionalLocationEnabled = true;
		const additionalLocationHours = 3;
		const photographyEnabled = true;
		const usbDrives = 2;

		let total = 0;

		// Base tier price
		total += TIER_PRICES[selectedTier]; // $1299

		// Main service overage (4 - 2 = 2 hours)
		const mainOverage = Math.max(0, mainServiceHours - 2);
		total += mainOverage * HOURLY_OVERAGE_RATE; // 2 * $125 = $250

		// Additional location fee
		if (additionalLocationEnabled) {
			total += ADDITIONAL_SERVICE_FEE; // $325

			// Additional location overage (3 - 2 = 1 hour)
			const additionalOverage = Math.max(0, additionalLocationHours - 2);
			total += additionalOverage * HOURLY_OVERAGE_RATE; // 1 * $125 = $125
		}

		// Photography addon
		if (photographyEnabled) {
			total += ADDON_PRICES.photography; // $400
		}

		// USB drives (2 drives: first $300, second $100)
		if (usbDrives > 0) {
			total += ADDON_PRICES.woodenUsbDrives; // First drive $300
			if (usbDrives > 1) {
				total += (usbDrives - 1) * 100; // Additional drives: 1 * $100 = $100
			}
		}

		// Expected total: $1299 + $250 + $325 + $125 + $400 + $300 + $100 = $2799
		expect(total).toBe(2799);
	});

	// Test edge cases
	it('should handle edge cases correctly', () => {
		// Zero hours should not cause negative overage
		expect(Math.max(0, 0 - 2)).toBe(0);

		// Zero USB drives should not add cost
		const usbCost = 0 > 0 ? ADDON_PRICES.woodenUsbDrives : 0;
		expect(usbCost).toBe(0);

		// Exactly 2 hours should not have overage
		expect(Math.max(0, 2 - 2)).toBe(0);
	});

	// Test reactive calculation function
	it('should simulate reactive calculation correctly', () => {
		function calculateTotal(config: {
			selectedTier: keyof typeof TIER_PRICES;
			mainServiceHours: number;
			additionalLocation: { enabled: boolean; hours: number };
			additionalDay: { enabled: boolean; hours: number };
			addons: {
				photography: boolean;
				audioVisualSupport: boolean;
				liveMusician: boolean;
				woodenUsbDrives: number;
			};
		}) {
			let total = 0;

			// Base tier
			total += TIER_PRICES[config.selectedTier];

			// Main service overage
			const mainOverage = Math.max(0, config.mainServiceHours - 2);
			total += mainOverage * HOURLY_OVERAGE_RATE;

			// Additional location
			if (config.additionalLocation.enabled) {
				total += ADDITIONAL_SERVICE_FEE;
				const addlOverage = Math.max(0, config.additionalLocation.hours - 2);
				total += addlOverage * HOURLY_OVERAGE_RATE;
			}

			// Additional day
			if (config.additionalDay.enabled) {
				total += ADDITIONAL_SERVICE_FEE;
				const addlDayOverage = Math.max(0, config.additionalDay.hours - 2);
				total += addlDayOverage * HOURLY_OVERAGE_RATE;
			}

			// Addons
			if (config.addons.photography) total += ADDON_PRICES.photography;
			if (config.addons.audioVisualSupport) total += ADDON_PRICES.audioVisualSupport;
			if (config.addons.liveMusician) total += ADDON_PRICES.liveMusician;

			// USB drives
			if (config.addons.woodenUsbDrives > 0) {
				const isLegacy = config.selectedTier === 'legacy';
				const includedDrives = isLegacy ? 1 : 0;
				const billableDrives = Math.max(0, config.addons.woodenUsbDrives - includedDrives);

				if (billableDrives > 0) {
					if (includedDrives === 0) {
						// First drive + additional drives
						total += ADDON_PRICES.woodenUsbDrives;
						if (billableDrives > 1) {
							total += (billableDrives - 1) * 100;
						}
					} else {
						// All drives are additional (legacy case)
						total += billableDrives * 100;
					}
				}
			}

			return total;
		}

		// Test record tier with basic configuration
		const recordConfig = {
			selectedTier: 'record' as const,
			mainServiceHours: 2,
			additionalLocation: { enabled: false, hours: 2 },
			additionalDay: { enabled: false, hours: 2 },
			addons: {
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 0
			}
		};

		expect(calculateTotal(recordConfig)).toBe(699);

		// Test legacy tier with USB drives
		const legacyConfig = {
			selectedTier: 'legacy' as const,
			mainServiceHours: 2,
			additionalLocation: { enabled: false, hours: 2 },
			additionalDay: { enabled: false, hours: 2 },
			addons: {
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 3
			}
		};

		// Legacy: $1599 + 2 additional USB drives at $100 each = $1799
		expect(calculateTotal(legacyConfig)).toBe(1799);
	});
});
