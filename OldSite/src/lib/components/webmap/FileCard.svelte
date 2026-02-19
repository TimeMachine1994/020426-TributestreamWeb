<script lang="ts">
	import type { FileNode } from '$lib/types/webmap';
	import { selectFile } from '$lib/stores/webmap';

	interface Props {
		file: FileNode;
		selected?: boolean;
		draggable?: boolean;
	}

	let { file, selected = false, draggable = true }: Props = $props();

	const FILE_ICONS: Record<string, string> = {
		'.ts': '📘',
		'.tsx': '📘',
		'.js': '📜',
		'.jsx': '📜',
		'.svelte': '🔷',
		'.json': '📋',
		'.md': '📄',
		'.css': '🎨',
		'.scss': '🎨',
		'.html': '🌐',
		'.py': '🐍',
		'.java': '☕',
		'.go': '🐹',
		'.rs': '🦀',
		'.sql': '🗄️'
	};

	const LANGUAGE_COLORS: Record<string, string> = {
		'.ts': '#3178c6',
		'.tsx': '#3178c6',
		'.js': '#f7df1e',
		'.jsx': '#f7df1e',
		'.svelte': '#ff3e00',
		'.json': '#5a5a5a',
		'.md': '#083fa1',
		'.css': '#563d7c',
		'.scss': '#c6538c',
		'.html': '#e34c26',
		'.py': '#3572A5',
		'.java': '#b07219',
		'.go': '#00ADD8',
		'.rs': '#dea584',
		'.sql': '#e38c00'
	};

	function getFileIcon(extension?: string): string {
		if (!extension) return '📄';
		return FILE_ICONS[extension] || '📄';
	}

	function getLanguageColor(extension?: string): string {
		if (!extension) return '#64748b';
		return LANGUAGE_COLORS[extension] || '#64748b';
	}

	function getLanguageName(extension?: string): string {
		if (!extension) return 'Unknown';
		const names: Record<string, string> = {
			'.ts': 'TypeScript',
			'.tsx': 'TypeScript',
			'.js': 'JavaScript',
			'.jsx': 'JavaScript',
			'.svelte': 'Svelte',
			'.json': 'JSON',
			'.md': 'Markdown',
			'.css': 'CSS',
			'.scss': 'SCSS',
			'.html': 'HTML',
			'.py': 'Python',
			'.java': 'Java',
			'.go': 'Go',
			'.rs': 'Rust',
			'.sql': 'SQL'
		};
		return names[extension] || extension.slice(1).toUpperCase();
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function formatDate(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 60) return diffMins + ' min ago';
		if (diffHours < 24) return diffHours + ' hr ago';
		if (diffDays < 7) return diffDays + ' days ago';
		return date.toLocaleDateString();
	}

	let isDragging = $state(false);

	function handleDragStart(e: DragEvent) {
		if (!draggable) return;
		e.dataTransfer!.effectAllowed = 'move';
		e.dataTransfer!.setData('file-path', file.path);
		isDragging = true;
	}

	function handleDragEnd() {
		isDragging = false;
	}

	function handleClick() {
		selectFile(file.path);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}

	function copyPath() {
		navigator.clipboard.writeText(file.path);
	}
</script>

<div
	class="file-card"
	class:selected
	class:dragging={isDragging}
	style="border-left-color: {getLanguageColor(file.extension)}"
	draggable={draggable}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	role="button"
	tabindex="0"
>
	<div class="card-header">
		<span class="file-icon">{getFileIcon(file.extension)}</span>
		<span class="file-name" title={file.name}>{file.name}</span>
	</div>

	<div class="card-body">
		<div class="file-meta">
			{#if file.lines}
				<span class="meta-item">{file.lines} lines</span>
			{/if}
			<span class="meta-item">{getLanguageName(file.extension)}</span>
		</div>
		<div class="file-meta">
			<span class="meta-item">{formatFileSize(file.size)}</span>
			<span class="meta-item">{formatDate(file.lastModified)}</span>
		</div>
	</div>

	<div class="card-footer">
		<button class="btn-sm" onclick={handleClick}>View</button>
		<button class="btn-sm" onclick={(e) => { e.stopPropagation(); copyPath(); }}>Copy Path</button>
	</div>

	{#if file.lines && file.lines > 500}
		<div class="badge badge-warning">Large</div>
	{/if}
</div>

<style>
	.file-card {
		background-color: #1e293b;
		border: 1px solid #334155;
		border-left-width: 3px;
		border-radius: 0.5rem;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		min-width: 250px;
		max-width: 320px;
	}

	.file-card:hover {
		background-color: #334155;
		border-color: #475569;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.file-card.selected {
		background-color: #1e3a8a;
		border-color: #3b82f6;
	}

	.file-card.dragging {
		opacity: 0.5;
		transform: scale(0.95);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.file-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.file-name {
		font-weight: 600;
		color: #e2e8f0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.file-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.meta-item {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.card-footer {
		display: flex;
		gap: 0.5rem;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		border-radius: 0.25rem;
		background-color: #334155;
		border: 1px solid #475569;
		color: #e2e8f0;
		cursor: pointer;
		transition: all 0.15s;
		flex: 1;
	}

	.btn-sm:hover {
		background-color: #475569;
		border-color: #64748b;
	}

	.badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.625rem;
		font-weight: 600;
		border-radius: 0.25rem;
		text-transform: uppercase;
	}

	.badge-warning {
		background-color: #f59e0b;
		color: #000;
	}
</style>
