import type { Stripe } from '@stripe/stripe-js';

interface StripeLoaderState {
  stripe: Stripe | null;
  loading: boolean;
  error: string | null;
  scriptLoaded: boolean;
}

class StripeLoader {
  private state: StripeLoaderState = {
    stripe: null,
    loading: false,
    error: null,
    scriptLoaded: false
  };

  private loadPromise: Promise<Stripe | null> | null = null;

  /**
   * Lazy load Stripe.js script and initialize Stripe instance
   * Only loads when actually needed for payment processing
   */
  async loadStripe(publishableKey?: string): Promise<Stripe | null> {
    // Return existing instance if already loaded
    if (this.state.stripe) {
      return this.state.stripe;
    }

    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.state.loading = true;
    this.state.error = null;

    this.loadPromise = this.initializeStripe(publishableKey);
    
    try {
      const stripe = await this.loadPromise;
      this.state.stripe = stripe;
      this.state.loading = false;
      return stripe;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to load Stripe';
      this.state.loading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  private async initializeStripe(publishableKey?: string): Promise<Stripe | null> {
    // Step 1: Load Stripe.js script if not already loaded
    if (!this.state.scriptLoaded) {
      await this.loadStripeScript();
      this.state.scriptLoaded = true;
    }

    // Step 2: Get publishable key
    const key = publishableKey || this.getPublishableKey();
    if (!key) {
      throw new Error('Stripe publishable key not found');
    }

    // Step 3: Initialize Stripe instance
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripe = await loadStripe(key);
    
    if (!stripe) {
      throw new Error('Failed to initialize Stripe');
    }

    return stripe;
  }

  private loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector('script[src*="js.stripe.com"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe script'));
      
      document.head.appendChild(script);
    });
  }

  private getPublishableKey(): string {
    // Try multiple sources for the key
    const sources = [
      () => import.meta.env.VITE_STRIPE_PUBLIC_KEY,
      () => import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY,
      () => (window as any).__STRIPE_PUBLISHABLE_KEY__
    ];

    for (const getKey of sources) {
      try {
        const key = getKey();
        if (key) return key;
      } catch {
        // Continue to next source
      }
    }

    return '';
  }

  /**
   * Get current loading state for UI feedback
   */
  getState(): Readonly<StripeLoaderState> {
    return { ...this.state };
  }

  /**
   * Reset the loader state (useful for testing)
   */
  reset(): void {
    this.state = {
      stripe: null,
      loading: false,
      error: null,
      scriptLoaded: false
    };
    this.loadPromise = null;
  }
}

// Export singleton instance
export const stripeLoader = new StripeLoader();

// Export convenience function
export async function getStripe(publishableKey?: string): Promise<Stripe | null> {
  return stripeLoader.loadStripe(publishableKey);
}

// Export loading state hook for Svelte components
export function createStripeStore() {
  let state = $state(stripeLoader.getState());
  
  return {
    get state() { return state; },
    async load(publishableKey?: string) {
      state = stripeLoader.getState();
      try {
        const stripe = await stripeLoader.loadStripe(publishableKey);
        state = stripeLoader.getState();
        return stripe;
      } catch (error) {
        state = stripeLoader.getState();
        throw error;
      }
    }
  };
}
