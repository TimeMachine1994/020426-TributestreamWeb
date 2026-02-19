<script lang="ts">
	import type { SerializedChatMessage } from '$lib/types/chat';
	import { Pencil, Trash2 } from 'lucide-svelte';
	
	interface Props {
		message: SerializedChatMessage;
		currentUserId?: string;
		isMemorialOwner: boolean;
		onEdit?: (messageId: string) => void;
		onDelete?: (messageId: string) => void;
	}
	
	let { message, currentUserId, isMemorialOwner, onEdit, onDelete }: Props = $props();
	
	const isOwnMessage = $derived(message.userId === currentUserId);
	const canEdit = $derived(isOwnMessage && !message.isDeleted);
	const canDelete = $derived((isOwnMessage || isMemorialOwner) && !message.isDeleted);
	
	// Format timestamp
	const formattedTime = $derived(() => {
		try {
			const date = new Date(message.timestamp);
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} catch {
			return '';
		}
	});
	
	// Role badge color
	const roleBadgeClass = $derived(() => {
		switch (message.userRole) {
			case 'admin':
				return 'bg-red-100 text-red-800';
			case 'owner':
				return 'bg-purple-100 text-purple-800';
			case 'funeral_director':
				return 'bg-blue-100 text-blue-800';
			case 'viewer':
			default:
				return 'bg-gray-100 text-gray-700';
		}
	});
	
	// Role display name
	const roleDisplay = $derived(() => {
		switch (message.userRole) {
			case 'admin':
				return 'Admin';
			case 'owner':
				return 'Family';
			case 'funeral_director':
				return 'Director';
			case 'viewer':
			default:
				return 'Viewer';
		}
	});
</script>

<div class="flex flex-col gap-1 px-4 py-2 hover:bg-gray-50 transition-colors group">
	<!-- Message header -->
	<div class="flex items-center gap-2 text-sm">
		<span class="font-semibold text-gray-900">{message.userName}</span>
		<span class="px-2 py-0.5 text-xs font-medium rounded {roleBadgeClass()}">
			{roleDisplay()}
		</span>
		<span class="text-xs text-gray-500">{formattedTime()}</span>
		{#if message.isEdited}
			<span class="text-xs text-gray-400 italic">(edited)</span>
		{/if}
	</div>
	
	<!-- Message content -->
	<div class="text-gray-800 text-sm whitespace-pre-wrap break-words">
		{message.message}
	</div>
	
	<!-- Message actions (show on hover if user has permissions) -->
	{#if (canEdit || canDelete) && !message.isDeleted}
		<div class="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
			{#if canEdit && onEdit}
				<button
					type="button"
					onclick={() => onEdit?.(message.id)}
					class="flex items-center gap-1 text-xs text-gray-600 hover:text-[#D5BA7F] transition-colors"
					aria-label="Edit message"
				>
					<Pencil class="w-3 h-3" />
					Edit
				</button>
			{/if}
			{#if canDelete && onDelete}
				<button
					type="button"
					onclick={() => onDelete?.(message.id)}
					class="flex items-center gap-1 text-xs text-gray-600 hover:text-red-600 transition-colors"
					aria-label="Delete message"
				>
					<Trash2 class="w-3 h-3" />
					Delete
				</button>
			{/if}
		</div>
	{/if}
</div>
