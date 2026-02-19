<script lang="ts">
	/**
	 * Chat Moderation Panel Component
	 * 
	 * Created: January 22, 2026
	 * Admin interface for moderating stream chat messages
	 * 
	 * Features:
	 * - Real-time message feed with auto-refresh
	 * - Delete individual messages
	 * - View deleted messages
	 * - Message search and filtering
	 * - Participant statistics
	 */

	import { onMount } from 'svelte';
	import type { StreamChatMessage } from '$lib/types/chat';

	// Props interface
	interface Props {
		streamId: string;
	}

	let { streamId }: Props = $props();

	// Component state
	let messages = $state<StreamChatMessage[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let showDeleted = $state(false);
	let searchQuery = $state('');
	let refreshTimer: NodeJS.Timeout;

	console.log('🛡️ [MODERATION PANEL] Component initialized');
	console.log('🛡️ [MODERATION PANEL] Stream ID:', streamId);

	/**
	 * Load messages from API
	 */
	async function loadMessages() {
		console.log('🛡️ [MODERATION PANEL] Loading messages...');
		console.log('🛡️ [MODERATION PANEL] Include deleted:', showDeleted);
		
		loading = true;
		error = null;

		try {
			const url = `/api/streams/${streamId}/chat/messages?limit=100&includeDeleted=${showDeleted}`;
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error('Failed to load messages');
			}

			const data = await response.json();
			
			console.log('✅ [MODERATION PANEL] Messages loaded:', data.messages.length);
			messages = data.messages;

		} catch (err) {
			console.error('❌ [MODERATION PANEL] Error loading messages:', err);
			error = err instanceof Error ? err.message : 'Failed to load messages';
		} finally {
			loading = false;
		}
	}

	/**
	 * Delete a message
	 */
	async function deleteMessage(messageId: string) {
		console.log('🛡️ [MODERATION PANEL] Deleting message:', messageId);

		if (!confirm('Are you sure you want to delete this message?')) {
			console.log('🛡️ [MODERATION PANEL] Deletion cancelled by user');
			return;
		}

		try {
			const response = await fetch(
				`/api/streams/${streamId}/chat/messages/${messageId}`,
				{ method: 'DELETE' }
			);

			if (!response.ok) {
				throw new Error('Failed to delete message');
			}

			console.log('✅ [MODERATION PANEL] Message deleted successfully');

			// Reload messages
			await loadMessages();

		} catch (err) {
			console.error('❌ [MODERATION PANEL] Error deleting message:', err);
			alert(err instanceof Error ? err.message : 'Failed to delete message');
		}
	}

	/**
	 * Filter messages based on search query
	 */
	const filteredMessages = $derived(() => {
		if (!searchQuery.trim()) {
			return messages;
		}

		const query = searchQuery.toLowerCase();
		return messages.filter(msg => 
			msg.userName.toLowerCase().includes(query) ||
			msg.message.toLowerCase().includes(query)
		);
	});

	/**
	 * Calculate statistics
	 */
	const stats = $derived(() => {
		const total = messages.length;
		const deleted = messages.filter(m => m.deleted).length;
		const active = total - deleted;
		const uniqueUsers = new Set(messages.map(m => m.userName)).size;

		return { total, deleted, active, uniqueUsers };
	});

	/**
	 * Format timestamp
	 */
	function formatTimestamp(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	// Lifecycle: mount and setup polling
	onMount(() => {
		console.log('🛡️ [MODERATION PANEL] Component mounted');

		// Initial load
		loadMessages();

		// Poll for new messages every 3 seconds
		console.log('🛡️ [MODERATION PANEL] Starting auto-refresh (3s interval)');
		refreshTimer = setInterval(loadMessages, 3000);

		// Cleanup
		return () => {
			if (refreshTimer) {
				console.log('🛡️ [MODERATION PANEL] Clearing refresh timer');
				clearInterval(refreshTimer);
			}
		};
	});

	// Watch for showDeleted changes and reload
	$effect(() => {
		if (showDeleted !== undefined) {
			loadMessages();
		}
	});
</script>

<div class="moderation-panel">
	<!-- Panel Header -->
	<div class="panel-header">
		<div class="header-content">
			<h2>🛡️ Chat Moderation</h2>
			<button onclick={loadMessages} class="refresh-button" disabled={loading}>
				{#if loading}
					⏳ Loading...
				{:else}
					🔄 Refresh
				{/if}
			</button>
		</div>

		<!-- Statistics -->
		<div class="stats-row">
			<div class="stat">
				<span class="stat-value">{stats().total}</span>
				<span class="stat-label">Total Messages</span>
			</div>
			<div class="stat">
				<span class="stat-value">{stats().active}</span>
				<span class="stat-label">Active</span>
			</div>
			<div class="stat">
				<span class="stat-value">{stats().deleted}</span>
				<span class="stat-label">Deleted</span>
			</div>
			<div class="stat">
				<span class="stat-value">{stats().uniqueUsers}</span>
				<span class="stat-label">Participants</span>
			</div>
		</div>
	</div>

	<!-- Controls -->
	<div class="controls-row">
		<div class="search-box">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="🔍 Search messages or users..."
				class="search-input"
			/>
		</div>
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={showDeleted} />
			Show deleted messages
		</label>
	</div>

	<!-- Messages List -->
	<div class="messages-list">
		{#if error}
			<div class="error-state">
				<p>⚠️ {error}</p>
			</div>
		{:else if loading && messages.length === 0}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>Loading messages...</p>
			</div>
		{:else if filteredMessages().length === 0}
			<div class="empty-state">
				<p>No messages found</p>
				{#if searchQuery}
					<p class="help-text">Try a different search term</p>
				{/if}
			</div>
		{:else}
			{#each filteredMessages() as message (message.id)}
				<div class="message-item" class:deleted={message.deleted}>
					<!-- Message Header -->
					<div class="message-header">
						<div class="user-info">
							<strong class="user-name">
								{#if message.isAnonymous}
									👤 {message.userName}
								{:else}
									✓ {message.userName}
								{/if}
							</strong>
							<span class="user-id">
								{#if message.userId}
									ID: {message.userId.substring(0, 8)}...
								{:else}
									Anonymous
								{/if}
							</span>
						</div>
						<span class="timestamp">{formatTimestamp(message.timestamp)}</span>
					</div>

					<!-- Message Content -->
					<p class="message-text">
						{#if message.deleted}
							<em class="deleted-text">Message deleted by moderator</em>
						{:else}
							{message.message}
						{/if}
					</p>

					<!-- Message Footer -->
					<div class="message-footer">
						{#if message.deleted}
							<div class="deleted-info">
								Deleted by: {message.deletedBy || 'Unknown'}
								{#if message.deletedAt}
									at {formatTimestamp(message.deletedAt)}
								{/if}
							</div>
						{:else}
							<button onclick={() => deleteMessage(message.id)} class="delete-btn">
								🗑️ Delete Message
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.moderation-panel {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* Header */
	.panel-header {
		padding: 1.5rem;
		border-bottom: 2px solid #e5e7eb;
		background: #f9fafb;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.panel-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
	}

	.refresh-button {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.refresh-button:hover:not(:disabled) {
		background: #2563eb;
	}

	.refresh-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	/* Statistics */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}

	.stat {
		text-align: center;
		padding: 1rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: #3b82f6;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Controls */
	.controls-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		background: white;
	}

	.search-box {
		flex: 1;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		ring: 2px;
		ring-color: #93c5fd;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #374151;
		white-space: nowrap;
		cursor: pointer;
	}

	/* Messages List */
	.messages-list {
		max-height: 600px;
		overflow-y: auto;
		padding: 1rem;
	}

	.loading-state,
	.empty-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: #6b7280;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.help-text {
		font-size: 0.875rem;
		color: #9ca3af;
	}

	/* Message Item */
	.message-item {
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		background: white;
		transition: all 0.2s;
	}

	.message-item:hover {
		border-color: #d1d5db;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.message-item.deleted {
		background: #fee2e2;
		border-color: #fca5a5;
	}

	.message-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
	}

	.user-id {
		font-size: 0.75rem;
		color: #9ca3af;
		font-family: monospace;
	}

	.timestamp {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.message-text {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: #374151;
		word-wrap: break-word;
	}

	.deleted-text {
		color: #991b1b;
	}

	.message-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.delete-btn {
		padding: 0.375rem 0.75rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.delete-btn:hover {
		background: #dc2626;
	}

	.deleted-info {
		font-size: 0.75rem;
		color: #991b1b;
		font-style: italic;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.stats-row {
			grid-template-columns: repeat(2, 1fr);
		}

		.controls-row {
			flex-direction: column;
			align-items: stretch;
		}

		.user-info {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
