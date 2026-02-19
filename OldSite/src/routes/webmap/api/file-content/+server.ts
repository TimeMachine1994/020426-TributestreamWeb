import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as fs from 'fs';
import * as path from 'path';
import type { FileContent } from '$lib/types/webmap';

const MAX_FILE_SIZE = 1024 * 1024;

const LANGUAGE_MAP: Record<string, string> = {
	'.ts': 'typescript',
	'.js': 'javascript',
	'.svelte': 'svelte',
	'.json': 'json',
	'.md': 'markdown',
	'.css': 'css',
	'.scss': 'scss',
	'.html': 'html',
	'.py': 'python',
	'.java': 'java',
	'.go': 'go',
	'.rs': 'rust',
	'.sql': 'sql',
	'.yaml': 'yaml',
	'.yml': 'yaml',
	'.xml': 'xml',
	'.sh': 'bash',
	'.bash': 'bash',
	'.env': 'shell',
	'.txt': 'plaintext'
};

function getLanguageFromExtension(extension: string): string {
	return LANGUAGE_MAP[extension.toLowerCase()] || 'plaintext';
}

function isBinaryFile(filePath: string): boolean {
	const binaryExtensions = [
		'.png',
		'.jpg',
		'.jpeg',
		'.gif',
		'.ico',
		'.pdf',
		'.zip',
		'.tar',
		'.gz',
		'.exe',
		'.dll',
		'.so',
		'.dylib',
		'.woff',
		'.woff2',
		'.ttf',
		'.eot',
		'.mp4',
		'.mp3',
		'.wav',
		'.avi'
	];

	const extension = path.extname(filePath).toLowerCase();
	return binaryExtensions.includes(extension);
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const requestedPath = url.searchParams.get('path');

		if (!requestedPath) {
			return json({ error: 'Path parameter is required' }, { status: 400 });
		}

		const projectRoot = path.resolve(process.cwd());
		const absolutePath = path.isAbsolute(requestedPath)
			? requestedPath
			: path.resolve(projectRoot, requestedPath);

		if (!absolutePath.startsWith(projectRoot)) {
			return json({ error: 'Access denied - path outside project root' }, { status: 403 });
		}

		if (!fs.existsSync(absolutePath)) {
			return json({ error: 'File not found' }, { status: 404 });
		}

		const stats = fs.statSync(absolutePath);

		if (!stats.isFile()) {
			return json({ error: 'Path is not a file' }, { status: 400 });
		}

		if (stats.size > MAX_FILE_SIZE) {
			return json(
				{
					error: 'File too large',
					message: `File size (${(stats.size / 1024).toFixed(2)} KB) exceeds maximum allowed size (${MAX_FILE_SIZE / 1024} KB)`,
					size: stats.size
				},
				{ status: 413 }
			);
		}

		if (isBinaryFile(absolutePath)) {
			return json(
				{
					error: 'Binary file',
					message: 'Cannot display binary file content',
					name: path.basename(absolutePath),
					size: stats.size,
					extension: path.extname(absolutePath)
				},
				{ status: 415 }
			);
		}

		const content = fs.readFileSync(absolutePath, 'utf-8');
		const extension = path.extname(absolutePath);
		const language = getLanguageFromExtension(extension);
		const lines = content.split('\n').length;

		const response: FileContent = {
			path: absolutePath,
			name: path.basename(absolutePath),
			content,
			lines,
			size: stats.size,
			language,
			extension
		};

		return json(response);
	} catch (error) {
		console.error('File content API error:', error);
		return json({ error: 'Failed to read file content' }, { status: 500 });
	}
};
