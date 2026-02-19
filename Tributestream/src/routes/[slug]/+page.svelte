<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { MemorialServices } from '$lib/features/booking/types';

	let { data } = $props();

	const memorial = $derived(data.memorial);
	const streams = $derived(data.streams ?? []);
	const services = $derived(memorial.services as MemorialServices | null);

	const bookingMemorialId = $derived(page.url.searchParams.get('booking'));
	let showBookingBanner = $state(false);
	let bannerDismissed = $state(false);

	onMount(() => {
		import('@mux/mux-player');

		if (bookingMemorialId) {
			const timer = setTimeout(() => {
				showBookingBanner = true;
			}, 3000);
			return () => clearTimeout(timer);
		}
	});

	const statusLabels: Record<string, { text: string; class: string }> = {
		draft: { text: 'Coming Soon', class: 'bg-gray-100 text-gray-700' },
		scheduled: { text: 'Scheduled', class: 'bg-blue-100 text-blue-700' },
		live: { text: 'Live Now', class: 'bg-red-100 text-red-700' },
		ended: { text: 'Ended', class: 'bg-gray-100 text-gray-700' },
		archived: { text: 'Archived', class: 'bg-gray-100 text-gray-700' }
	};

	const status = $derived(statusLabels[memorial.status] ?? statusLabels.draft);

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatTime(timeStr: string | null): string {
		if (!timeStr) return '';
		const [h, m] = timeStr.split(':');
		const date = new Date();
		date.setHours(parseInt(h), parseInt(m));
		return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>{memorial.lovedOneName ? `In Memory of ${memorial.lovedOneName}` : memorial.title} | Tributestream</title>
</svelte:head>

<div class="min-h-screen bg-gray-900">
	<!-- Complete Booking Banner -->
	{#if showBookingBanner && !bannerDismissed && bookingMemorialId}
		<div class="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
			<div class="mx-auto max-w-3xl px-4 pb-6">
				<div class="flex items-center justify-between gap-4 rounded-xl bg-amber-500 px-6 py-4 shadow-2xl shadow-amber-500/25">
					<div>
						<p class="font-semibold text-slate-900">Your memorial page is ready!</p>
						<p class="text-sm text-slate-800">Complete your booking to schedule the livestream.</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							onclick={() => (bannerDismissed = true)}
							class="rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-amber-400"
						>
							Later
						</button>
						<a
							href="/schedule/{bookingMemorialId}"
							class="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
						>
							Complete Booking
						</a>
					</div>
				</div>
			</div>
		</div>
	{/if}

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
		<!-- Memorial Header (from calculator data) -->
		{#if memorial.lovedOneName}
			<div class="mb-8 text-center">
				{#if memorial.imageUrl}
					<img
						src={memorial.imageUrl}
						alt={memorial.lovedOneName}
						class="mx-auto mb-4 h-32 w-32 rounded-full border-4 border-amber-500/30 object-cover"
					/>
				{/if}
				<h1 class="text-3xl font-bold text-white">
					In Loving Memory of {memorial.lovedOneName}
				</h1>
				{#if memorial.birthDate || memorial.deathDate}
					<p class="mt-2 text-gray-400">
						{memorial.birthDate ? formatDate(memorial.birthDate) : ''}
						{memorial.birthDate && memorial.deathDate ? ' — ' : ''}
						{memorial.deathDate ? formatDate(memorial.deathDate) : ''}
					</p>
				{/if}
				{#if memorial.description}
					<p class="mx-auto mt-4 max-w-2xl text-gray-400">{memorial.description}</p>
				{/if}
			</div>
		{/if}

		<div class="grid gap-8 lg:grid-cols-3">
			<!-- Video Player Area -->
			<div class="lg:col-span-2">
				<!-- Primary stream player -->
				<div class="aspect-video overflow-hidden rounded-lg bg-black">
					{#if memorial.status === 'live' && memorial.muxPlaybackId}
						<mux-player
							playback-id={memorial.muxPlaybackId}
							stream-type="live"
							autoplay
							muted
							style="width:100%;height:100%;--media-object-fit:contain;"
						></mux-player>
					{:else if streams.length > 0 && streams.some((s: any) => s.status === 'live' && s.muxPlaybackId)}
						{@const liveStream = streams.find((s: any) => s.status === 'live' && s.muxPlaybackId)}
						{#if liveStream}
							<mux-player
								playback-id={liveStream.muxPlaybackId}
								stream-type="live"
								autoplay
								muted
								style="width:100%;height:100%;--media-object-fit:contain;"
							></mux-player>
						{/if}
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

				<!-- Memorial Info (fallback if no lovedOneName) -->
				{#if !memorial.lovedOneName}
					<div class="mt-6">
						<h1 class="text-2xl font-bold text-white">{memorial.title}</h1>
						{#if memorial.description}
							<p class="mt-2 text-gray-400">{memorial.description}</p>
						{/if}
					</div>
				{/if}

				<!-- Service Details (from calculator) -->
				{#if services}
					<div class="mt-6 rounded-lg bg-gray-800 p-6">
						<h2 class="mb-4 text-lg font-semibold text-white">Service Details</h2>

						<!-- Main service -->
						<div class="space-y-2">
							{#if services.main.location.name}
								<div class="flex items-start gap-3">
									<span class="text-amber-500">📍</span>
									<div>
										<p class="font-medium text-white">{services.main.location.name}</p>
										{#if services.main.location.address}
											<p class="text-sm text-gray-400">{services.main.location.address}</p>
										{/if}
									</div>
								</div>
							{/if}
							{#if services.main.time.date || services.main.time.time}
								<div class="flex items-start gap-3">
									<span class="text-amber-500">📅</span>
									<div>
										{#if services.main.time.date}
											<p class="font-medium text-white">{formatDate(services.main.time.date)}</p>
										{/if}
										{#if services.main.time.time}
											<p class="text-sm text-gray-400">{formatTime(services.main.time.time)}</p>
										{/if}
									</div>
								</div>
							{:else if services.main.time.isUnknown}
								<div class="flex items-start gap-3">
									<span class="text-amber-500">📅</span>
									<p class="text-gray-400">Date & time to be announced</p>
								</div>
							{/if}
						</div>

						<!-- Additional services -->
						{#each services.additional as addl, i}
							<div class="mt-4 border-t border-gray-700 pt-4">
								<h3 class="mb-2 text-sm font-semibold text-amber-400">
									{addl.type === 'location' ? 'Additional Location' : 'Additional Day'}
								</h3>
								<div class="space-y-2">
									{#if addl.location.name}
										<div class="flex items-start gap-3">
											<span class="text-amber-500">📍</span>
											<div>
												<p class="font-medium text-white">{addl.location.name}</p>
												{#if addl.location.address}
													<p class="text-sm text-gray-400">{addl.location.address}</p>
												{/if}
											</div>
										</div>
									{/if}
									{#if addl.time.date || addl.time.time}
										<div class="flex items-start gap-3">
											<span class="text-amber-500">📅</span>
											<div>
												{#if addl.time.date}
													<p class="font-medium text-white">{formatDate(addl.time.date)}</p>
												{/if}
												{#if addl.time.time}
													<p class="text-sm text-gray-400">{formatTime(addl.time.time)}</p>
												{/if}
											</div>
										</div>
									{/if}
								</div>
							</div>
						{/each}

						{#if memorial.funeralHomeName}
							<div class="mt-4 border-t border-gray-700 pt-4">
								<p class="text-sm text-gray-400">
									Arranged by <span class="text-white">{memorial.funeralHomeName}</span>
								</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Multi-stream selector (if multiple streams from calculator) -->
				{#if streams.length > 1}
					<div class="mt-6 rounded-lg bg-gray-800 p-6">
						<h2 class="mb-4 text-lg font-semibold text-white">Service Streams</h2>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							{#each streams as stream}
								<div class="rounded-lg border border-gray-700 p-4">
									<h3 class="font-medium text-white">{stream.title}</h3>
									{#if stream.scheduledStartTime}
										<p class="mt-1 text-sm text-gray-400">
											{new Date(stream.scheduledStartTime).toLocaleString()}
										</p>
									{/if}
									<span
										class="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium
											{stream.status === 'live'
											? 'bg-red-500/20 text-red-400'
											: stream.status === 'scheduled'
												? 'bg-blue-500/20 text-blue-400'
												: 'bg-gray-700 text-gray-400'}"
									>
										{stream.status}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Memorial content / obituary -->
				{#if memorial.content}
					<div class="prose prose-invert mt-6 max-w-none rounded-lg bg-gray-800 p-6">
						{@html memorial.content}
					</div>
				{/if}
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

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	:global(.animate-slide-up) {
		animation: slide-up 0.4s ease-out;
	}
</style>
