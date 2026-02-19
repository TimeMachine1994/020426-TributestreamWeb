<script lang="ts">
	import { onMount } from 'svelte';
	import { MessageCircle, Trash2, Shield, RefreshCw, ToggleLeft, ToggleRight, Lock, Unlock } from 'lucide-svelte';
	import type { StreamChatMessage } from '$lib/types/chat';

	interface Props {
		streamId: string;
		chatEnabled?: boolean;
		chatLocked?: boolean;
		onToggleChat?: (enabled: boolean) => void;
	}

	let { streamId, chatEnabled = true, chatLocked = false, onToggleChat }: Props = $props();

	let isLocked = $state(chatLocked);
	let isTogglingLock = $state(false);

	let messages = $state<StreamChatMessage[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let adminMessage = $state('');
	let isSending = $state(false);
	let deletingId = $state<string | null>(null);

	onMount(() => {
		loadMessages();
	});

	async function loadMessages() {
		isLoading = true;
		error = null;
		
		try {
			const response = await fetch(`/api/streams/${streamId}/chat/messages?limit=100&includeDeleted=true`);
			
			if (!response.ok) {
				throw new Error('Failed to load messages');
			}
			
			const data = await response.json();
			
			if (data.success) {
				messages = (data.messages || []).reverse();
			}
		} catch (err) {
			console.error('[AdminChatPanel] Error loading messages:', err);
			error = 'Failed to load chat messages';
		} finally {
			isLoading = false;
		}
	}

	async function deleteMessage(messageId: string) {
		if (!confirm('Are you sure you want to delete this message?')) return;
		
		deletingId = messageId;
		
		try {
			const response = await fetch(`/api/streams/${streamId}/chat/messages/${messageId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete message');
			}

			// Update local state
			messages = messages.map(m => 
				m.id === messageId ? { ...m, deleted: true } : m
			);
		} catch (err) {
			console.error('[AdminChatPanel] Error deleting message:', err);
			error = 'Failed to delete message';
		} finally {
			deletingId = null;
		}
	}

	async function sendAdminMessage() {
		if (!adminMessage.trim() || isSending) return;
		
		isSending = true;
		
		try {
			const response = await fetch(`/api/streams/${streamId}/chat/messages`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: adminMessage.trim(),
					userName: 'Admin'
				})
			});

			if (!response.ok) {
				throw new Error('Failed to send message');
			}

			adminMessage = '';
			await loadMessages();
		} catch (err) {
			console.error('[AdminChatPanel] Error sending message:', err);
			error = 'Failed to send message';
		} finally {
			isSending = false;
		}
	}

	function formatTime(timestamp: string): string {
		return new Date(timestamp).toLocaleString();
	}

	async function toggleChatLock() {
		isTogglingLock = true;
		
		try {
			const response = await fetch(`/api/streams/${streamId}/chat/lock`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ locked: !isLocked })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to toggle chat lock');
			}

			isLocked = !isLocked;
		} catch (err: any) {
			console.error('[AdminChatPanel] Error toggling lock:', err);
			error = err.message || 'Failed to toggle chat lock';
		} finally {
			isTogglingLock = false;
		}
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
		<div class="flex items-center gap-2">
			<MessageCircle class="w-5 h-5 text-blue-600" />
			<h3 class="font-semibold text-gray-900">Chat Moderation</h3>
			<span class="text-xs text-gray-500">({messages.length} messages)</span>
		</div>
		<div class="flex items-center gap-2">
			<button
				onclick={loadMessages}
				class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
				title="Refresh messages"
			>
				<RefreshCw class="w-4 h-4" />
			</button>
			<!-- Lock/Unlock Chat Button -->
			<button
				onclick={toggleChatLock}
				disabled={isTogglingLock}
				class="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors
					{isLocked ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
					disabled:opacity-50 disabled:cursor-not-allowed"
				title={isLocked ? 'Unlock chat to allow new messages' : 'Lock chat to prevent new messages'}
			>
				{#if isTogglingLock}
					<div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
				{:else if isLocked}
					<Lock class="w-4 h-4" />
					Locked
				{:else}
					<Unlock class="w-4 h-4" />
					Unlocked
				{/if}
			</button>
			{#if onToggleChat}
				<button
					onclick={() => onToggleChat?.(!chatEnabled)}
					class="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors
						{chatEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}"
				>
					{#if chatEnabled}
						<ToggleRight class="w-4 h-4" />
						Chat On
					{:else}
						<ToggleLeft class="w-4 h-4" />
						Chat Off
					{/if}
				</button>
			{/if}
		</div>
	</div>

	<!-- Admin send message -->
	<div class="p-3 border-b border-gray-200 bg-purple-50">
		<div class="flex items-center gap-2 mb-2">
			<Shield class="w-4 h-4 text-purple-600" />
			<span class="text-sm font-medium text-purple-700">Send as Admin</span>
		</div>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={adminMessage}
				placeholder="Type an admin message..."
				class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
				maxlength="500"
				onkeydown={(e) => e.key === 'Enter' && sendAdminMessage()}
			/>
			<button
				onclick={sendAdminMessage}
				disabled={!adminMessage.trim() || isSending}
				class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
			>
				{isSending ? 'Sending...' : 'Send'}
			</button>
		</div>
	</div>

	<!-- Messages list -->
	<div class="max-h-96 overflow-y-auto">
		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
			</div>
		{:else if error}
			<div class="p-4 text-center text-red-600">
				{error}
				<button onclick={loadMessages} class="ml-2 underline">Retry</button>
			</div>
		{:else if messages.length === 0}
			<div class="p-8 text-center text-gray-500">
				No chat messages yet
			</div>
		{:else}
			<div class="divide-y divide-gray-100">
				{#each messages as message (message.id)}
					<div class="p-3 hover:bg-gray-50 {message.deleted ? 'opacity-50 bg-red-50' : ''}">
						<div class="flex items-start justify-between gap-2">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<span class="font-medium text-sm text-gray-900">{message.userName}</span>
									{#if message.userRole === 'admin'}
										<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
											<Shield class="w-3 h-3" />
											Admin
										</span>
									{/if}
									{#if message.isAnonymous}
										<span class="text-xs text-gray-400">(Guest)</span>
									{/if}
									{#if message.deleted}
										<span class="text-xs text-red-500">(Deleted)</span>
									{/if}
								</div>
								<p class="text-sm text-gray-700 break-words {message.deleted ? 'line-through' : ''}">
									{message.message}
								</p>
								<p class="text-xs text-gray-400 mt-1">{formatTime(message.timestamp)}</p>
							</div>
							{#if !message.deleted}
								<button
									onclick={() => deleteMessage(message.id)}
									disabled={deletingId === message.id}
									class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
									title="Delete message"
								>
									{#if deletingId === message.id}
										<div class="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
									{:else}
										<Trash2 class="w-4 h-4" />
									{/if}
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
