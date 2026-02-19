<script lang="ts">
	import { selectedFileContent, viewState, isLoadingFile } from '$lib/stores/webmap';
	import { onMount } from 'svelte';

	let showCopyNotification = $state(false);

	async function loadFileContent(filePath: string) {
		isLoadingFile.set(true);
		try {
			const response = await fetch(`/webmap/api/file-content?path=${encodeURIComponent(filePath)}`);
			const data = await response.json();
			
			if (response.ok) {
				selectedFileContent.set(data);
			} else {
				selectedFileContent.set(null);
				console.error('Failed to load file:', data.error);
			}
		} catch (error) {
			console.error('Error loading file content:', error);
			selectedFileContent.set(null);
		} finally {
			isLoadingFile.set(false);
		}
	}

	$effect(() => {
		if ($viewState.selectedFile) {
			loadFileContent($viewState.selectedFile);
		}
	});

	function copyCode() {
		if ($selectedFileContent) {
			navigator.clipboard.writeText($selectedFileContent.content);
			showCopyNotification = true;
			setTimeout(() => {
				showCopyNotification = false;
			}, 2000);
		}
	}

	function downloadFile() {
		if ($selectedFileContent) {
			const blob = new Blob([$selectedFileContent.content], { type: 'text/plain' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = $selectedFileContent.name;
			a.click();
			URL.revokeObjectURL(url);
		}
	}
</script>

<div class="file-viewer">
	{#if $isLoadingFile}
		<div class="loading-state">
			<div class="spinner"></div>
			<p class="text-sm text-gray-400">Loading file...</p>
		</div>
	{:else if $selectedFileContent}
		<div class="viewer-header">
			<div class="file-info">
				<span class="file-name">{$selectedFileContent.name}</span>
				<span class="file-meta">{$selectedFileContent.lines} lines • {$selectedFileContent.language}</span>
			</div>
			<div class="viewer-actions">
				<button class="btn-action" onclick={copyCode} title="Copy code" aria-label="Copy code to clipboard">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
						<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
					</svg>
				</button>
				<button class="btn-action" onclick={downloadFile} title="Download file" aria-label="Download file">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" x2="12" y1="15" y2="3" />
					</svg>
				</button>
			</div>
		</div>

		<div class="code-container">
			<pre class="code-block"><code>{#each $selectedFileContent.content.split('\n') as line, i}<span class="line-number">{i + 1}</span><span class="line-content">{line}</span>
{/each}</code></pre>
		</div>

		{#if showCopyNotification}
			<div class="notification">✓ Code copied to clipboard</div>
		{/if}
	{:else}
		<div class="empty-state">
			<div class="empty-icon">📄</div>
			<p class="text-base text-gray-400">No file selected</p>
			<p class="text-sm text-gray-500">Click on a file to view its contents</p>
		</div>
	{/if}
</div>

<style>
	.file-viewer {
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: #0f172a;
		position: relative;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		gap: 1rem;
		height: 100%;
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

	.viewer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background-color: #1e293b;
		border-bottom: 1px solid #334155;
	}

	.file-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.file-name {
		font-weight: 600;
		color: #e2e8f0;
		font-size: 0.875rem;
	}

	.file-meta {
		font-size: 0.75rem;
		color: #64748b;
	}

	.viewer-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-action {
		padding: 0.375rem;
		border-radius: 0.25rem;
		background-color: transparent;
		border: 1px solid #334155;
		color: #94a3b8;
		cursor: pointer;
		transition: all 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-action:hover {
		background-color: #334155;
		border-color: #475569;
		color: #e2e8f0;
	}

	.code-container {
		flex: 1;
		overflow: auto;
		background-color: #0f172a;
	}

	.code-block {
		margin: 0;
		padding: 1rem;
		font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		color: #e2e8f0;
		white-space: pre;
		overflow-x: auto;
	}

	.code-block code {
		display: block;
	}

	.line-number {
		display: inline-block;
		width: 3rem;
		text-align: right;
		color: #475569;
		user-select: none;
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.line-content {
		color: #e2e8f0;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		height: 100%;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.notification {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		padding: 0.75rem 1rem;
		background-color: #10b981;
		color: white;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		animation: slideIn 0.3s ease;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(1rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
