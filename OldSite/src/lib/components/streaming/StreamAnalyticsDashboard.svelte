<script lang="ts">
	/**
	 * Stream Analytics Dashboard Component
	 * 
	 * Created: January 22, 2026
	 * Displays real-time and historical analytics for streams
	 * 
	 * Features:
	 * - Real-time viewer count
	 * - Peak viewer tracking
	 * - Average watch time metrics
	 * - Chat activity visualization
	 * - Quality of service metrics
	 * - Auto-refresh for live streams
	 */

	import { onMount } from 'svelte';

	// Props interface
	interface Props {
		streamId: string;
		isLive?: boolean;
		refreshInterval?: number; // Milliseconds
	}

	let { 
		streamId, 
		isLive = false,
		refreshInterval = 10000 // Default 10 seconds
	}: Props = $props();

	// Analytics data state
	let analytics = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let lastUpdated = $state<Date | null>(null);
	let refreshTimer: NodeJS.Timeout;

	console.log('📊 [ANALYTICS DASHBOARD] Component initialized');
	console.log('📊 [ANALYTICS DASHBOARD] Stream ID:', streamId);
	console.log('📊 [ANALYTICS DASHBOARD] Is live:', isLive);
	console.log('📊 [ANALYTICS DASHBOARD] Refresh interval:', refreshInterval, 'ms');

	/**
	 * Fetch analytics data from API
	 */
	async function fetchAnalytics() {
		console.log('📊 [ANALYTICS DASHBOARD] Fetching analytics...');
		console.log('📊 [ANALYTICS DASHBOARD] Timestamp:', new Date().toISOString());

		try {
			const response = await fetch(`/api/streams/${streamId}/analytics`);

			if (!response.ok) {
				throw new Error('Failed to fetch analytics');
			}

			const data = await response.json();
			
			console.log('✅ [ANALYTICS DASHBOARD] Analytics fetched successfully');
			console.log('📊 [ANALYTICS DASHBOARD] Current viewers:', data.realTime?.viewerCount || 0);
			console.log('📊 [ANALYTICS DASHBOARD] Peak viewers:', data.historical?.peakViewers || 0);
			console.log('📊 [ANALYTICS DASHBOARD] Timeline points:', data.timeline?.length || 0);

			analytics = data;
			lastUpdated = new Date();
			error = null;
			loading = false;

		} catch (err) {
			console.error('❌ [ANALYTICS DASHBOARD] Error fetching analytics:', err);
			error = err instanceof Error ? err.message : 'Failed to fetch analytics';
			loading = false;
		}
	}

	/**
	 * Format duration in seconds to readable string
	 */
	function formatDuration(seconds: number): string {
		if (seconds < 60) return `${Math.round(seconds)}s`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	}

	/**
	 * Format number with commas
	 */
	function formatNumber(num: number): string {
		return num.toLocaleString('en-US');
	}

	/**
	 * Get time ago string
	 */
	function getTimeAgo(date: Date): string {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		if (seconds < 60) return 'Just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ago`;
	}

	// Lifecycle: mount and setup auto-refresh
	onMount(() => {
		console.log('📊 [ANALYTICS DASHBOARD] Component mounted');

		// Initial fetch
		fetchAnalytics();

		// Setup auto-refresh for live streams
		if (isLive && refreshInterval > 0) {
			console.log('📊 [ANALYTICS DASHBOARD] Starting auto-refresh');
			refreshTimer = setInterval(fetchAnalytics, refreshInterval);
		}

		// Cleanup on unmount
		return () => {
			if (refreshTimer) {
				console.log('📊 [ANALYTICS DASHBOARD] Clearing refresh timer');
				clearInterval(refreshTimer);
			}
		};
	});
</script>

<div class="analytics-dashboard">
	<!-- Dashboard Header -->
	<div class="dashboard-header">
		<h2>📊 Stream Analytics</h2>
		{#if lastUpdated}
			<span class="last-updated">
				Updated {getTimeAgo(lastUpdated)}
				{#if isLive}
					<span class="live-indicator">🔴 Live</span>
				{/if}
			</span>
		{/if}
	</div>

	{#if loading && !analytics}
		<!-- Loading State -->
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading analytics...</p>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="error-state">
			<p>⚠️ {error}</p>
			<button onclick={fetchAnalytics} class="retry-button">
				🔄 Retry
			</button>
		</div>
	{:else if analytics}
		<!-- Real-Time Metrics Grid -->
		<div class="metrics-grid">
			<div class="metric-card">
				<div class="metric-icon">👁️</div>
				<div class="metric-value">{formatNumber(analytics.realTime?.viewerCount || 0)}</div>
				<div class="metric-label">Current Viewers</div>
			</div>

			<div class="metric-card">
				<div class="metric-icon">📈</div>
				<div class="metric-value">{formatNumber(analytics.historical?.peakViewers || 0)}</div>
				<div class="metric-label">Peak Viewers</div>
			</div>

			<div class="metric-card">
				<div class="metric-icon">⏱️</div>
				<div class="metric-value">
					{formatDuration(analytics.historical?.averageWatchTime || 0)}
				</div>
				<div class="metric-label">Avg Watch Time</div>
			</div>

			<div class="metric-card">
				<div class="metric-icon">💬</div>
				<div class="metric-value">{analytics.realTime?.chatActivity || 0}/min</div>
				<div class="metric-label">Chat Activity</div>
			</div>
		</div>

		<!-- Quality Metrics -->
		<div class="quality-section">
			<h3>Quality of Service</h3>
			<div class="quality-grid">
				<div class="quality-item">
					<span class="quality-label">Playback Quality:</span>
					<div class="quality-bar">
						<div 
							class="quality-fill" 
							style="width: {analytics.realTime?.playbackQuality || 0}%"
						></div>
					</div>
					<span class="quality-value">{analytics.realTime?.playbackQuality || 0}%</span>
				</div>

				<div class="quality-item">
					<span class="quality-label">Buffering Rate:</span>
					<div class="quality-bar">
						<div 
							class="quality-fill warning" 
							style="width: {analytics.realTime?.bufferingRate || 0}%"
						></div>
					</div>
					<span class="quality-value">{analytics.realTime?.bufferingRate || 0}%</span>
				</div>
			</div>
		</div>

		<!-- Historical Data -->
		{#if analytics.historical}
			<div class="historical-section">
				<h3>Historical Metrics</h3>
				<div class="historical-grid">
					<div class="historical-item">
						<span class="historical-label">Total Views:</span>
						<span class="historical-value">
							{formatNumber(analytics.historical.totalViews || 0)}
						</span>
					</div>
					<div class="historical-item">
						<span class="historical-label">Total Watch Time:</span>
						<span class="historical-value">
							{formatDuration(analytics.historical.totalWatchTime || 0)}
						</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Timeline Visualization (Simple) -->
		{#if analytics.timeline && analytics.timeline.length > 0}
			<div class="timeline-section">
				<h3>Viewer Timeline</h3>
				<div class="timeline-chart">
					{#each analytics.timeline as point, index (index)}
						<div class="timeline-bar">
							<div 
								class="bar-fill" 
								style="height: {(point.viewerCount / (analytics.historical?.peakViewers || 1)) * 100}%"
								title="{point.viewerCount} viewers at {new Date(point.timestamp).toLocaleTimeString()}"
							></div>
						</div>
					{/each}
				</div>
				<div class="timeline-labels">
					<span>Start</span>
					<span>Now</span>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.analytics-dashboard {
		background: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* Header */
	.dashboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.dashboard-header h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
	}

	.last-updated {
		font-size: 0.875rem;
		color: #6b7280;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.live-indicator {
		background: #ef4444;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
	}

	/* Loading & Error States */
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: #6b7280;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.retry-button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
	}

	.retry-button:hover {
		background: #2563eb;
	}

	/* Metrics Grid */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.metric-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1.5rem;
		border-radius: 0.5rem;
		text-align: center;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.metric-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.metric-value {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.metric-label {
		font-size: 0.875rem;
		opacity: 0.9;
	}

	/* Quality Section */
	.quality-section {
		margin-bottom: 2rem;
	}

	.quality-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.quality-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.quality-item {
		display: grid;
		grid-template-columns: 150px 1fr 60px;
		align-items: center;
		gap: 1rem;
	}

	.quality-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.quality-bar {
		height: 20px;
		background: #e5e7eb;
		border-radius: 10px;
		overflow: hidden;
	}

	.quality-fill {
		height: 100%;
		background: #10b981;
		transition: width 0.3s ease;
	}

	.quality-fill.warning {
		background: #ef4444;
	}

	.quality-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: #6b7280;
		text-align: right;
	}

	/* Historical Section */
	.historical-section {
		margin-bottom: 2rem;
	}

	.historical-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.historical-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.historical-item {
		padding: 1rem;
		background: #f9fafb;
		border-radius: 0.375rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.historical-label {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.historical-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	/* Timeline Section */
	.timeline-section {
		margin-top: 2rem;
	}

	.timeline-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.timeline-chart {
		display: flex;
		align-items: flex-end;
		gap: 2px;
		height: 150px;
		background: #f9fafb;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.timeline-bar {
		flex: 1;
		height: 100%;
		display: flex;
		align-items: flex-end;
	}

	.bar-fill {
		width: 100%;
		background: linear-gradient(to top, #3b82f6, #60a5fa);
		border-radius: 2px 2px 0 0;
		transition: height 0.3s ease;
		min-height: 2px;
	}

	.timeline-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: #6b7280;
		padding: 0 1rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.metrics-grid {
			grid-template-columns: 1fr 1fr;
		}

		.quality-item {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.quality-label {
			grid-column: 1;
		}

		.quality-bar {
			grid-column: 1;
		}

		.quality-value {
			grid-column: 1;
			text-align: left;
		}
	}
</style>
