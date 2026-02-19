<script lang="ts">
	import { Clock } from 'lucide-svelte';

	interface Props {
		scheduledStartTime: string;
		streamTitle: string;
		streamDescription?: string;
		posterUrl?: string;
		theme?: 'memorial' | 'homepage';
		currentTime: Date;
	}

	let { 
		scheduledStartTime, 
		streamTitle, 
		streamDescription, 
		posterUrl,
		theme = 'memorial',
		currentTime
	}: Props = $props();

	// Check if stream has started
	function hasStreamStarted(scheduledTime: string, currentTime: Date): boolean {
		const now = currentTime.getTime();
		const target = new Date(scheduledTime).getTime();
		return target <= now;
	}

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		
		});
	}

	// Format time separately for display
	function formatTime(dateString: string): string {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'short'
		});
	}

	// Check if stream has started
	let streamStarted = $derived.by(() => {
		return hasStreamStarted(scheduledStartTime, currentTime);
	});
</script>

<div class="countdown-video-player" class:memorial-theme={theme === 'memorial'} class:homepage-theme={theme === 'homepage'}>
	<div class="video-container">
		<!-- Video Screen with Lens Flare Effect -->
		<div class="video-screen">
			<!-- Lens Flare Background -->
			<div class="lens-flare-bg">
				<div class="flare-circle flare-1"></div>
				<div class="flare-circle flare-2"></div>
				<div class="flare-circle flare-3"></div>
				<div class="flare-beam"></div>
				<div class="flare-beam flare-beam-2"></div>
			</div>
			
			<!-- Dark Overlay for Better Text Contrast -->
			<div class="video-overlay"></div>
			
			<!-- Schedule Overlay -->
			<div class="countdown-overlay">
				<div class="countdown-content">
					<div class="schedule-display">
						<div class="schedule-header">
							<Clock class="schedule-icon" />
							<h3 class="schedule-title">{streamTitle || 'Scheduled Service'}</h3>
						</div>
						<div class="schedule-info">
							<div class="schedule-date">
 								<span class="date-value">{formatDate(scheduledStartTime)}</span>
							</div>
							<div class="schedule-time">
 								<span class="time-value">{formatTime(scheduledStartTime)}</span>
							</div>
						</div>
						{#if streamStarted}
										
							<div class="schedule-status started">
								<span class="status-text">Service should be starting shortly.</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
		
		<!-- Fake Video Controls -->
		<div class="video-controls">
			<div class="control-bar">
				<!-- Play Button (Disabled) -->
				<button class="play-button" disabled aria-label="Stream not yet available">
					<svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="5,3 19,12 5,21"></polygon>
					</svg>
				</button>
				
				<!-- Progress Bar (Empty) -->
				<div class="progress-container">
					<div class="progress-bar">
						<div class="progress-fill" style="width: 0%"></div>
					</div>
				</div>
				
				<!-- Time Display -->
				<span class="time-display">Stream starts soon</span>
				
				<!-- Volume Button (Disabled) -->
				<button class="volume-button" disabled aria-label="Volume control unavailable">
					<svg class="volume-icon" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="11,5 6,9 2,9 2,15 6,15 11,19"></polygon>
						<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
					</svg>
				</button>
				
				<!-- Fullscreen Button (Disabled) -->
				<button class="fullscreen-button" disabled aria-label="Fullscreen unavailable">
					<svg class="fullscreen-icon" viewBox="0 0 24 24" fill="currentColor">
						<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
					</svg>
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.countdown-video-player {
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		background: #000;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.video-container {
		position: relative;
		width: 100%;
	}

	.video-screen {
		aspect-ratio: 16/9;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	/* Lens Flare Effects */
	.lens-flare-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
		z-index: 0;
	}

	.flare-circle {
		position: absolute;
		border-radius: 50%;
		opacity: 0.3;
		animation: float 6s ease-in-out infinite;
	}

	.flare-1 {
		width: 200px;
		height: 200px;
		background: radial-gradient(circle, rgba(213, 186, 127, 0.4) 0%, rgba(213, 186, 127, 0.1) 50%, transparent 100%);
		top: 10%;
		right: 15%;
		animation-delay: 0s;
	}

	.flare-2 {
		width: 120px;
		height: 120px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
		bottom: 20%;
		left: 20%;
		animation-delay: 2s;
	}

	.flare-3 {
		width: 80px;
		height: 80px;
		background: radial-gradient(circle, rgba(213, 186, 127, 0.5) 0%, rgba(213, 186, 127, 0.2) 50%, transparent 100%);
		top: 60%;
		right: 40%;
		animation-delay: 4s;
	}

	.flare-beam {
		position: absolute;
		width: 2px;
		height: 100%;
		background: linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
		left: 30%;
		top: 0;
		animation: shimmer 4s ease-in-out infinite;
		transform: rotate(15deg);
	}

	.flare-beam-2 {
		left: 70%;
		animation-delay: 2s;
		transform: rotate(-15deg);
		background: linear-gradient(to bottom, transparent 0%, rgba(213, 186, 127, 0.3) 50%, transparent 100%);
	}

	@keyframes float {
		0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
		50% { transform: translateY(-20px) scale(1.1); opacity: 0.5; }
	}

	@keyframes shimmer {
		0%, 100% { opacity: 0.1; }
		50% { opacity: 0.4; }
	}

	.video-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 1;
	}

	.countdown-overlay {
		position: relative;
		z-index: 2;
		text-align: center;
		color: white;
		padding: 2rem;
	}

	.countdown-content {
		max-width: 500px;
		margin: 0 auto;
	}


	.schedule-display {
		text-align: center;
		max-width: 400px;
		margin: 0 auto;
	}

	.schedule-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.schedule-icon {
		width: 2rem;
		height: 2rem;
		color: #D5BA7F;
		filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.8));
	}

	.schedule-title {
		font-family: 'Fanwood Text', serif;
		font-size: 2.25rem;
		font-weight: 400;
		font-style: italic;
		color: white;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
		margin: 0;
	}

	.schedule-info {
		margin-bottom: 1.5rem;
	}

	.schedule-date,
	.schedule-time {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		margin-bottom: 0.75rem;
		border: 1px solid rgba(213, 186, 127, 0.2);
		text-align: center;
	}

	.date-label,
	.time-label {
		font-size: 1rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.8);
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
	}

	.date-value,
	.time-value {
		font-size: 1.1rem;
		font-weight: 600;
		color: #D5BA7F;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
	}

	.schedule-status {
		padding: 0.75rem 1rem;
		background: rgba(59, 130, 246, 0.2);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: 8px;
		text-align: center;
	}

	.schedule-status.started {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.3);
	}

	.status-text {
		font-size: 0.95rem;
		font-weight: 500;
		color: white;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
	}


	/* Video Controls */
	.video-controls {
		background: #1a1a1a;
		padding: 0.75rem 1rem;
		border-top: 1px solid #333;
	}

	.control-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #888;
		font-size: 0.9rem;
	}

	.play-button,
	.volume-button,
	.fullscreen-button {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #333;
		border: none;
		border-radius: 4px;
		cursor: not-allowed;
		opacity: 0.5;
		color: #888;
		transition: all 0.2s ease;
	}

	.play-button:disabled,
	.volume-button:disabled,
	.fullscreen-button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.play-icon,
	.volume-icon,
	.fullscreen-icon {
		width: 14px;
		height: 14px;
	}

	.progress-container {
		flex: 1;
		margin: 0 0.5rem;
	}

	.progress-bar {
		height: 4px;
		background: #333;
		border-radius: 2px;
		position: relative;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #666;
		border-radius: 2px;
		transition: width 0.2s ease;
	}

	.time-display {
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		min-width: 120px;
		text-align: center;
		color: #888;
	}

	/* Theme Variations */
	.memorial-theme {
		/* Memorial page specific styling */
	}

	.homepage-theme {
		/* Homepage specific styling if needed */
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.countdown-overlay {
			padding: 1.5rem;
		}

		.schedule-title {
			font-size: 1.25rem;
		}

		.schedule-date,
		.schedule-time {
			padding: 0.5rem 0.75rem;
		}

		.date-value,
		.time-value {
			font-size: 1rem;
		}

		.control-bar {
			gap: 0.75rem;
		}

		.time-display {
			min-width: 100px;
			font-size: 0.8rem;
		}
	}

	@media (max-width: 480px) {
		.schedule-header {
			gap: 0.5rem;
		}

		.schedule-icon {
			width: 1.5rem;
			height: 1.5rem;
		}

		.schedule-title {
			font-size: 1.1rem;
		}

		.date-label,
		.time-label {
			font-size: 0.9rem;
		}

		.date-value,
		.time-value {
			font-size: 0.95rem;
		}
	}
</style>
