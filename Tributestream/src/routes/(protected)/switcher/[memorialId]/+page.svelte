<script lang="ts">
	import { page } from '$app/stores';

	let { data } = $props();

	const memorialId = $derived($page.params.memorialId);
</script>

<div class="h-screen bg-gray-900 text-white">
	<header class="flex h-12 items-center justify-between border-b border-gray-700 px-4">
		<div class="flex items-center gap-4">
			<a href="/switcher" class="text-sm text-gray-400 hover:text-white">← Back</a>
			<h1 class="text-lg font-semibold">Production: {memorialId}</h1>
		</div>
		<div class="flex items-center gap-4">
			<span class="rounded bg-gray-700 px-2 py-1 text-xs">PREVIEW</span>
			<button
				type="button"
				class="rounded bg-red-600 px-4 py-1 text-sm font-semibold hover:bg-red-500"
			>
				GO LIVE
			</button>
		</div>
	</header>

	<div class="flex h-[calc(100vh-3rem)]">
		<!-- Multiviewer Grid -->
		<div class="flex-1 p-4">
			<div class="grid h-full grid-cols-3 grid-rows-2 gap-2">
				<!-- Camera 1 (Program) -->
				<div class="col-span-2 row-span-2 rounded border-2 border-red-500 bg-gray-800">
					<div class="flex h-full items-center justify-center">
						<span class="text-gray-500">Program Output</span>
					</div>
				</div>
				<!-- Preview sources -->
				<div class="rounded border border-gray-600 bg-gray-800">
					<div class="flex h-full items-center justify-center">
						<span class="text-xs text-gray-500">Camera 1</span>
					</div>
				</div>
				<div class="rounded border border-gray-600 bg-gray-800">
					<div class="flex h-full items-center justify-center">
						<span class="text-xs text-gray-500">Camera 2</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Controls Sidebar -->
		<aside class="w-80 border-l border-gray-700 bg-gray-800 p-4">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Sources</h2>
			<div class="mt-4 space-y-2">
				<button class="w-full rounded bg-gray-700 px-3 py-2 text-left text-sm hover:bg-gray-600">
					Camera 1
				</button>
				<button class="w-full rounded bg-gray-700 px-3 py-2 text-left text-sm hover:bg-gray-600">
					Camera 2
				</button>
				<button class="w-full rounded bg-gray-700 px-3 py-2 text-left text-sm hover:bg-gray-600">
					+ Add Source
				</button>
			</div>

			<h2 class="mt-8 text-sm font-semibold uppercase tracking-wider text-gray-400">Overlays</h2>
			<div class="mt-4 space-y-2">
				<button class="w-full rounded bg-gray-700 px-3 py-2 text-left text-sm hover:bg-gray-600">
					Lower Third
				</button>
				<button class="w-full rounded bg-gray-700 px-3 py-2 text-left text-sm hover:bg-gray-600">
					Full Screen Graphic
				</button>
			</div>

			<h2 class="mt-8 text-sm font-semibold uppercase tracking-wider text-gray-400">Audio</h2>
			<div class="mt-4 space-y-3">
				<div class="flex items-center gap-2">
					<span class="w-16 text-xs text-gray-400">Cam 1</span>
					<input type="range" min="0" max="100" value="80" class="flex-1" />
				</div>
				<div class="flex items-center gap-2">
					<span class="w-16 text-xs text-gray-400">Cam 2</span>
					<input type="range" min="0" max="100" value="0" class="flex-1" />
				</div>
			</div>
		</aside>
	</div>
</div>
