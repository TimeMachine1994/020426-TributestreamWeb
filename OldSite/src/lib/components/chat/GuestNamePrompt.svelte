<script lang="ts">
	import { X } from 'lucide-svelte';

	interface Props {
		onSubmit: (name: string) => void;
		onClose?: () => void;
	}

	let { onSubmit, onClose }: Props = $props();

	let guestName = $state('');
	let error = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();
		
		const trimmedName = guestName.trim();
		
		if (trimmedName.length < 2) {
			error = 'Name must be at least 2 characters';
			return;
		}
		
		if (trimmedName.length > 30) {
			error = 'Name must be 30 characters or less';
			return;
		}
		
		// Store in sessionStorage for persistence during session
		sessionStorage.setItem('guestChatName', trimmedName);
		onSubmit(trimmedName);
	}
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold text-gray-900">Join the Chat</h2>
			{#if onClose}
				<button
					onclick={onClose}
					class="text-gray-400 hover:text-gray-600 transition-colors"
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</button>
			{/if}
		</div>
		
		<p class="text-gray-600 mb-4">
			Enter your name to participate in the live chat.
		</p>
		
		<form onsubmit={handleSubmit}>
			<div class="mb-4">
				<label for="guestName" class="block text-sm font-medium text-gray-700 mb-1">
					Your Name
				</label>
				<input
					type="text"
					id="guestName"
					bind:value={guestName}
					placeholder="Enter your name"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
					maxlength="30"
					autofocus
				/>
				{#if error}
					<p class="text-red-500 text-sm mt-1">{error}</p>
				{/if}
			</div>
			
			<button
				type="submit"
				class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
			>
				Join Chat
			</button>
		</form>
		
		<p class="text-xs text-gray-500 mt-4 text-center">
			Your name will be visible to other viewers and moderators.
		</p>
	</div>
</div>
