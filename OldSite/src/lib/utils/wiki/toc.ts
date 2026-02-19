import type { TableOfContentsItem } from '$lib/types/wiki';

/**
 * Generate table of contents from markdown content
 */
export function generateTableOfContents(markdown: string): TableOfContentsItem[] {
	const headingRegex = /^(#{1,6})\s+(.+)$/gm;
	const headings: { level: number; text: string; id: string }[] = [];

	let match;
	while ((match = headingRegex.exec(markdown)) !== null) {
		const level = match[1].length;
		const text = match[2].trim();
		const id = text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-');

		headings.push({ level, text, id });
	}

	return buildTocTree(headings);
}

/**
 * Build hierarchical tree structure from flat heading list
 */
function buildTocTree(
	headings: { level: number; text: string; id: string }[]
): TableOfContentsItem[] {
	const root: TableOfContentsItem[] = [];
	const stack: TableOfContentsItem[] = [];

	for (const heading of headings) {
		const item: TableOfContentsItem = {
			id: heading.id,
			text: heading.text,
			level: heading.level,
			children: []
		};

		// Find parent based on level
		while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
			stack.pop();
		}

		if (stack.length === 0) {
			root.push(item);
		} else {
			stack[stack.length - 1].children.push(item);
		}

		stack.push(item);
	}

	return root;
}

/**
 * Add IDs to markdown headings for anchor links
 */
export function addHeadingIds(markdown: string): string {
	return markdown.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
		const id = text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-');
		return `${hashes} ${text} {#${id}}`;
	});
}
