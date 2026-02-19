<script lang="ts">
	import { allFiles, customGroups, viewState, addFileToGroup } from '$lib/stores/webmap';
	import FileCard from './FileCard.svelte';

	let layoutMode = $state<'grid' | 'list'>('grid');
	let dragOverGroupId = $state<string | null>(null);

	function handleDragOver(e: DragEvent, groupId: string) {
		e.preventDefault();
		dragOverGroupId = groupId;
	}

	function handleDragLeave() {
		dragOverGroupId = null;
	}

	function handleDrop(e: DragEvent, groupId: string) {
		e.preventDefault();
		const filePath = e.dataTransfer?.getData('file-path');
		if (filePath) {
			addFileToGroup(filePath, groupId);
		}
		dragOverGroupId = null;
	}

	function getFilesForGroup(groupId: string): typeof $allFiles {
		const group = $customGroups.find((g) => g.id === groupId);
		if (!group) return [];
		return $allFiles.filter((f) => group.files.includes(f.path));
	}
</script>

<div class="visual-canvas">
	<div class="canvas-header">
		<div class="view-controls">
			<button
				class="view-btn"
				class:active={layoutMode === 'grid'}
				onclick={() => (layoutMode = 'grid')}
				title="Grid View"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect width="7" height="7" x="3" y="3" rx="1" />
					<rect width="7" height="7" x="14" y="3" rx="1" />
					<rect width="7" height="7" x="14" y="14" rx="1" />
					<rect width="7" height="7" x="3" y="14" rx="1" />
				</svg>
				<span>Grid</span>
			</button>
			<button
				class="view-btn"
				class:active={layoutMode === 'list'}
				onclick={() => (layoutMode = 'list')}
				title="List View"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="8" x2="21" y1="6" y2="6" />
					<line x1="8" x2="21" y1="12" y2="12" />
					<line x1="8" x2="21" y1="18" y2="18" />
					<line x1="3" x2="3.01" y1="6" y2="6" />
					<line x1="3" x2="3.01" y1="12" y2="12" />
					<line x1="3" x2="3.01" y1="18" y2="18" />
				</svg>
				<span>List</span>
			</button>
		</div>
		<div class="zoom-controls">
			<span class="text-sm text-gray-400">Zoom: {Math.round($viewState.zoom * 100)}%</span>
		</div>
	</div>

	<div class="canvas-content">
		{#each $customGroups as group (group.id)}
			{@const groupFiles = getFilesForGroup(group.id)}
			{#if groupFiles.length > 0}
				<div class="file-group">
					<div
						class="group-header"
						style="border-left-color: {group.color}"
						ondragover={(e) => handleDragOver(e, group.id)}
						ondragleave={handleDragLeave}
						ondrop={(e) => handleDrop(e, group.id)}
						class:drag-over={dragOverGroupId === group.id}
						role="region"
						aria-label="Drop zone for {group.title}"
					>
						<div class="group-info">
							<h3 class="group-title">{group.title}</h3>
							<p class="group-description">{group.description}</p>
						</div>
						<div class="group-meta">
							<span class="file-count">{groupFiles.length} files</span>
						</div>
					</div>

					<div class="group-files" class:grid-layout={layoutMode === 'grid'} class:list-layout={layoutMode === 'list'}>
						{#each groupFiles as file (file.id)}
							<FileCard {file} selected={$viewState.selectedFile === file.path} />
						{/each}
					</div>
				</div>
			{/if}
		{/each}

		{#if $allFiles.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📂</div>
				<p class="text-lg text-gray-400">No files to display</p>
				<p class="text-sm text-gray-500">Try adjusting your filters or wait for the file tree to load</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.visual-canvas {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.canvas-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #334155;
		background-color: #1e293b;
	}

	.view-controls {
		display: flex;
		gap: 0.5rem;
	}

	.view-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background-color: transparent;
		border: 1px solid #334155;
		color: #94a3b8;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.view-btn:hover {
		background-color: #334155;
		border-color: #475569;
		color: #e2e8f0;
	}

	.view-btn.active {
		background-color: #3b82f6;
		border-color: #3b82f6;
		color: white;
	}

	.zoom-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.canvas-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.file-group {
		margin-bottom: 2rem;
	}

	.group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background-color: #1e293b;
		border: 1px solid #334155;
		border-left-width: 4px;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		transition: all 0.2s;
	}

	.group-header.drag-over {
		background-color: #334155;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.group-info {
		flex: 1;
	}

	.group-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #e2e8f0;
		margin-bottom: 0.25rem;
	}

	.group-description {
		font-size: 0.875rem;
		color: #94a3b8;
	}

	.group-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.file-count {
		font-size: 0.875rem;
		color: #64748b;
		background-color: #334155;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
	}

	.group-files {
		display: flex;
		gap: 1rem;
	}

	.group-files.grid-layout {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	}

	.group-files.list-layout {
		flex-direction: column;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}
</style>
