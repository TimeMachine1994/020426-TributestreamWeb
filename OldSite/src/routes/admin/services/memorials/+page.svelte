<!--
MEMORIALS ADMIN PAGE

High-density data grid for memorial management
Implements ADMIN_REFACTOR_2_DATA_OPERATIONS.md features
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import BulkActionBar from '$lib/components/admin/BulkActionBar.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';
	import { applyFilters, type FilterRule } from '$lib/utils/filter-utils';

	let { data } = $props();

	// State
	let selectedMemorials = $state<Set<string>>(new Set());
	let showFilters = $state(false);
	let search = $state<string>(data.searchQuery || '');
	let activeFilters = $state<FilterRule[]>([]);

	// Derived filtered data
	let filteredMemorials = $derived.by(() => {
		return applyFilters(data.memorials, activeFilters);
	});

	async function togglePayment(row: any) {
		const action = row.isPaid ? 'markUnpaid' : 'markPaid';

		const response = await fetch('/api/admin/bulk-actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action,
				ids: [row.id],
				resourceType: 'memorial'
			})
		});

		if (response.ok) {
			location.reload();
		} else {
			alert('Failed to update payment status. Please try again.');
		}
	}

	async function toggleVisibility(row: any) {
		const action = row.isPublic ? 'makePrivate' : 'makePublic';

		const response = await fetch('/api/admin/bulk-actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action,
				ids: [row.id],
				resourceType: 'memorial'
			})
		});

		if (response.ok) {
			location.reload();
		} else {
			alert('Failed to update visibility. Please try again.');
		}
	}

	// Navigate to user detail page
	function viewUserDetails(row: any) {
		if (row.ownerUid) {
			goto(`/admin/users/memorial-owners/${row.ownerUid}`);
		}
	}

	// Column configuration
	const columns = [
		{
			id: 'lovedOneName',
			label: 'Name',
			field: 'lovedOneName',
			width: 200,
			sortable: true,
			pinnable: true,
			formatter: (val: string, row: any) => row.customTitle || val
		},
		{
			id: 'ownerEmail',
			label: 'Owner',
			field: 'creatorEmail',
			width: 200,
			sortable: true,
			onClick: viewUserDetails,
			formatter: (val: string) => val || 'Unknown'
		},
		{
			id: 'isPaid',
			label: 'Payment',
			field: 'isPaid',
			width: 120,
			formatter: (val: boolean) => (val ? '✅ Paid' : '❌ Unpaid'),
			onClick: togglePayment,
			sortable: true
		},
		{
			id: 'isPublic',
			label: 'Visibility',
			field: 'isPublic',
			width: 100,
			formatter: (val: boolean) => (val ? '🌐 Public' : '🔒 Private'),
			onClick: toggleVisibility
		},
		{
			id: 'createdAt',
			label: 'Created',
			field: 'createdAt',
			width: 150,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		},
		{
			id: 'location',
			label: 'Location',
			field: 'location',
			width: 180
		},
		{
			id: 'serviceDate',
			label: 'Service Date',
			field: 'scheduledStartTime',
			width: 120,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				const datePart = date.toLocaleDateString();
				const timePart = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
				return `${datePart} ${timePart}`;
			}
		}
	];

	// Actions
	async function handleBulkAction(action: string, ids: string[]) {
		console.log('Bulk action:', action, ids);
		
		// Confirm delete action
		if (action === 'delete') {
			const count = ids.length;
			const memorial = count === 1 ? 'memorial' : 'memorials';
			const confirmMessage = `Are you sure you want to delete ${count} ${memorial}?\n\nThis will mark them as deleted and they will be hidden from the admin list.`;
			
			if (!confirm(confirmMessage)) {
				return;
			}
		}
		
		const response = await fetch('/api/admin/bulk-actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, ids, resourceType: 'memorial' })
		});

		if (response.ok) {
			const result = await response.json();
			const successCount = result.success?.length || 0;
			const failedCount = result.failed?.length || 0;
			
			if (failedCount > 0) {
				alert(`Action completed with errors:\n✅ ${successCount} succeeded\n❌ ${failedCount} failed`);
			}
			
			// Reload data
			location.reload();
		} else {
			alert('Action failed. Please try again.');
		}
	}

	function handleRowClick(memorial: any) {
		goto(`/admin/services/memorials/${memorial.id}`);
	}
</script>

<AdminLayout
	title="Memorials"
	subtitle="Manage all memorial pages and services"
	actions={[
		{
			label: 'Filters',
			icon: '🔍',
			onclick: () => (showFilters = !showFilters)
		},
		...$can('memorial', 'create')
			? [
					{
						label: 'Create Memorial',
						icon: '➕',
						variant: 'primary',
						onclick: () => goto('/admin/services/memorials/create')
					}
				]
			: []
	]}
>
	<!-- Search Bar -->
	<form class="search-bar" method="GET">
		<input
			type="text"
			name="q"
			placeholder="Search by name, slug, owner, location..."
			value={search}
			oninput={(event) => {
				const target = event.currentTarget as HTMLInputElement;
				search = target.value;
			}}
		/>
		<button type="submit">Search</button>
	</form>

	<!-- Bulk Actions Bar -->
	{#if selectedMemorials.size > 0}
		<BulkActionBar
			selectedCount={selectedMemorials.size}
			resourceType="memorial"
			onAction={(action) => handleBulkAction(action, Array.from(selectedMemorials))}
			onClear={() => {
				selectedMemorials.clear();
				selectedMemorials = selectedMemorials;
			}}
		/>
	{/if}

	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{ id: 'lovedOneName', label: 'Name', type: 'string' },
					{ id: 'creatorEmail', label: 'Owner Email', type: 'string' },
					{ id: 'isPaid', label: 'Payment Status', type: 'boolean' },
					{ id: 'isPublic', label: 'Visibility', type: 'boolean' },
					{ id: 'createdAt', label: 'Created Date', type: 'date' }
				]}
				onFilterChange={(filters) => {
					activeFilters = filters;
				}}
			/>
		</div>
	{/if}

	<DataGrid
		{columns}
		data={filteredMemorials}
		selectable={$can('memorial', 'update')}
		bind:selectedMemorials={selectedMemorials}
		onRowClick={handleRowClick}
		resourceType="memorial"
	/>
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

	.filters-panel {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}
</style>
