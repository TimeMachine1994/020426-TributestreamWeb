<!--
BULK ACTION BAR

Toolbar for performing actions on multiple selected items
Based on ADMIN_REFACTOR_2_DATA_OPERATIONS.md
-->
<script lang="ts">
	let {
		selectedCount,
		resourceType,
		onAction,
		onClear
	}: {
		selectedCount: number;
		resourceType: string;
		onAction: (action: string) => void;
		onClear: () => void;
	} = $props();

	// Define actions based on resource type
	const actions = $derived.by(() => {
		switch (resourceType) {
			case 'memorial':
				return [
					{ id: 'markPaid', label: 'Mark Paid', icon: '✅', variant: 'primary' },
					{ id: 'makePublic', label: 'Make Public', icon: '🌐', variant: 'secondary' },
					{ id: 'makePrivate', label: 'Make Private', icon: '🔒', variant: 'secondary' },
					{ id: 'export', label: 'Export CSV', icon: '📥', variant: 'secondary' },
					{ id: 'delete', label: 'Delete', icon: '🗑️', variant: 'danger' }
				];

			case 'stream':
				return [
					{ id: 'makeVisible', label: 'Make Visible', icon: '👁️', variant: 'primary' },
					{ id: 'makeInvisible', label: 'Hide', icon: '🚫', variant: 'secondary' },
					{ id: 'delete', label: 'Delete', icon: '🗑️', variant: 'danger' }
				];

			case 'user':
				return [
					{ id: 'sendEmail', label: 'Email Users', icon: '📧', variant: 'primary' },
					{ id: 'export', label: 'Export CSV', icon: '📥', variant: 'secondary' },
					{ id: 'suspend', label: 'Suspend', icon: '🚫', variant: 'danger' }
				];

			case 'funeral_director':
				return [
					{ id: 'sendEmail', label: 'Email', icon: '📧', variant: 'primary' },
					{ id: 'export', label: 'Export CSV', icon: '📥', variant: 'secondary' },
					{ id: 'suspend', label: 'Suspend', icon: '🚫', variant: 'danger' }
				];

			case 'encoder':
				return [
					{ id: 'markAvailable', label: 'Mark Available', icon: '✅', variant: 'primary' },
					{ id: 'markMaintenance', label: 'Maintenance', icon: '🔧', variant: 'secondary' },
					{ id: 'export', label: 'Export CSV', icon: '📥', variant: 'secondary' },
					{ id: 'delete', label: 'Delete', icon: '🗑️', variant: 'danger' }
				];

			case 'deleted_item':
				return [
					{ id: 'restore', label: 'Restore', icon: '🔄', variant: 'primary' },
					{ id: 'permanent_delete', label: 'Delete Permanently', icon: '🗑️', variant: 'danger' }
				];

			default:
				return [
					{ id: 'export', label: 'Export', icon: '📥', variant: 'secondary' },
					{ id: 'delete', label: 'Delete', icon: '🗑️', variant: 'danger' }
				];
		}
	});
</script>

<div class="bulk-action-bar">
	<div class="selection-info">
		<span class="count">{selectedCount} selected</span>
		<button class="clear-btn" onclick={onClear}>Clear</button>
	</div>

	<div class="actions">
		{#each actions as action}
			<button
				class="action-btn"
				class:primary={action.variant === 'primary'}
				class:danger={action.variant === 'danger'}
				onclick={() => onAction(action.id)}
			>
				<span class="icon">{action.icon}</span>
				<span class="label">{action.label}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.bulk-action-bar {
		background: #ebf8ff;
		border: 1px solid #90cdf4;
		border-radius: 0.5rem;
		padding: 1rem 1.5rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.selection-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.count {
		font-size: 0.875rem;
		font-weight: 600;
		color: #2c5282;
	}

	.clear-btn {
		background: none;
		border: none;
		color: #3182ce;
		font-size: 0.8125rem;
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
	}

	.clear-btn:hover {
		color: #2c5282;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		background: white;
		color: #4a5568;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: #f7fafc;
		border-color: #a0aec0;
	}

	.action-btn.primary {
		background: #3182ce;
		color: white;
		border-color: #3182ce;
	}

	.action-btn.primary:hover {
		background: #2c5282;
	}

	.action-btn.danger {
		background: #e53e3e;
		color: white;
		border-color: #e53e3e;
	}

	.action-btn.danger:hover {
		background: #c53030;
	}

	.action-btn .icon {
		font-size: 1rem;
	}

	.action-btn .label {
		white-space: nowrap;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.bulk-action-bar {
			flex-direction: column;
			align-items: flex-start;
		}

		.actions {
			width: 100%;
		}

		.action-btn {
			flex: 1;
			justify-content: center;
		}
	}
</style>
