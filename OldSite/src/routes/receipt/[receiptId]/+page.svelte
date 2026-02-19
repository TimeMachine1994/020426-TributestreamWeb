<!--
PUBLIC RECEIPT PAGE

Shareable receipt view for clients - no authentication required
-->
<script lang="ts">
	let { data } = $props();
	const receipt = data.receipt;

	// Format date helper
	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	// Print receipt
	function printReceipt() {
		window.print();
	}

	// Generate receipt number
	function getReceiptNumber(): string {
		const id = receipt.paymentIntentId || receipt.checkoutSessionId || receipt.id;
		const shortId = id.replace(/^(pi_|cs_)/, '').substring(0, 8).toUpperCase();
		const date = receipt.paidAt ? new Date(receipt.paidAt) : new Date();
		const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
		return `TS-${dateStr}-${shortId}`;
	}

	// Get booking items from calculatorConfig
	function getBookingItems() {
		if (receipt.calculatorConfig?.bookingItems?.length > 0) {
			return receipt.calculatorConfig.bookingItems;
		}
		// Fallback: create single line item from total
		return [{
			name: 'Memorial Livestream Service',
			price: receipt.amount || 0,
			quantity: 1,
			total: receipt.amount || 0
		}];
	}

	const bookingItems = getBookingItems();
</script>

<svelte:head>
	<title>Receipt {getReceiptNumber()} | Tributestream</title>
	<style>
		@media print {
			body * {
				visibility: hidden;
			}
			.receipt-printable, .receipt-printable * {
				visibility: visible;
			}
			.receipt-printable {
				position: absolute;
				left: 0;
				top: 0;
				width: 100%;
				padding: 2rem;
			}
			.no-print {
				display: none !important;
			}
		}
	</style>
</svelte:head>

<div class="page-container">
	<!-- Print Button -->
	<div class="actions-bar no-print">
		<button class="btn btn-primary" onclick={printReceipt}>
			🖨️ Print Receipt
		</button>
		<button class="btn btn-secondary" onclick={printReceipt}>
			📄 Save as PDF
		</button>
	</div>

	<!-- Printable Receipt -->
	<div class="receipt-printable">
		<div class="receipt-container">
			<!-- Header -->
			<div class="receipt-header">
				<div class="company-info">
					<h1 class="company-name">Tributestream</h1>
					<p class="company-tagline">Memorial Livestreaming Services</p>
				</div>
				<div class="receipt-meta">
					<div class="receipt-badge">RECEIPT</div>
					<div class="receipt-number">{getReceiptNumber()}</div>
				</div>
			</div>

			<!-- Status Banner -->
			<div class="status-banner status-{receipt.status}">
				{#if receipt.status === 'paid'}
					✅ Payment Successful
				{:else}
					⏳ {receipt.status}
				{/if}
			</div>

			<!-- Two Column Layout -->
			<div class="receipt-columns">
				<!-- Customer Info -->
				<div class="info-section">
					<h3>Bill To</h3>
					<div class="info-content">
						<p class="customer-name">{receipt.ownerName || 'Customer'}</p>
						<p>{receipt.ownerEmail}</p>
					</div>
				</div>

				<!-- Payment Info -->
				<div class="info-section">
					<h3>Payment Details</h3>
					<div class="info-content">
						<p><strong>Date:</strong> {formatDate(receipt.paidAt)}</p>
						<p><strong>Method:</strong> Credit Card (Stripe)</p>
						{#if receipt.paymentIntentId}
							<p class="payment-id"><strong>Transaction:</strong> {receipt.paymentIntentId}</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Memorial Info -->
			<div class="memorial-section">
				<h3>Memorial Service</h3>
				<div class="memorial-details">
					<div class="memorial-name">
						<span class="label">In Memory of</span>
						<span class="value">{receipt.lovedOneName}</span>
					</div>
					{#if receipt.memorialDate || receipt.memorialTime}
						<div class="memorial-datetime">
							<span class="label">Service Date</span>
							<span class="value">
								{receipt.memorialDate || ''} {receipt.memorialTime ? `at ${receipt.memorialTime}` : ''}
							</span>
						</div>
					{/if}
					{#if receipt.memorialLocationName}
						<div class="memorial-location">
							<span class="label">Location</span>
							<span class="value">{receipt.memorialLocationName}</span>
							{#if receipt.memorialLocationAddress}
								<span class="address">{receipt.memorialLocationAddress}</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Line Items -->
			<div class="line-items-section">
				<h3>Services</h3>
				<table class="line-items">
					<thead>
						<tr>
							<th>Description</th>
							<th class="text-center">Qty</th>
							<th class="text-right">Unit Price</th>
							<th class="text-right">Amount</th>
						</tr>
					</thead>
					<tbody>
						{#each bookingItems as item}
							<tr>
								<td>{item.name}</td>
								<td class="text-center">{item.quantity || 1}</td>
								<td class="text-right">${Number(item.price || 0).toFixed(2)}</td>
								<td class="text-right">${Number(item.total || item.price || 0).toFixed(2)}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr class="total-row">
							<td colspan="3"><strong>Total Paid</strong></td>
							<td class="text-right total-amount">${Number(receipt.amount || 0).toFixed(2)}</td>
						</tr>
					</tfoot>
				</table>
			</div>

			<!-- Note (if included by admin) -->
			{#if receipt.receiptNote}
				<div class="receipt-note">
					<h3>Notes</h3>
					<p>{receipt.receiptNote}</p>
				</div>
			{/if}

			<!-- Footer -->
			<div class="receipt-footer">
				<p class="thank-you">Thank you for choosing Tributestream</p>
				<p class="contact">Questions? Contact us at support@tributestream.com</p>
				<p class="url">www.tributestream.com</p>
			</div>
		</div>
	</div>
</div>

<style>
	.page-container {
		min-height: 100vh;
		background: #f7fafc;
		padding: 2rem 1rem;
	}

	.actions-bar {
		max-width: 800px;
		margin: 0 auto 1.5rem;
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.btn {
		padding: 0.625rem 1.25rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: background 0.2s;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: #667eea;
		color: white;
	}

	.btn-primary:hover {
		background: #5a67d8;
	}

	.btn-secondary {
		background: #e2e8f0;
		color: #4a5568;
	}

	.btn-secondary:hover {
		background: #cbd5e0;
	}

	.receipt-container {
		max-width: 800px;
		margin: 0 auto;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.receipt-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid #e2e8f0;
	}

	.company-name {
		font-size: 1.75rem;
		font-weight: 700;
		color: #667eea;
		margin: 0;
	}

	.company-tagline {
		color: #718096;
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
	}

	.receipt-meta {
		text-align: right;
	}

	.receipt-badge {
		display: inline-block;
		background: #667eea;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		font-weight: 600;
		font-size: 0.75rem;
		letter-spacing: 0.05em;
	}

	.receipt-number {
		font-family: monospace;
		font-size: 0.875rem;
		color: #4a5568;
		margin-top: 0.5rem;
	}

	.status-banner {
		padding: 0.75rem 1rem;
		border-radius: 0.375rem;
		font-weight: 600;
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.status-banner.status-paid {
		background: #c6f6d5;
		color: #22543d;
	}

	.receipt-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 1.5rem;
	}

	.info-section h3 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #718096;
		margin: 0 0 0.5rem;
	}

	.info-content p {
		margin: 0.25rem 0;
		color: #2d3748;
	}

	.customer-name {
		font-weight: 600;
		font-size: 1.125rem;
	}

	.payment-id {
		font-size: 0.75rem;
		word-break: break-all;
	}

	.memorial-section {
		background: #f7fafc;
		border-radius: 0.375rem;
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.memorial-section h3 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #718096;
		margin: 0 0 1rem;
	}

	.memorial-details {
		display: grid;
		gap: 0.75rem;
	}

	.memorial-details .label {
		display: block;
		font-size: 0.75rem;
		color: #718096;
	}

	.memorial-details .value {
		display: block;
		font-weight: 600;
		color: #2d3748;
	}

	.memorial-details .address {
		display: block;
		font-size: 0.875rem;
		color: #4a5568;
	}

	.line-items-section h3 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #718096;
		margin: 0 0 0.75rem;
	}

	.line-items {
		width: 100%;
		border-collapse: collapse;
	}

	.line-items th,
	.line-items td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e2e8f0;
	}

	.line-items th {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #718096;
		font-weight: 600;
	}

	.line-items .text-right {
		text-align: right;
	}

	.line-items .text-center {
		text-align: center;
	}

	.line-items tfoot td {
		border-bottom: none;
		border-top: 2px solid #e2e8f0;
	}

	.total-row td {
		padding-top: 1rem;
	}

	.total-amount {
		font-size: 1.5rem;
		font-weight: 700;
		color: #667eea;
	}

	.receipt-note {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f7fafc;
		border-radius: 0.375rem;
		border-left: 4px solid #667eea;
	}

	.receipt-note h3 {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #718096;
		margin: 0 0 0.5rem;
	}

	.receipt-note p {
		margin: 0;
		color: #2d3748;
		white-space: pre-wrap;
	}

	.receipt-footer {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
		text-align: center;
	}

	.receipt-footer p {
		margin: 0.25rem 0;
	}

	.thank-you {
		font-weight: 600;
		color: #2d3748;
	}

	.contact, .url {
		font-size: 0.875rem;
		color: #718096;
	}

	@media (max-width: 640px) {
		.receipt-columns {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.receipt-header {
			flex-direction: column;
			gap: 1rem;
		}

		.receipt-meta {
			text-align: left;
		}

		.actions-bar {
			justify-content: center;
		}
	}
</style>
