<!--
DATA GRID COMPONENT

High-density table with:
- Sortable/resizable columns
- Multi-select with bulk actions
- Inline editing
- Virtual scrolling support

Based on ADMIN_REFACTOR_2_DATA_OPERATIONS.md
-->
<script lang="ts">
	import BulkActionBar from './BulkActionBar.svelte';

	interface Column {
		id: string;
		label: string;
		field: string;
		width?: number;
		minWidth?: number;
		sortable?: boolean;
		resizable?: boolean;
		pinned?: 'left' | 'right' | false;
		formatter?: (value: any, row: any) => string;
		onClick?: (row: any) => void;
		align?: 'left' | 'center' | 'right';
	}

	let {
		columns = [],
		data = [],
		selectable = false,
		selectedMemorials = $bindable(new Set()),
		resourceType = 'memorial',
		onRowClick,
		onBulkAction
	}: {
		columns: Column[];
		data: any[];
		selectable?: boolean;
		selectedMemorials?: Set<string>;
		resourceType?: string;
		onRowClick?: (row: any) => void;
		onBulkAction?: (action: string, ids: string[]) => void;
	} = $props();

	// State
	let sortedColumn = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let columnWidths = $state<Map<string, number>>(new Map());

	// Derived sorted data
	let sortedData = $derived.by(() => {
		if (!sortedColumn) return data;

		const col = sortedColumn;
		return [...data].sort((a, b) => {
			const aVal = a[col];
			const bVal = b[col];

			if (aVal === bVal) return 0;

			const comparison = aVal > bVal ? 1 : -1;
			return sortDirection === 'asc' ? comparison : -comparison;
		});
	});

	// Select all checkbox - check against visible sorted data
	let selectAll = $derived(
		sortedData.length > 0 && 
		sortedData.every((row) => selectedMemorials.has(row.id))
	);

	function handleSort(column: Column) {
		if (!column.sortable) return;

		if (sortedColumn === column.field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortedColumn = column.field;
			sortDirection = 'asc';
		}
	}

	function toggleSelectAll() {
		// Check if all visible items are selected
		const allSelected = sortedData.length > 0 && 
			sortedData.every((row) => selectedMemorials.has(row.id));
		
		if (allSelected) {
			// Deselect all visible items
			sortedData.forEach((row) => selectedMemorials.delete(row.id));
		} else {
			// Select all visible items
			sortedData.forEach((row) => selectedMemorials.add(row.id));
		}
		selectedMemorials = selectedMemorials; // Trigger reactivity
	}

	function toggleSelection(id: string) {
		if (selectedMemorials.has(id)) {
			selectedMemorials.delete(id);
		} else {
			selectedMemorials.add(id);
		}
		selectedMemorials = selectedMemorials; // Trigger reactivity
	}

	function handleBulkAction(action: string) {
		if (onBulkAction) {
			onBulkAction(action, Array.from(selectedMemorials));
		}
	}
</script>

<div class="data-grid-container">
	<!-- Bulk Actions Bar -->
	{#if selectable && selectedMemorials.size > 0}
		<BulkActionBar
			selectedCount={selectedMemorials.size}
			{resourceType}
			onAction={handleBulkAction}
			onClear={() => {
				selectedMemorials.clear();
				selectedMemorials = selectedMemorials;
			}}
		/>
	{/if}

	<!-- Data Grid -->
	<div class="data-grid">
		<table>
			<thead>
				<tr>
					{#if selectable}
						<th class="checkbox-cell">
							<input
								type="checkbox"
								checked={selectAll}
								onclick={toggleSelectAll}
								aria-label="Select all"
							/>
						</th>
					{/if}

					{#each columns as column}
						<th
							class="header-cell"
							class:sortable={column.sortable}
							class:sorted={sortedColumn === column.field}
							style="width: {columnWidths.get(column.id) || column.width || 150}px; text-align: {column.align || 'left'}"
							onclick={() => handleSort(column)}
						>
							<div class="header-content">
								<span>{column.label}</span>
								{#if column.sortable}
									<span class="sort-icon">
										{#if sortedColumn === column.field}
											{sortDirection === 'asc' ? '↑' : '↓'}
										{:else}
											<span class="sort-placeholder">⇅</span>
										{/if}
									</span>
								{/if}
							</div>
						</th>
					{/each}
				</tr>
			</thead>

			<tbody>
				{#each sortedData as row}
					<tr
						class="data-row"
						class:selected={selectedMemorials.has(row.id)}
						class:clickable={onRowClick}
						onclick={(e) => {
							// Don't trigger row click if clicking checkbox or if no handler
							if (!onRowClick) return;
							const target = e.target as HTMLElement;
							if (target.tagName === 'INPUT' || target.closest('.checkbox-cell')) return;
							onRowClick(row);
						}}
					>
						{#if selectable}
							<td class="checkbox-cell" onclick={(e) => e.stopPropagation()}>
								<input
									type="checkbox"
									checked={selectedMemorials.has(row.id)}
									onclick={() => toggleSelection(row.id)}
									aria-label="Select row"
								/>
							</td>
						{/if}

						{#each columns as column}
							<td
								class="body-cell"
								class:clickable-cell={!!column.onClick}
								style="text-align: {column.align || 'left'}"
							>
								{#if column.onClick}
									<button
										class="cell-button"
										type="button"
										onclick={(event) => {
											event.stopPropagation();
											column.onClick?.(row);
										}}
									>
										{#if column.formatter}
											{column.formatter(row[column.field], row)}
										{:else}
											{row[column.field] ?? '-'}
										{/if}
									</button>
								{:else}
									{#if column.formatter}
										{column.formatter(row[column.field], row)}
									{:else}
										{row[column.field] ?? '-'}
									{/if}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}

				{#if sortedData.length === 0}
					<tr>
						<td colspan={columns.length + (selectable ? 1 : 0)} class="empty-state">
							<div class="empty-content">
								<span class="empty-icon">📭</span>
								<p>No data found</p>
							</div>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	<div class="grid-footer">
		<div class="row-count">{sortedData.length} items</div>
	</div>
</div>

<style>
	.data-grid-container {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.data-grid {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: #f7fafc;
		border-bottom: 2px solid #e2e8f0;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.header-cell {
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #4a5568;
		border-right: 1px solid #e2e8f0;
		white-space: nowrap;
	}

	.header-cell:last-child {
		border-right: none;
	}

	.header-cell.sortable {
		cursor: pointer;
		user-select: none;
	}

	.header-cell.sortable:hover {
		background: #edf2f7;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sort-icon {
		color: #3182ce;
		font-size: 0.75rem;
	}

	.sort-placeholder {
		color: #cbd5e0;
	}

	.checkbox-cell {
		width: 40px;
		padding: 0.75rem;
		text-align: center;
	}

	.data-row {
		border-bottom: 1px solid #e2e8f0;
		transition: background 0.15s;
	}

	.data-row:hover {
		background: #f7fafc;
	}

	.data-row.clickable:hover {
		cursor: pointer;
	}

	.data-row.selected {
		background: #ebf8ff;
	}

	.checkbox-cell {
		cursor: pointer;
	}

	.body-cell {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: #2d3748;
		border-right: 1px solid #f7fafc;
	}

	.body-cell.clickable-cell {
		padding: 0;
	}

	.cell-button {
		width: 100%;
		padding: 0.5rem 1rem;
		margin: 0;
		background: none;
		border: none;
		text-align: inherit;
		font: inherit;
		color: inherit;
		cursor: pointer;
		border-radius: 999px;
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.cell-button:hover {
		background-color: #edf2f7;
	}

	.body-cell:last-child {
		border-right: none;
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
	}

	.empty-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: #a0aec0;
	}

	.empty-icon {
		font-size: 3rem;
	}

	.empty-content p {
		margin: 0;
		font-size: 0.875rem;
	}

	.grid-footer {
		padding: 0.75rem 1rem;
		border-top: 1px solid #e2e8f0;
		background: #f7fafc;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.row-count {
		font-size: 0.8125rem;
		color: #718096;
	}
</style>
