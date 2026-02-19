<!--
EMAIL AUDIT LOGS ADMIN PAGE

View, filter, and manage all email audit logs.
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import EmailLogDetail from '$lib/components/admin/EmailLogDetail.svelte';
	import { applyFilters, type FilterRule } from '$lib/utils/filter-utils';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();

	// State
	let showFilters = $state(false);
	let activeFilters = $state<FilterRule[]>([]);
	let selectedLog = $state<any>(null);
	let loadingDetail = $state(false);
	let detailError = $state('');

	// Derived filtered data (client-side filtering on top of server-side)
	let filteredLogs = $derived.by(() => {
		return applyFilters(data.logs, activeFilters);
	});

	// Email type display map
	const typeLabels: Record<string, string> = {
		enhanced_registration: '📝 Registration',
		basic_registration: '📝 Registration (Basic)',
		funeral_director_registration: '🏥 Director Registration',
		invitation: '📨 Invitation',
		email_change_confirmation: '✉️ Email Change',
		payment_confirmation: '💳 Payment Confirmed',
		payment_action_required: '⚠️ Payment Action',
		payment_failure: '❌ Payment Failed',
		password_reset: '🔑 Password Reset',
		owner_welcome: '👋 Owner Welcome',
		funeral_director_welcome: '👋 Director Welcome',
		contact_form_support: '📩 Contact (Support)',
		contact_form_confirmation: '📩 Contact (Confirm)',
		invoice: '🧾 Invoice',
		invoice_receipt: '🧾 Invoice Receipt'
	};

	const statusLabels: Record<string, string> = {
		sent: '✅ Sent',
		failed: '❌ Failed',
		mocked: '🔶 Mocked'
	};

	// Column configuration
	const columns = [
		{
			id: 'type',
			label: 'Type',
			field: 'type',
			width: 200,
			sortable: true,
			formatter: (val: string) => typeLabels[val] || val
		},
		{
			id: 'to',
			label: 'Recipient',
			field: 'to',
			width: 220,
			sortable: true
		},
		{
			id: 'templateName',
			label: 'Template',
			field: 'templateName',
			width: 200,
			formatter: (val: string) => val || '-'
		},
		{
			id: 'sentAt',
			label: 'Sent At',
			field: 'sentAt',
			width: 180,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				const now = new Date();
				const diffMs = now.getTime() - date.getTime();
				const diffMin = Math.floor(diffMs / 60000);
				if (diffMin < 1) return 'Just now';
				if (diffMin < 60) return `${diffMin}m ago`;
				const diffHr = Math.floor(diffMin / 60);
				if (diffHr < 24) return `${diffHr}h ago`;
				return date.toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				});
			}
		},
		{
			id: 'status',
			label: 'Status',
			field: 'status',
			width: 120,
			sortable: true,
			formatter: (val: string) => statusLabels[val] || val
		},
		{
			id: 'error',
			label: 'Error',
			field: 'error',
			width: 200,
			formatter: (val: string) => {
				if (!val) return '';
				return val.length > 60 ? val.substring(0, 60) + '...' : val;
			}
		}
	];

	// Handlers
	async function handleRowClick(log: any) {
		loadingDetail = true;
		detailError = '';
		try {
			const res = await fetch(`/api/admin/email-logs/${log.id}`);
			if (!res.ok) throw new Error('Failed to load email details');
			const result = await res.json();
			selectedLog = result.log;
		} catch (err: any) {
			detailError = err.message || 'Failed to load details';
		} finally {
			loadingDetail = false;
		}
	}

	function closeDetail() {
		selectedLog = null;
		detailError = '';
	}

	function handlePageChange(newPage: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(newPage));
		goto(`?${params.toString()}`);
	}
</script>

<AdminLayout
	title="Email Audit Logs"
	subtitle="View all emails sent from the system"
	actions={[
		{
			label: showFilters ? 'Hide Filters' : 'Show Filters',
			icon: '🔍',
			onclick: () => (showFilters = !showFilters)
		}
	]}
>
	<!-- Stats Bar -->
	<div class="stats-bar">
		<div class="stat">
			<span class="stat-value">{data.stats.total.toLocaleString()}</span>
			<span class="stat-label">Total</span>
		</div>
		<div class="stat sent">
			<span class="stat-value">{data.stats.sent.toLocaleString()}</span>
			<span class="stat-label">Sent</span>
		</div>
		<div class="stat failed">
			<span class="stat-value">{data.stats.failed.toLocaleString()}</span>
			<span class="stat-label">Failed</span>
		</div>
		<div class="stat mocked">
			<span class="stat-value">{data.stats.mocked.toLocaleString()}</span>
			<span class="stat-label">Mocked</span>
		</div>
	</div>

	<!-- Filters -->
	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{
						id: 'type',
						label: 'Email Type',
						type: 'enum',
						options: [
							{ value: 'enhanced_registration', label: 'Enhanced Registration' },
							{ value: 'basic_registration', label: 'Basic Registration' },
							{ value: 'funeral_director_registration', label: 'Director Registration' },
							{ value: 'invitation', label: 'Invitation' },
							{ value: 'email_change_confirmation', label: 'Email Change' },
							{ value: 'payment_confirmation', label: 'Payment Confirmed' },
							{ value: 'payment_action_required', label: 'Payment Action Required' },
							{ value: 'payment_failure', label: 'Payment Failure' },
							{ value: 'password_reset', label: 'Password Reset' },
							{ value: 'owner_welcome', label: 'Owner Welcome' },
							{ value: 'funeral_director_welcome', label: 'Director Welcome' },
							{ value: 'contact_form_support', label: 'Contact Form (Support)' },
							{ value: 'contact_form_confirmation', label: 'Contact Form (Confirm)' },
							{ value: 'invoice', label: 'Invoice' },
							{ value: 'invoice_receipt', label: 'Invoice Receipt' }
						]
					},
					{
						id: 'status',
						label: 'Status',
						type: 'enum',
						options: [
							{ value: 'sent', label: 'Sent' },
							{ value: 'failed', label: 'Failed' },
							{ value: 'mocked', label: 'Mocked' }
						]
					},
					{ id: 'to', label: 'Recipient Email', type: 'string' },
					{ id: 'sentAt', label: 'Date', type: 'date' }
				]}
				onFilterChange={(filters) => {
					activeFilters = filters;
				}}
			/>
		</div>
	{/if}

	<!-- Data Grid -->
	<DataGrid
		{columns}
		data={filteredLogs}
		selectable={false}
		resourceType="email_log"
		onRowClick={handleRowClick}
	/>

	<!-- Pagination -->
	{#if data.pagination.total > data.pagination.limit}
		<div class="pagination">
			<button
				class="page-btn"
				disabled={data.pagination.page <= 1}
				onclick={() => handlePageChange(data.pagination.page - 1)}
			>
				← Prev
			</button>
			<span class="page-info">
				Page {data.pagination.page} of {Math.ceil(data.pagination.total / data.pagination.limit)}
			</span>
			<button
				class="page-btn"
				disabled={!data.pagination.hasMore}
				onclick={() => handlePageChange(data.pagination.page + 1)}
			>
				Next →
			</button>
		</div>
	{/if}
</AdminLayout>

<!-- Detail Modal -->
{#if selectedLog || loadingDetail}
	<EmailLogDetail
		log={selectedLog}
		loading={loadingDetail}
		error={detailError}
		onClose={closeDetail}
	/>
{/if}

<style>
	.stats-bar {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 0.75rem 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 100px;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2d3748;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat.sent .stat-value {
		color: #38a169;
	}

	.stat.failed .stat-value {
		color: #e53e3e;
	}

	.stat.mocked .stat-value {
		color: #d69e2e;
	}

	.filters-panel {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 1.5rem;
		padding: 1rem 0;
	}

	.page-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		color: #4a5568;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.15s;
	}

	.page-btn:hover:not(:disabled) {
		background: #f7fafc;
		border-color: #cbd5e0;
	}

	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-info {
		font-size: 0.875rem;
		color: #718096;
	}
</style>
