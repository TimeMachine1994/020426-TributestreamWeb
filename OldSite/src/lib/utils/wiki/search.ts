import type { WikiPage, WikiSearchResult } from '$lib/types/wiki';

/**
 * Search wiki pages by title and content
 */
export function searchPages(pages: WikiPage[], query: string): WikiSearchResult[] {
	if (!query.trim()) return [];

	const lowerQuery = query.toLowerCase();

	return pages
		.map((page) => {
			let relevance = 0;

			// Title match (highest priority)
			if (page.title.toLowerCase().includes(lowerQuery)) {
				relevance += 10;
			}

			// Tag match
			if (page.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
				relevance += 5;
			}

			// Category match
			if (page.category?.toLowerCase().includes(lowerQuery)) {
				relevance += 3;
			}

			// Content match
			const contentIndex = page.content.toLowerCase().indexOf(lowerQuery);
			if (contentIndex !== -1) {
				relevance += 1;

				// Extract excerpt around match
				const start = Math.max(0, contentIndex - 50);
				const end = Math.min(page.content.length, contentIndex + 150);
				const excerpt = '...' + page.content.substring(start, end) + '...';

				return {
					id: page.id,
					slug: page.slug,
					title: page.title,
					excerpt,
					category: page.category,
					tags: page.tags,
					relevance
				};
			}

			// If we have any relevance from title/tags/category, create result
			if (relevance > 0) {
				return {
					id: page.id,
					slug: page.slug,
					title: page.title,
					excerpt: page.content.substring(0, 150) + '...',
					category: page.category,
					tags: page.tags,
					relevance
				};
			}

			return null;
		})
		.filter((result): result is WikiSearchResult => result !== null && result.relevance > 0)
		.sort((a, b) => b.relevance - a.relevance);
}
