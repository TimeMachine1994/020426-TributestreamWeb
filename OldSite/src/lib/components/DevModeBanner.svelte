<script lang="ts">
	import { isDevelopment } from '$lib/utils/environment';
	import { getActiveBypasses } from '$lib/config/dev-mode';
	
	let dismissed = $state(false);
	
	const activeBypasses = getActiveBypasses();
</script>

{#if isDevelopment && !dismissed}
	<div class="dev-banner">
		<div class="content">
			<span class="icon">⚠️</span>
			<div class="text">
				<strong>Development Mode Active</strong>
				{#if activeBypasses.length > 0}
					<span class="bypasses">
						Bypasses: {activeBypasses.join(', ')}
					</span>
				{/if}
			</div>
			<button 
				class="dismiss-button"
				onclick={() => dismissed = true}
				type="button"
				aria-label="Dismiss banner"
			>
				×
			</button>
		</div>
	</div>
{/if}

<style>
	.dev-banner {
		background: linear-gradient(90deg, #f59e0b, #d97706);
		color: white;
		padding: 0.75rem 1rem;
		text-align: center;
		position: sticky;
		top: 0;
		z-index: 9998;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		max-width: 1200px;
		margin: 0 auto;
		position: relative;
	}
	
	.icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}
	
	.text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-items: center;
	}
	
	strong {
		font-weight: 700;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.bypasses {
		font-size: 0.75rem;
		opacity: 0.95;
		font-weight: 500;
	}
	
	.dismiss-button {
		position: absolute;
		right: 0;
		background: rgba(0, 0, 0, 0.2);
		border: none;
		color: white;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 1.5rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		padding: 0;
	}
	
	.dismiss-button:hover {
		background: rgba(0, 0, 0, 0.3);
		transform: scale(1.1);
	}
	
	.dismiss-button:active {
		transform: scale(0.95);
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.dev-banner {
			padding: 0.625rem 0.75rem;
		}
		
		.content {
			gap: 0.5rem;
		}
		
		.text {
			gap: 0.125rem;
		}
		
		strong {
			font-size: 0.8125rem;
		}
		
		.bypasses {
			font-size: 0.6875rem;
		}
		
		.icon {
			font-size: 1.125rem;
		}
		
		.dismiss-button {
			width: 24px;
			height: 24px;
			font-size: 1.25rem;
		}
	}
</style>
