<script lang="ts">
	interface Props {
		onAdd: () => void;
	}

	let { onAdd }: Props = $props();
</script>

<div class="block-toolbar">
	<button class="add-block-btn" onclick={onAdd}>
		➕ Add Block
	</button>
</div>

<style>
	.block-toolbar {
		display: flex;
		gap: 0.5rem;
	}

	.add-block-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #3182ce;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.add-block-btn:hover {
		background: #2c5282;
	}

</style>
