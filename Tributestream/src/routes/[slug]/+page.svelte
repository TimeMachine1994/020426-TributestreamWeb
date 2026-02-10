<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();

	const memorial = $derived(data.memorial);

	onMount(() => {
		import('@mux/mux-player');
	});

	const statusLabels: Record<string, { text: string; class: string }> = {
		draft: { text: 'Coming Soon', class: 'bg-gray-100 text-gray-700' },
		scheduled: { text: 'Scheduled', class: 'bg-blue-100 text-blue-700' },
		live: { text: 'Live Now', class: 'bg-red-100 text-red-700' },
		ended: { text: 'Ended', class: 'bg-gray-100 text-gray-700' },
		archived: { text: 'Archived', class: 'bg-gray-100 text-gray-700' }
	};

	const status = $derived(statusLabels[memorial.status] ?? statusLabels.draft);
</script>

<svelte:head>
	<title>{memorial.title} | Tributestream</title>
</svelte:head>

<div class="min-h-screen bg-gray-900">
	<!-- Header -->
	<header class="border-b border-gray-800 bg-gray-900/95 backdrop-blur">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<a href="/" class="text-lg font-semibold text-white">Tributestream</a>
				<span class="rounded-full px-3 py-1 text-xs font-medium {status.class}">
					{status.text}
				</span>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="grid gap-8 lg:grid-cols-3">
			<!-- Video Player Area -->
			<div class="lg:col-span-2">
				<div class="aspect-video overflow-hidden rounded-lg bg-black">
					{#if memorial.status === 'live' && memorial.muxPlaybackId}
						<mux-player
							playback-id={memorial.muxPlaybackId}
							stream-type="live"
							autoplay
							muted
							style="width:100%;height:100%;--media-object-fit:contain;"
						></mux-player>
					{:else if memorial.status === 'scheduled'}
						<div class="flex h-full flex-col items-center justify-center text-center">
							<span class="text-lg font-semibold text-white">Stream Starting Soon</span>
							{#if memorial.scheduledAt}
								<span class="mt-2 text-sm text-gray-400">
									{new Date(memorial.scheduledAt).toLocaleString()}
								</span>
							{/if}
						</div>
					{:else}
						<div class="flex h-full items-center justify-center">
							<span class="text-gray-500">No stream available</span>
						</div>
					{/if}
				</div>

				<!-- Memorial Info -->
				<div class="mt-6">
					<h1 class="text-2xl font-bold text-white">{memorial.title}</h1>
					{#if memorial.description}
						<p class="mt-2 text-gray-400">{memorial.description}</p>
					{/if}
				</div>
			</div>

			<!-- Chat Sidebar -->
			<div class="lg:col-span-1">
				{#if memorial.chatEnabled}
					<div class="flex h-[500px] flex-col rounded-lg bg-gray-800">
						<div class="border-b border-gray-700 px-4 py-3">
							<h2 class="font-semibold text-white">Chat</h2>
						</div>
						<div class="flex-1 overflow-y-auto p-4">
							<p class="text-center text-sm text-gray-500">
								Chat messages will appear here.
							</p>
						</div>
						<div class="border-t border-gray-700 p-4">
							<form class="flex gap-2">
								<input
									type="text"
									placeholder="Send a message..."
									class="flex-1 rounded-md border-0 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
								/>
								<button
									type="submit"
									class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
								>
									Send
								</button>
							</form>
						</div>
					</div>

					<!-- Quick Registration -->
					<div class="mt-4 rounded-lg bg-gray-800 p-4">
						<h3 class="text-sm font-semibold text-white">Join the conversation</h3>
						<p class="mt-1 text-xs text-gray-400">Sign in to send messages and share memories.</p>
						<a
							href="/login"
							class="mt-3 block w-full rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 hover:bg-gray-100"
						>
							Sign In
						</a>
					</div>
				{:else}
					<div class="rounded-lg bg-gray-800 p-6 text-center">
						<p class="text-sm text-gray-400">Chat is disabled for this memorial.</p>
					</div>
				{/if}
			</div>
		</div>
	</main>
</div>
