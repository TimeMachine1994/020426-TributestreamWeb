<script lang="ts">
	import { page } from '$app/stores';
	import { FileText, CreditCard, CheckCircle, AlertCircle, XCircle } from 'lucide-svelte';
	import type { InvoicePublicData } from '$lib/types/invoice';

	let { data } = $props<{ data: { invoice: InvoicePublicData | null; error: string | null } }>();

	let invoice = $derived(data.invoice);
	let error = $derived(data.error);
	let isLoading = $state(false);
	let paymentError = $state<string | null>(null);

	// Check for cancelled query param
	let wasCancelled = $derived($page.url.searchParams.get('cancelled') === 'true');

	function formatCurrency(cents: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(cents / 100);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function handlePayNow() {
		if (!invoice) return;

		isLoading = true;
		paymentError = null;

		try {
			const response = await fetch(`/api/invoices/${invoice.id}/pay`, {
				method: 'POST'
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to create checkout session');
			}

			// Redirect to Stripe Checkout
			if (result.url) {
				window.location.href = result.url;
			}
		} catch (err) {
			paymentError = err instanceof Error ? err.message : 'An error occurred';
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{invoice ? `Invoice ${invoice.id}` : 'Invoice'} - Tributestream</title>
	<meta name="description" content="Pay your Tributestream invoice securely" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
	<div class="mx-auto max-w-lg">
		<!-- Logo/Header -->
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold text-slate-800">Tributestream</h1>
			<p class="text-slate-500">Secure Payment</p>
		</div>

		{#if error}
			<!-- Error State -->
			<div class="rounded-xl bg-white p-8 shadow-lg text-center">
				<div class="mb-4 flex justify-center">
					<AlertCircle class="h-16 w-16 text-red-400" />
				</div>
				<h2 class="mb-2 text-xl font-semibold text-slate-800">Invoice Not Found</h2>
				<p class="text-slate-600">{error}</p>
				<p class="mt-4 text-sm text-slate-500">
					If you believe this is an error, please contact support.
				</p>
			</div>
		{:else if invoice}
			{#if invoice.status === 'paid'}
				<!-- Already Paid State -->
				<div class="rounded-xl bg-white p-8 shadow-lg text-center">
					<div class="mb-4 flex justify-center">
						<CheckCircle class="h-16 w-16 text-green-500" />
					</div>
					<h2 class="mb-2 text-xl font-semibold text-slate-800">Already Paid</h2>
					<p class="text-slate-600">This invoice has already been paid.</p>
					<a
						href="/pay/{invoice.id}/receipt"
						class="mt-6 inline-block rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 transition-colors"
					>
						View Receipt
					</a>
				</div>
			{:else if invoice.status === 'expired' || invoice.status === 'cancelled'}
				<!-- Expired/Cancelled State -->
				<div class="rounded-xl bg-white p-8 shadow-lg text-center">
					<div class="mb-4 flex justify-center">
						<XCircle class="h-16 w-16 text-slate-400" />
					</div>
					<h2 class="mb-2 text-xl font-semibold text-slate-800">
						Invoice {invoice.status === 'expired' ? 'Expired' : 'Cancelled'}
					</h2>
					<p class="text-slate-600">
						This invoice is no longer available for payment.
					</p>
					<p class="mt-4 text-sm text-slate-500">
						Please contact support if you need a new invoice.
					</p>
				</div>
			{:else}
				<!-- Payment Form -->
				<div class="rounded-xl bg-white shadow-lg overflow-hidden">
					<!-- Invoice Header -->
					<div class="bg-slate-800 px-6 py-4 text-white">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<FileText class="h-5 w-5" />
								<span class="font-medium">Invoice</span>
							</div>
							<span class="text-sm text-slate-300">{invoice.id}</span>
						</div>
					</div>

					<div class="p-6">
						<!-- Cancelled Warning -->
						{#if wasCancelled}
							<div class="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
								<p class="text-sm text-amber-800">
									Payment was cancelled. You can try again when you're ready.
								</p>
							</div>
						{/if}

						<!-- Customer Info -->
						{#if invoice.customerName || invoice.customerEmail}
							<div class="mb-6 text-sm text-slate-600">
								<p class="font-medium text-slate-800">Billed to:</p>
								{#if invoice.customerName}
									<p>{invoice.customerName}</p>
								{/if}
								<p>{invoice.customerEmail}</p>
							</div>
						{/if}

						<!-- Line Items -->
						<div class="mb-6 space-y-3">
							{#each invoice.items as item}
								<div class="flex justify-between items-start">
									<div class="flex-1">
										<p class="font-medium text-slate-800">{item.name}</p>
										{#if item.quantity > 1}
											<p class="text-sm text-slate-500">
												{item.quantity} × {formatCurrency(item.price)}
											</p>
										{/if}
									</div>
									<p class="font-medium text-slate-800">{formatCurrency(item.total)}</p>
								</div>
							{/each}
						</div>

						<!-- Total -->
						<div class="border-t border-slate-200 pt-4 mb-6">
							<div class="flex justify-between items-center">
								<span class="text-lg font-semibold text-slate-800">Total</span>
								<span class="text-2xl font-bold text-slate-900">
									{formatCurrency(invoice.total)}
								</span>
							</div>
						</div>

						<!-- Payment Error -->
						{#if paymentError}
							<div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
								<p class="text-sm text-red-800">{paymentError}</p>
							</div>
						{/if}

						<!-- Pay Button -->
						<button
							onclick={handlePayNow}
							disabled={isLoading}
							class="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if isLoading}
								<span class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
								<span>Processing...</span>
							{:else}
								<CreditCard class="h-5 w-5" />
								<span>Pay {formatCurrency(invoice.total)}</span>
							{/if}
						</button>

						<!-- Security Note -->
						<p class="mt-4 text-center text-xs text-slate-500">
							Secure payment powered by Stripe
						</p>
					</div>
				</div>

				<!-- Invoice Date -->
				<p class="mt-4 text-center text-sm text-slate-500">
					Invoice created on {formatDate(invoice.createdAt)}
				</p>
			{/if}
		{:else}
			<!-- Loading State -->
			<div class="rounded-xl bg-white p-8 shadow-lg text-center">
				<div class="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
				<p class="mt-4 text-slate-600">Loading invoice...</p>
			</div>
		{/if}
	</div>
</div>
