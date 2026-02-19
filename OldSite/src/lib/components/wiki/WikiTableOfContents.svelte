<script lang="ts">
	import type { TableOfContentsItem } from '$lib/types/wiki';

	interface Props {
		items: TableOfContentsItem[];
		currentId?: string;
	}

	let { items, currentId = $bindable('') }: Props = $props();

	function scrollToHeading(id: string) {
		const element = document.getElementById(id);
		if (element) {
			// Get element position and scroll with offset
			const offset = 80; // Account for any fixed headers
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - offset;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
			
			currentId = id;
		}
	}
</script>

<nav class="wiki-toc">
	<h3 class="toc-title">Table of Contents</h3>
	
	{#if items.length === 0}
		<p class="toc-empty">No headings found</p>
	{:else}
		<ul class="toc-list">
			{#each items as item}
				<li class="toc-item level-{item.level}">
					<button
						onclick={() => scrollToHeading(item.id)}
						class:active={currentId === item.id}
					>
						{item.text}
					</button>
					
					{#if item.children.length > 0}
						<ul class="toc-sublist">
							{#each item.children as child}
								<li class="toc-item level-{child.level}">
									<button
										onclick={() => scrollToHeading(child.id)}
										class:active={currentId === child.id}
									>
										{child.text}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</nav>

<style>
	.wiki-toc {
		position: sticky;
		top: 2rem;
		max-height: calc(100vh - 4rem);
		overflow-y: auto;
		padding: 1.5rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.toc-title {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #6b7280;
		margin-bottom: 1rem;
		letter-spacing: 0.05em;
	}

	.toc-empty {
		font-size: 0.875rem;
		color: #9ca3af;
		font-style: italic;
	}

	.toc-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.toc-sublist {
		list-style: none;
		padding-left: 1rem;
		margin-top: 0.25rem;
	}

	.toc-item {
		margin-bottom: 0.25rem;
	}

	.toc-item button {
		width: 100%;
		text-align: left;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		color: #4b5563;
		background: transparent;
		border: none;
		border-left: 2px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
		border-radius: 0.25rem;
	}

	.toc-item button:hover {
		background: #f3f4f6;
		color: #d5ba7f;
		border-left-color: #d5ba7f;
	}

	.toc-item button.active {
		background: #fef3c7;
		color: #92400e;
		border-left-color: #d5ba7f;
		font-weight: 500;
	}

	.toc-item.level-1 button {
		font-weight: 500;
	}

	.toc-item.level-2 button {
		padding-left: 1rem;
	}

	.toc-item.level-3 button {
		padding-left: 1.5rem;
		font-size: 0.8125rem;
	}
</style>
