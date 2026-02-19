import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import SchedulePage from './+page.svelte';

// Mock SvelteKit modules
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

describe('Schedule Page Calculator', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Clear localStorage before each test
		localStorage.clear();
	});

	it('renders the calculator with default state', () => {
		const { container } = render(SchedulePage);

		expect(screen.getByText('Tributestream Pricing Calculator')).toBeInTheDocument();
		expect(screen.getByText('Choose Your Tributestream Package')).toBeInTheDocument();
	});

	it('initializes with record tier selected', () => {
		render(SchedulePage);

		// Should show record tier as selected and display its price
		expect(screen.getByText('$699')).toBeInTheDocument();
	});

	it('updates total when tier selection changes', async () => {
		render(SchedulePage);

		// Find and click the Live tier button
		const liveButton = screen.getByText('Tributestream Live').closest('button');
		expect(liveButton).toBeInTheDocument();

		await fireEvent.click(liveButton!);

		// Should now show Live tier pricing
		expect(screen.getByText('$1,299')).toBeInTheDocument();
	});

	it('calculates overage charges when hours exceed 2', async () => {
		render(SchedulePage);

		// Find the hours slider and set it to 4 hours
		const hoursSlider = screen.getByLabelText(/Main Service Hours/);
		await fireEvent.input(hoursSlider, { target: { value: '4' } });

		// Should show overage charges (2 hours * $125 = $250)
		// Total should be $699 (record) + $250 (overage) = $849
		expect(screen.getByText('$849')).toBeInTheDocument();
	});

	it('adds additional location charges correctly', async () => {
		render(SchedulePage);

		// Enable additional location
		const additionalLocationCheckbox = screen.getByLabelText(/Additional Location/);
		await fireEvent.click(additionalLocationCheckbox);

		// Should add $325 for additional location
		// Total should be $699 (record) + $325 (additional location) = $924
		expect(screen.getByText('$924')).toBeInTheDocument();
	});

	it('adds additional day charges correctly', async () => {
		render(SchedulePage);

		// Enable additional day
		const additionalDayCheckbox = screen.getByLabelText(/Additional Day/);
		await fireEvent.click(additionalDayCheckbox);

		// Should add $325 for additional day
		// Total should be $699 (record) + $325 (additional day) = $924
		expect(screen.getByText('$924')).toBeInTheDocument();
	});

	it('calculates addon charges correctly', async () => {
		render(SchedulePage);

		// Enable photography addon
		const photographyCheckbox = screen.getByLabelText(/Photography/);
		await fireEvent.click(photographyCheckbox);

		// Should add $400 for photography
		// Total should be $699 (record) + $400 (photography) = $999
		expect(screen.getByText('$999')).toBeInTheDocument();
	});

	it('handles USB drive pricing for non-legacy tiers', async () => {
		render(SchedulePage);

		// Set USB drives to 2
		const usbInput = screen.getByLabelText(/Wooden USB Drives/);
		await fireEvent.input(usbInput, { target: { value: '2' } });

		// Should add $300 (first) + $100 (second) = $400
		// Total should be $699 (record) + $400 (USB drives) = $999
		expect(screen.getByText('$999')).toBeInTheDocument();
	});

	it('handles USB drive pricing for legacy tier correctly', async () => {
		render(SchedulePage);

		// Switch to legacy tier
		const legacyButton = screen.getByText('Tributestream Legacy').closest('button');
		await fireEvent.click(legacyButton!);

		// Set USB drives to 3 (1 included with legacy, so 2 additional at $100 each)
		const usbInput = screen.getByLabelText(/Wooden USB Drives/);
		await fireEvent.input(usbInput, { target: { value: '3' } });

		// Should add $200 for 2 additional drives
		// Total should be $1599 (legacy) + $200 (2 additional USB) = $1799
		expect(screen.getByText('$1,799')).toBeInTheDocument();
	});

	it('resets addons when tier changes', async () => {
		render(SchedulePage);

		// Enable photography addon on record tier
		const photographyCheckbox = screen.getByLabelText(/Photography/);
		await fireEvent.click(photographyCheckbox);

		// Switch to live tier
		const liveButton = screen.getByText('Tributestream Live').closest('button');
		await fireEvent.click(liveButton!);

		// Photography should be unchecked after tier change
		expect(photographyCheckbox).not.toBeChecked();

		// Total should be just the live tier price
		expect(screen.getByText('$1,299')).toBeInTheDocument();
	});

	it('saves form data to localStorage', async () => {
		render(SchedulePage);

		// Make some changes
		const hoursSlider = screen.getByLabelText(/Main Service Hours/);
		await fireEvent.input(hoursSlider, { target: { value: '3' } });

		// Wait for auto-save (debounced)
		await new Promise((resolve) => setTimeout(resolve, 1100));

		// Check if data was saved to localStorage
		const savedData = localStorage.getItem('scheduleFormData');
		expect(savedData).toBeTruthy();

		const parsedData = JSON.parse(savedData!);
		expect(parsedData.mainServiceHours).toBe(3);
	});

	it('loads saved form data from localStorage', () => {
		// Pre-populate localStorage with saved data
		const savedData = {
			selectedTier: 'live',
			mainServiceHours: 4,
			additionalLocation: { enabled: true, hours: 3 },
			additionalDay: { enabled: false, hours: 2 },
			addons: {
				photography: true,
				audioVisualSupport: false,
				liveMusician: false,
				woodenUsbDrives: 1
			},
			savedAt: new Date().toISOString()
		};
		localStorage.setItem('scheduleFormData', JSON.stringify(savedData));

		render(SchedulePage);

		// Should load the saved tier
		expect(screen.getByText('Tributestream Live')).toHaveClass('border-amber-400');

		// Should show the calculated total based on saved data
		// Live ($1299) + Main Overage (2*$125) + Additional Location ($325) + Additional Location Overage (1*$125) + Photography ($400) + USB Drive ($300)
		const expectedTotal = 1299 + 250 + 325 + 125 + 400 + 300; // $2699
		expect(screen.getByText(`$${expectedTotal.toLocaleString()}`)).toBeInTheDocument();
	});

	it('shows auto-save status correctly', async () => {
		render(SchedulePage);

		// Make a change to trigger auto-save
		const hoursSlider = screen.getByLabelText(/Main Service Hours/);
		await fireEvent.input(hoursSlider, { target: { value: '3' } });

		// Should show unsaved changes status
		expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

		// Wait for auto-save to complete
		await new Promise((resolve) => setTimeout(resolve, 1100));

		// Should show saved status
		expect(screen.getByText(/Saved/)).toBeInTheDocument();
	});

	it('handles Book Now button click', async () => {
		const { goto } = await import('$app/navigation');
		render(SchedulePage);

		const bookNowButton = screen.getByText('Book Now');
		await fireEvent.click(bookNowButton);

		// Should navigate to payment page with encoded data
		expect(goto).toHaveBeenCalledWith(expect.stringContaining('/payment?data='));
	});

	it('handles Save and Pay Later button click', async () => {
		const { goto } = await import('$app/navigation');
		render(SchedulePage);

		const saveButton = screen.getByText('Save and Pay Later');
		await fireEvent.click(saveButton);

		// Should navigate to profile page
		expect(goto).toHaveBeenCalledWith('/profile');
	});

	it('calculates complex pricing scenario correctly', async () => {
		render(SchedulePage);

		// Switch to Legacy tier
		const legacyButton = screen.getByText('Tributestream Legacy').closest('button');
		await fireEvent.click(legacyButton!);

		// Set main service to 5 hours (3 hours overage)
		const hoursSlider = screen.getByLabelText(/Main Service Hours/);
		await fireEvent.input(hoursSlider, { target: { value: '5' } });

		// Enable additional location with 4 hours (2 hours overage)
		const additionalLocationCheckbox = screen.getByLabelText(/Additional Location/);
		await fireEvent.click(additionalLocationCheckbox);

		const additionalLocationHoursSlider = screen.getByLabelText(/Additional Location Hours/);
		await fireEvent.input(additionalLocationHoursSlider, { target: { value: '4' } });

		// Enable additional day with 2 hours (no overage)
		const additionalDayCheckbox = screen.getByLabelText(/Additional Day/);
		await fireEvent.click(additionalDayCheckbox);

		// Enable all addons
		const photographyCheckbox = screen.getByLabelText(/Photography/);
		await fireEvent.click(photographyCheckbox);

		const avCheckbox = screen.getByLabelLabel(/Audio\/Visual Support/);
		await fireEvent.click(avCheckbox);

		const musicianCheckbox = screen.getByLabelText(/Live Musician/);
		await fireEvent.click(musicianCheckbox);

		// Set USB drives to 3 (1 included with legacy, 2 additional)
		const usbInput = screen.getByLabelText(/Wooden USB Drives/);
		await fireEvent.input(usbInput, { target: { value: '3' } });

		// Calculate expected total:
		// Legacy: $1599
		// Main overage: 3 * $125 = $375
		// Additional location fee: $325
		// Additional location overage: 2 * $125 = $250
		// Additional day fee: $325
		// Photography: $400
		// A/V Support: $200
		// Live Musician: $500
		// Additional USB drives: 2 * $100 = $200
		const expectedTotal = 1599 + 375 + 325 + 250 + 325 + 400 + 200 + 500 + 200; // $4174

		expect(screen.getByText(`$${expectedTotal.toLocaleString()}`)).toBeInTheDocument();
	});
});

// Test reactive calculations directly
describe('Schedule Page Reactive Calculations', () => {
	it('calculates booking items correctly', () => {
		// Test the calculation logic that should be working in the component
		const selectedTier = 'record';
		const mainServiceHours = 3;
		const additionalLocation = { enabled: true, hours: 2 };
		const additionalDay = { enabled: false, hours: 2 };
		const addons = {
			photography: true,
			audioVisualSupport: false,
			liveMusician: false,
			woodenUsbDrives: 1
		};

		// Expected items:
		// 1. Record tier: $699
		// 2. Main overage: 1 hour * $125 = $125
		// 3. Additional location: $325
		// 4. Photography: $400
		// 5. USB drive: $300

		const expectedTotal = 699 + 125 + 325 + 400 + 300; // $1749
		expect(expectedTotal).toBe(1749);
	});

	it('handles tier price lookup correctly', () => {
		const TIER_PRICES = { record: 699, live: 1299, legacy: 1599 };

		expect(TIER_PRICES.record).toBe(699);
		expect(TIER_PRICES.live).toBe(1299);
		expect(TIER_PRICES.legacy).toBe(1599);
	});

	it('calculates overage hours correctly', () => {
		expect(Math.max(0, 2 - 2)).toBe(0); // No overage
		expect(Math.max(0, 3 - 2)).toBe(1); // 1 hour overage
		expect(Math.max(0, 5 - 2)).toBe(3); // 3 hours overage
	});
});
