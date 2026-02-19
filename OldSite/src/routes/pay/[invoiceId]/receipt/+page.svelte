<script lang="ts">
	import { goto } from '$app/navigation';
	import { CheckCircle, Download, Mail, FileText, AlertCircle } from 'lucide-svelte';

	let { data } = $props<{
		data: {
			receipt: {
				invoiceId: string;
				items: Array<{ name: string; quantity: number; price: number; total: number }>;
				total: number;
				customerEmail: string;
				customerName?: string;
				paidAt: string;
				paymentIntentId: string;
			} | null;
			error: string | null;
			redirectTo?: string;
		};
	}>();

	let receipt = $derived(data.receipt);
	let error = $derived(data.error);

	// Redirect if not paid
	$effect(() => {
		if (data.redirectTo) {
			goto(data.redirectTo);
		}
	});

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
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function downloadReceipt() {
		if (!receipt) return;

		const receiptText = `
TRIBUTESTREAM PAYMENT RECEIPT
=============================

Invoice ID: ${receipt.invoiceId}
Payment Date: ${formatDate(receipt.paidAt)}
Payment Reference: ${receipt.paymentIntentId}

CUSTOMER
--------
${receipt.customerName ? `Name: ${receipt.customerName}\n` : ''}Email: ${receipt.customerEmail}

ORDER DETAILS
-------------
${receipt.items.map((item) => `${item.name}${item.quantity > 1 ? ` (${item.quantity}x ${formatCurrency(item.price)})` : ''}: ${formatCurrency(item.total)}`).join('\n')}

TOTAL PAID: ${formatCurrency(receipt.total)}

=============================
Thank you for choosing Tributestream!
`;

		const blob = new Blob([receiptText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `Tributestream-Receipt-${receipt.invoiceId}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Payment Receipt - Tributestream</title>
	<meta name="description" content="Your Tributestream payment receipt" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
	<div class="mx-auto max-w-lg">
		{#if error && !data.redirectTo}
			<!-- Error State -->
			<div class="rounded-xl bg-white p-8 shadow-lg text-center">
				<div class="mb-4 flex justify-center">
					<AlertCircle class="h-16 w-16 text-red-400" />
				</div>
				<h2 class="mb-2 text-xl font-semibold text-slate-800">Receipt Unavailable</h2>
				<p class="text-slate-600">{error}</p>
			</div>
		{:else if receipt}
			<!-- Success Header -->
			<div class="mb-6 text-center">
				<div class="mb-4 flex justify-center">
					<CheckCircle class="h-16 w-16 text-green-500" />
				</div>
				<h1 class="mb-2 text-2xl font-bold text-slate-800">Payment Successful!</h1>
				<p class="text-slate-600">Thank you for your payment</p>
			</div>

			<!-- Receipt Card -->
			<div class="rounded-xl bg-white shadow-lg overflow-hidden">
				<!-- Header -->
				<div class="bg-green-600 px-6 py-4 text-white">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<FileText class="h-5 w-5" />
							<span class="font-medium">Receipt</span>
						</div>
						<button
							onclick={downloadReceipt}
							class="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
						>
							<Download class="h-4 w-4" />
							Download
						</button>
					</div>
				</div>

				<div class="p-6">
					<!-- Payment Info -->
					<div class="mb-6 space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-slate-500">Invoice ID</span>
							<span class="font-mono text-slate-800">{receipt.invoiceId}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-500">Payment Date</span>
							<span class="text-slate-800">{formatDate(receipt.paidAt)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-500">Reference</span>
							<span class="font-mono text-xs text-slate-600">{receipt.paymentIntentId}</span>
						</div>
					</div>

					<!-- Divider -->
					<div class="border-t border-slate-200 my-4"></div>

					<!-- Customer Info -->
					<div class="mb-6">
						<p class="text-sm font-medium text-slate-500 mb-1">Paid by</p>
						{#if receipt.customerName}
							<p class="text-slate-800">{receipt.customerName}</p>
						{/if}
						<p class="text-slate-600 flex items-center gap-1">
							<Mail class="h-4 w-4" />
							{receipt.customerEmail}
						</p>
					</div>

					<!-- Line Items -->
					<div class="mb-6 space-y-3">
						<p class="text-sm font-medium text-slate-500">Items</p>
						{#each receipt.items as item}
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<p class="text-slate-800">{item.name}</p>
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
					<div class="border-t border-slate-200 pt-4">
						<div class="flex justify-between items-center">
							<span class="text-lg font-semibold text-slate-800">Total Paid</span>
							<span class="text-2xl font-bold text-green-600">
								{formatCurrency(receipt.total)}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Email Confirmation -->
			<div class="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
				<p class="text-sm text-blue-800">
					A confirmation email has been sent to <strong>{receipt.customerEmail}</strong>
				</p>
			</div>

			<!-- Support -->
			<div class="mt-6 text-center text-sm text-slate-500">
				<p>Questions? Contact us at</p>
				<a href="mailto:support@tributestream.com" class="text-blue-600 hover:underline">
					support@tributestream.com
				</a>
			</div>
		{:else}
			<!-- Loading State -->
			<div class="rounded-xl bg-white p-8 shadow-lg text-center">
				<div class="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
				<p class="mt-4 text-slate-600">Loading receipt...</p>
			</div>
		{/if}
	</div>
</div>
