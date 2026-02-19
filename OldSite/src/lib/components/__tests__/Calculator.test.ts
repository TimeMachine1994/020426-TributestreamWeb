import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Calculator from '../calculator/Calculator.svelte';
import { setupTestEnvironment } from '../../../../test-utils/test-helpers';
import { createTestMemorial } from '../../../../test-utils/factories';

// Mock API calls
const mockUpdateMemorial = vi.fn();
const mockCreateStreams = vi.fn();

vi.mock('$lib/utils/api', () => ({
  updateMemorial: mockUpdateMemorial,
  createStreamsFromSchedule: mockCreateStreams
}));

describe('Calculator Component', () => {
  const mockMemorial = createTestMemorial({
    services: {
      main: {
        location: { name: '', address: '', isUnknown: true },
        time: { date: null, time: null, isUnknown: true },
        hours: 2
      },
      additional: []
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setupTestEnvironment();
    mockUpdateMemorial.mockResolvedValue({ success: true });
    mockCreateStreams.mockResolvedValue({ success: true });
  });

  it('renders calculator steps', () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    expect(screen.getByText(/service details/i)).toBeInTheDocument();
    expect(screen.getByText(/tier selection/i)).toBeInTheDocument();
    expect(screen.getByText(/summary/i)).toBeInTheDocument();
  });

  it('starts on service details step', () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    expect(screen.getByText(/when and where will the service be held/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
  });

  it('validates service details before proceeding', async () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/location name is required/i)).toBeInTheDocument();
    });
  });

  it('navigates to tier selection after valid service details', async () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    // Fill out service details
    const locationInput = screen.getByLabelText(/location name/i);
    await fireEvent.input(locationInput, {
      target: { value: 'Memorial Chapel' }
    });
    
    const dateInput = screen.getByLabelText(/service date/i);
    await fireEvent.input(dateInput, {
      target: { value: '2024-01-15' }
    });
    
    const timeInput = screen.getByLabelText(/service time/i);
    await fireEvent.input(timeInput, {
      target: { value: '14:00' }
    });
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/choose your package/i)).toBeInTheDocument();
    });
  });

  it('displays tier options correctly', async () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    // Navigate to tier selection
    await fillServiceDetails();
    
    expect(screen.getByText(/diy/i)).toBeInTheDocument();
    expect(screen.getByText(/standard/i)).toBeInTheDocument();
    expect(screen.getByText(/premium/i)).toBeInTheDocument();
    
    expect(screen.getByText(/\$99/)).toBeInTheDocument();
    expect(screen.getByText(/\$199/)).toBeInTheDocument();
    expect(screen.getByText(/\$299/)).toBeInTheDocument();
  });

  it('selects tier and updates pricing', async () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    await fillServiceDetails();
    
    // Select premium tier
    const premiumTier = screen.getByText(/premium/i).closest('button');
    await fireEvent.click(premiumTier!);
    
    expect(premiumTier).toHaveClass('ring-2'); // Selected state
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/\$299/)).toBeInTheDocument();
    });
  });

  it('shows summary with all details', async () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    await fillServiceDetails();
    await selectTier('premium');
    
    // Check summary details
    expect(screen.getByText(/memorial chapel/i)).toBeInTheDocument();
    expect(screen.getByText(/january 15, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/2:00 pm/i)).toBeInTheDocument();
    expect(screen.getByText(/premium package/i)).toBeInTheDocument();
    expect(screen.getByText(/\$299/)).toBeInTheDocument();
  });

  it('saves and pays later', async () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    await fillServiceDetails();
    await selectTier('standard');
    
    const saveButton = screen.getByRole('button', { name: /save and pay later/i });
    await fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateMemorial).toHaveBeenCalledWith(
        mockMemorial.id,
        expect.objectContaining({
          services: expect.objectContaining({
            main: expect.objectContaining({
              location: { name: 'Memorial Chapel', address: '', isUnknown: false }
            })
          }),
          calculatorConfig: expect.objectContaining({
            selectedTier: 'standard',
            totalPrice: 199
          })
        })
      );
    });
  });

  it('proceeds to payment', async () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    await fillServiceDetails();
    await selectTier('diy');
    
    const payButton = screen.getByRole('button', { name: /proceed to payment/i });
    expect(payButton).toBeInTheDocument();
    
    await fireEvent.click(payButton);
    
    // Should show Stripe checkout component
    await waitFor(() => {
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });
  });

  it('handles additional services', async () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    await fillServiceDetails();
    
    // Add additional service
    const addServiceButton = screen.getByRole('button', { name: /add additional service/i });
    await fireEvent.click(addServiceButton);
    
    const additionalLocationInput = screen.getByLabelText(/additional location/i);
    await fireEvent.input(additionalLocationInput, {
      target: { value: 'Reception Hall' }
    });
    
    await selectTier('standard');
    
    // Check summary includes additional service
    expect(screen.getByText(/reception hall/i)).toBeInTheDocument();
  });

  it('auto-saves form data', async () => {
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    const locationInput = screen.getByLabelText(/location name/i);
    await fireEvent.input(locationInput, {
      target: { value: 'Test Location' }
    });
    
    // Wait for auto-save
    await waitFor(() => {
      expect(localStorage.getItem(`calculator-${mockMemorial.id}`)).toContain('Test Location');
    }, { timeout: 3000 });
  });

  it('loads saved form data on mount', () => {
    const savedData = {
      services: {
        main: {
          location: { name: 'Saved Location', address: '', isUnknown: false },
          time: { date: '2024-02-01', time: '10:00', isUnknown: false },
          hours: 2
        }
      },
      selectedTier: 'premium'
    };
    
    localStorage.setItem(`calculator-${mockMemorial.id}`, JSON.stringify(savedData));
    
    render(Calculator, {
      props: { memorial: mockMemorial }
    });
    
    expect(screen.getByDisplayValue('Saved Location')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-02-01')).toBeInTheDocument();
  });

  // Helper functions
  async function fillServiceDetails() {
    const locationInput = screen.getByLabelText(/location name/i);
    await fireEvent.input(locationInput, {
      target: { value: 'Memorial Chapel' }
    });
    
    const dateInput = screen.getByLabelText(/service date/i);
    await fireEvent.input(dateInput, {
      target: { value: '2024-01-15' }
    });
    
    const timeInput = screen.getByLabelText(/service time/i);
    await fireEvent.input(timeInput, {
      target: { value: '14:00' }
    });
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/choose your package/i)).toBeInTheDocument();
    });
  }

  async function selectTier(tier: string) {
    const tierButton = screen.getByText(new RegExp(tier, 'i')).closest('button');
    await fireEvent.click(tierButton!);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/summary/i)).toBeInTheDocument();
    });
  }
});
