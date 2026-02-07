<script lang="ts">
	import type { Compositor } from '$lib/compositor/Compositor.svelte';

	interface Props {
		compositor: Compositor;
		mode: 'program' | 'preview';
		showFps?: boolean;
	}

	let { compositor, mode, showFps = false }: Props = $props();

	function bindCanvas(node: HTMLCanvasElement) {
		if (mode === 'program') {
			compositor.setProgramCanvas(node);
		} else {
			compositor.setPreviewCanvas(node);
		}
	}
</script>

<div class="relative h-full w-full overflow-hidden rounded-lg bg-black">
	<canvas
		use:bindCanvas
		class="h-full w-full object-contain"
	></canvas>

	{#if showFps && compositor.isRunning}
		<div class="absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 font-mono text-xs text-green-400">
			{compositor.measuredFps} fps
		</div>
	{/if}
</div>
