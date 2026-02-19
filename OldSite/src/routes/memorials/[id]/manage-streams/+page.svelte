<script lang="ts">
	import type { PageData } from './$types';
	import StreamCard from '$lib/components/streaming/StreamCard.svelte';
	import { Calendar, Plus } from 'lucide-svelte';

	export let data: PageData;

	const { memorial, streams, canManage } = data;
</script>

<svelte:head>
	<title>Manage Streams - {memorial?.lovedOneName || 'Memorial'} | TributeStream</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Stream Management</h1>
					<p class="mt-2 text-gray-600">
						Managing streams for <span class="font-semibold">{memorial?.lovedOneName}</span>
					</p>
				</div>

				{#if canManage}
					<a
						href="/memorials/{memorial?.id}/schedule"
						class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
					>
						<Plus class="h-5 w-5" />
						Create Stream
					</a>
				{/if}
			</div>
		</div>

		<!-- Streams List -->
		{#if streams.length === 0}
			<div class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
				<Calendar class="mx-auto h-12 w-12 text-gray-400" />
				<h3 class="mt-4 text-lg font-semibold text-gray-900">No Streams Yet</h3>
				<p class="mt-2 text-gray-600">
					{#if canManage}
						Get started by creating a new livestream for this memorial.
					{:else}
						Streams will appear here once they are scheduled.
					{/if}
				</p>
				{#if canManage}
					<a
						href="/memorials/{memorial?.id}/schedule"
						class="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
					>
						<Plus class="h-5 w-5" />
						Create Your First Stream
					</a>
				{/if}
			</div>
		{:else}
			<div class="space-y-6">
				{#each streams as stream (stream.id)}
					<StreamCard {stream} {canManage} memorialId={memorial?.id || ''} />
				{/each}
			</div>
		{/if}

		<!-- Info Box for Managers -->
		{#if canManage && streams.length > 0}
			<div class="mt-8 rounded-lg bg-blue-50 p-6">
				<h3 class="text-lg font-semibold text-blue-900">Stream Management Tips</h3>
				<ul class="mt-3 space-y-2 text-sm text-blue-800">
					<li>• <strong>Arm streams</strong> before they go live to generate streaming credentials</li>
					<li>• <strong>Mobile Input:</strong> For browser-based streaming from phones/tablets</li>
					<li>• <strong>Stream Key:</strong> For professional OBS/encoder streaming</li>
					<li>• Streams automatically appear on the memorial page when they go live</li>
				</ul>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Add any additional styles here */
</style>
