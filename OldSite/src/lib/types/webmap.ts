export interface FileNode {
	id: string;
	name: string;
	path: string;
	relativePath: string;
	type: 'file' | 'folder';
	extension?: string;
	size: number;
	lines?: number;
	lastModified: Date;
	children?: FileNode[];
}

export interface FileMetadata {
	path: string;
	description?: string;
	tags: string[];
	language: string;
	imports?: string[];
	exports?: string[];
	complexity?: number;
}

export interface FileGroup {
	id: string;
	title: string;
	description: string;
	color: string;
	icon?: string;
	files: string[];
}

export interface FilterState {
	query: string;
	fileTypes: string[];
	tags: string[];
	dateRange?: { start: Date; end: Date };
	sizeRange?: { min: number; max: number };
}

export interface ProjectStats {
	totalFiles: number;
	totalFolders: number;
	totalLines: number;
	languageBreakdown: Record<string, number>;
	largestFiles: Array<{ path: string; size: number; lines: number }>;
	recentlyModified: Array<{ path: string; date: Date }>;
}

export interface ViewState {
	selectedFile: string | null;
	selectedGroup: string | null;
	expandedFolders: Set<string>;
	zoom: number;
	panOffset: { x: number; y: number };
}

export interface FileContent {
	path: string;
	name: string;
	content: string;
	lines: number;
	size: number;
	language: string;
	extension: string;
}

export interface FileTreeResponse {
	root: FileNode;
	stats: {
		totalFiles: number;
		totalFolders: number;
	};
}

export interface FileAnalysis {
	path: string;
	imports: Array<{ path: string; items: string[] }>;
	exports: string[];
	todos: Array<{ line: number; text: string }>;
	complexity: number;
	hasTests: boolean;
	testCoverage?: number;
	warnings: string[];
}
