export interface WikiLinkMatch {
	fullMatch: string;
	pageTitle: string;
	displayText: string;
	isValid: boolean;
}

/**
 * Parse wiki-style links [[Page Title]] or [[Page Title|Display Text]]
 */
export function parseWikiLinks(content: string): WikiLinkMatch[] {
	const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
	const matches: WikiLinkMatch[] = [];

	let match;
	while ((match = wikiLinkRegex.exec(content)) !== null) {
		matches.push({
			fullMatch: match[0],
			pageTitle: match[1].trim(),
			displayText: (match[2] || match[1]).trim(),
			isValid: true // Will be validated against actual pages
		});
	}

	return matches;
}

/**
 * Convert wiki links to HTML links
 */
export async function convertWikiLinksToHtml(
	content: string,
	pageMap: Map<string, string> // Map of title -> slug
): Promise<string> {
	const links = parseWikiLinks(content);
	let result = content;

	for (const link of links) {
		const slug = pageMap.get(link.pageTitle.toLowerCase());

		if (slug) {
			// Valid link - convert to anchor
			const htmlLink = `<a href="/admin/wiki/${slug}" class="wiki-link">${link.displayText}</a>`;
			result = result.replace(link.fullMatch, htmlLink);
		} else {
			// Invalid link - create link to new page with pre-filled title
			const encodedTitle = encodeURIComponent(link.pageTitle);
			const htmlLink = `<a href="/admin/wiki/new?title=${encodedTitle}" class="wiki-link-broken" title="Page does not exist - Click to create">${link.displayText}</a>`;
			result = result.replace(link.fullMatch, htmlLink);
		}
	}

	return result;
}

/**
 * Extract all wiki links from content
 */
export function extractWikiLinks(content: string): string[] {
	const links = parseWikiLinks(content);
	return [...new Set(links.map((l) => l.pageTitle))];
}

/**
 * Search and replace for client-side rendering
 */
export function replaceWikiLinksClient(content: string, pageMap: Map<string, string>): string {
	const links = parseWikiLinks(content);
	let result = content;

	for (const link of links) {
		const slug = pageMap.get(link.pageTitle.toLowerCase());

		if (slug) {
			// Valid link
			const htmlLink = `<a href="/admin/wiki/${slug}" class="wiki-link">${link.displayText}</a>`;
			result = result.replace(link.fullMatch, htmlLink);
		} else {
			// Broken link - create link to new page with pre-filled title
			const encodedTitle = encodeURIComponent(link.pageTitle);
			const htmlLink = `<a href="/admin/wiki/new?title=${encodedTitle}" class="wiki-link-broken" title="Page does not exist - Click to create">${link.displayText}</a>`;
			result = result.replace(link.fullMatch, htmlLink);
		}
	}

	return result;
}
