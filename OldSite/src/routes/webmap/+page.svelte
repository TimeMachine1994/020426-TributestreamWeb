<script lang="ts">
	import { onMount } from 'svelte';
	import {
		fileTree,
		projectStats,
		isLoadingTree,
		isLoadingStats,
		autoPopulateGroups
	} from '$lib/stores/webmap';
	import FileTreeSidebar from '$lib/components/webmap/FileTreeSidebar.svelte';
	import VisualCanvas from '$lib/components/webmap/VisualCanvas.svelte';
	import FileViewer from '$lib/components/webmap/FileViewer.svelte';
	import SearchBar from '$lib/components/webmap/SearchBar.svelte';
	import StatsPanel from '$lib/components/webmap/StatsPanel.svelte';

	let isCodeViewerExpanded = $state(false);

	async function loadFileTree() {
		isLoadingTree.set(true);
		console.log('[Webmap] Loading file tree...');
		try {
			const response = await fetch('/webmap/api/file-tree');
			console.log('[Webmap] File tree response status:', response.status);
			
			if (!response.ok) {
				const errorData = await response.json();
				console.error('[Webmap] File tree error:', errorData);
				throw new Error(errorData.error || 'Failed to load file tree');
			}
			
			const data = await response.json();
			console.log('[Webmap] File tree loaded:', data.stats);
			fileTree.set(data.root);
			autoPopulateGroups();
		} catch (error) {
			console.error('[Webmap] Failed to load file tree:', error);
			alert('Failed to load file tree. Check console for details.');
		} finally {
			isLoadingTree.set(false);
		}
	}

	async function loadStats() {
		isLoadingStats.set(true);
		console.log('[Webmap] Loading stats...');
		try {
			const response = await fetch('/webmap/api/stats');
			console.log('[Webmap] Stats response status:', response.status);
			
			if (!response.ok) {
				const errorData = await response.json();
				console.error('[Webmap] Stats error:', errorData);
				throw new Error(errorData.error || 'Failed to load stats');
			}
			
			const data = await response.json();
			console.log('[Webmap] Stats loaded:', {
				files: data.totalFiles,
				folders: data.totalFolders,
				lines: data.totalLines
			});
			projectStats.set(data);
		} catch (error) {
			console.error('[Webmap] Failed to load stats:', error);
		} finally {
			isLoadingStats.set(false);
		}
	}

	onMount(() => {
		loadFileTree();
		loadStats();
	});

	function toggleCodeViewer() {
		isCodeViewerExpanded = !isCodeViewerExpanded;
	}
</script>

<div class="webmap-container">
	<header class="webmap-header">
		<div class="header-left">
			<h1 class="text-2xl font-bold">🗺️ TributeStream WebMap</h1>
		</div>
		<div class="header-center">
			<SearchBar />
		</div>
		<div class="header-right">
			<button
				class="btn-icon"
				title="Refresh"
				aria-label="Refresh file tree and statistics"
				onclick={() => {
					loadFileTree();
					loadStats();
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
				</svg>
			</button>
		</div>
	</header>

	<div class="webmap-layout">
		<aside class="sidebar">
			<FileTreeSidebar />
		</aside>

		<main class="canvas">
			<VisualCanvas />
		</main>

		<aside class="info-panel">
			<StatsPanel />
		</aside>
	</div>

	<div class="code-viewer" class:expanded={isCodeViewerExpanded}>
		<div class="code-viewer-header">
			<span class="text-sm font-medium">Code Viewer</span>
			<button class="btn-icon-sm" onclick={toggleCodeViewer} aria-label="Toggle code viewer">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class:rotate-180={isCodeViewerExpanded}
				>
					<polyline points="18 15 12 9 6 15"></polyline>
				</svg>
			</button>
		</div>
		<div class="code-viewer-content">
			<FileViewer />
		</div>
	</div>
</div>

<style>
	.webmap-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #0f172a;
		color: #e2e8f0;
		overflow: hidden;
	}

	.webmap-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #1e293b;
		background-color: #1e293b;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.header-center {
		flex: 1;
		max-width: 600px;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-icon {
		padding: 0.5rem;
		border-radius: 0.375rem;
		background-color: transparent;
		border: 1px solid #334155;
		color: #94a3b8;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-icon:hover {
		background-color: #334155;
		color: #e2e8f0;
		border-color: #475569;
	}

	.webmap-layout {
		display: grid;
		grid-template-columns: 280px 1fr 320px;
		flex: 1;
		overflow: hidden;
		gap: 0;
	}

	.sidebar {
		background-color: #1e293b;
		border-right: 1px solid #334155;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.canvas {
		background-color: #0f172a;
		overflow: auto;
		position: relative;
	}

	.info-panel {
		background-color: #1e293b;
		border-left: 1px solid #334155;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.code-viewer {
		border-top: 1px solid #334155;
		background-color: #1e293b;
		transition: height 0.3s ease;
		height: 50px;
		display: flex;
		flex-direction: column;
	}

	.code-viewer.expanded {
		height: 400px;
	}

	.code-viewer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #334155;
		cursor: pointer;
		user-select: none;
	}

	.code-viewer-header:hover {
		background-color: #334155;
	}

	.code-viewer-content {
		flex: 1;
		overflow: auto;
		display: none;
	}

	.code-viewer.expanded .code-viewer-content {
		display: block;
	}

	.btn-icon-sm {
		padding: 0.25rem;
		border-radius: 0.25rem;
		background-color: transparent;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-icon-sm:hover {
		background-color: #475569;
		color: #e2e8f0;
	}

	.btn-icon-sm svg {
		transition: transform 0.3s ease;
	}

	.btn-icon-sm svg.rotate-180 {
		transform: rotate(180deg);
	}

	:global(.webmap-container *::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
	}

	:global(.webmap-container *::-webkit-scrollbar-track) {
		background-color: #1e293b;
	}

	:global(.webmap-container *::-webkit-scrollbar-thumb) {
		background-color: #475569;
		border-radius: 4px;
	}

	:global(.webmap-container *::-webkit-scrollbar-thumb:hover) {
		background-color: #64748b;
	}

	@media (max-width: 1024px) {
		.webmap-layout {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr auto;
		}

		.sidebar,
		.info-panel {
			display: none;
		}
	}
</style>
