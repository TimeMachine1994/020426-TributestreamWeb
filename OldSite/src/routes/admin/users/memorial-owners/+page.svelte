<!--
MEMORIAL OWNERS ADMIN PAGE

Manage users who own memorial pages
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';
	import { goto } from '$app/navigation';
	import { applyFilters, type FilterRule } from '$lib/utils/filter-utils';

	let { data } = $props();

	// State
	let selectedUsers = $state<Set<string>>(new Set());
	let showFilters = $state(false);
	let activeFilters = $state<FilterRule[]>([]);

	// Derived filtered data
	let filteredUsers = $derived.by(() => {
		return applyFilters(data.users, activeFilters);
	});

	// Column configuration
	const columns = [
		{
			id: 'displayName',
			label: 'Name',
			field: 'displayName',
			width: 200,
			sortable: true
		},
		{
			id: 'email',
			label: 'Email',
			field: 'email',
			width: 250,
			sortable: true
		},
		{
			id: 'memorialCount',
			label: 'Memorials',
			field: 'memorialCount',
			width: 100,
			align: 'center' as const,
			sortable: true
		},
		{
			id: 'hasPaid',
			label: 'Has Paid',
			field: 'hasPaidForMemorial',
			width: 100,
			formatter: (val: boolean) => (val ? '✅ Yes' : '❌ No'),
			sortable: true
		},
		{
			id: 'suspended',
			label: 'Status',
			field: 'suspended',
			width: 100,
			formatter: (val: boolean) => (val ? '🚫 Suspended' : '✅ Active'),
			sortable: true
		},
		{
			id: 'createdAt',
			label: 'Joined',
			field: 'createdAt',
			width: 120,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		},
		{
			id: 'lastLoginAt',
			label: 'Last Login',
			field: 'lastLoginAt',
			width: 120,
			formatter: (val: string) => {
				if (!val) return 'Never';
				const date = new Date(val);
				return date.toLocaleDateString();
			}
		}
	];

	// Actions
	async function handleBulkAction(action: string, ids: string[]) {
		const response = await fetch('/api/admin/bulk-actions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, ids, resourceType: 'user' })
		});

		if (response.ok) {
			location.reload();
		}
	}

	function handleRowClick(user: any) {
		goto(`/admin/users/memorial-owners/${user.id}`);
	}
</script>

<AdminLayout
	title="Memorial Owners"
	subtitle="Manage users who created memorial pages"
	actions={[
		{
			label: 'Filters',
			icon: '🔍',
			onclick: () => (showFilters = !showFilters)
		},
		{
			label: 'Export CSV',
			icon: '📥',
			onclick: () => console.log('Export users')
		}
	]}
>
	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{ id: 'displayName', label: 'Name', type: 'string' },
					{ id: 'email', label: 'Email', type: 'string' },
					{ id: 'hasPaidForMemorial', label: 'Has Paid', type: 'boolean' },
					{ id: 'suspended', label: 'Suspended', type: 'boolean' },
					{ id: 'createdAt', label: 'Join Date', type: 'date' }
				]}
				onFilterChange={(filters) => {
					activeFilters = filters;
				}}
			/>
		</div>
	{/if}

	<DataGrid
		{columns}
		data={filteredUsers}
		selectable={$can('user', 'update')}
		bind:selectedMemorials={selectedUsers}
		onRowClick={handleRowClick}
		resourceType="user"
	/>
</AdminLayout>

<style>
	.filters-panel {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	/* Clickable user name styling */
	:global(.user-name-link) {
		color: #d5ba7f;
		text-decoration: none;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:global(.user-name-link:hover) {
		text-decoration: underline;
		color: #c4a76e;
	}

	/* Enhanced row hover effect */
	:global(.data-grid tbody tr) {
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	:global(.data-grid tbody tr:hover) {
		background-color: #f7fafc;
	}
</style>
