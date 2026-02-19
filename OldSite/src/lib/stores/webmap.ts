import { writable, derived } from 'svelte/store';
import type {
	FileNode,
	ViewState,
	FilterState,
	FileGroup,
	ProjectStats,
	FileContent
} from '$lib/types/webmap';

export const fileTree = writable<FileNode | null>(null);

export const viewState = writable<ViewState>({
	selectedFile: null,
	selectedGroup: null,
	expandedFolders: new Set(),
	zoom: 1,
	panOffset: { x: 0, y: 0 }
});

export const filterState = writable<FilterState>({
	query: '',
	fileTypes: [],
	tags: [],
	dateRange: undefined,
	sizeRange: undefined
});

export const customGroups = writable<FileGroup[]>([
	{
		id: 'routes',
		title: 'Frontend Routes',
		description: 'SvelteKit pages and API endpoints',
		color: '#3b82f6',
		icon: 'route',
		files: []
	},
	{
		id: 'components',
		title: 'Components',
		description: 'Reusable Svelte components',
		color: '#10b981',
		icon: 'box',
		files: []
	},
	{
		id: 'types',
		title: 'Type Definitions',
		description: 'TypeScript interfaces and types',
		color: '#8b5cf6',
		icon: 'code',
		files: []
	},
	{
		id: 'server',
		title: 'Server Utilities',
		description: 'Server-side code and Firebase',
		color: '#f59e0b',
		icon: 'server',
		files: []
	},
	{
		id: 'docs',
		title: 'Documentation',
		description: 'Markdown documentation files',
		color: '#ec4899',
		icon: 'file-text',
		files: []
	}
]);

export const projectStats = writable<ProjectStats | null>(null);

export const selectedFileContent = writable<FileContent | null>(null);

export const isLoadingTree = writable(false);
export const isLoadingFile = writable(false);
export const isLoadingStats = writable(false);

function filterFileNode(node: FileNode, filter: FilterState): FileNode | null {
	if (node.type === 'file') {
		const matchesQuery =
			!filter.query ||
			node.name.toLowerCase().includes(filter.query.toLowerCase()) ||
			node.relativePath.toLowerCase().includes(filter.query.toLowerCase());

		const matchesFileType =
			filter.fileTypes.length === 0 ||
			(node.extension && filter.fileTypes.includes(node.extension));

		const matchesSizeRange =
			!filter.sizeRange ||
			((!filter.sizeRange.min || node.size >= filter.sizeRange.min) &&
				(!filter.sizeRange.max || node.size <= filter.sizeRange.max));

		if (matchesQuery && matchesFileType && matchesSizeRange) {
			return node;
		}
		return null;
	}

	if (node.children) {
		const filteredChildren = node.children
			.map((child) => filterFileNode(child, filter))
			.filter((child): child is FileNode => child !== null);

		if (filteredChildren.length > 0) {
			return {
				...node,
				children: filteredChildren
			};
		}
	}

	return null;
}

export const filteredFileTree = derived(
	[fileTree, filterState],
	([$fileTree, $filterState]) => {
		if (!$fileTree) return null;
		if (!$filterState.query && $filterState.fileTypes.length === 0) {
			return $fileTree;
		}
		return filterFileNode($fileTree, $filterState);
	}
);

function collectAllFiles(node: FileNode, files: FileNode[] = []): FileNode[] {
	if (node.type === 'file') {
		files.push(node);
	} else if (node.children) {
		for (const child of node.children) {
			collectAllFiles(child, files);
		}
	}
	return files;
}

export const allFiles = derived([fileTree], ([$fileTree]) => {
	if (!$fileTree) return [];
	return collectAllFiles($fileTree);
});

export const selectedFileNode = derived(
	[fileTree, viewState],
	([$fileTree, $viewState]) => {
		if (!$fileTree || !$viewState.selectedFile) return null;

		function findNode(node: FileNode, path: string): FileNode | null {
			if (node.path === path || node.relativePath === path) return node;
			if (node.children) {
				for (const child of node.children) {
					const found = findNode(child, path);
					if (found) return found;
				}
			}
			return null;
		}

		return findNode($fileTree, $viewState.selectedFile);
	}
);

export function toggleFolder(folderPath: string) {
	viewState.update((state) => {
		const newExpanded = new Set(state.expandedFolders);
		if (newExpanded.has(folderPath)) {
			newExpanded.delete(folderPath);
		} else {
			newExpanded.add(folderPath);
		}
		return { ...state, expandedFolders: newExpanded };
	});
}

export function selectFile(filePath: string) {
	viewState.update((state) => ({
		...state,
		selectedFile: filePath
	}));
}

export function addFileToGroup(filePath: string, groupId: string) {
	customGroups.update((groups) => {
		return groups.map((group) => {
			if (group.id === groupId) {
				if (!group.files.includes(filePath)) {
					return {
						...group,
						files: [...group.files, filePath]
					};
				}
			}
			return group;
		});
	});
}

export function removeFileFromGroup(filePath: string, groupId: string) {
	customGroups.update((groups) => {
		return groups.map((group) => {
			if (group.id === groupId) {
				return {
					...group,
					files: group.files.filter((f) => f !== filePath)
				};
			}
			return group;
		});
	});
}

export function autoPopulateGroups() {
	fileTree.subscribe(($tree) => {
		if (!$tree) return;

		const files = collectAllFiles($tree);

		customGroups.update((groups) => {
			return groups.map((group) => {
				const matchedFiles: string[] = [];

				if (group.id === 'routes') {
					matchedFiles.push(
						...files
							.filter((f) => f.relativePath.includes('routes/') || f.relativePath.includes('routes\\'))
							.map((f) => f.path)
					);
				} else if (group.id === 'components') {
					matchedFiles.push(
						...files
							.filter((f) => f.relativePath.includes('components/') || f.relativePath.includes('components\\'))
							.map((f) => f.path)
					);
				} else if (group.id === 'types') {
					matchedFiles.push(
						...files
							.filter((f) => f.relativePath.includes('types/') || f.relativePath.includes('types\\'))
							.map((f) => f.path)
					);
				} else if (group.id === 'server') {
					matchedFiles.push(
						...files
							.filter((f) => f.relativePath.includes('server/') || f.relativePath.includes('server\\'))
							.map((f) => f.path)
					);
				} else if (group.id === 'docs') {
					matchedFiles.push(...files.filter((f) => f.extension === '.md').map((f) => f.path));
				}

				return {
					...group,
					files: matchedFiles
				};
			});
		});
	});
}
