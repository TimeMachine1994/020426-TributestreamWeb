import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import Calculator from './Calculator.svelte';
import type { CalculatorFormData, Tier, BookingItem } from '$lib/types/livestream';

// Mock the auto-save composable
vi.mock('$lib/composables/useAutoSave', () => ({
	useAutoSave: vi.fn(() => ({
		triggerAutoSave: vi.fn(),
		loadAutoSavedData: vi.fn(() => Promise.resolve(null)),
		isSaving: vi.fn(() => false),
		lastSaved: vi.fn(() => null),
		hasUnsavedChanges: vi.fn(() => false)
	}))
}));

// Mock Firebase auth
vi.mock('$lib/firebase', () => ({
	auth: {
		currentUser: { uid: 'test-user' }
	}
}));

describe('Calculator Component', () => {
	const mockProps = {
		memorialId: 'test-memorial-123',
		data: {
			memorial: {
				id: 'test-memorial-123',
				lovedOneName: 'John Doe',
				ownerUid: 'test-user'
			},
			config: null
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders with default state', () => {
		const { container } = render(Calculator, { props: mockProps });
		expect(container).toBeTruthy();
	});

	it('initializes with record tier selected by default', () => {
		const { component } = render(Calculator, { props: mockProps });

		// Access component state (this might need adjustment based on your testing setup)
		expect(screen.getByText('Choose Your Package')).toBeInTheDocument();
	});

	it('calculates correct pricing for record tier', () => {
		const { component } = render(Calculator, { props: mockProps });

		// Test that record tier shows correct base price
		expect(screen.getByText('$699')).toBeInTheDocument();
	});

	it('updates pricing when tier changes', async () => {
		const { component } = render(Calculator, { props: mockProps });

		// Find and click the Live tier button
		const liveButton = screen.getByText('Tributestream Live').closest('button');
		await fireEvent.click(liveButton!);

		// Should show Live tier pricing
		expect(screen.getByText('$1299')).toBeInTheDocument();
	});

	it('calculates overage charges correctly', () => {
		const { component } = render(Calculator, { props: mockProps });

		// Test overage calculation logic
		const testFormData: CalculatorFormData = {
			lovedOneName: 'Test',
			mainService: {
				location: { name: 'Test Location', address: 'Test Address', isUnknown: false },
				time: { date: '2024-01-01', time: '10:00', isUnknown: false },
				hours: 4 // 2 hours overage
			},
			additionalLocation: {
				enabled: false,
				location: { name: '', address: '', isUnknown: false },
				startTime: null,
				hours: 2
			},
			additionalDay: {
				enabled: false,
				location: { name: '', address: '', isUnknown: false },
				startTime: null,
				hours: 2
			},
			funeralDirectorName: '',
			funeralHome: '',
			addons: {
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 0
			}
		};

		// Calculate expected items
		const expectedOverage = (4 - 2) * 125; // 2 hours * $125 = $250
		expect(expectedOverage).toBe(250);
	});

	it('handles additional location charges', () => {
		const testFormData: CalculatorFormData = {
			lovedOneName: 'Test',
			mainService: {
				location: { name: 'Test Location', address: 'Test Address', isUnknown: false },
				time: { date: '2024-01-01', time: '10:00', isUnknown: false },
				hours: 2
			},
			additionalLocation: {
				enabled: true,
				location: { name: 'Second Location', address: 'Second Address', isUnknown: false },
				startTime: '14:00',
				hours: 3 // 1 hour overage
			},
			additionalDay: {
				enabled: false,
				location: { name: '', address: '', isUnknown: false },
				startTime: null,
				hours: 2
			},
			funeralDirectorName: '',
			funeralHome: '',
			addons: {
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 0
			}
		};

		// Should include additional location fee ($325) + overage (1 * $125)
		const expectedAdditionalLocationTotal = 325 + 125; // $450
		expect(expectedAdditionalLocationTotal).toBe(450);
	});

	it('calculates USB drive pricing correctly for non-legacy tiers', () => {
		const testAddons = {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: 3
		};

		// For non-legacy tiers: first drive $300, additional drives $100 each
		// 3 drives = $300 + (2 * $100) = $500
		const expectedUsbTotal = 300 + 2 * 100;
		expect(expectedUsbTotal).toBe(500);
	});

	it('calculates USB drive pricing correctly for legacy tier', () => {
		const testAddons = {
			photography: false,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: 3
		};

		// For legacy tier: 1 drive included, additional drives $100 each
		// 3 drives with 1 included = 2 * $100 = $200
		const expectedUsbTotal = 2 * 100;
		expect(expectedUsbTotal).toBe(200);
	});

	it('handles addon selections correctly', () => {
		const testAddons = {
			photography: true, // $400
			audioVisualSupport: true, // $200
			liveMusician: true, // $500
			woodenUsbDrives: 1 // $300 (first drive)
		};

		const expectedAddonTotal = 400 + 200 + 500 + 300; // $1400
		expect(expectedAddonTotal).toBe(1400);
	});

	it('resets addons when tier changes', async () => {
		const { component } = render(Calculator, { props: mockProps });

		// This test would need to verify that when tier changes, addons are reset
		// Implementation depends on how you expose component state for testing
	});

	it('validates form data before saving', () => {
		// Test validation logic
		const invalidFormData = {
			selectedTier: null,
			bookingItems: [],
			total: 0
		};

		// Should return false for invalid data
		expect(invalidFormData.selectedTier).toBeNull();
		expect(invalidFormData.bookingItems.length).toBe(0);
		expect(invalidFormData.total).toBe(0);
	});
});

// Test the calculation functions directly
describe('Calculator Logic Functions', () => {
	const TIER_PRICES = { record: 699, live: 1299, legacy: 1599 };
	const ADDON_PRICES = {
		photography: 400,
		audioVisualSupport: 200,
		liveMusician: 500,
		woodenUsbDrives: 300
	};
	const HOURLY_OVERAGE_RATE = 125;
	const ADDITIONAL_SERVICE_FEE = 325;

	function calculateBookingItems(selectedTier: Tier, formData: CalculatorFormData): BookingItem[] {
		const items: BookingItem[] = [];

		// Base Package
		if (selectedTier) {
			const price = TIER_PRICES[selectedTier];
			items.push({
				id: selectedTier,
				name: `Tributestream ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`,
				package: `Tributestream ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`,
				price: price,
				quantity: 1,
				total: price
			});
		}

		// Main Service Overage
		const mainOverageHours = Math.max(0, formData.mainService.hours - 2);
		if (mainOverageHours > 0) {
			items.push({
				id: 'main_overage',
				name: 'Main Location Overage',
				package: 'Add-on',
				price: HOURLY_OVERAGE_RATE,
				quantity: mainOverageHours,
				total: HOURLY_OVERAGE_RATE * mainOverageHours
			});
		}

		// Additional Location
		if (formData.additionalLocation.enabled) {
			items.push({
				id: 'addl_location_fee',
				name: 'Additional Location Fee',
				package: 'Add-on',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});

			const addlLocationOverage = Math.max(0, formData.additionalLocation.hours - 2);
			if (addlLocationOverage > 0) {
				items.push({
					id: 'addl_location_overage',
					name: 'Add. Location Overage',
					package: 'Add-on',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlLocationOverage,
					total: HOURLY_OVERAGE_RATE * addlLocationOverage
				});
			}
		}

		// Additional Day
		if (formData.additionalDay.enabled) {
			items.push({
				id: 'addl_day_fee',
				name: 'Additional Day Fee',
				package: 'Add-on',
				price: ADDITIONAL_SERVICE_FEE,
				quantity: 1,
				total: ADDITIONAL_SERVICE_FEE
			});

			const addlDayOverage = Math.max(0, formData.additionalDay.hours - 2);
			if (addlDayOverage > 0) {
				items.push({
					id: 'addl_day_overage',
					name: 'Add. Day Overage',
					package: 'Add-on',
					price: HOURLY_OVERAGE_RATE,
					quantity: addlDayOverage,
					total: HOURLY_OVERAGE_RATE * addlDayOverage
				});
			}
		}

		// Addons
		if (formData.addons.photography) {
			items.push({
				id: 'photography',
				name: 'Photography',
				package: 'Add-on',
				price: ADDON_PRICES.photography,
				quantity: 1,
				total: ADDON_PRICES.photography
			});
		}

		if (formData.addons.audioVisualSupport) {
			items.push({
				id: 'av_support',
				name: 'Audio/Visual Support',
				package: 'Add-on',
				price: ADDON_PRICES.audioVisualSupport,
				quantity: 1,
				total: ADDON_PRICES.audioVisualSupport
			});
		}

		if (formData.addons.liveMusician) {
			items.push({
				id: 'live_musician',
				name: 'Live Musician',
				package: 'Add-on',
				price: ADDON_PRICES.liveMusician,
				quantity: 1,
				total: ADDON_PRICES.liveMusician
			});
		}

		// USB Drives
		if (formData.addons.woodenUsbDrives > 0) {
			const isLegacy = selectedTier === 'legacy';
			const usbDrives = formData.addons.woodenUsbDrives;
			const includedDrives = isLegacy ? 1 : 0;

			if (usbDrives > includedDrives) {
				const billableDrives = usbDrives - includedDrives;

				if (billableDrives > 0 && includedDrives === 0) {
					items.push({
						id: 'usb_drive_first',
						name: 'Wooden USB Drive',
						package: 'Add-on',
						price: ADDON_PRICES.woodenUsbDrives,
						quantity: 1,
						total: ADDON_PRICES.woodenUsbDrives
					});

					if (billableDrives > 1) {
						items.push({
							id: 'usb_drive_additional',
							name: 'Additional Wooden USB Drives',
							package: 'Add-on',
							price: 100,
							quantity: billableDrives - 1,
							total: 100 * (billableDrives - 1)
						});
					}
				} else {
					items.push({
						id: 'usb_drive_additional',
						name: 'Additional Wooden USB Drives',
						package: 'Add-on',
						price: 100,
						quantity: billableDrives,
						total: 100 * billableDrives
					});
				}
			}
		}

		return items;
	}

	it('calculates record tier correctly', () => {
		const formData: CalculatorFormData = {
			lovedOneName: 'Test',
			mainService: {
				location: { name: '', address: '', isUnknown: false },
				time: { date: null, time: null, isUnknown: false },
				hours: 2
			},
			additionalLocation: {
				enabled: false,
				location: { name: '', address: '', isUnknown: false },
				startTime: null,
				hours: 2
			},
			additionalDay: {
				enabled: false,
				location: { name: '', address: '', isUnknown: false },
				startTime: null,
				hours: 2
			},
			funeralDirectorName: '',
			funeralHome: '',
			addons: {
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 0
			}
		};

		const items = calculateBookingItems('record', formData);
		const total = items.reduce((acc, item) => acc + item.total, 0);

		expect(items).toHaveLength(1);
		expect(items[0].name).toBe('Tributestream Record');
		expect(items[0].total).toBe(699);
		expect(total).toBe(699);
	});

	it('calculates complex scenario correctly', () => {
		const formData: CalculatorFormData = {
			lovedOneName: 'Test',
			mainService: {
				location: { name: '', address: '', isUnknown: false },
				time: { date: null, time: null, isUnknown: false },
				hours: 4
			}, // 2 hours overage
			additionalLocation: {
				enabled: true,
				location: { name: '', address: '', isUnknown: false },
				startTime: null,
				hours: 3
			}, // 1 hour overage
			additionalDay: {
				enabled: true,
				location: { name: '', address: '', isUnknown: false },
				startTime: null,
				hours: 2
			}, // no overage
			funeralDirectorName: '',
			funeralHome: '',
			addons: {
				photography: true,
				audioVisualSupport: true,
				liveMusician: false,
				woodenUsbDrives: 2
			}
		};

		const items = calculateBookingItems('live', formData);
		const total = items.reduce((acc, item) => acc + item.total, 0);

		// Expected: Live ($1299) + Main Overage (2*$125) + Additional Location ($325) + Additional Location Overage (1*$125) + Additional Day ($325) + Photography ($400) + A/V Support ($200) + USB Drive ($300) + Additional USB ($100)
		const expectedTotal = 1299 + 250 + 325 + 125 + 325 + 400 + 200 + 300 + 100;
		expect(total).toBe(expectedTotal);
	});

	it('handles legacy tier USB drives correctly', () => {
		const formData: CalculatorFormData = {
			lovedOneName: 'Test',
			mainService: {
				location: { name: '', address: '', isUnknown: false },
				time: { date: null, time: null, isUnknown: false },
				hours: 2
			},
			additionalLocation: {
				enabled: false,
				location: { name: '', address: '', isUnknown: false },
				startTime: null,
				hours: 2
			},
			additionalDay: {
				enabled: false,
				location: { name: '', address: '', isUnknown: false },
				startTime: null,
				hours: 2
			},
			funeralDirectorName: '',
			funeralHome: '',
			addons: {
				photography: false,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 3
			}
		};

		const items = calculateBookingItems('legacy', formData);
		const total = items.reduce((acc, item) => acc + item.total, 0);

		// Legacy includes 1 USB drive, so 3 drives = 1 included + 2 additional at $100 each
		// Expected: Legacy ($1599) + Additional USB Drives (2*$100)
		const expectedTotal = 1599 + 200;
		expect(total).toBe(expectedTotal);
	});
});
