import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ErrorBoundary from '../ErrorBoundary.svelte';
import { setupTestEnvironment } from '../../../../test-utils/test-helpers';

// Mock Lucide icons
vi.mock('lucide-svelte', () => ({
  AlertTriangle: vi.fn(() => ({ $$: { fragment: null } })),
  RefreshCw: vi.fn(() => ({ $$: { fragment: null } })),
  Home: vi.fn(() => ({ $$: { fragment: null } }))
}));

// Mock SvelteKit navigation
const mockGoto = vi.fn();
vi.mock('$app/navigation', () => ({
  goto: mockGoto
}));

describe('ErrorBoundary Component', () => {
  let mockWindowLocation: { reload: ReturnType<typeof vi.fn>; href: string };
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();

    // Mock window.location
    mockWindowLocation = {
      reload: vi.fn(),
      href: 'http://localhost:3000/test'
    };
    Object.defineProperty(window, 'location', {
      value: mockWindowLocation,
      writable: true
    });

    // Mock event listeners
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();
    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener,
      writable: true
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: mockRemoveEventListener,
      writable: true
    });

    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Test Browser)',
      writable: true
    });

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Normal Operation', () => {
    it('renders children when no error occurs', () => {
      render(ErrorBoundary, {
        children: () => 'Normal content'
      });

      expect(screen.getByText('Normal content')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('sets up global error handlers on mount', () => {
      render(ErrorBoundary);

      expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(ErrorBoundary);

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });
  });

  describe('Fallback Mode', () => {
    it('shows error UI when fallback prop is true', () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });

    it('uses custom error title and message', () => {
      render(ErrorBoundary, {
        props: {
          fallback: true,
          errorTitle: 'Custom Error Title',
          errorMessage: 'Custom error message for testing'
        }
      });

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
      expect(screen.getByText('Custom error message for testing')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches and displays JavaScript errors', () => {
      render(ErrorBoundary);

      // Simulate a JavaScript error
      const errorEvent = new ErrorEvent('error', {
        error: new Error('Test JavaScript error'),
        message: 'Test JavaScript error'
      });

      // Get the error handler that was registered
      const errorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      expect(errorHandler).toBeDefined();
      errorHandler(errorEvent);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Global error caught:', expect.any(Error));
    });

    it('catches and displays unhandled promise rejections', () => {
      render(ErrorBoundary);

      // Simulate an unhandled promise rejection
      const rejectionEvent = {
        reason: new Error('Test promise rejection')
      } as PromiseRejectionEvent;

      // Get the rejection handler that was registered
      const rejectionHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'unhandledrejection'
      )?.[1];

      expect(rejectionHandler).toBeDefined();
      rejectionHandler(rejectionEvent);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Unhandled promise rejection:', expect.any(Error));
    });

    it('handles promise rejections without error objects', () => {
      render(ErrorBoundary);

      const rejectionEvent = {
        reason: 'String error message'
      } as any;

      const rejectionHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'unhandledrejection'
      )?.[1];

      rejectionHandler(rejectionEvent);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('shows retry button by default', () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('shows home button by default', () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('hides retry button when showRetry is false', () => {
      render(ErrorBoundary, {
        props: {
          fallback: true,
          showRetry: false
        }
      });

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('hides home button when showHome is false', () => {
      render(ErrorBoundary, {
        props: {
          fallback: true,
          showHome: false
        }
      });

      expect(screen.queryByText('Go Home')).not.toBeInTheDocument();
    });

    it('reloads page when retry button clicked', async () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      const retryButton = screen.getByText('Try Again');
      await fireEvent.click(retryButton);

      expect(mockWindowLocation.reload).toHaveBeenCalled();
    });

    it('navigates to home when home button clicked', async () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      const homeButton = screen.getByText('Go Home');
      await fireEvent.click(homeButton);

      expect(mockGoto).toHaveBeenCalledWith('/');
    });

    it('shows retrying state during retry', async () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      const retryButton = screen.getByText('Try Again');
      
      // Mock reload to not actually reload
      mockWindowLocation.reload.mockImplementation(() => {});
      
      await fireEvent.click(retryButton);

      // Should show retrying state
      expect(screen.getByText('Retrying...')).toBeInTheDocument();
    });
  });

  describe('Development Mode Features', () => {
    it('shows technical details in development mode', () => {
      // Mock development environment
      vi.stubGlobal('import', {
        meta: {
          env: {
            DEV: true
          }
        }
      });

      render(ErrorBoundary);

      // Trigger an error
      const errorEvent = new ErrorEvent('error', {
        error: new Error('Development error'),
        message: 'Development error'
      });

      const errorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      errorHandler(errorEvent);

      expect(screen.getByText('Technical Details')).toBeInTheDocument();
      expect(screen.getByText('Development error')).toBeInTheDocument();
    });

    it('hides technical details in production mode', () => {
      // Mock production environment
      vi.stubGlobal('import', {
        meta: {
          env: {
            DEV: false
          }
        }
      });

      render(ErrorBoundary);

      // Trigger an error
      const errorEvent = new ErrorEvent('error', {
        error: new Error('Production error'),
        message: 'Production error'
      });

      const errorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      errorHandler(errorEvent);

      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('logs error details for monitoring', () => {
      render(ErrorBoundary);

      const testError = new Error('Test error for logging');
      const errorEvent = new ErrorEvent('error', {
        error: testError,
        message: 'Test error for logging'
      });

      const errorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      errorHandler(errorEvent);

      expect(console.error).toHaveBeenCalledWith('Error boundary caught:', {
        error: 'Test error for logging',
        stack: expect.any(String),
        timestamp: expect.any(String),
        userAgent: 'Mozilla/5.0 (Test Browser)',
        url: 'http://localhost:3000/test'
      });
    });

    it('handles errors without stack traces', () => {
      render(ErrorBoundary);

      const errorEvent = new ErrorEvent('error', {
        error: { message: 'Error without stack' },
        message: 'Error without stack'
      });

      const errorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      errorHandler(errorEvent);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper heading structure', () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Something went wrong');
    });

    it('provides proper button roles and labels', () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      const homeButton = screen.getByRole('button', { name: /go home/i });

      expect(retryButton).toBeInTheDocument();
      expect(homeButton).toBeInTheDocument();
    });

    it('disables retry button during retry operation', async () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      const retryButton = screen.getByText('Try Again');
      
      // Mock reload to simulate async operation
      mockWindowLocation.reload.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      await fireEvent.click(retryButton);

      expect(retryButton).toBeDisabled();
    });
  });

  describe('Visual Design', () => {
    it('renders error icon', () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      // Check for error icon container
      const iconContainer = document.querySelector('.bg-red-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('shows help text', () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      expect(screen.getByText('If this problem persists, please contact support with the error details above.')).toBeInTheDocument();
    });

    it('applies proper styling classes', () => {
      const { container } = render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      // Check for main container styling
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('bg-gradient-to-br', 'from-red-50', 'to-pink-50');
    });
  });

  describe('Edge Cases', () => {
    it('handles null error objects', () => {
      render(ErrorBoundary);

      const errorEvent = new ErrorEvent('error', {
        error: null,
        message: 'Null error'
      });

      const errorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      errorHandler(errorEvent);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('handles retry failures gracefully', async () => {
      render(ErrorBoundary, {
        props: {
          fallback: true
        }
      });

      // Mock reload to throw an error
      mockWindowLocation.reload.mockImplementation(() => {
        throw new Error('Reload failed');
      });

      const retryButton = screen.getByText('Try Again');
      await fireEvent.click(retryButton);

      expect(console.error).toHaveBeenCalledWith('Retry failed:', expect.any(Error));
    });
  });
});
