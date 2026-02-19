<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { X, Send, Loader2 } from 'lucide-svelte';
	import ChatMessage from './ChatMessage.svelte';
	import type { SerializedChatMessage } from '$lib/types/chat';
	
	interface Props {
		memorialId: string;
		memorialName: string;
		currentUserId?: string;
		isMemorialOwner: boolean;
		isOpen: boolean;
		onClose: () => void;
	}
	
	let { memorialId, memorialName, currentUserId, isMemorialOwner, isOpen, onClose }: Props = $props();
	
	// State
	let messages = $state<SerializedChatMessage[]>([]);
	let messageInput = $state('');
	let isLoading = $state(false);
	let isSending = $state(false);
	let error = $state('');
	let messagesContainer = $state<HTMLDivElement | undefined>(undefined);
	let pollInterval: ReturnType<typeof setInterval>;
	
	// Auto-scroll to bottom
	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}
	
	// Load messages
	async function loadMessages() {
		isLoading = true;
		error = '';
		
		try {
			const response = await fetch(`/api/memorials/${memorialId}/chat?limit=50`);
			
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error('[ChatPanel] API error:', { status: response.status, errorData });
				throw new Error(errorData.message || `Server error: ${response.status}`);
			}
			
			const data = await response.json();
			messages = data.messages || [];
			
			// Scroll to bottom after messages load
			setTimeout(scrollToBottom, 100);
		} catch (err: any) {
			console.error('[ChatPanel] Error loading messages:', err);
			error = err.message || 'Failed to load chat messages. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	// Send message
	async function sendMessage() {
		if (!messageInput.trim() || isSending) return;
		
		const trimmedMessage = messageInput.trim();
		
		if (trimmedMessage.length > 500) {
			error = 'Message cannot exceed 500 characters';
			return;
		}
		
		isSending = true;
		error = '';
		
		try {
			const response = await fetch(`/api/memorials/${memorialId}/chat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: trimmedMessage })
			});
			
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Failed to send message' }));
				throw new Error(errorData.message || 'Failed to send message');
			}
			
			const newMessage = await response.json();
			
			// Add message to list
			messages = [...messages, newMessage];
			
			// Clear input
			messageInput = '';
			
			// Scroll to bottom
			setTimeout(scrollToBottom, 100);
		} catch (err: any) {
			console.error('[ChatPanel] Error sending message:', err);
			error = err.message || 'Failed to send message';
		} finally {
			isSending = false;
		}
	}
	
	// Edit message (placeholder - would show edit modal)
	async function handleEdit(messageId: string) {
		// TODO: Implement edit modal
		console.log('Edit message:', messageId);
	}
	
	// Delete message
	async function handleDelete(messageId: string) {
		if (!confirm('Are you sure you want to delete this message?')) return;
		
		try {
			const response = await fetch(`/api/memorials/${memorialId}/chat/${messageId}`, {
				method: 'DELETE'
			});
			
			if (!response.ok) {
				throw new Error('Failed to delete message');
			}
			
			// Remove message from list
			messages = messages.filter(m => m.id !== messageId);
		} catch (err: any) {
			console.error('[ChatPanel] Error deleting message:', err);
			error = 'Failed to delete message';
		}
	}
	
	// Handle Enter key in textarea
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
	
	// Handle ESC key to close panel
	function handleEscKey(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			onClose();
		}
	}
	
	// Poll for new messages every 10 seconds
	function startPolling() {
		pollInterval = setInterval(loadMessages, 10000);
	}
	
	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	}
	
	// Lifecycle
	onMount(() => {
		if (isOpen) {
			loadMessages();
			startPolling();
		}
		
		// Add keyboard listener for ESC
		window.addEventListener('keydown', handleEscKey);
		
		return () => {
			window.removeEventListener('keydown', handleEscKey);
		};
	});
	
	// Watch for panel open/close
	$effect(() => {
		if (isOpen) {
			loadMessages();
			startPolling();
		} else {
			stopPolling();
		}
	});
	
	onDestroy(() => {
		stopPolling();
	});
</script>

{#if isOpen}
	<div 
		class="w-full max-w-2xl mx-auto bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out"
		style="animation: slideDown 0.3s ease-out;"
	>
		<!-- Header -->
		<div class="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
			<div class="flex items-center gap-2">
				<h3 class="font-semibold text-gray-900">Memorial Chat</h3>
				<span class="text-sm text-gray-500">·</span>
				<span class="text-sm text-gray-600">{memorialName}</span>
			</div>
			<button
				type="button"
				onclick={onClose}
				class="p-1 hover:bg-gray-100 rounded-full transition-colors"
				aria-label="Close chat"
			>
				<X class="w-5 h-5 text-gray-600" />
			</button>
		</div>
		
		<!-- Messages container -->
		<div 
			bind:this={messagesContainer}
			class="h-96 overflow-y-auto bg-gray-50"
		>
			{#if isLoading}
				<div class="flex items-center justify-center h-full">
					<Loader2 class="w-6 h-6 text-[#D5BA7F] animate-spin" />
				</div>
			{:else if messages.length === 0}
				<div class="flex flex-col items-center justify-center h-full text-center px-4">
					<p class="text-gray-500 mb-2">No messages yet</p>
					<p class="text-sm text-gray-400">Be the first to share your thoughts</p>
				</div>
			{:else}
				<div class="flex flex-col">
					{#each messages as message (message.id)}
						<ChatMessage
							{message}
							{currentUserId}
							{isMemorialOwner}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					{/each}
				</div>
			{/if}
		</div>
		
		<!-- Input area -->
		<div class="px-4 py-3 bg-white border-t border-gray-200">
			{#if error}
				<div class="mb-2 text-sm text-red-600">
					{error}
				</div>
			{/if}
			
			{#if currentUserId}
				<div class="flex gap-2">
					<textarea
						bind:value={messageInput}
						onkeydown={handleKeyDown}
						placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
						class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D5BA7F] focus:border-transparent resize-none"
						rows="2"
						maxlength="500"
						disabled={isSending}
					></textarea>
					<button
						type="button"
						onclick={sendMessage}
						disabled={!messageInput.trim() || isSending}
						class="px-4 py-2 bg-[#D5BA7F] text-white rounded-lg hover:bg-[#C5AA6F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
						aria-label="Send message"
					>
						{#if isSending}
							<Loader2 class="w-5 h-5 animate-spin" />
						{:else}
							<Send class="w-5 h-5" />
						{/if}
					</button>
				</div>
				<div class="mt-1 text-xs text-gray-500 text-right">
					{messageInput.length}/500
				</div>
			{:else}
				<div class="text-center py-4">
					<p class="text-sm text-gray-600 mb-2">Sign in to participate in the conversation</p>
					<a
						href="/login"
						class="inline-block px-4 py-2 bg-[#D5BA7F] text-white rounded-lg hover:bg-[#C5AA6F] transition-colors"
					>
						Sign In
					</a>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
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
	
	textarea {
		font-family: inherit;
	}
	
	/* Custom scrollbar for messages */
	div::-webkit-scrollbar {
		width: 8px;
	}
	
	div::-webkit-scrollbar-track {
		background: #f1f1f1;
	}
	
	div::-webkit-scrollbar-thumb {
		background: #D5BA7F;
		border-radius: 4px;
	}
	
	div::-webkit-scrollbar-thumb:hover {
		background: #C5AA6F;
	}
</style>
