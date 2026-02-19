<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		CheckCircle,
		Download,
		Mail,
		Calendar,
		MapPin,
		Clock,
		DollarSign,
		Edit3,
		ExternalLink
	} from 'lucide-svelte';

	let {
		memorial,
		calculatorConfig,
		onRequestEdit
	}: {
		memorial: any;
		calculatorConfig: any;
		onRequestEdit: () => void;
	} = $props();

	// Check if we have complete booking data
	const hasCompleteData = $derived(
		calculatorConfig?.bookingItems && calculatorConfig.bookingItems.length > 0
	);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatServiceDate(date: string | null, time: string | null): string {
		if (!date) return 'Date TBD';
		const dateStr = new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
		if (time) {
			return `${dateStr} at ${time}`;
		}
		return dateStr;
	}

	function getTierName(tier: string): string {
		const tierNames: Record<string, string> = {
			record: 'Tributestream Record',
			live: 'Tributestream Live',
			legacy: 'Tributestream Legacy'
		};
		return tierNames[tier] || tier;
	}

	function getPaymentMethod(): string {
		if (memorial.manualPayment) {
			const method = memorial.manualPayment.method;
			const methodNames: Record<string, string> = {
				cash: 'Cash',
				check: 'Check',
				venmo: 'Venmo',
				zelle: 'Zelle',
				manual: 'Manual Payment'
			};
			return methodNames[method] || method;
		}
		if (calculatorConfig?.checkoutSessionId) {
			return 'Credit Card (Stripe)';
		}
		return 'Payment Confirmed';
	}

	function getPaymentId(): string | null {
		return (
			calculatorConfig?.paymentIntentId ||
			calculatorConfig?.checkoutSessionId ||
			memorial.manualPayment?.notes ||
			null
		);
	}

	function downloadReceipt() {
		if (!hasCompleteData) return;

		const receiptText = `
TRIBUTESTREAM PAYMENT RECEIPT
=============================

Memorial: ${memorial.lovedOneName}
Payment Date: ${formatDate(memorial.paidAt || calculatorConfig?.paidAt)}
Payment Method: ${getPaymentMethod()}
${getPaymentId() ? `Payment ID: ${getPaymentId()}` : ''}

ORDER DETAILS
-------------
${calculatorConfig.bookingItems
	.map(
		(item: any) =>
			`${item.name}${item.quantity > 1 ? ` (${item.quantity}x $${item.price})` : ''}: ${formatCurrency(item.total)}`
	)
	.join('\n')}

TOTAL: ${formatCurrency(calculatorConfig.total)}

SERVICE INFORMATION
-------------------
Date: ${formatServiceDate(memorial.services?.main?.time?.date, memorial.services?.main?.time?.time)}
Location: ${memorial.services?.main?.location?.name || 'TBD'}
${memorial.services?.main?.location?.address ? `Address: ${memorial.services?.main?.location?.address}` : ''}
Duration: ${memorial.services?.main?.hours || 2} hours

Thank you for choosing Tributestream!
`;

		const blob = new Blob([receiptText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `Tributestream-Receipt-${memorial.lovedOneName.replace(/\s+/g, '-')}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Payment Receipt - {memorial.lovedOneName} - Tributestream</title>
	<meta name="description" content="Your Tributestream service booking has been confirmed" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
	<div class="mx-auto max-w-5xl px-4">
		{#if hasCompleteData}
			<!-- Full Receipt with Complete Data -->
			<div class="mb-8 text-center">
				<div class="mb-4 flex items-center justify-center">
					<CheckCircle class="h-16 w-16 text-green-500" />
				</div>
				<h1 class="mb-2 text-3xl font-bold text-gray-900">Payment Confirmed</h1>
				<p class="text-lg text-gray-600">
					Your memorial service booking for <strong>{memorial.lovedOneName}</strong> is confirmed
					and paid
				</p>
			</div>

			<div class="mb-8 grid gap-8 lg:grid-cols-2">
				<!-- Receipt Details -->
				<div class="rounded-lg bg-white p-6 shadow-lg">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-xl font-semibold text-gray-900">Receipt Details</h2>
						<button
							onclick={downloadReceipt}
							class="flex items-center rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
						>
							<Download class="mr-2 h-4 w-4" />
							Download
						</button>
					</div>

					<!-- Payment Information -->
					<div class="mb-6 space-y-4">
						<div class="flex items-center justify-between border-b border-gray-100 py-2">
							<span class="text-sm text-gray-600">Payment Date</span>
							<span class="font-medium"
								>{formatDate(memorial.paidAt || calculatorConfig?.paidAt)}</span
							>
						</div>
						<div class="flex items-center justify-between border-b border-gray-100 py-2">
							<span class="text-sm text-gray-600">Payment Method</span>
							<span class="font-medium">{getPaymentMethod()}</span>
						</div>
						{#if getPaymentId()}
							<div class="flex items-center justify-between border-b border-gray-100 py-2">
								<span class="text-sm text-gray-600">Payment ID</span>
								<span class="font-mono text-sm">{getPaymentId()}</span>
							</div>
						{/if}
						{#if memorial.manualPayment?.markedPaidBy}
							<div class="flex items-center justify-between border-b border-gray-100 py-2">
								<span class="text-sm text-gray-600">Processed By</span>
								<span class="text-sm">{memorial.manualPayment.markedPaidBy}</span>
							</div>
						{/if}
						<div class="flex items-center justify-between border-b border-gray-100 py-2">
							<span class="text-sm text-gray-600">Status</span>
							<span
								class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
							>
								<CheckCircle class="mr-1 h-3 w-3" />
								Paid
							</span>
						</div>
					</div>

					<!-- Package Summary -->
					<div class="border-t border-gray-200 pt-6">
						<h3 class="mb-4 font-semibold text-gray-900">Package Information</h3>
						<div class="space-y-2 text-sm">
							<p>
								<strong>Package:</strong>
								{getTierName(calculatorConfig?.formData?.selectedTier || 'live')}
							</p>
							<p class="flex items-center">
								<Calendar class="mr-2 h-4 w-4 text-gray-400" />
								{formatServiceDate(
									memorial.services?.main?.time?.date,
									memorial.services?.main?.time?.time
								)}
							</p>
							{#if memorial.services?.main?.location?.name}
								<p class="flex items-start">
									<MapPin class="mt-0.5 mr-2 h-4 w-4 text-gray-400" />
									<span>
										{memorial.services.main.location.name}
										{#if memorial.services.main.location.address}
											<br />
											<span class="text-gray-500">{memorial.services.main.location.address}</span>
										{/if}
									</span>
								</p>
							{/if}
							{#if memorial.services?.main?.hours}
								<p class="flex items-center">
									<Clock class="mr-2 h-4 w-4 text-gray-400" />
									{memorial.services.main.hours} hour{memorial.services.main.hours !== 1 ? 's' : ''}
									coverage
								</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Order Summary -->
				<div class="rounded-lg bg-white p-6 shadow-lg">
					<h2 class="mb-6 text-xl font-semibold text-gray-900">Order Summary</h2>

					<div class="mb-6 space-y-3">
						{#each calculatorConfig.bookingItems as item}
							<div class="flex justify-between text-sm">
								<span class="flex-1 text-gray-700">
									{item.name}
									{#if item.quantity > 1}
										<span class="text-gray-500">({item.quantity}x ${item.price})</span>
									{/if}
								</span>
								<span class="font-medium text-gray-900">{formatCurrency(item.total)}</span>
							</div>
						{/each}
					</div>

					<div class="border-t border-gray-200 pt-4">
						<div class="flex items-center justify-between text-xl font-bold">
							<span class="text-gray-900">Total Paid</span>
							<span class="text-green-600">{formatCurrency(calculatorConfig.total)}</span>
						</div>
					</div>

					<!-- Additional Services -->
					{#if memorial.services?.additional && memorial.services.additional.length > 0}
						<div class="mt-6 border-t border-gray-200 pt-6">
							<h3 class="mb-4 font-semibold text-gray-900">Additional Services</h3>
							<div class="space-y-2 text-sm">
								{#each memorial.services.additional as service}
									<p>
										<strong>
											{service.type === 'location' ? 'Additional Location' : 'Additional Day'}:
										</strong>
										{formatServiceDate(service.time?.date, service.time?.time)}
										{#if service.location?.name}
											<br />
											<span class="text-gray-600">📍 {service.location.name}</span>
										{/if}
									</p>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Generic Paid Confirmation (Missing Data) -->
			<div class="mb-8 text-center">
				<div class="mb-4 flex items-center justify-center">
					<CheckCircle class="h-16 w-16 text-green-500" />
				</div>
				<h1 class="mb-2 text-3xl font-bold text-gray-900">Payment Confirmed</h1>
				<p class="text-lg text-gray-600">This memorial service has been marked as paid</p>
			</div>

			<div class="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-lg">
				<div class="space-y-4">
					<div class="flex items-center justify-between border-b border-gray-100 py-3">
						<span class="font-medium text-gray-600">Memorial</span>
						<span class="text-lg font-semibold text-gray-900">{memorial.lovedOneName}</span>
					</div>
					<div class="flex items-center justify-between border-b border-gray-100 py-3">
						<span class="font-medium text-gray-600">Status</span>
						<span
							class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
						>
							<CheckCircle class="mr-1 h-4 w-4" />
							Paid
						</span>
					</div>
					{#if memorial.paidAt}
						<div class="flex items-center justify-between border-b border-gray-100 py-3">
							<span class="font-medium text-gray-600">Payment Date</span>
							<span class="text-gray-900">{formatDate(memorial.paidAt)}</span>
						</div>
					{/if}
					{#if memorial.manualPayment?.notes}
						<div class="flex flex-col gap-2 border-b border-gray-100 py-3">
							<span class="font-medium text-gray-600">Payment Notes</span>
							<p class="text-gray-900 max-w-md break-words ml-0 whitespace-pre-wrap">{memorial.manualPayment.notes}</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="mt-8 rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">What's Next?</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<!-- Request Changes -->
				<button
					onclick={onRequestEdit}
					class="flex items-center justify-center rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
				>
					<Edit3 class="mr-2 h-4 w-4" />
					Request Changes
				</button>

				<!-- View Memorial -->
				{#if memorial.fullSlug}
					<a
						href="/{memorial.fullSlug}"
						class="flex items-center justify-center rounded-lg border-2 border-blue-400 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
					>
						<ExternalLink class="mr-2 h-4 w-4" />
						View Memorial
					</a>
				{/if}
			</div>
		</div>

		<!-- Support Information -->
		<div class="mt-8 text-center text-sm text-gray-600">
			<p>Need help? Contact us at <strong>tributestream@tributestream.com</strong></p>
			<p class="mt-1">or call <strong>(407) 221-5922</strong></p>
		</div> 
	</div>
</div>
