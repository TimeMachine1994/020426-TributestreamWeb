<script lang="ts">
	import { Send } from 'lucide-svelte';

	interface Props {
		onSend: (message: string) => void;
		disabled?: boolean;
		placeholder?: string;
	}

	let { onSend, disabled = false, placeholder = 'Type a message...' }: Props = $props();

	let message = $state('');
	let isSending = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		const trimmedMessage = message.trim();
		if (!trimmedMessage || isSending || disabled) return;
		
		isSending = true;
		try {
			await onSend(trimmedMessage);
			message = '';
		} finally {
			isSending = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	}

	const charCount = $derived(message.length);
	const isOverLimit = $derived(charCount > 500);
</script>

<form onsubmit={handleSubmit} class="border-t border-gray-200 p-3 bg-white">
	<div class="flex items-end gap-2">
		<div class="flex-1 relative">
			<textarea
				bind:value={message}
				onkeydown={handleKeyDown}
				{placeholder}
				disabled={disabled || isSending}
				rows="1"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
				class:border-red-500={isOverLimit}
				maxlength="500"
			></textarea>
			<div class="absolute bottom-1 right-2 text-xs {isOverLimit ? 'text-red-500' : 'text-gray-400'}">
				{charCount}/500
			</div>
		</div>
		<button
			type="submit"
			disabled={disabled || isSending || !message.trim() || isOverLimit}
			class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
			aria-label="Send message"
		>
			{#if isSending}
				<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
			{:else}
				<Send class="w-5 h-5" />
			{/if}
		</button>
	</div>
</form>
