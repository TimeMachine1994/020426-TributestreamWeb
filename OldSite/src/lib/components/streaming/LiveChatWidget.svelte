<script lang="ts">
	/**
	 * Live Chat Widget Component
	 * 
	 * Created: January 22, 2026
	 * Real-time chat interface for stream viewers
	 * 
	 * Features:
	 * - Real-time message display with polling
	 * - Anonymous and authenticated messaging
	 * - Auto-scroll to latest messages
	 * - Message validation and character limit
	 * - Clean, accessible UI
	 */

	import { onMount } from 'svelte';
	import type { StreamChatMessage } from '$lib/types/chat';

	// Props interface
	interface Props {
		streamId: string;
		enabled?: boolean;  // Show/hide chat entirely
		locked?: boolean;   // Prevent new messages (read-only mode)
	}

	let { streamId, enabled = true, locked = false }: Props = $props();

	// Component state
	let messages = $state<StreamChatMessage[]>([]);
	let newMessage = $state('');
	let userName = $state('');
	let sending = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let messagesContainer: HTMLDivElement;
	let pollInterval: NodeJS.Timeout;

	// Debug logging for chat state
	console.log('💬 [CHAT] Init:', { streamId, enabled, locked });

	/**
	 * Load chat messages from API
	 */
	async function loadMessages() {
		console.log('💬 [CHAT WIDGET] Loading messages...');
		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/streams/${streamId}/chat/messages?limit=50`);
			
			if (!response.ok) {
				throw new Error('Failed to load messages');
			}

			const data = await response.json();
			
			console.log('✅ [CHAT WIDGET] Messages loaded:', data.messages.length);
			messages = data.messages;

			// Auto-scroll to bottom after messages load
			setTimeout(scrollToBottom, 100);

		} catch (err) {
			console.error('❌ [CHAT WIDGET] Error loading messages:', err);
			error = 'Failed to load chat messages';
		} finally {
			loading = false;
		}
	}

	/**
	 * Send a new chat message
	 */
	async function sendMessage() {
		console.log('💬 [CHAT WIDGET] Sending message...');
		console.log('💬 [CHAT WIDGET] Message length:', newMessage.trim().length);
		console.log('💬 [CHAT WIDGET] User name:', userName);

		// Validate inputs
		if (!newMessage.trim()) {
			console.warn('⚠️ [CHAT WIDGET] Empty message, ignoring');
			return;
		}

		if (!userName.trim()) {
			console.warn('⚠️ [CHAT WIDGET] No user name provided');
			error = 'Please enter your name';
			return;
		}

		if (newMessage.trim().length > 500) {
			console.warn('⚠️ [CHAT WIDGET] Message too long:', newMessage.trim().length);
			error = 'Message must be 500 characters or less';
			return;
		}

		sending = true;
		error = null;

		try {
			const response = await fetch(`/api/streams/${streamId}/chat/messages`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: newMessage.trim(),
					userName: userName.trim()
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to send message');
			}

			console.log('✅ [CHAT WIDGET] Message sent successfully');

			// Clear input
			newMessage = '';

			// Reload messages to show new message
			await loadMessages();

		} catch (err) {
			console.error('❌ [CHAT WIDGET] Error sending message:', err);
			error = err instanceof Error ? err.message : 'Failed to send message';
		} finally {
			sending = false;
		}
	}

	/**
	 * Scroll messages container to bottom
	 */
	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
			console.log('📜 [CHAT WIDGET] Scrolled to bottom');
		}
	}

	/**
	 * Format timestamp for display
	 */
	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', { 
			hour: 'numeric', 
			minute: '2-digit' 
		});
	}

	/**
	 * Handle Enter key press in message input
	 */
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	// Lifecycle: mount and setup polling
	onMount(() => {
		console.log('💬 [CHAT] Mounted:', { streamId, enabled, locked });

		if (!enabled) {
			return;
		}

		// Load initial messages
		loadMessages();

		// Always poll for new messages (even if locked - users can still read)
		pollInterval = setInterval(loadMessages, 2000);

		// Cleanup on unmount
		return () => {
			if (pollInterval) {
				clearInterval(pollInterval);
			}
		};
	});

	// Watch for messages changes and scroll
	$effect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	});
</script>

<div class="chat-widget" class:disabled={!enabled}>
	<!-- Chat Header -->
	<div class="chat-header">
		<div class="header-content">
			<h3>💬 Live Chat</h3>
			{#if enabled}
				<span class="message-count">{messages.length} messages</span>
			{:else}
				<span class="disabled-label">Disabled</span>
			{/if}
		</div>
		{#if locked}
			<div class="locked-notice">
				<span>🔒 Chat Locked</span>
			</div>
		{/if}
	</div>

	{#if enabled}
		<!-- Messages Container -->
		<div class="messages-container" bind:this={messagesContainer}>
			{#if loading && messages.length === 0}
				<div class="loading-state">
					<p>Loading messages...</p>
				</div>
			{:else if messages.length === 0}
				<div class="empty-state">
					<p>No messages yet</p>
					<p class="help-text">Be the first to say something!</p>
				</div>
			{:else}
				<div class="messages-list">
					{#each messages as message (message.id)}
						<div class="message" class:deleted={message.deleted}>
							<div class="message-header">
								<strong class="user-name">
									{#if message.isAnonymous}
										{message.userName}
									{:else}
										✓ {message.userName}
									{/if}
								</strong>
								<span class="timestamp">{formatTime(message.timestamp)}</span>
							</div>
							<p class="message-text">
								{#if message.deleted}
									<em>Message deleted by moderator</em>
								{:else}
									{message.message}
								{/if}
							</p>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Chat Input Form (only if not locked) -->
		{#if !locked}
			<form class="chat-input" onsubmit={(e) => { e.preventDefault(); sendMessage(); }}>
				<div class="input-row">
					<input
						type="text"
						bind:value={userName}
						placeholder="Your name"
						required
						disabled={sending}
						class="name-input"
						maxlength="50"
					/>
				</div>
				<div class="input-row">
					<textarea
						bind:value={newMessage}
						placeholder="Type a message..."
						required
						disabled={sending}
						class="message-input"
						maxlength="500"
						rows="2"
						onkeypress={handleKeyPress}
					></textarea>
					<button type="submit" disabled={sending || !newMessage.trim() || !userName.trim()}>
						{#if sending}
							⏳
						{:else}
							📤 Send
						{/if}
					</button>
				</div>
				{#if error}
					<div class="error-message">
						⚠️ {error}
					</div>
				{/if}
				<div class="character-count" class:near-limit={newMessage.length > 450}>
					{newMessage.length}/500
				</div>
			</form>
		{/if}
	{:else}
		<!-- Chat Disabled State -->
		<div class="chat-disabled">
			<p>💬 Chat is currently disabled for this stream</p>
		</div>
	{/if}
</div>

<style>
	/* ====================== */
	/* OPTION A: Purple Theme */
	/* ====================== */
	.chat-widget {
		background: #faf9fc;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(147, 51, 234, 0.15);
		display: flex;
		flex-direction: column;
		height: 600px;
	}

	.chat-widget.disabled {
		opacity: 0.7;
	}

	/* Header */
	.chat-header {
		background: linear-gradient(135deg, #9333ea 0%, #c026d3 100%);
		padding: 1.25rem 1.5rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.chat-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: white;
	}

	.message-count {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.8);
		background: rgba(255, 255, 255, 0.2);
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
	}

	.disabled-label {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.9);
		background: rgba(239, 68, 68, 0.3);
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
	}

	.locked-notice {
		margin-top: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 0.5rem;
		text-align: center;
	}

	.locked-notice span {
		font-size: 0.875rem;
		color: white;
		font-weight: 500;
	}

	/* Messages Container */
	.messages-container {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		background: white;
		display: flex;
		flex-direction: column;
	}

	.messages-list {
		margin-top: auto;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #9ca3af;
	}

	.empty-state p {
		margin: 0.25rem 0;
	}

	.help-text {
		font-size: 0.9375rem;
		color: #7c3aed;
	}

	/* Message */
	.message {
		margin-bottom: 1.25rem;
		padding: 1rem 1.25rem;
		background: #f8f5ff;
		border-radius: 1rem;
		border-left: 3px solid #9333ea;
		transition: background-color 0.2s, transform 0.2s;
	}

	.message:last-child {
		margin-bottom: 0;
	}

	.message:hover {
		background: #f3edff;
		transform: translateX(2px);
	}

	.message.deleted {
		opacity: 0.6;
		background: #fef2f2;
		border-left-color: #ef4444;
	}

	.message-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.user-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #7c3aed;
	}

	.timestamp {
		font-size: 0.8125rem;
		color: #9ca3af;
	}

	.message-text {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.6;
		color: #374151;
		word-wrap: break-word;
	}

	/* Chat Input */
	.chat-input {
		padding: 1.25rem 1.5rem;
		background: #faf5ff;
		border-top: 1px solid #e9d5ff;
	}

	.input-row {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.input-row:last-of-type {
		margin-bottom: 0.5rem;
	}

	.name-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid #d8b4fe;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		background: white;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.message-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid #d8b4fe;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		resize: none;
		font-family: inherit;
		background: white;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.chat-input input:focus,
	.chat-input textarea:focus {
		outline: none;
		border-color: #9333ea;
		box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.15);
	}

	.chat-input button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #9333ea 0%, #c026d3 100%);
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		white-space: nowrap;
	}

	.chat-input button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);
	}

	.chat-input button:disabled {
		background: #d1d5db;
		cursor: not-allowed;
	}

	.error-message {
		padding: 0.75rem 1rem;
		background: #fef2f2;
		color: #dc2626;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
		border: 1px solid #fecaca;
	}

	.character-count {
		font-size: 0.8125rem;
		color: #9ca3af;
		text-align: right;
	}

	.character-count.near-limit {
		color: #dc2626;
		font-weight: 600;
	}

	/* Chat Disabled State */
	.chat-disabled {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		color: #7c3aed;
		background: white;
	}

	.chat-disabled p {
		margin: 0;
		font-size: 1.0625rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.chat-widget {
			height: 500px;
			border-radius: 0.75rem;
		}

		.chat-header {
			padding: 1rem 1.25rem;
		}

		.messages-container {
			padding: 1rem;
		}

		.message {
			padding: 0.875rem 1rem;
		}

		.chat-input {
			padding: 1rem;
		}

		.input-row {
			flex-direction: column;
		}

		.chat-input button {
			width: 100%;
		}
	}
</style>
