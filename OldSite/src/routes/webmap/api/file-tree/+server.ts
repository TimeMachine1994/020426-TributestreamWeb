import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as fs from 'fs';
import * as path from 'path';
import type { FileNode, FileTreeResponse } from '$lib/types/webmap';

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

function countLines(filePath: string): number {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		return content.split('\n').length;
	} catch {
		return 0;
	}
}

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

			children.sort((a, b) => {
				if (a.type !== b.type) {
					return a.type === 'folder' ? -1 : 1;
				}
				return a.name.localeCompare(b.name);
			});

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
		console.error(`Error processing ${dirPath}:`, error);
		return null;
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

export const GET: RequestHandler = async ({ url }) => {
	try {
		const requestedPath = url.searchParams.get('path');
		const maxDepth = parseInt(url.searchParams.get('depth') || '10', 10);

		const projectRoot = path.resolve(process.cwd());
		const targetPath = requestedPath
			? path.resolve(projectRoot, requestedPath)
			: projectRoot;

		if (!targetPath.startsWith(projectRoot)) {
			return json({ error: 'Invalid path - outside project root' }, { status: 403 });
		}

		if (!fs.existsSync(targetPath)) {
			return json({ error: 'Path does not exist' }, { status: 404 });
		}

		const root = buildFileTree(targetPath, projectRoot, maxDepth);

		if (!root) {
			return json({ error: 'Failed to build file tree' }, { status: 500 });
		}

		const counts = countNodes(root);

		const response: FileTreeResponse = {
			root,
			stats: {
				totalFiles: counts.files,
				totalFolders: counts.folders
			}
		};

		return json(response);
	} catch (error) {
		console.error('File tree API error:', error);
		return json({ error: 'Failed to generate file tree' }, { status: 500 });
	}
};
