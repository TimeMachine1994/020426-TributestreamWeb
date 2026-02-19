<script lang="ts">
	import type { MemorialBlock, TextConfig } from '$lib/types/memorial-blocks';

	interface Props {
		block: MemorialBlock;
	}

	let { block }: Props = $props();

	const config = block.config as TextConfig;

	function getStyleBadge(style: string) {
		switch (style) {
			case 'heading':
				return { label: 'H', class: 'heading' };
			case 'note':
				return { label: '📌', class: 'note' };
			default:
				return { label: '¶', class: 'paragraph' };
		}
	}

	function truncateContent(content: string, maxLength: number = 150) {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}
</script>

<div class="text-preview">
	<div class="text-info">
		<span class="style-badge {getStyleBadge(config.style).class}">
			{getStyleBadge(config.style).label}
		</span>
		<span class="style-label">{config.style}</span>
	</div>
	<div class="text-content" class:heading={config.style === 'heading'}>
		{truncateContent(config.content)}
	</div>
</div>

<style>
	.text-preview {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.text-info {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.style-badge {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		border-radius: 0.25rem;
	}

	.style-badge.heading {
		background: #faf089;
		color: #744210;
	}

	.style-badge.note {
		background: #fed7e2;
		color: #97266d;
	}

	.style-badge.paragraph {
		background: #e2e8f0;
		color: #4a5568;
	}

	.style-label {
		font-size: 0.6875rem;
		text-transform: capitalize;
		color: #a0aec0;
	}

	.text-content {
		font-size: 0.8125rem;
		color: #4a5568;
		line-height: 1.4;
	}

	.text-content.heading {
		font-weight: 600;
		color: #2d3748;
	}
</style>
