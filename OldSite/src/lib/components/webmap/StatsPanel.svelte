<script lang="ts">
	import { projectStats, isLoadingStats } from '$lib/stores/webmap';

	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	function getLanguagePercentage(count: number, total: number): number {
		return Math.round((count / total) * 100);
	}
</script>

<div class="stats-panel">
	<div class="panel-header">
		<h2 class="panel-title">📊 Project Stats</h2>
	</div>

	{#if $isLoadingStats}
		<div class="loading-state">
			<div class="spinner"></div>
			<p class="text-sm text-gray-400">Loading statistics...</p>
		</div>
	{:else if $projectStats}
		<div class="stats-content">
			<div class="stat-section">
				<h3 class="section-title">Overview</h3>
				<div class="stat-grid">
					<div class="stat-item">
						<div class="stat-value">{formatNumber($projectStats.totalFiles)}</div>
						<div class="stat-label">Total Files</div>
					</div>
					<div class="stat-item">
						<div class="stat-value">{formatNumber($projectStats.totalFolders)}</div>
						<div class="stat-label">Folders</div>
					</div>
					<div class="stat-item">
						<div class="stat-value">{formatNumber($projectStats.totalLines)}</div>
						<div class="stat-label">Lines of Code</div>
					</div>
				</div>
			</div>

			<div class="stat-section">
				<h3 class="section-title">📈 Languages</h3>
				<div class="language-list">
					{#each Object.entries($projectStats.languageBreakdown).sort(([,a], [,b]) => b - a) as [language, count]}
						<div class="language-item">
							<div class="language-header">
								<span class="language-name">{language}</span>
								<span class="language-count">{count} files</span>
							</div>
							<div class="progress-bar">
								<div
									class="progress-fill"
									style="width: {getLanguagePercentage(count, $projectStats.totalFiles)}%"
								></div>
							</div>
							<div class="language-percent">
								{getLanguagePercentage(count, $projectStats.totalFiles)}%
							</div>
						</div>
					{/each}
				</div>
			</div>

			{#if $projectStats.largestFiles.length > 0}
				<div class="stat-section">
					<h3 class="section-title">📦 Largest Files</h3>
					<div class="file-list">
						{#each $projectStats.largestFiles.slice(0, 5) as file}
							<div class="file-list-item">
								<div class="file-list-name" title={file.path}>
									{file.path.split(/[/\\]/).pop()}
								</div>
								<div class="file-list-meta">
									{file.lines} lines
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if $projectStats.recentlyModified.length > 0}
				<div class="stat-section">
					<h3 class="section-title">⏰ Recently Modified</h3>
					<div class="file-list">
						{#each $projectStats.recentlyModified.slice(0, 5) as file}
							<div class="file-list-item">
								<div class="file-list-name" title={file.path}>
									{file.path.split(/[/\\]/).pop()}
								</div>
								<div class="file-list-meta">
									{new Date(file.date).toLocaleDateString()}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="empty-state">
			<p class="text-sm text-gray-400">No statistics available</p>
		</div>
	{/if}
</div>

<style>
	.stats-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.panel-header {
		padding: 1rem;
		border-bottom: 1px solid #334155;
	}

	.panel-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.stats-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.stat-section {
		margin-bottom: 1.5rem;
	}

	.stat-section:last-child {
		margin-bottom: 0;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.stat-item {
		padding: 0.75rem;
		background-color: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #3b82f6;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.language-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.language-item {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.language-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.language-name {
		font-size: 0.875rem;
		color: #e2e8f0;
		font-weight: 500;
	}

	.language-count {
		font-size: 0.75rem;
		color: #64748b;
	}

	.progress-bar {
		height: 6px;
		background-color: #334155;
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #3b82f6, #8b5cf6);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.language-percent {
		font-size: 0.75rem;
		color: #64748b;
		text-align: right;
	}

	.file-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.file-list-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background-color: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.25rem;
		gap: 0.5rem;
	}

	.file-list-name {
		font-size: 0.75rem;
		color: #e2e8f0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.file-list-meta {
		font-size: 0.75rem;
		color: #64748b;
		flex-shrink: 0;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid #334155;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
	}
</style>
