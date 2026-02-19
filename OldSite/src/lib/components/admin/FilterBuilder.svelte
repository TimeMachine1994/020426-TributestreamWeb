<!--
FILTER BUILDER

Boolean logic filter UI for advanced data filtering
Based on ADMIN_REFACTOR_2_DATA_OPERATIONS.md
-->
<script lang="ts">
	interface Field {
		id: string;
		label: string;
		type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
		options?: Array<{ value: any; label: string }>;
	}

	interface FilterRule {
		field: string;
		operator: string;
		value: any;
		type: string;
	}

	let {
		fields,
		onFilterChange
	}: {
		fields: Field[];
		onFilterChange: (filters: any) => void;
	} = $props();

	// State
	let rules = $state<FilterRule[]>([]);

	// Operators by field type
	const operators = {
		string: [
			{ value: 'eq', label: 'equals' },
			{ value: 'ne', label: 'not equals' },
			{ value: 'contains', label: 'contains' },
			{ value: 'startsWith', label: 'starts with' },
			{ value: 'isNull', label: 'is empty' },
			{ value: 'isNotNull', label: 'is not empty' }
		],
		number: [
			{ value: 'eq', label: 'equals' },
			{ value: 'ne', label: 'not equals' },
			{ value: 'gt', label: 'greater than' },
			{ value: 'gte', label: 'greater or equal' },
			{ value: 'lt', label: 'less than' },
			{ value: 'lte', label: 'less or equal' }
		],
		date: [
			{ value: 'eq', label: 'equals' },
			{ value: 'ne', label: 'not equals' },
			{ value: 'gt', label: 'after' },
			{ value: 'lt', label: 'before' }
		],
		boolean: [{ value: 'eq', label: 'is' }],
		enum: [
			{ value: 'eq', label: 'equals' },
			{ value: 'ne', label: 'not equals' }
		]
	};

	function addRule() {
		const firstField = fields[0];
		rules.push({
			field: firstField.id,
			operator: 'eq',
			value: '',
			type: firstField.type
		});
		rules = rules; // Trigger reactivity
	}

	function removeRule(index: number) {
		rules.splice(index, 1);
		rules = rules;
		emitFilters();
	}

	function updateRule(index: number, changes: Partial<FilterRule>) {
		rules[index] = { ...rules[index], ...changes };

		// If field changed, update type and reset operator
		if (changes.field) {
			const field = fields.find((f) => f.id === changes.field);
			if (field) {
				rules[index].type = field.type;
				rules[index].operator = 'eq';
				rules[index].value = '';
			}
		}

		rules = rules;
		emitFilters();
	}

	function emitFilters() {
		const validRules = rules.filter((rule) => {
			// Check if rule is complete
			const needsValue = !['isNull', 'isNotNull'].includes(rule.operator);
			return rule.field && rule.operator && (!needsValue || rule.value !== '');
		});

		onFilterChange(validRules);
	}

	function clearAll() {
		rules = [];
		emitFilters();
	}
</script>

<div class="filter-builder">
	<div class="filter-header">
		<h3>Advanced Filters</h3>
		<div class="header-actions">
			{#if rules.length > 0}
				<button class="clear-btn" onclick={clearAll}>Clear All</button>
			{/if}
			<button class="add-btn" onclick={addRule}>+ Add Filter</button>
		</div>
	</div>

	{#if rules.length > 0}
		<div class="filter-rules">
			{#each rules as rule, index}
				{@const field = fields.find((f) => f.id === rule.field)}
				{@const fieldOperators = operators[rule.type] || operators.string}

				<div class="filter-rule">
					<!-- Field selector -->
					<select
						class="field-select"
						value={rule.field}
						onchange={(e) =>
							updateRule(index, { field: (e.target as HTMLSelectElement).value })}
					>
						{#each fields as f}
							<option value={f.id}>{f.label}</option>
						{/each}
					</select>

					<!-- Operator selector -->
					<select
						class="operator-select"
						value={rule.operator}
						onchange={(e) =>
							updateRule(index, { operator: (e.target as HTMLSelectElement).value })}
					>
						{#each fieldOperators as op}
							<option value={op.value}>{op.label}</option>
						{/each}
					</select>

					<!-- Value input (if needed) -->
					{#if !['isNull', 'isNotNull'].includes(rule.operator)}
						{#if rule.type === 'boolean'}
							<select
								class="value-input"
								value={rule.value}
								onchange={(e) =>
									updateRule(index, {
										value: (e.target as HTMLSelectElement).value === 'true'
									})}
							>
								<option value="true">True</option>
								<option value="false">False</option>
							</select>
						{:else if rule.type === 'date'}
							<input
								type="date"
								class="value-input"
								value={rule.value}
								oninput={(e) => updateRule(index, { value: (e.target as HTMLInputElement).value })}
							/>
						{:else if rule.type === 'enum' && field?.options}
							<select
								class="value-input"
								value={rule.value}
								onchange={(e) =>
									updateRule(index, { value: (e.target as HTMLSelectElement).value })}
							>
								<option value="">Select...</option>
								{#each field.options as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						{:else}
							<input
								type={rule.type === 'number' ? 'number' : 'text'}
								class="value-input"
								value={rule.value}
								oninput={(e) => updateRule(index, { value: (e.target as HTMLInputElement).value })}
								placeholder="Enter value..."
							/>
						{/if}
					{/if}

					<!-- Remove button -->
					<button class="remove-btn" onclick={() => removeRule(index)}>✕</button>
				</div>
			{/each}
		</div>

		<div class="active-filters-info">
			<span class="info-text">{rules.length} filter{rules.length !== 1 ? 's' : ''} active</span>
		</div>
	{:else}
		<div class="empty-state">
			<p>No filters applied. Click "Add Filter" to start filtering.</p>
		</div>
	{/if}
</div>

<style>
	.filter-builder {
		background: #f7fafc;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.filter-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.filter-header h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #2d3748;
		margin: 0;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.add-btn,
	.clear-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		background: white;
		color: #4a5568;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.add-btn:hover,
	.clear-btn:hover {
		background: #edf2f7;
		border-color: #a0aec0;
	}

	.filter-rules {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.filter-rule {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		background: white;
		padding: 1rem;
		border-radius: 0.375rem;
		border: 1px solid #e2e8f0;
	}

	.field-select,
	.operator-select,
	.value-input {
		padding: 0.5rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #2d3748;
		background: white;
	}

	.field-select {
		flex: 0 0 180px;
	}

	.operator-select {
		flex: 0 0 140px;
	}

	.value-input {
		flex: 1;
		min-width: 150px;
	}

	.remove-btn {
		flex: 0 0 auto;
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: 0.25rem;
		background: #feb2b2;
		color: #742a2a;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.remove-btn:hover {
		background: #fc8181;
	}

	.active-filters-info {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: #bee3f8;
		border-radius: 0.375rem;
	}

	.info-text {
		font-size: 0.8125rem;
		color: #2c5282;
		font-weight: 500;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: #a0aec0;
	}

	.empty-state p {
		margin: 0;
		font-size: 0.875rem;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.filter-rule {
			flex-direction: column;
			align-items: stretch;
		}

		.field-select,
		.operator-select,
		.value-input {
			flex: 1;
			width: 100%;
		}

		.remove-btn {
			width: 100%;
		}
	}
</style>
