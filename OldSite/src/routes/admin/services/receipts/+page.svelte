<!--
RECEIPTS ADMIN PAGE

View all payment receipts with ability to view details and print/download as PDF
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let search = $state<string>(data.searchQuery || '');

	// Column configuration
	const columns = [
		{
			id: 'lovedOneName',
			label: 'Memorial',
			field: 'lovedOneName',
			width: 180,
			sortable: true
		},
		{
			id: 'ownerEmail',
			label: 'Customer',
			field: 'ownerEmail',
			width: 200,
			sortable: true,
			formatter: (val: string, row: any) => row.ownerName || val || 'Unknown'
		},
		{
			id: 'amount',
			label: 'Amount',
			field: 'amount',
			width: 100,
			sortable: true,
			formatter: (val: number) => val ? `$${val.toFixed(2)}` : '-'
		},
		{
			id: 'paidAt',
			label: 'Payment Date',
			field: 'paidAt',
			width: 150,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				});
			}
		},
		{
			id: 'status',
			label: 'Status',
			field: 'status',
			width: 100,
			formatter: (val: string) => {
				switch (val) {
					case 'paid':
						return '✅ Paid';
					case 'payment_failed':
						return '❌ Failed';
					case 'pending_payment':
						return '⏳ Pending';
					default:
						return val || '-';
				}
			}
		},
		{
			id: 'paymentIntentId',
			label: 'Payment ID',
			field: 'paymentIntentId',
			width: 180,
			formatter: (val: string) => val ? `${val.substring(0, 20)}...` : '-'
		}
	];

	function handleRowClick(receipt: any) {
		goto(`/admin/services/receipts/${receipt.memorialId}`);
	}
</script>

<AdminLayout
	title="Payment Receipts"
	subtitle="View and print payment receipts for all completed transactions"
>
	<!-- Search Bar -->
	<form class="search-bar" method="GET">
		<input
			type="text"
			name="q"
			placeholder="Search by name, email, payment ID..."
			value={search}
			oninput={(event) => {
				const target = event.currentTarget as HTMLInputElement;
				search = target.value;
			}}
		/>
		<button type="submit">Search</button>
	</form>

	<!-- Stats Summary -->
	<div class="stats-bar">
		<div class="stat">
			<span class="stat-value">{data.receipts.length}</span>
			<span class="stat-label">Total Receipts</span>
		</div>
		<div class="stat">
			<span class="stat-value">
				${data.receipts.reduce((sum: number, r: any) => sum + (r.amount || 0), 0).toFixed(2)}
			</span>
			<span class="stat-label">Total Revenue</span>
		</div>
	</div>

	{#if data.receipts.length === 0}
		<div class="empty-state">
			<div class="empty-icon">🧾</div>
			<h3>No Receipts Found</h3>
			<p>Payment receipts will appear here after customers complete their purchases.</p>
		</div>
	{:else}
		<DataGrid
			{columns}
			data={data.receipts}
			selectable={false}
			onRowClick={handleRowClick}
			resourceType="receipt"
		/>
	{/if}
</AdminLayout>

<style>
	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.search-bar input[type='text'] {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid #e2e8f0;
		font-size: 0.9375rem;
	}

	.search-bar button[type='submit'] {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: 1px solid #cbd5e0;
		background: #edf2f7;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease;
	}

	.search-bar button[type='submit']:hover {
		background: #e2e8f0;
		border-color: #a0aec0;
	}

	.stats-bar {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 0.5rem;
		color: white;
	}

	.stat {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.stat-label {
		font-size: 0.875rem;
		opacity: 0.9;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: #f7fafc;
		border-radius: 0.5rem;
		border: 2px dashed #e2e8f0;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem;
		color: #2d3748;
	}

	.empty-state p {
		margin: 0;
		color: #718096;
	}
</style>
