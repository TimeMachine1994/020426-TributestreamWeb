<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { MessageCircle, X } from 'lucide-svelte';
	import GuestNamePrompt from './GuestNamePrompt.svelte';
	import ChatMessageList from './ChatMessageList.svelte';
	import ChatInput from './ChatInput.svelte';
	import type { StreamChatMessage } from '$lib/types/chat';

	interface Props {
		streamId: string;
		isEnabled?: boolean;
		isExpanded?: boolean;
	}

	let { streamId, isEnabled = true, isExpanded = $bindable(false) }: Props = $props();

	let messages = $state<StreamChatMessage[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let guestName = $state<string | null>(null);
	let showNamePrompt = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Check for existing guest name in session storage
	onMount(() => {
		const storedName = sessionStorage.getItem('guestChatName');
		if (storedName) {
			guestName = storedName;
		}
		
		if (isEnabled) {
			loadMessages();
			// Poll for new messages every 3 seconds
			pollInterval = setInterval(loadMessages, 3000);
		}
	});

	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});

	async function loadMessages() {
		try {
			const response = await fetch(`/api/streams/${streamId}/chat/messages?limit=100`);
			
			if (!response.ok) {
				throw new Error('Failed to load messages');
			}
			
			const data = await response.json();
			
			if (data.success) {
				// Reverse to get chronological order (oldest first)
				messages = (data.messages || []).reverse();
			}
		} catch (err) {
			console.error('[StreamChat] Error loading messages:', err);
			error = 'Failed to load chat messages';
		} finally {
			isLoading = false;
		}
	}

	async function sendMessage(messageText: string) {
		if (!guestName) {
			showNamePrompt = true;
			return;
		}

		try {
			const response = await fetch(`/api/streams/${streamId}/chat/messages`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: messageText,
					userName: guestName
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to send message');
			}

			// Immediately reload messages to show the new one
			await loadMessages();
		} catch (err) {
			console.error('[StreamChat] Error sending message:', err);
			error = err instanceof Error ? err.message : 'Failed to send message';
		}
	}

	function handleNameSubmit(name: string) {
		guestName = name;
		showNamePrompt = false;
	}

	function handleJoinChat() {
		if (!guestName) {
			showNamePrompt = true;
		}
	}
</script>

{#if !isEnabled}
	<div class="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
		<MessageCircle class="w-8 h-8 mx-auto mb-2 opacity-50" />
		<p>Chat is disabled for this stream</p>
	</div>
{:else}
	<div class="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
		<!-- Header -->
		<div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
			<div class="flex items-center gap-2">
				<MessageCircle class="w-5 h-5 text-blue-600" />
				<h3 class="font-semibold text-gray-900">Live Chat</h3>
				<span class="text-xs text-gray-500">({messages.length} messages)</span>
			</div>
			{#if guestName}
				<span class="text-sm text-gray-600">
					Chatting as <strong>{guestName}</strong>
				</span>
			{/if}
		</div>

		<!-- Messages -->
		<div class="flex-1 relative min-h-0">
			<ChatMessageList 
				{messages} 
				currentUserName={guestName || undefined}
				{isLoading}
			/>
		</div>

		<!-- Input or Join prompt -->
		{#if guestName}
			<ChatInput onSend={sendMessage} />
		{:else}
			<div class="border-t border-gray-200 p-4 bg-gray-50">
				<button
					onclick={handleJoinChat}
					class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
				>
					Join Chat to Send Messages
				</button>
			</div>
		{/if}

		<!-- Error display -->
		{#if error}
			<div class="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-sm">
				{error}
				<button onclick={() => error = null} class="ml-2 underline">Dismiss</button>
			</div>
		{/if}
	</div>
{/if}

<!-- Guest name prompt modal -->
{#if showNamePrompt}
	<GuestNamePrompt 
		onSubmit={handleNameSubmit}
		onClose={() => showNamePrompt = false}
	/>
{/if}
