<script lang="ts">
	import { onMount } from 'svelte';
	import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
	import { getStripe } from '$lib/utils/stripeLoader';

	let { amount, memorialId, lovedOneName } = $props<{
		amount: number;
		memorialId: string;
		lovedOneName: string;
	}>();
	let stripe: Stripe | null = $state(null);
	let elements: StripeElements | null = $state(null);
	let cardElement: StripeCardElement | null = $state(null);
	let processing = $state(false);
	let error: string | null = $state(null);
	let clientSecret: string | null = $state(null);
	let stripeLoading = $state(true);
	let stripeError: string | null = $state(null);

	onMount(async () => {
		console.log('StripeCheckout component mounted 💳');
		try {
			// Lazy load Stripe when component mounts
			stripe = await getStripe();
			if (!stripe) {
				stripeError = 'Failed to initialize Stripe. Please refresh and try again.';
				stripeLoading = false;
				return;
			}
			stripeLoading = false;
		} catch (error) {
			console.error('Error loading Stripe:', error);
			stripeError = error instanceof Error ? error.message : 'Failed to load payment system';
			stripeLoading = false;
			return;
		}

		const res = await fetch('/app/calculator', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ amount, memorialId, lovedOneName })
		});

		const data = await res.json();
		clientSecret = data.clientSecret;

		if (stripe && clientSecret) {
			elements = stripe.elements({ clientSecret });
			cardElement = elements.create('card');
			cardElement.mount('#card-element');
		}
	});

	async function handleSubmit() {
		if (!stripe || !elements || !cardElement || !clientSecret) {
			return;
		}

		processing = true;

		const { error: submitError } = await stripe.confirmCardPayment(clientSecret, {
			payment_method: {
				card: cardElement
			}
		});

		if (submitError) {
			error = submitError.message ?? 'An unknown error occurred.';
			processing = false;
			return;
		}

		// Payment successful
		window.location.href = `/app/checkout/success?memorialId=${memorialId}`;
	}
</script>

<div class="stripe-checkout">
	<h3>Complete Your Payment</h3>
	
	{#if stripeLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading payment system...</p>
		</div>
	{:else if stripeError}
		<div class="error-state">
			<p class="error">{stripeError}</p>
			<button onclick={() => window.location.reload()} class="retry-btn">
				Retry
			</button>
		</div>
	{:else}
		<div id="card-element"></div>
		<button onclick={handleSubmit} disabled={processing || !stripe}>
			{processing ? 'Processing...' : `Pay $${amount}`}
		</button>
		{#if error}
			<p class="error">{error}</p>
		{/if}
	{/if}
</div>

<style>
	.stripe-checkout {
		padding: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background-color: #fafafa;
	}
	#card-element {
		margin-bottom: 1rem;
	}
	
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem;
		text-align: center;
	}
	
	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #f3f3f3;
		border-top: 3px solid #f59e0b;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.error-state {
		text-align: center;
		padding: 1rem;
	}
	
	.error {
		color: #ef4444;
		margin-bottom: 1rem;
	}
	
	.retry-btn {
		background: #f59e0b;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.retry-btn:hover {
		background: #d97706;
	}
</style>
