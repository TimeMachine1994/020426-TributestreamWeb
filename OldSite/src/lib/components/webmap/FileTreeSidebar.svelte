<script lang="ts">
	import { filteredFileTree, viewState, toggleFolder, selectFile } from '$lib/stores/webmap';
	import type { FileNode } from '$lib/types/webmap';

	const FILE_ICONS: Record<string, string> = {
		'.ts': '📘',
		'.js': '📜',
		'.svelte': '🔷',
		'.json': '📋',
		'.md': '📄',
		'.css': '🎨',
		'.html': '🌐',
		'.py': '🐍',
		'.java': '☕',
		'.go': '🐹'
	};

	function getFileIcon(extension?: string): string {
		if (!extension) return '📄';
		return FILE_ICONS[extension] || '📄';
	}

	function handleFolderClick(node: FileNode) {
		toggleFolder(node.path);
	}

	function handleFileClick(node: FileNode) {
		selectFile(node.path);
	}

	function isExpanded(folderPath: string): boolean {
		return $viewState.expandedFolders.has(folderPath);
	}

	function isSelected(filePath: string): boolean {
		return $viewState.selectedFile === filePath;
	}
</script>

<div class="file-tree-sidebar">
	<div class="sidebar-header">
		<h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">File Explorer</h2>
	</div>

	<div class="tree-content">
		{#if $filteredFileTree}
			<TreeNode node={$filteredFileTree} depth={0} />
		{:else}
			<div class="loading-state">
				<div class="spinner"></div>
				<p class="text-sm text-gray-400">Loading file tree...</p>
			</div>
		{/if}
	</div>
</div>

{#snippet TreeNode(node: FileNode, depth: number)}
	<div class="tree-node" style="padding-left: {depth * 12}px">
		{#if node.type === 'folder'}
			<button
				class="folder-item"
				class:expanded={isExpanded(node.path)}
				onclick={() => handleFolderClick(node)}
			>
				<span class="folder-icon">
					{isExpanded(node.path) ? '📂' : '📁'}
				</span>
				<span class="folder-name">{node.name}</span>
				<span class="file-count">({node.children?.length || 0})</span>
			</button>

			{#if isExpanded(node.path) && node.children}
				{#each node.children as child (child.id)}
					{@render TreeNode(child, depth + 1)}
				{/each}
			{/if}
		{:else}
			<button
				class="file-item"
				class:selected={isSelected(node.path)}
				onclick={() => handleFileClick(node)}
			>
				<span class="file-icon">{getFileIcon(node.extension)}</span>
				<span class="file-name">{node.name}</span>
				{#if node.lines}
					<span class="file-meta">{node.lines}L</span>
				{/if}
			</button>
		{/if}
	</div>
{/snippet}

<style>
	.file-tree-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.sidebar-header {
		padding: 1rem;
		border-bottom: 1px solid #334155;
	}

	.tree-content {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0;
	}

	.tree-node {
		display: flex;
		flex-direction: column;
	}

	.folder-item,
	.file-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		color: #e2e8f0;
		cursor: pointer;
		transition: background-color 0.15s;
		font-size: 0.875rem;
	}

	.folder-item:hover,
	.file-item:hover {
		background-color: #334155;
	}

	.file-item.selected {
		background-color: #3b82f6;
		color: white;
	}

	.folder-icon,
	.file-icon {
		flex-shrink: 0;
		font-size: 1rem;
	}

	.folder-name,
	.file-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-count {
		font-size: 0.75rem;
		color: #64748b;
	}

	.file-meta {
		font-size: 0.75rem;
		color: #64748b;
		flex-shrink: 0;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid #334155;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
