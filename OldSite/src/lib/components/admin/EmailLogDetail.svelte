<!--
EMAIL LOG DETAIL COMPONENT

Modal overlay showing full email audit log details:
- Email info (type, status, timestamps)
- Recipients and template info
- Related entities (memorial, user links)
- Full template data as formatted JSON
- Resend and copy actions
-->
<script lang="ts">
	let {
		log = null,
		loading = false,
		error = '',
		onClose
	}: {
		log: any;
		loading?: boolean;
		error?: string;
		onClose: () => void;
	} = $props();

	// State
	let resending = $state(false);
	let resendResult = $state<{ success: boolean; message: string } | null>(null);
	let showResendConfirm = $state(false);
	let overrideEmail = $state('');
	let copied = $state(false);

	// Email type display map
	const typeLabels: Record<string, string> = {
		enhanced_registration: 'Enhanced Registration',
		basic_registration: 'Basic Registration',
		funeral_director_registration: 'Funeral Director Registration',
		invitation: 'Invitation',
		email_change_confirmation: 'Email Change Confirmation',
		payment_confirmation: 'Payment Confirmation',
		payment_action_required: 'Payment Action Required',
		payment_failure: 'Payment Failure',
		password_reset: 'Password Reset',
		owner_welcome: 'Owner Welcome',
		funeral_director_welcome: 'Funeral Director Welcome',
		contact_form_support: 'Contact Form (Support)',
		contact_form_confirmation: 'Contact Form (Confirmation)',
		invoice: 'Invoice',
		invoice_receipt: 'Invoice Receipt'
	};

	const statusStyles: Record<string, { label: string; color: string; bg: string }> = {
		sent: { label: '✅ Sent', color: '#38a169', bg: '#f0fff4' },
		failed: { label: '❌ Failed', color: '#e53e3e', bg: '#fff5f5' },
		mocked: { label: '🔶 Mocked (Dev)', color: '#d69e2e', bg: '#fffff0' }
	};

	function formatDate(iso: string): string {
		if (!iso) return '-';
		return new Date(iso).toLocaleString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	async function copyJson() {
		if (!log?.templateData) return;
		try {
			await navigator.clipboard.writeText(JSON.stringify(log.templateData, null, 2));
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Fallback
			const textarea = document.createElement('textarea');
			textarea.value = JSON.stringify(log.templateData, null, 2);
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	async function handleResend() {
		if (!log) return;
		resending = true;
		resendResult = null;
		try {
			const body: any = {};
			if (overrideEmail.trim()) {
				body.modifyData = { email: overrideEmail.trim() };
			}
			const res = await fetch(`/api/admin/email-logs/${log.id}/resend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await res.json();
			if (!res.ok) throw new Error(result.message || 'Resend failed');
			resendResult = { success: true, message: result.message };
			showResendConfirm = false;
			overrideEmail = '';
		} catch (err: any) {
			resendResult = { success: false, message: err.message || 'Resend failed' };
		} finally {
			resending = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={handleBackdropClick}>
	<div class="modal-content">
		<!-- Header -->
		<div class="modal-header">
			<h2>📧 Email Details</h2>
			<button class="close-btn" onclick={onClose}>✕</button>
		</div>

		<!-- Body -->
		<div class="modal-body">
			{#if loading}
				<div class="loading">
					<div class="spinner"></div>
					<p>Loading email details...</p>
				</div>
			{:else if error}
				<div class="error-banner">
					<span>❌</span> {error}
				</div>
			{:else if log}
				<!-- Status Banner -->
				<div
					class="status-banner"
					style="background: {statusStyles[log.status]?.bg || '#f7fafc'}; color: {statusStyles[log.status]?.color || '#4a5568'}"
				>
					<span class="status-label">{statusStyles[log.status]?.label || log.status}</span>
					<span class="status-env">{log.environment}</span>
				</div>

				<!-- Email Info -->
				<section class="detail-section">
					<h3>Email Information</h3>
					<div class="info-grid">
						<div class="info-row">
							<span class="info-label">Type</span>
							<span class="info-value">{typeLabels[log.type] || log.type}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Sent At</span>
							<span class="info-value">{formatDate(log.sentAt)}</span>
						</div>
						{#if log.sendgridMessageId}
							<div class="info-row">
								<span class="info-label">SendGrid ID</span>
								<span class="info-value mono">{log.sendgridMessageId}</span>
							</div>
						{/if}
						<div class="info-row">
							<span class="info-label">Triggered By</span>
							<span class="info-value">{log.triggeredBy}</span>
						</div>
					</div>
				</section>

				<!-- Recipients -->
				<section class="detail-section">
					<h3>Recipients</h3>
					<div class="info-grid">
						<div class="info-row">
							<span class="info-label">To</span>
							<span class="info-value">{log.to}</span>
						</div>
						{#if log.cc?.length}
							<div class="info-row">
								<span class="info-label">CC</span>
								<span class="info-value">{log.cc.join(', ')}</span>
							</div>
						{/if}
						<div class="info-row">
							<span class="info-label">From</span>
							<span class="info-value">{log.from}</span>
						</div>
						{#if log.templateId}
							<div class="info-row">
								<span class="info-label">Template ID</span>
								<span class="info-value mono">{log.templateId}</span>
							</div>
						{/if}
						{#if log.templateName}
							<div class="info-row">
								<span class="info-label">Template</span>
								<span class="info-value">{log.templateName}</span>
							</div>
						{/if}
						{#if log.subject}
							<div class="info-row">
								<span class="info-label">Subject</span>
								<span class="info-value">{log.subject}</span>
							</div>
						{/if}
					</div>
				</section>

				<!-- Related Entities -->
				{#if log.memorialId || log.userId || log.invoiceId || log.streamId}
					<section class="detail-section">
						<h3>Related Entities</h3>
						<div class="info-grid">
							{#if log.memorialId}
								<div class="info-row">
									<span class="info-label">Memorial</span>
									<a href="/admin/services/memorials/{log.memorialId}" class="info-link">
										{log.memorialId} →
									</a>
								</div>
							{/if}
							{#if log.userId}
								<div class="info-row">
									<span class="info-label">User</span>
									<span class="info-value mono">{log.userId}</span>
								</div>
							{/if}
							{#if log.invoiceId}
								<div class="info-row">
									<span class="info-label">Invoice</span>
									<span class="info-value mono">{log.invoiceId}</span>
								</div>
							{/if}
							{#if log.streamId}
								<div class="info-row">
									<span class="info-label">Stream</span>
									<span class="info-value mono">{log.streamId}</span>
								</div>
							{/if}
							{#if log.triggeredByUserId}
								<div class="info-row">
									<span class="info-label">Triggered By User</span>
									<span class="info-value mono">{log.triggeredByUserId}</span>
								</div>
							{/if}
							{#if log.triggeredByAdminId}
								<div class="info-row">
									<span class="info-label">Triggered By Admin</span>
									<span class="info-value mono">{log.triggeredByAdminId}</span>
								</div>
							{/if}
						</div>
					</section>
				{/if}

				<!-- Error Details -->
				{#if log.error}
					<section class="detail-section error-section">
						<h3>Error Details</h3>
						<pre class="error-pre">{log.error}</pre>
					</section>
				{/if}

				<!-- Template Data -->
				<section class="detail-section">
					<div class="section-header">
						<h3>Template Data Sent</h3>
						<button class="copy-btn" onclick={copyJson}>
							{copied ? '✅ Copied!' : '📋 Copy JSON'}
						</button>
					</div>
					<pre class="json-pre">{JSON.stringify(log.templateData, null, 2)}</pre>
				</section>

				<!-- Resend Result -->
				{#if resendResult}
					<div class="resend-result" class:success={resendResult.success} class:failure={!resendResult.success}>
						{resendResult.success ? '✅' : '❌'} {resendResult.message}
					</div>
				{/if}

				<!-- Actions -->
				<div class="modal-actions">
					{#if showResendConfirm}
						<div class="resend-form">
							<label>
								Override recipient (optional):
								<input
									type="email"
									bind:value={overrideEmail}
									placeholder={log.to}
								/>
							</label>
							<div class="resend-buttons">
								<button class="btn btn-danger" onclick={handleResend} disabled={resending}>
									{resending ? '⏳ Resending...' : '🔄 Confirm Resend'}
								</button>
								<button class="btn btn-secondary" onclick={() => (showResendConfirm = false)}>
									Cancel
								</button>
							</div>
							<p class="resend-warning">
								⚠️ Passwords in resent emails will be masked. Only use this for non-credential emails or with a new override recipient.
							</p>
						</div>
					{:else}
						<button class="btn btn-primary" onclick={() => (showResendConfirm = true)}>
							🔄 Resend Email
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 2rem;
		z-index: 1000;
		overflow-y: auto;
	}

	.modal-content {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		width: 100%;
		max-width: 700px;
		margin: 2rem auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: #2d3748;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: #a0aec0;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.close-btn:hover {
		background: #f7fafc;
		color: #4a5568;
	}

	.modal-body {
		padding: 1.5rem;
		max-height: calc(100vh - 12rem);
		overflow-y: auto;
	}

	/* Loading */
	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 3rem;
		color: #718096;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid #e2e8f0;
		border-top-color: #3182ce;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Error */
	.error-banner {
		background: #fff5f5;
		border: 1px solid #feb2b2;
		border-radius: 0.5rem;
		padding: 1rem;
		color: #c53030;
	}

	/* Status Banner */
	.status-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		font-weight: 600;
	}

	.status-env {
		font-size: 0.75rem;
		font-weight: 400;
		opacity: 0.7;
		text-transform: uppercase;
	}

	/* Sections */
	.detail-section {
		margin-bottom: 1.5rem;
	}

	.detail-section h3 {
		font-size: 0.8125rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #a0aec0;
		margin: 0 0 0.75rem 0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	/* Info Grid */
	.info-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-row {
		display: flex;
		gap: 1rem;
		padding: 0.375rem 0;
		border-bottom: 1px solid #f7fafc;
	}

	.info-label {
		font-size: 0.8125rem;
		color: #718096;
		min-width: 130px;
		flex-shrink: 0;
	}

	.info-value {
		font-size: 0.875rem;
		color: #2d3748;
		word-break: break-all;
	}

	.info-value.mono {
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 0.8125rem;
	}

	.info-link {
		font-size: 0.875rem;
		color: #3182ce;
		text-decoration: none;
	}

	.info-link:hover {
		text-decoration: underline;
	}

	/* Error Section */
	.error-section {
		background: #fff5f5;
		border: 1px solid #feb2b2;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.error-pre {
		margin: 0;
		font-size: 0.8125rem;
		color: #c53030;
		white-space: pre-wrap;
		word-break: break-all;
	}

	/* JSON */
	.json-pre {
		background: #1a202c;
		color: #e2e8f0;
		padding: 1rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-family: 'SF Mono', 'Fira Code', monospace;
		line-height: 1.6;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
		margin: 0;
		max-height: 300px;
		overflow-y: auto;
	}

	.copy-btn {
		background: none;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		padding: 0.25rem 0.75rem;
		font-size: 0.8125rem;
		cursor: pointer;
		color: #4a5568;
	}

	.copy-btn:hover {
		background: #f7fafc;
	}

	/* Resend */
	.resend-result {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.resend-result.success {
		background: #f0fff4;
		color: #38a169;
		border: 1px solid #c6f6d5;
	}

	.resend-result.failure {
		background: #fff5f5;
		color: #e53e3e;
		border: 1px solid #feb2b2;
	}

	/* Actions */
	.modal-actions {
		border-top: 1px solid #e2e8f0;
		padding-top: 1rem;
	}

	.resend-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.resend-form label {
		font-size: 0.875rem;
		color: #4a5568;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.resend-form input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.resend-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.resend-warning {
		font-size: 0.75rem;
		color: #d69e2e;
		margin: 0;
	}

	/* Buttons */
	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.15s;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #3182ce;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2c5282;
	}

	.btn-danger {
		background: #e53e3e;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #c53030;
	}

	.btn-secondary {
		background: #edf2f7;
		color: #4a5568;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #e2e8f0;
	}
</style>
