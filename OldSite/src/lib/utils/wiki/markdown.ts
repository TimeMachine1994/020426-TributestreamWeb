import { marked } from 'marked';

/**
 * Generate slug from heading text for anchor IDs
 */
function generateHeadingId(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-');
}

/**
 * Custom renderer to add IDs to headings
 */
const renderer = new marked.Renderer();
const originalHeading = renderer.heading.bind(renderer);

renderer.heading = function({ text, depth }) {
	const id = generateHeadingId(text);
	return `<h${depth} id="${id}">${text}</h${depth}>`;
};

/**
 * Configure marked with custom settings
 */
marked.setOptions({
	gfm: true, // GitHub Flavored Markdown
	breaks: true, // Convert \n to <br>
	renderer: renderer
});

/**
 * Parse markdown to HTML
 * Note: No sanitization since this is admin-only content from trusted sources.
 * Marked already escapes HTML by default for safety.
 */
export function parseMarkdown(content: string): string {
	return marked.parse(content) as string;
}

/**
 * Extract plain text excerpt from markdown
 */
export function extractExcerpt(markdown: string, maxLength: number = 200): string {
	// Remove markdown syntax
	const plainText = markdown
		.replace(/#{1,6}\s+/g, '') // Headers
		.replace(/\*\*(.+?)\*\*/g, '$1') // Bold
		.replace(/\*(.+?)\*/g, '$1') // Italic
		.replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
		.replace(/`(.+?)`/g, '$1') // Code
		.replace(/\[\[(.+?)(?:\|.+?)?\]\]/g, '$1') // Wiki links
		.trim();

	if (plainText.length <= maxLength) return plainText;

	return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(markdown: string): number {
	const wordsPerMinute = 200;
	const words = markdown.trim().split(/\s+/).length;
	return Math.ceil(words / wordsPerMinute);
}
