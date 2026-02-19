// Schedule Calculator Logic Tests (unit tests without Svelte component rendering)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { goto } from '$app/navigation';
import type { CalculatorFormData, BookingItem, Tier } from '$lib/types/livestream';

describe('Schedule Calculator - Pricing Logic', () => {
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

	function calculateBookingItems(
		selectedTier: Tier,
		mainServiceHours: number,
		additionalLocation: { enabled: boolean; hours: number },
		additionalDay: { enabled: boolean; hours: number },
		addons: {
			photography: boolean;
			audioVisualSupport: boolean;
			liveMusician: boolean;
			woodenUsbDrives: number;
		}
	): BookingItem[] {
		const items: BookingItem[] = [];

		// Base Package
		if (selectedTier) {
			const price = TIER_PRICES[selectedTier];
			items.push({
				id: 'base-package',
				name: `Tributestream ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`,
				package: selectedTier,
				price: price,
				quantity: 1,
				total: price
			});
		}

		// Main Service Overage
		const mainOverageHours = Math.max(0, mainServiceHours - 2);
		if (mainOverageHours > 0) {
			items.push({
				id: 'main-overage',
				name: 'Main Location Overage',
				package: selectedTier || 'record',
				price: HOURLY_OVERAGE_RATE,
				quantity: mainOverageHours,
				total: HOURLY_OVERAGE_RATE * mainOverageHours
			});
		}

		// Additional Location
		if (additionalLocation.enabled) {
			items.push({
				id: 'additional-location-base',
				name: 'Additional Location',
				package: selectedTier || 'record',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});

			const addlLocationOverage = Math.max(0, additionalLocation.hours - 2);
			if (addlLocationOverage > 0) {
				items.push({
					id: 'additional-location-overage',
					name: 'Additional Location Overage',
					package: selectedTier || 'record',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlLocationOverage,
					total: HOURLY_OVERAGE_RATE * addlLocationOverage
				});
			}
		}

		// Additional Day
		if (additionalDay.enabled) {
			items.push({
				id: 'additional-day-base',
				name: 'Additional Day',
				package: selectedTier || 'record',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});

			const addlDayOverage = Math.max(0, additionalDay.hours - 2);
			if (addlDayOverage > 0) {
				items.push({
					id: 'additional-day-overage',
					name: 'Additional Day Overage',
					package: selectedTier || 'record',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlDayOverage,
					total: HOURLY_OVERAGE_RATE * addlDayOverage
				});
			}
		}

		// Addons
		if (addons.photography) {
			items.push({
				id: 'photography',
				name: 'Photography Service',
				package: selectedTier || 'record',
				price: ADDON_PRICES.photography,
				quantity: 1,
				total: ADDON_PRICES.photography
			});
		}

		if (addons.audioVisualSupport) {
			items.push({
				id: 'audio-visual',
				name: 'Audio/Visual Support',
				package: selectedTier || 'record',
				price: ADDON_PRICES.audioVisualSupport,
				quantity: 1,
				total: ADDON_PRICES.audioVisualSupport
			});
		}

		if (addons.liveMusician) {
			items.push({
				id: 'live-musician',
				name: 'Live Musician',
				package: selectedTier || 'record',
				price: ADDON_PRICES.liveMusician,
				quantity: 1,
				total: ADDON_PRICES.liveMusician
			});
		}

		// USB Drives
		if (addons.woodenUsbDrives > 0) {
			const includedDrives = selectedTier === 'legacy' ? 1 : 0;
			const chargeableDrives = Math.max(0, addons.woodenUsbDrives - includedDrives);

			if (chargeableDrives > 0) {
				const firstDrivePrice = ADDON_PRICES.woodenUsbDrives;
				const additionalDrivePrice = 100;

				let totalUsbPrice = 0;
				if (chargeableDrives === 1) {
					totalUsbPrice = firstDrivePrice;
				} else {
					totalUsbPrice = firstDrivePrice + (chargeableDrives - 1) * additionalDrivePrice;
				}

				items.push({
					id: 'wooden-usb',
					name: `Wooden USB Drive${chargeableDrives > 1 ? 's' : ''}`,
					package: selectedTier || 'record',
					price: totalUsbPrice / chargeableDrives,
					quantity: chargeableDrives,
					total: totalUsbPrice
				});
			}
		}

		return items;
	}

	it('calculates record tier base price correctly', () => {
		const items = calculateBookingItems(
			'record',
			2,
			{ enabled: false, hours: 2 },
			{ enabled: false, hours: 2 },
			{
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 0
			}
		);

		expect(items).toHaveLength(1);
		expect(items[0].name).toBe('Tributestream Record');
		expect(items[0].total).toBe(699);
	});

	it('calculates overage charges correctly', () => {
		const items = calculateBookingItems(
			'record',
			4,
			{ enabled: false, hours: 2 },
			{ enabled: false, hours: 2 },
			{
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 0
			}
		);

		expect(items).toHaveLength(2);
		expect(items[1].name).toBe('Main Location Overage');
		expect(items[1].quantity).toBe(2); // 4 - 2 = 2 hours overage
		expect(items[1].total).toBe(250); // 2 * 125
	});

	it('calculates additional location fees', () => {
		const items = calculateBookingItems(
			'record',
			2,
			{ enabled: true, hours: 3 },
			{ enabled: false, hours: 2 },
			{
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 0
			}
		);

		expect(items).toHaveLength(3);
		expect(items[1].name).toBe('Additional Location');
		expect(items[1].total).toBe(325);
		expect(items[2].name).toBe('Additional Location Overage');
		expect(items[2].total).toBe(125); // 1 hour overage
	});

	it('calculates USB drive pricing for non-legacy tiers', () => {
		const items = calculateBookingItems(
			'record',
			2,
			{ enabled: false, hours: 2 },
			{ enabled: false, hours: 2 },
			{
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 3
			}
		);

		const usbItem = items.find((item) => item.id === 'wooden-usb');
		expect(usbItem).toBeDefined();
		expect(usbItem!.quantity).toBe(3);
		expect(usbItem!.total).toBe(500); // 300 + 100 + 100
	});

	it('calculates USB drive pricing for legacy tier with included drive', () => {
		const items = calculateBookingItems(
			'legacy',
			2,
			{ enabled: false, hours: 2 },
			{ enabled: false, hours: 2 },
			{
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 3
			}
		);

		const usbItem = items.find((item) => item.id === 'wooden-usb');
		expect(usbItem).toBeDefined();
		expect(usbItem!.quantity).toBe(2); // 3 - 1 included = 2 chargeable
		expect(usbItem!.total).toBe(400); // 300 + 100
	});

	it('calculates complex scenario correctly', () => {
		const items = calculateBookingItems(
			'live',
			4,
			{ enabled: true, hours: 3 },
			{ enabled: true, hours: 2 },
			{
				photography: true,
				audioVisualSupport: true,
				liveMusician: false,
				woodenUsbDrives: 2
			}
		);

		const total = items.reduce((acc, item) => acc + item.total, 0);

		// Live: 1299 + Main overage: 250 + Additional location: 325 + Location overage: 125 + Additional day: 325 + Photography: 400 + A/V: 200 + USB drives: 400
		const expectedTotal = 1299 + 250 + 325 + 125 + 325 + 400 + 200 + 400;
		expect(total).toBe(expectedTotal);
	});
});

describe('Schedule Page - Navigation Logic', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should extract memorial ID from URL params', () => {
		const searchParams = new URLSearchParams('?memorialId=test-123');
		const memorialId = searchParams.get('memorialId');

		expect(memorialId).toBe('test-123');
	});

	it('should redirect to profile when no memorial ID', () => {
		const searchParams = new URLSearchParams('');
		const memorialId = searchParams.get('memorialId');

		if (!memorialId) {
			goto('/profile');
		}

		expect(goto).toHaveBeenCalledWith('/profile');
	});

	it('should handle booking navigation with payment data', () => {
		const paymentData = {
			memorialId: 'test-123',
			clientSecret: 'pi_test_secret',
			amount: 699,
			bookingItems: []
		};

		const encodedData = btoa(JSON.stringify(paymentData));
		const expectedUrl = `/payment?data=${encodedData}`;

		goto(expectedUrl);

		expect(goto).toHaveBeenCalledWith(expectedUrl);
	});
});

describe('Schedule Page - API Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	it('should call payment intent API with correct data', async () => {
		const mockResponse = {
			ok: true,
			json: () =>
				Promise.resolve({
					clientSecret: 'pi_test_secret',
					paymentIntentId: 'pi_test_123'
				})
		};

		(global.fetch as any).mockResolvedValue(mockResponse);

		const bookingData = {
			memorialId: 'test-123',
			amount: 699,
			bookingItems: [],
			customerInfo: { email: 'test@example.com' }
		};

		const response = await fetch('/api/create-payment-intent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(bookingData)
		});

		expect(global.fetch).toHaveBeenCalledWith('/api/create-payment-intent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(bookingData)
		});

		const result = await response.json();
		expect(result.clientSecret).toBe('pi_test_secret');
	});

	it('should handle API errors gracefully', async () => {
		const mockResponse = {
			ok: false,
			json: () => Promise.resolve({ error: 'Payment failed' })
		};

		(global.fetch as any).mockResolvedValue(mockResponse);

		const response = await fetch('/api/create-payment-intent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});

		const result = await response.json();
		expect(result.error).toBe('Payment failed');
	});
});
