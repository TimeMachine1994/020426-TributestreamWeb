<script lang="ts">
	import type { MemorialBlock, EmbedConfig } from '$lib/types/memorial-blocks';

	interface Props {
		block: MemorialBlock;
	}

	let { block }: Props = $props();

	const config = block.config as EmbedConfig;

	function getEmbedTypeBadge(type: string) {
		switch (type) {
			case 'video':
				return { label: '🎬 Video', class: 'video' };
			case 'chat':
				return { label: '💬 Chat', class: 'chat' };
			default:
				return { label: '🔗 Other', class: 'other' };
		}
	}

	function truncateCode(code: string, maxLength: number = 80) {
		if (code.length <= maxLength) return code;
		return code.substring(0, maxLength) + '...';
	}
</script>

<div class="embed-preview">
	<div class="embed-info">
		<span class="type-badge {getEmbedTypeBadge(config.embedType).class}">
			{getEmbedTypeBadge(config.embedType).label}
		</span>
	</div>
	<div class="embed-code">
		<code>{truncateCode(config.embedCode)}</code>
	</div>
</div>

<style>
	.embed-preview {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.embed-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.type-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}

	.type-badge.video {
		background: #e9d8fd;
		color: #553c9a;
	}

	.type-badge.chat {
		background: #b2f5ea;
		color: #234e52;
	}

	.type-badge.other {
		background: #e2e8f0;
		color: #4a5568;
	}

	.embed-code {
		font-size: 0.75rem;
		background: #f7fafc;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		overflow: hidden;
	}

	.embed-code code {
		font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
		color: #718096;
		word-break: break-all;
	}
</style>
