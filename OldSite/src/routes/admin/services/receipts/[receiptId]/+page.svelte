<!--
RECEIPT DETAIL PAGE

View receipt details with print/PDF functionality
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
	const receipt = data.receipt;

	// Note state
	let noteContent = $state(receipt.receiptNote?.content || '');
	let isEditingNote = $state(false);
	let isSavingNote = $state(false);
	let noteSaveStatus = $state<'idle' | 'saved' | 'error'>('idle');
	let includeNoteInPrint = $state(true);
	let linkCopied = $state(false);

	// Copy public link to clipboard
	async function copyPublicLink() {
		const publicUrl = `${window.location.origin}/receipt/${receipt.id}`;
		try {
			await navigator.clipboard.writeText(publicUrl);
			linkCopied = true;
			setTimeout(() => { linkCopied = false; }, 3000);
		} catch (e) {
			// Fallback for older browsers
			const input = document.createElement('input');
			input.value = publicUrl;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
			linkCopied = true;
			setTimeout(() => { linkCopied = false; }, 3000);
		}
	}

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

	// Format short date
	function formatShortDate(dateStr: string | null): string {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Print receipt
	function printReceipt() {
		window.print();
	}

	// Download as PDF (uses browser print to PDF)
	function downloadPDF() {
		// Trigger print dialog - user can select "Save as PDF"
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

	// Save note to server
	async function saveNote() {
		isSavingNote = true;
		noteSaveStatus = 'idle';
		
		try {
			const response = await fetch(`/api/admin/receipts/${receipt.id}/note`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ note: noteContent })
			});

			if (response.ok) {
				noteSaveStatus = 'saved';
				isEditingNote = false;
				setTimeout(() => { noteSaveStatus = 'idle'; }, 3000);
			} else {
				noteSaveStatus = 'error';
			}
		} catch (e) {
			noteSaveStatus = 'error';
		} finally {
			isSavingNote = false;
		}
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
	<title>Receipt {getReceiptNumber()} | Tributestream Admin</title>
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

<AdminLayout
	title="Receipt Details"
	subtitle="View and print payment receipt"
	actions={[
		{
			label: linkCopied ? 'Link Copied!' : 'Copy Public Link',
			icon: linkCopied ? '✓' : '🔗',
			variant: linkCopied ? 'success' : 'secondary',
			onclick: copyPublicLink
		},
		{
			label: 'Print Receipt',
			icon: '🖨️',
			variant: 'primary',
			onclick: printReceipt
		},
		{
			label: 'Save as PDF',
			icon: '📄',
			onclick: downloadPDF
		},
		{
			label: 'Back to Receipts',
			icon: '←',
			onclick: () => goto('/admin/services/receipts')
		}
	]}
>
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
				{:else if receipt.status === 'payment_failed'}
					❌ Payment Failed
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
						{#if receipt.ownerPhone}
							<p>{receipt.ownerPhone}</p>
						{/if}
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

			<!-- Admin Note (Printable if enabled) -->
			{#if noteContent && includeNoteInPrint}
				<div class="receipt-note printable-note">
					<h3>Notes</h3>
					<p>{noteContent}</p>
				</div>
			{/if}

			<!-- Footer -->
			<div class="receipt-footer">
				<p class="thank-you">Thank you for choosing Tributestream</p>
				<p class="contact">Questions? Contact us at support@tributestream.com</p>
				<p class="url">www.tributestream.com</p>
			</div>
		</div>

		<!-- Payment History (Admin Only - Not Printed) -->
		{#if receipt.paymentHistory && receipt.paymentHistory.length > 0}
			<div class="payment-history no-print">
				<h3>Payment History</h3>
				<table class="history-table">
					<thead>
						<tr>
							<th>Date</th>
							<th>Status</th>
							<th>Amount</th>
							<th>Transaction ID</th>
						</tr>
					</thead>
					<tbody>
						{#each receipt.paymentHistory as payment}
							<tr class="status-row-{payment.status}">
								<td>{formatShortDate(payment.paidAt || payment.failedAt || payment.actionRequiredAt)}</td>
								<td>
									{#if payment.status === 'succeeded'}
										<span class="badge badge-success">Succeeded</span>
									{:else if payment.status === 'failed'}
										<span class="badge badge-error">Failed</span>
									{:else}
										<span class="badge badge-warning">{payment.status}</span>
									{/if}
								</td>
								<td>${Number(payment.amount || 0).toFixed(2)}</td>
								<td class="mono">{payment.paymentIntentId || payment.checkoutSessionId || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- Admin Notes Section (Not Printed) -->
		<div class="admin-notes-section no-print">
			<div class="notes-header">
				<h3>📝 Admin Notes</h3>
				<label class="print-toggle">
					<input type="checkbox" bind:checked={includeNoteInPrint} />
					Include in print
				</label>
			</div>
			
			{#if isEditingNote}
				<div class="note-editor">
					<textarea
						bind:value={noteContent}
						placeholder="Add a note for this receipt (e.g., special requests, follow-up needed, payment method details...)"
						rows="4"
					></textarea>
					<div class="note-actions">
						<button class="btn btn-primary" onclick={saveNote} disabled={isSavingNote}>
							{isSavingNote ? 'Saving...' : 'Save Note'}
						</button>
						<button class="btn btn-secondary" onclick={() => { isEditingNote = false; noteContent = receipt.receiptNote?.content || ''; }}>
							Cancel
						</button>
					</div>
				</div>
			{:else}
				<div class="note-display">
					{#if noteContent}
						<p class="note-content">{noteContent}</p>
						{#if receipt.receiptNote?.updatedAt}
							<p class="note-meta">
								Last updated: {formatDate(receipt.receiptNote.updatedAt)}
								{#if receipt.receiptNote.updatedByEmail}
									by {receipt.receiptNote.updatedByEmail}
								{/if}
							</p>
						{/if}
					{:else}
						<p class="no-note">No notes added yet.</p>
					{/if}
					<button class="btn btn-secondary" onclick={() => isEditingNote = true}>
						{noteContent ? 'Edit Note' : 'Add Note'}
					</button>
				</div>
			{/if}
			
			{#if noteSaveStatus === 'saved'}
				<div class="save-status success">✓ Note saved successfully</div>
			{:else if noteSaveStatus === 'error'}
				<div class="save-status error">✗ Failed to save note</div>
			{/if}
		</div>

		<!-- Admin Actions -->
		<div class="admin-actions no-print">
			<a href="/admin/services/memorials/{receipt.memorialId}" class="action-link">
				View Memorial Details →
			</a>
			{#if receipt.ownerUid}
				<a href="/admin/users/memorial-owners/{receipt.ownerUid}" class="action-link">
					View Customer Profile →
				</a>
			{/if}
		</div>
	</div>
</AdminLayout>

<style>
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

	.status-banner.status-payment_failed {
		background: #fed7d7;
		color: #742a2a;
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

	/* Payment History (Admin View) */
	.payment-history {
		max-width: 800px;
		margin: 2rem auto 0;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.payment-history h3 {
		margin: 0 0 1rem;
		font-size: 1rem;
		color: #2d3748;
	}

	.history-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.history-table th,
	.history-table td {
		padding: 0.5rem;
		text-align: left;
		border-bottom: 1px solid #e2e8f0;
	}

	.history-table th {
		font-weight: 600;
		color: #4a5568;
	}

	.mono {
		font-family: monospace;
		font-size: 0.75rem;
	}

	.badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge-success {
		background: #c6f6d5;
		color: #22543d;
	}

	.badge-error {
		background: #fed7d7;
		color: #742a2a;
	}

	.badge-warning {
		background: #fefcbf;
		color: #744210;
	}

	/* Admin Actions */
	.admin-actions {
		max-width: 800px;
		margin: 1.5rem auto 0;
		display: flex;
		gap: 1rem;
	}

	.action-link {
		color: #667eea;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.action-link:hover {
		text-decoration: underline;
	}

	.text-center {
		text-align: center;
	}

	/* Receipt Note (Printable) */
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

	/* Admin Notes Section */
	.admin-notes-section {
		max-width: 800px;
		margin: 2rem auto 0;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.notes-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.notes-header h3 {
		margin: 0;
		font-size: 1rem;
		color: #2d3748;
	}

	.print-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #4a5568;
		cursor: pointer;
	}

	.print-toggle input {
		cursor: pointer;
	}

	.note-editor textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		resize: vertical;
		font-family: inherit;
	}

	.note-editor textarea:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.note-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: background 0.2s;
	}

	.btn-primary {
		background: #667eea;
		color: white;
	}

	.btn-primary:hover {
		background: #5a67d8;
	}

	.btn-primary:disabled {
		background: #a0aec0;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #e2e8f0;
		color: #4a5568;
	}

	.btn-secondary:hover {
		background: #cbd5e0;
	}

	.note-display .note-content {
		background: #f7fafc;
		padding: 1rem;
		border-radius: 0.375rem;
		margin: 0 0 0.5rem;
		white-space: pre-wrap;
		color: #2d3748;
	}

	.note-display .note-meta {
		font-size: 0.75rem;
		color: #718096;
		margin: 0 0 0.75rem;
	}

	.note-display .no-note {
		color: #a0aec0;
		font-style: italic;
		margin: 0 0 0.75rem;
	}

	.save-status {
		margin-top: 0.75rem;
		padding: 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		text-align: center;
	}

	.save-status.success {
		background: #c6f6d5;
		color: #22543d;
	}

	.save-status.error {
		background: #fed7d7;
		color: #742a2a;
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
	}
</style>
