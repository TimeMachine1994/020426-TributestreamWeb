<script lang="ts">
	import { onMount } from 'svelte';
	import { Shield } from 'lucide-svelte';
	import type { StreamChatMessage } from '$lib/types/chat';

	interface Props {
		messages: StreamChatMessage[];
		currentUserName?: string;
		isLoading?: boolean;
	}

	let { messages, currentUserName, isLoading = false }: Props = $props();

	let messagesContainer: HTMLDivElement;
	let shouldAutoScroll = $state(true);

	function scrollToBottom() {
		if (messagesContainer && shouldAutoScroll) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	function handleScroll() {
		if (!messagesContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
		// Auto-scroll if user is near the bottom (within 100px)
		shouldAutoScroll = scrollHeight - scrollTop - clientHeight < 100;
	}

	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	$effect(() => {
		// Scroll to bottom when new messages arrive
		if (messages.length > 0) {
			scrollToBottom();
		}
	});

	onMount(() => {
		scrollToBottom();
	});
</script>

<div 
	bind:this={messagesContainer}
	onscroll={handleScroll}
	class="flex-1 overflow-y-auto p-4 space-y-3"
>
	{#if isLoading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
			<span class="ml-2 text-gray-500">Loading messages...</span>
		</div>
	{:else if messages.length === 0}
		<div class="text-center py-8 text-gray-500">
			<p>No messages yet. Be the first to say something!</p>
		</div>
	{:else}
		{#each messages as message (message.id)}
			<div 
				class="flex flex-col {message.userName === currentUserName ? 'items-end' : 'items-start'}"
			>
				<div 
					class="max-w-[80%] rounded-lg px-3 py-2 {message.userName === currentUserName 
						? 'bg-blue-600 text-white' 
						: 'bg-gray-100 text-gray-900'}"
				>
					<div class="flex items-center gap-2 mb-1">
						<span class="font-medium text-sm {message.userName === currentUserName ? 'text-blue-100' : 'text-gray-600'}">
							{message.userName}
						</span>
						{#if message.userRole === 'admin'}
							<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
								<Shield class="w-3 h-3" />
								Admin
							</span>
						{/if}
						<span class="text-xs {message.userName === currentUserName ? 'text-blue-200' : 'text-gray-400'}">
							{formatTime(message.timestamp)}
						</span>
					</div>
					<p class="text-sm break-words">{message.message}</p>
				</div>
			</div>
		{/each}
	{/if}
</div>

{#if !shouldAutoScroll && messages.length > 0}
	<button
		onclick={scrollToBottom}
		class="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm shadow-lg hover:bg-blue-700 transition-colors"
	>
		↓ New messages
	</button>
{/if}
