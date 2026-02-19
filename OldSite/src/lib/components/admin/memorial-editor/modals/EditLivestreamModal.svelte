<script lang="ts">
	import type { MemorialBlock, LivestreamConfig } from '$lib/types/memorial-blocks';

	interface Props {
		block: MemorialBlock;
		stream?: any;
		onClose: () => void;
		onSave: (updates: Partial<LivestreamConfig>) => void;
	}

	let { block, stream, onClose, onSave }: Props = $props();

	const config = block.config as LivestreamConfig;

	// Note: Livestream block config only contains streamId reference
	// The actual stream data is edited separately via StreamCard
	// This modal mainly provides information and link to stream management

	function formatDateTime(isoString: string | null) {
		if (!isoString) return 'Not scheduled';
		return new Date(isoString).toLocaleString();
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'live':
				return '🔴 Currently Live';
			case 'completed':
				return '✅ Completed';
			case 'scheduled':
			default:
				return '📅 Scheduled';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-overlay" onclick={onClose}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h3>Livestream Block</h3>
			<button class="close-btn" onclick={onClose}>✕</button>
		</div>

		<div class="modal-body">
			{#if stream}
				<div class="stream-details">
					<div class="detail-row">
						<span class="detail-label">Title</span>
						<span class="detail-value">{stream.title}</span>
					</div>

					<div class="detail-row">
						<span class="detail-label">Status</span>
						<span class="detail-value status">{getStatusLabel(stream.status)}</span>
					</div>

					<div class="detail-row">
						<span class="detail-label">Scheduled</span>
						<span class="detail-value">{formatDateTime(stream.scheduledStartTime)}</span>
					</div>

					{#if stream.description}
						<div class="detail-row">
							<span class="detail-label">Description</span>
							<span class="detail-value">{stream.description}</span>
						</div>
					{/if}
				</div>

				<div class="info-box">
					<p>💡 Stream credentials (RTMP URL, Stream Key) and controls are displayed directly in the livestream block below. Use the StreamCard controls to manage credentials, chat, visibility, and embeds.</p>
				</div>
			{:else}
				<div class="error-box">
					<p>⚠️ Stream not found</p>
					<p class="stream-id">Stream ID: {config.streamId}</p>
					<p>This stream may have been deleted. Consider removing this block.</p>
				</div>
			{/if}
		</div>

		<div class="modal-footer">
			<button class="cancel-btn" onclick={onClose}>Close</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #2d3748;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		color: #718096;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
	}

	.close-btn:hover {
		color: #2d3748;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.stream-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.detail-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #718096;
	}

	.detail-value {
		font-size: 0.9375rem;
		color: #2d3748;
	}

	.detail-value.status {
		font-weight: 600;
	}

	.info-box {
		background: #ebf8ff;
		border: 1px solid #bee3f8;
		border-radius: 0.375rem;
		padding: 1rem;
	}

	.info-box p {
		margin: 0;
		font-size: 0.875rem;
		color: #2c5282;
	}

	.error-box {
		background: #fed7d7;
		border: 1px solid #fc8181;
		border-radius: 0.375rem;
		padding: 1rem;
	}

	.error-box p {
		margin: 0.5rem 0;
		font-size: 0.875rem;
		color: #742a2a;
	}

	.error-box p:first-child {
		margin-top: 0;
		font-weight: 600;
	}

	.stream-id {
		font-family: monospace;
		font-size: 0.75rem;
		color: #a0aec0;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.cancel-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
	}

	.cancel-btn:hover {
		background: #f7fafc;
	}
</style>
