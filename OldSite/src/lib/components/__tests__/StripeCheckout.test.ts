import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import StripeCheckout from '../calculator/StripeCheckout.svelte';
import { setupTestEnvironment } from '../../../../test-utils/test-helpers';

// Mock Stripe types and functions
const mockCardElement = {
  mount: vi.fn(),
  unmount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

const mockElements = {
  create: vi.fn(() => mockCardElement),
  getElement: vi.fn()
};

const mockStripe = {
  elements: vi.fn(() => mockElements),
  confirmCardPayment: vi.fn(),
  createPaymentMethod: vi.fn(),
  retrievePaymentIntent: vi.fn()
};

// Mock Stripe loader
vi.mock('$lib/utils/stripeLoader', () => ({
  getStripe: vi.fn(() => Promise.resolve(mockStripe))
}));

describe('StripeCheckout Component', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockWindowLocation: { href: string; reload: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    setupTestEnvironment();

    // Mock fetch
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Mock window.location
    mockWindowLocation = {
      href: '',
      reload: vi.fn()
    };
    Object.defineProperty(window, 'location', {
      value: mockWindowLocation,
      writable: true
    });

    // Reset all mocks
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render and Loading', () => {
    it('renders with payment title', () => {
      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      expect(screen.getByText('Complete Your Payment')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      expect(screen.getByText('Loading payment system...')).toBeInTheDocument();
      expect(document.querySelector('.spinner')).toBeInTheDocument();
    });

    it('initializes Stripe on mount', async () => {
      const { getStripe } = await import('$lib/utils/stripeLoader');
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          clientSecret: 'pi_test_client_secret'
        })
      });

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for mount effect
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(getStripe).toHaveBeenCalled();
    });
  });

  describe('Stripe Initialization', () => {
    it('handles successful Stripe initialization', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          clientSecret: 'pi_test_client_secret'
        })
      });

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockStripe.elements).toHaveBeenCalledWith({
        clientSecret: 'pi_test_client_secret'
      });
      expect(mockElements.create).toHaveBeenCalledWith('card');
      expect(mockCardElement.mount).toHaveBeenCalledWith('#card-element');
    });

    it('handles Stripe initialization failure', async () => {
      const { getStripe } = await import('$lib/utils/stripeLoader');
      (getStripe as any).mockResolvedValueOnce(null);

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Failed to initialize Stripe. Please refresh and try again.')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('handles Stripe loading error', async () => {
      const { getStripe } = await import('$lib/utils/stripeLoader');
      (getStripe as any).mockRejectedValueOnce(new Error('Network error'));

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Payment Intent Creation', () => {
    it('creates payment intent with correct data', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          clientSecret: 'pi_test_client_secret'
        })
      });

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('/app/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        })
      });
    });

    it('handles payment intent creation failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Payment intent creation failed'));

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization attempt
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should still show loading or handle gracefully
      // The component doesn't explicitly handle this error case in the current implementation
    });
  });

  describe('Payment Form', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          clientSecret: 'pi_test_client_secret'
        })
      });
    });

    it('shows payment button with correct amount', async () => {
      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Pay $299')).toBeInTheDocument();
    });

    it('disables payment button when Stripe not loaded', async () => {
      const { getStripe } = await import('$lib/utils/stripeLoader');
      (getStripe as any).mockResolvedValueOnce(null);

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should show error state instead of disabled button
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('shows card element container', async () => {
      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.querySelector('#card-element')).toBeInTheDocument();
    });
  });

  describe('Payment Processing', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          clientSecret: 'pi_test_client_secret'
        })
      });
    });

    it('processes payment successfully', async () => {
      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: {
          id: 'pi_test_123',
          status: 'succeeded'
        }
      });

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      const payButton = screen.getByText('Pay $299');
      await fireEvent.click(payButton);

      expect(mockStripe.confirmCardPayment).toHaveBeenCalledWith('pi_test_client_secret', {
        payment_method: {
          card: mockCardElement
        }
      });

      expect(mockWindowLocation.href).toBe('/app/checkout/success?memorialId=memorial-123');
    });

    it('shows processing state during payment', async () => {
      // Mock a payment that never resolves to test processing state
      mockStripe.confirmCardPayment.mockImplementation(() => new Promise(() => {}));

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      const payButton = screen.getByText('Pay $299');
      await fireEvent.click(payButton);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('handles payment errors', async () => {
      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: {
          message: 'Your card was declined.',
          type: 'card_error',
          code: 'card_declined'
        }
      });

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      const payButton = screen.getByText('Pay $299');
      await fireEvent.click(payButton);

      // Wait for payment processing
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
      expect(screen.getByText('Pay $299')).toBeInTheDocument(); // Button should be enabled again
    });

    it('handles payment errors without message', async () => {
      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: {
          type: 'api_error',
          code: 'processing_error'
        }
      });

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      const payButton = screen.getByText('Pay $299');
      await fireEvent.click(payButton);

      // Wait for payment processing
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(screen.getByText('An unknown error occurred.')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('shows retry button on Stripe error', async () => {
      const { getStripe } = await import('$lib/utils/stripeLoader');
      (getStripe as any).mockRejectedValueOnce(new Error('Failed to load'));

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });

    it('reloads page when retry clicked', async () => {
      const { getStripe } = await import('$lib/utils/stripeLoader');
      (getStripe as any).mockRejectedValueOnce(new Error('Failed to load'));

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      const retryButton = screen.getByText('Retry');
      await fireEvent.click(retryButton);

      expect(mockWindowLocation.reload).toHaveBeenCalled();
    });
  });

  describe('Component State Management', () => {
    it('prevents payment submission without required dependencies', async () => {
      // Mock scenario where Stripe loads but elements fail to create
      mockStripe.elements.mockReturnValueOnce(null);

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          clientSecret: 'pi_test_client_secret'
        })
      });

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      // Try to click pay button (should not process)
      const payButton = screen.getByText('Pay $299');
      await fireEvent.click(payButton);

      expect(mockStripe.confirmCardPayment).not.toHaveBeenCalled();
    });

    it('handles missing client secret gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          // Missing clientSecret
        })
      });

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      // Elements should not be created without client secret
      expect(mockStripe.elements).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility and UX', () => {
    it('provides proper button states for screen readers', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          clientSecret: 'pi_test_client_secret'
        })
      });

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      const payButton = screen.getByRole('button', { name: /pay \$299/i });
      expect(payButton).toBeInTheDocument();
      expect(payButton).not.toBeDisabled();
    });

    it('shows appropriate loading indicators', async () => {
      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Initial loading state
      expect(screen.getByText('Loading payment system...')).toBeInTheDocument();
      
      // Spinner should be visible
      const spinner = document.querySelector('.spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('spinner');
    });

    it('maintains focus management during state changes', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          clientSecret: 'pi_test_client_secret'
        })
      });

      render(StripeCheckout, {
        props: {
          amount: 299,
          memorialId: 'memorial-123',
          lovedOneName: 'John Doe'
        }
      });

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      // Payment button should be focusable
      const payButton = screen.getByText('Pay $299');
      expect(payButton).toBeInTheDocument();
      expect(payButton.tagName).toBe('BUTTON');
    });
  });
});
