<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white shadow-sm">
		<nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between items-center">
				<a href="/" class="text-xl font-semibold text-gray-900">Tributestream</a>
				<div class="flex gap-4">
					<a href="/login" class="text-gray-600 hover:text-gray-900">Login</a>
				</div>
			</div>
		</nav>
	</header>
	<main>
		{@render children()}
	</main>
</div>
