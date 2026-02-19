<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	interface Props {
		memorialId: string;
		memorialName: string;
		onDismiss: () => void;
		visible?: boolean;
	}

	let { memorialId, memorialName, onDismiss, visible = false }: Props = $props();
	
	let isVisible = $state(visible);
	let isAnimating = $state(false);

	// Show banner with animation
	function showBanner() {
		isVisible = true;
		isAnimating = true;
		// No need to scroll - banner is now positioned below nav bar
	}

	// Hide banner with animation
	function hideBanner() {
		isAnimating = false;
		setTimeout(() => {
			isVisible = false;
			onDismiss();
		}, 300); // Match animation duration
	}

	// Navigate to calculator
	function goToCalculator() {
		// Banner will be marked as seen by parent component's onDismiss handler
		goto(`/schedule/${memorialId}`);
	}

	// Auto-show after mount if visible prop is true
	onMount(() => {
		if (visible) {
			// Small delay to ensure page is loaded
			setTimeout(showBanner, 100);
		}
	});
</script>

{#if isVisible}
	<div 
		class="booking-reminder-banner {isAnimating ? 'banner-visible' : 'banner-hidden'}"
		role="banner"
		aria-live="polite"
	>
		<div class="banner-content">
			<div class="banner-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
				</svg>
			</div>
			
			<div class="banner-text">
				<h3 class="banner-title">Complete Your Service Booking</h3>
				<p class="banner-message">
					Continue setting up the memorial service for <strong>{memorialName}</strong>
				</p>
			</div>
			
			<div class="banner-actions">
				<button 
					class="continue-btn"
					onclick={goToCalculator}
					type="button"
				>
					Continue Booking
				</button>
				<button 
					class="dismiss-btn"
					onclick={hideBanner}
					type="button"
					aria-label="Dismiss notification"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.booking-reminder-banner {
		position: fixed;
		top: 72px; /* Position below nav bar (nav is ~72px tall) */
		left: 0;
		right: 0;
		z-index: 40; /* Below nav bar (z-50) but above content */
		background: linear-gradient(135deg, #D5BA7F 0%, #C5AA6F 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transform: translateY(-100%);
		transition: transform 0.3s ease-out;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.banner-visible {
		transform: translateY(0);
	}

	.banner-hidden {
		transform: translateY(-100%);
	}

	.banner-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.banner-icon {
		flex-shrink: 0;
		width: 40px;
		height: 40px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.banner-text {
		flex: 1;
		min-width: 0;
	}

	.banner-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		color: white;
	}

	.banner-message {
		font-size: 0.9rem;
		margin: 0;
		opacity: 0.95;
		line-height: 1.4;
	}

	.banner-message strong {
		font-weight: 600;
	}

	.banner-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.continue-btn {
		background: white;
		color: #8B7355;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.continue-btn:hover {
		background: #f8f9fa;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.continue-btn:active {
		transform: translateY(0);
	}

	.dismiss-btn {
		background: transparent;
		border: none;
		color: white;
		padding: 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		opacity: 0.8;
		transition: opacity 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dismiss-btn:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.1);
	}

	/* Mobile responsive design */
	@media (max-width: 768px) {
		.banner-content {
			padding: 1rem;
			gap: 0.75rem;
		}

		.banner-icon {
			width: 36px;
			height: 36px;
		}

		.banner-title {
			font-size: 1rem;
		}

		.banner-message {
			font-size: 0.85rem;
		}

		.continue-btn {
			padding: 0.625rem 1.25rem;
			font-size: 0.85rem;
		}

		.banner-actions {
			gap: 0.5rem;
		}
	}

	@media (max-width: 480px) {
		.banner-content {
			flex-direction: column;
			align-items: stretch;
			text-align: center;
			gap: 1rem;
		}

		.banner-icon {
			align-self: center;
		}

		.banner-actions {
			justify-content: center;
		}
		
		.booking-reminder-banner {
			top: 64px; /* Shorter nav on mobile */
		}
	}
</style>
