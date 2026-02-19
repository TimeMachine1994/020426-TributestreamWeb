<!--
AUDIT LOGS ADMIN PAGE

View all administrative actions and system events
-->
<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import DataGrid from '$lib/components/admin/DataGrid.svelte';
	import FilterBuilder from '$lib/components/admin/FilterBuilder.svelte';
	import { can } from '$lib/stores/adminUser';
	import { applyFilters, type FilterRule } from '$lib/utils/filter-utils';

	let { data } = $props();

	// State
	let selectedLogs = $state<Set<string>>(new Set());
	let showFilters = $state(false);
	let activeFilters = $state<FilterRule[]>([]);

	// Derived filtered data
	let filteredLogs = $derived.by(() => {
		return applyFilters(data.logs, activeFilters);
	});

	// Column configuration
	const columns = [
		{
			id: 'timestamp',
			label: 'Time',
			field: 'timestamp',
			width: 180,
			sortable: true,
			formatter: (val: string) => {
				if (!val) return '-';
				const date = new Date(val);
				return date.toLocaleString();
			}
		},
		{
			id: 'action',
			label: 'Action',
			field: 'action',
			width: 200,
			sortable: true,
			formatter: (val: string) => {
				// Convert snake_case to Title Case
				return val
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
			}
		},
		{
			id: 'adminEmail',
			label: 'Admin',
			field: 'adminEmail',
			width: 200,
			sortable: true
		},
		{
			id: 'resourceType',
			label: 'Resource',
			field: 'resourceType',
			width: 120,
			formatter: (val: string) => {
				const resourceMap: Record<string, string> = {
					memorial: '💝 Memorial',
					stream: '📹 Stream',
					user: '👤 User',
					funeral_director: '🏥 Director',
					system: '⚙️ System'
				};
				return resourceMap[val] || val;
			}
		},
		{
			id: 'resourceId',
			label: 'Resource ID',
			field: 'resourceId',
			width: 150
		},
		{
			id: 'status',
			label: 'Status',
			field: 'status',
			width: 100,
			formatter: (val: string) => {
				const statusMap: Record<string, string> = {
					success: '✅ Success',
					failed: '❌ Failed',
					pending: '🕒 Pending'
				};
				return statusMap[val] || val;
			}
		},
		{
			id: 'details',
			label: 'Details',
			field: 'details',
			width: 300,
			formatter: (val: any) => {
				if (!val) return '-';
				if (typeof val === 'string') return val;
				return JSON.stringify(val).substring(0, 100) + '...';
			}
		}
	];

	function handleRowClick(log: any) {
		// Show modal with full log details
		console.log('Log details:', log);
	}
</script>

<AdminLayout
	title="Audit Logs"
	subtitle="View all administrative actions and system events"
	actions={[
		{
			label: 'Filters',
			icon: '🔍',
			onclick: () => (showFilters = !showFilters)
		},
		{
			label: 'Export Logs',
			icon: '📥',
			onclick: () => console.log('Export logs')
		}
	]}
>
	{#if showFilters}
		<div class="filters-panel">
			<FilterBuilder
				fields={[
					{ id: 'action', label: 'Action', type: 'string' },
					{ id: 'adminEmail', label: 'Admin Email', type: 'string' },
					{
						id: 'resourceType',
						label: 'Resource Type',
						type: 'enum',
						options: [
							{ value: 'memorial', label: 'Memorial' },
							{ value: 'stream', label: 'Stream' },
							{ value: 'user', label: 'User' },
							{ value: 'funeral_director', label: 'Funeral Director' },
							{ value: 'system', label: 'System' }
						]
					},
					{
						id: 'status',
						label: 'Status',
						type: 'enum',
						options: [
							{ value: 'success', label: 'Success' },
							{ value: 'failed', label: 'Failed' },
							{ value: 'pending', label: 'Pending' }
						]
					},
					{ id: 'timestamp', label: 'Date', type: 'date' }
				]}
				onFilterChange={(filters) => {
					activeFilters = filters;
				}}
			/>
		</div>
	{/if}

	<div class="audit-log-info">
		<div class="info-banner">
			<span class="info-icon">ℹ️</span>
			<p>
				Audit logs are retained for 90 days. Logs older than 90 days are automatically archived.
				All actions are recorded with full details for compliance and security purposes.
			</p>
		</div>
	</div>

	<DataGrid
		{columns}
		data={filteredLogs}
		selectable={false}
		resourceType="audit_log"
	/>
	<!-- onRowClick disabled - will show modal with full details when implemented -->
</AdminLayout>

<style>
	.filters-panel {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.audit-log-info {
		margin-bottom: 1.5rem;
	}

	.info-banner {
		background: #ebf8ff;
		border: 1px solid #90cdf4;
		border-radius: 0.5rem;
		padding: 1rem 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.info-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.info-banner p {
		margin: 0;
		font-size: 0.875rem;
		color: #2c5282;
		line-height: 1.5;
	}
</style>
