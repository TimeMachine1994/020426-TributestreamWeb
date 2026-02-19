<script>
	console.log('🔗 LiveUrlPreview component initializing');

	let { lovedOneName = $bindable('') } = $props();

	// Generate slug from loved one's name
	let slug = $derived.by(() => {
		console.log('📝 Generating slug for:', lovedOneName);

		if (!lovedOneName || lovedOneName.trim() === '') {
			return '';
		}

		// Convert to lowercase, replace spaces with hyphens, remove special characters
		const generatedSlug = lovedOneName
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
			.replace(/\s+/g, '-') // Replace spaces with hyphens
			.replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
			.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

		console.log('✨ Generated slug:', generatedSlug);
		return generatedSlug;
	});

	// Generate full URL
	let fullUrl = $derived.by(() => {
		if (!slug) return '';
		const baseUrl = 'https://yoursite.com';
		const fullSlug = `celebration-of-life-for-${slug}`;
		const url = `${baseUrl}/${fullSlug}`;
		console.log('🌐 Generated full URL:', url);
		return url;
	});

	// Copy URL to clipboard
	async function copyToClipboard() {
		console.log('📋 Copying URL to clipboard:', fullUrl);
		try {
			await navigator.clipboard.writeText(fullUrl);
			console.log('✅ URL copied successfully');
			// You could add a toast notification here
		} catch (err) {
			console.error('❌ Failed to copy URL:', err);
		}
	}
</script>

<div class="live-url-preview">
	<div class="preview-header">
		<h3>🔗 Live Memorial URL Preview</h3>
		<p class="preview-description">
			This is how your memorial page URL will look. It updates automatically as you type the loved
			one's name.
		</p>
	</div>

	{#if fullUrl}
		<div class="url-display">
			<div class="url-container">
				<span class="url-text">{fullUrl}</span>
				<button
					type="button"
					class="copy-button"
					onclick={copyToClipboard}
					title="Copy URL to clipboard"
				>
					📋 Copy
				</button>
			</div>
			<div class="url-info">
				<p class="url-note">
					✨ This URL will be automatically generated when you create the memorial. Family and
					friends can use this link to visit the memorial page.
				</p>
			</div>
		</div>
	{:else}
		<div class="url-placeholder">
			<p class="placeholder-text">
				Enter your loved ones name below to preview your custom URL.
			</p>
		</div>
	{/if}
</div>

<style>
	.live-url-preview {
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		border: 2px solid #cbd5e1;
		border-radius: 12px;
		padding: 1.5rem;
		margin: 1rem 0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.preview-header h3 {
		margin: 0 0 0.5rem 0;
		color: #1e293b;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.preview-description {
		margin: 0 0 1rem 0;
		color: #64748b;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.url-display {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.url-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.url-text {
		flex: 1;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		color: #3b82f6;
		background: #eff6ff;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		border: 1px solid #bfdbfe;
		word-break: break-all;
	}

	.copy-button {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.copy-button:hover {
		background: #2563eb;
	}

	.copy-button:active {
		background: #1d4ed8;
		transform: translateY(1px);
	}

	.url-info {
		border-top: 1px solid #f1f5f9;
		padding-top: 0.75rem;
	}

	.url-note {
		margin: 0;
		color: #64748b;
		font-size: 0.8125rem;
		line-height: 1.5;
	}

	.url-placeholder {
		background: #f8fafc;
		border: 2px dashed #cbd5e1;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
	}

	.placeholder-text {
		margin: 0;
		color: #64748b;
		font-size: 0.875rem;
		font-style: italic;
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.live-url-preview {
			padding: 1rem;
		}

		.url-container {
			flex-direction: column;
			align-items: stretch;
		}

		.copy-button {
			align-self: center;
			width: fit-content;
		}

		.url-text {
			font-size: 0.8125rem;
		}
	}
</style>
