<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	interface Props {
		size?: 'sm' | 'md' | 'lg' | 'xl';
		variant?: 'primary' | 'secondary' | 'white';
		text?: string;
		fullScreen?: boolean;
	}

	let { size = 'md', variant = 'primary', text = '', fullScreen = false }: Props = $props();

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6',
		lg: 'w-8 h-8',
		xl: 'w-12 h-12'
	};

	const variantClasses = {
		primary: 'text-blue-600',
		secondary: 'text-gray-600',
		white: 'text-white'
	};

	const textSizeClasses = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg',
		xl: 'text-xl'
	};
</script>

{#if fullScreen}
	<div
		class="bg-opacity-90 fixed inset-0 z-50 flex items-center justify-center bg-white backdrop-blur-sm"
	>
		<div class="flex flex-col items-center space-y-4">
			<Loader2 class="animate-spin {sizeClasses[size]} {variantClasses[variant]}" />
			{#if text}
				<p class="font-medium {variantClasses[variant]} {textSizeClasses[size]}">
					{text}
				</p>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center space-x-2">
		<Loader2 class="animate-spin {sizeClasses[size]} {variantClasses[variant]}" />
		{#if text}
			<span class="font-medium {variantClasses[variant]} {textSizeClasses[size]}">
				{text}
			</span>
		{/if}
	</div>
{/if}
