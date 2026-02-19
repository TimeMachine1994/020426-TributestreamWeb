<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		CheckCircle,
		Download,
		Mail,
		Calendar,
		MapPin,
		Phone,
		User,
		CreditCard
	} from 'lucide-svelte';

	// Get data from page server load
	let { data } = $props<{ data: any }>();
	let receiptData = $state(data.receiptData);
	
	// Note: Email confirmation and payment processing handled by webhook
	// This provides better reliability than client-side calls
	console.log('📄 Receipt page loaded with data:', receiptData);

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
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
		if (!receiptData) return;

		// Create a simple text receipt
		const receiptText = `
TRIBUTESTREAM PAYMENT RECEIPT
=============================

Payment Date: ${formatDate(receiptData.paymentDate)}
Payment ID: ${receiptData.paymentIntentId}

CUSTOMER INFORMATION
-------------------
Name: ${receiptData.customerInfo.firstName} ${receiptData.customerInfo.lastName}
Email: ${receiptData.customerInfo.email}
Phone: ${receiptData.customerInfo.phone || 'Not provided'}

BILLING ADDRESS
--------------
${receiptData.customerInfo.address.line1}
${receiptData.customerInfo.address.line2 ? receiptData.customerInfo.address.line2 + '\n' : ''}${receiptData.customerInfo.address.city}, ${receiptData.customerInfo.address.state} ${receiptData.customerInfo.address.postal_code}

ORDER DETAILS
------------
${receiptData.bookingData.items
	.map(
		(item) =>
			`${item.name}${item.quantity > 1 ? ` (${item.quantity}x $${item.price})` : ''}: ${formatCurrency(item.total)}`
	)
	.join('\n')}

TOTAL: ${formatCurrency(receiptData.bookingData.total)}

Thank you for choosing Tributestream!
`;

		const blob = new Blob([receiptText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `Tributestream-Receipt-${receiptData.paymentIntentId}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Payment Successful - Tributestream</title>
	<meta name="description" content="Your Tributestream payment has been processed successfully" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
	<div class="mx-auto max-w-4xl px-4">
		{#if receiptData}
			<!-- Success Header -->
			<div class="mb-8 text-center">
				<div class="mb-4 flex items-center justify-center">
					<CheckCircle class="h-16 w-16 text-green-500" />
				</div>
				<h1 class="mb-2 text-3xl font-bold text-gray-900">Payment Successful!</h1>
				<p class="text-lg text-gray-600">
					Your Tributestream service has been booked and confirmed
				</p>

				<!-- Email Confirmation -->
				<div class="mt-4 flex items-center justify-center space-x-2">
					<Mail class="h-4 w-4 text-green-500" />
					<span class="text-sm text-green-600"
						>A confirmation email has been sent to {receiptData.customerInfo.email}</span
					>
				</div>
			</div>

			<div class="grid gap-8 lg:grid-cols-2">
				<!-- Receipt Details -->
				<div class="rounded-lg bg-white p-6 shadow-lg">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-xl font-semibold text-gray-900">Receipt Details</h2>
						<button
							on:click={downloadReceipt}
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
							<span class="font-medium">{formatDate(receiptData.paymentDate)}</span>
						</div>
						<div class="flex items-center justify-between border-b border-gray-100 py-2">
							<span class="text-sm text-gray-600">Payment ID</span>
							<span class="font-mono text-sm">{receiptData.paymentIntentId}</span>
						</div>
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

					<!-- Customer Information -->
					<div class="border-t border-gray-200 pt-6">
						<h3 class="mb-4 flex items-center text-lg font-medium text-gray-900">
							<User class="mr-2 h-5 w-5 text-blue-500" />
							Customer Information
						</h3>
						<div class="space-y-2 text-sm">
							<p>
								<strong>Name:</strong>
								{receiptData.customerInfo.firstName}
								{receiptData.customerInfo.lastName}
							</p>
							<p class="flex items-center">
								<Mail class="mr-2 h-4 w-4 text-gray-400" />
								{receiptData.customerInfo.email}
							</p>
							{#if receiptData.customerInfo.phone}
								<p class="flex items-center">
									<Phone class="mr-2 h-4 w-4 text-gray-400" />
									{receiptData.customerInfo.phone}
								</p>
							{/if}
							<div class="mt-3 flex items-start">
								<MapPin class="mt-0.5 mr-2 h-4 w-4 text-gray-400" />
								<div>
									<p>{receiptData.customerInfo.address.line1}</p>
									{#if receiptData.customerInfo.address.line2}
										<p>{receiptData.customerInfo.address.line2}</p>
									{/if}
									<p>
										{receiptData.customerInfo.address.city}, {receiptData.customerInfo.address
											.state}
										{receiptData.customerInfo.address.postal_code}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Order Summary -->
				<div class="rounded-lg bg-white p-6 shadow-lg">
					<h2 class="mb-6 text-xl font-semibold text-gray-900">Order Summary</h2>

					<div class="mb-6 space-y-3">
						{#each receiptData.bookingData.items as item}
							<div class="flex justify-between text-sm">
								<span class="flex-1 text-gray-700">
									{item.name}
									{#if item.quantity > 1}
										<span class="text-gray-500"
											>({item.quantity}x {formatCurrency(item.price)})</span
										>
									{/if}
								</span>
								<span class="font-medium text-gray-900">{formatCurrency(item.total)}</span>
							</div>
						{/each}
					</div>

					<div class="border-t border-gray-200 pt-4">
						<div class="flex items-center justify-between text-xl font-bold">
							<span class="text-gray-900">Total Paid</span>
							<span class="text-green-600">{formatCurrency(receiptData.bookingData.total)}</span>
						</div>
					</div>

					<!-- Next Steps -->
					<div class="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
						<h3 class="mb-2 flex items-center font-medium text-blue-900">
							<Calendar class="mr-2 h-5 w-5" />
							What's Next?
						</h3>
						<ul class="space-y-1 text-sm text-blue-800">
							<li>• Your schedule has been locked and confirmed</li>
							<li>• You'll receive a confirmation email with service details</li>
							<li>• Our team will contact you within 24 hours to coordinate</li>
							<li>• Access your booking details anytime in your portal</li>
						</ul>
					</div>

					<!-- Action Buttons -->
					<div class="mt-6 space-y-3">
						<a
							href="/my-portal"
							class="inline-block w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-center font-medium text-white transition-all duration-300 hover:from-blue-600 hover:to-blue-700"
						>
							Go to My Portal
						</a>
						<a
							href="/schedule"
							class="inline-block w-full rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50"
						>
							Schedule Another Service
						</a>
					</div>
				</div>
			</div>

			<!-- Support Information -->
			<div class="mt-8 rounded-lg bg-white p-6 text-center shadow-lg">
				<h3 class="mb-2 text-lg font-medium text-gray-900">Need Help?</h3>
				<p class="mb-4 text-gray-600">
					Our support team is here to assist you with any questions about your booking.
				</p>
				<div class="flex items-center justify-center space-x-6 text-sm">
					<a
						href="mailto:support@tributestream.com"
						class="flex items-center text-blue-600 hover:text-blue-700"
					>
						<Mail class="mr-2 h-4 w-4" />
						support@tributestream.com
					</a>
					<a href="tel:+1-555-123-4567" class="flex items-center text-blue-600 hover:text-blue-700">
						<Phone class="mr-2 h-4 w-4" />
						(555) 123-4567
					</a>
				</div>
			</div>
		{:else}
			<div class="rounded-lg bg-white p-8 text-center shadow-lg">
				<p class="text-gray-600">Loading receipt information...</p>
			</div>
		{/if}
	</div>
</div>
