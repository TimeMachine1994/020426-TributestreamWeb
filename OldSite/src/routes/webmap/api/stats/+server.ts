import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as fs from 'fs';
import * as path from 'path';
import type { ProjectStats, FileNode } from '$lib/types/webmap';

const LANGUAGE_EXTENSIONS: Record<string, string> = {
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

interface FileInfo {
	path: string;
	size: number;
	lines: number;
	lastModified: Date;
	extension: string;
}

function collectFileInfo(node: FileNode, files: FileInfo[] = []): FileInfo[] {
	if (node.type === 'file') {
		files.push({
			path: node.relativePath,
			size: node.size,
			lines: node.lines || 0,
			lastModified: node.lastModified,
			extension: node.extension || ''
		});
	} else if (node.children) {
		for (const child of node.children) {
			collectFileInfo(child, files);
		}
	}
	return files;
}

function analyzeFiles(files: FileInfo[]): ProjectStats {
	const languageBreakdown: Record<string, number> = {};
	let totalLines = 0;

	for (const file of files) {
		const language = LANGUAGE_EXTENSIONS[file.extension] || 'Other';
		languageBreakdown[language] = (languageBreakdown[language] || 0) + 1;
		totalLines += file.lines;
	}

	const largestFiles = files
		.filter((f) => f.lines > 0)
		.sort((a, b) => b.lines - a.lines)
		.slice(0, 10)
		.map((f) => ({
			path: f.path,
			size: f.size,
			lines: f.lines
		}));

	const recentlyModified = files
		.sort((a, b) => {
			const dateA = typeof a.lastModified === 'string' ? new Date(a.lastModified) : a.lastModified;
			const dateB = typeof b.lastModified === 'string' ? new Date(b.lastModified) : b.lastModified;
			return dateB.getTime() - dateA.getTime();
		})
		.slice(0, 10)
		.map((f) => ({
			path: f.path,
			date: typeof f.lastModified === 'string' ? new Date(f.lastModified) : f.lastModified
		}));

	return {
		totalFiles: files.length,
		totalFolders: 0,
		totalLines,
		languageBreakdown,
		largestFiles,
		recentlyModified
	};
}

const IGNORED_DIRS = new Set([
	'node_modules',
	'.git',
	'.svelte-kit',
	'build',
	'dist',
	'.next',
	'coverage',
	'.cache',
	'tmp',
	'temp'
]);

const IGNORED_FILES = new Set(['.DS_Store', 'Thumbs.db', '.gitkeep']);

function buildFileTree(
	dirPath: string,
	rootPath: string,
	maxDepth: number = 10,
	currentDepth: number = 0
): FileNode | null {
	if (currentDepth >= maxDepth) return null;

	try {
		const stats = fs.statSync(dirPath);
		const name = path.basename(dirPath);
		const relativePath = path.relative(rootPath, dirPath);

		if (stats.isDirectory()) {
			if (IGNORED_DIRS.has(name)) return null;

			const children: FileNode[] = [];
			const entries = fs.readdirSync(dirPath);

			for (const entry of entries) {
				const entryPath = path.join(dirPath, entry);
				const childNode = buildFileTree(entryPath, rootPath, maxDepth, currentDepth + 1);
				if (childNode) {
					children.push(childNode);
				}
			}

			return {
				id: relativePath || 'root',
				name,
				path: dirPath,
				relativePath: relativePath || '',
				type: 'folder',
				size: 0,
				lastModified: stats.mtime,
				children
			};
		} else {
			if (IGNORED_FILES.has(name)) return null;

			const extension = path.extname(name);
			const lines = countLines(dirPath);

			return {
				id: relativePath,
				name,
				path: dirPath,
				relativePath,
				type: 'file',
				extension,
				size: stats.size,
				lines,
				lastModified: stats.mtime
			};
		}
	} catch (error) {
		return null;
	}
}

function countLines(filePath: string): number {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		return content.split('\n').length;
	} catch {
		return 0;
	}
}

function countNodes(node: FileNode): { files: number; folders: number } {
	if (node.type === 'file') {
		return { files: 1, folders: 0 };
	}

	let files = 0;
	let folders = 1;

	if (node.children) {
		for (const child of node.children) {
			const counts = countNodes(child);
			files += counts.files;
			folders += counts.folders;
		}
	}

	return { files, folders };
}

export const GET: RequestHandler = async () => {
	try {
		const projectRoot = path.resolve(process.cwd());
		const root = buildFileTree(projectRoot, projectRoot, 10);

		if (!root) {
			return json({ error: 'Failed to build file tree' }, { status: 500 });
		}

		const counts = countNodes(root);
		const files = collectFileInfo(root);
		const stats = analyzeFiles(files);

		stats.totalFolders = counts.folders;

		return json(stats);
	} catch (error) {
		console.error('Stats API error:', error);
		return json({ error: 'Failed to generate statistics' }, { status: 500 });
	}
};
