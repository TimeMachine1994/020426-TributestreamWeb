<script lang="ts">
	import { MessageCircle, ChevronDown } from 'lucide-svelte';
	
	interface Props {
		isOpen: boolean;
		unreadCount: number;
		isAuthenticated: boolean;
		onclick: () => void;
	}
	
	let { isOpen, unreadCount, isAuthenticated, onclick }: Props = $props();
	
	const buttonText = $derived(() => {
		if (!isAuthenticated) return 'Sign in to Chat';
		if (isOpen) return 'Hide Chat';
		if (unreadCount > 0) return `Chat (${unreadCount})`;
		return 'Chat';
	});
</script>

<button
	type="button"
	onclick={onclick}
	class="w-full max-w-2xl mx-auto flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#D5BA7F] text-gray-800 font-medium rounded-lg hover:bg-[#D5BA7F]/10 transition-all duration-200 shadow-sm relative {isOpen ? 'bg-[#D5BA7F]/5' : 'bg-white'}"
>
	<MessageCircle class="w-5 h-5 text-[#D5BA7F]" />
	<span>{buttonText()}</span>
	
	{#if isOpen}
		<ChevronDown class="w-5 h-5 text-[#D5BA7F]" />
	{/if}
	
	{#if unreadCount > 0 && !isOpen}
		<span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
			{unreadCount}
		</span>
	{/if}
</button>

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
</style>
