<script lang="ts">
	import type { TextConfig } from '$lib/types/memorial-blocks';

	interface Props {
		config: TextConfig;
	}

	let { config }: Props = $props();
</script>

<div class="text-renderer" class:heading={config.style === 'heading'} class:note={config.style === 'note'} class:paragraph={config.style === 'paragraph'}>
	{#if config.style === 'heading'}
		<h2 class="text-heading">{config.content}</h2>
	{:else if config.style === 'note'}
		<div class="text-note">
			<p>{config.content}</p>
		</div>
	{:else}
		<p class="text-paragraph">{config.content}</p>
	{/if}
</div>

<style>
	.text-renderer {
		width: 100%;
	}

	.text-heading {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a202c;
		line-height: 1.3;
		text-align: center;
	}

	.text-paragraph {
		margin: 0;
		font-size: 1rem;
		color: #4a5568;
		line-height: 1.7;
		text-align: center;
	}

	.text-note {
		background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
		border: 1px solid #fcd34d;
		border-radius: 0.5rem;
		padding: 1.25rem 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.text-note p {
		margin: 0;
		font-size: 0.9375rem;
		color: #92400e;
		line-height: 1.6;
		text-align: center;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.text-heading {
			font-size: 1.25rem;
		}

		.text-paragraph {
			font-size: 0.9375rem;
		}

		.text-note {
			padding: 1rem;
		}
	}
</style>
