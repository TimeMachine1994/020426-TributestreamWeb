<script lang="ts">
	import type { PageData } from './$types';
	import BrowserStreamer from '$lib/components/BrowserStreamer.svelte';
	import { Copy, Check, ExternalLink } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import { db } from '$lib/firebase';
	import { doc, onSnapshot } from 'firebase/firestore';

	let { data }: { data: PageData } = $props();

	let isStreaming = $state(false);
	let copiedHls = $state(false);
	let copiedIframe = $state(false);
	let copiedPreview = $state(false);

	// Reactive URLs - these get set by Cloudflare webhooks when stream goes live
	let hlsUrl = $state(data.stream.hlsUrl || '');
	let liveWatchUrl = $state(data.stream.liveWatchUrl || '');
	
	// Immediate iframe URL for OBS Browser Source (works while streaming, no webhook needed)
	const iframeUrl = data.stream.cloudflareInputId 
		? `https://iframe.cloudflarestream.com/${data.stream.cloudflareInputId}`
		: '';
	
	console.log('🔧 [MOBILE] Initial HLS URL from server:', hlsUrl);
	console.log('🔧 [MOBILE] Cloudflare Input ID:', data.stream.cloudflareInputId);
	console.log('🔧 [MOBILE] Iframe URL (immediate):', iframeUrl);
	
	let unsubscribe: (() => void) | null = null;

	// Listen for real-time updates from Firestore when webhook arrives
	onMount(() => {
		const streamRef = doc(db, 'streams', data.stream.id);
		
		unsubscribe = onSnapshot(streamRef, (snapshot) => {
			if (snapshot.exists()) {
				const streamData = snapshot.data();
				console.log('📡 [MOBILE] Stream updated:', {
					status: streamData.status,
					hlsUrl: streamData.hlsUrl,
					liveWatchUrl: streamData.liveWatchUrl,
					playbackUrl: streamData.playbackUrl,
					embedUrl: streamData.embedUrl,
					cloudflareInputId: streamData.streamCredentials?.cloudflareInputId,
					fullData: streamData
				});
				
				// Update URLs when webhook sets them
				if (streamData.hlsUrl) {
					hlsUrl = streamData.hlsUrl;
					console.log('✅ [MOBILE] HLS URL received:', hlsUrl);
				} else {
					console.log('⚠️ [MOBILE] No hlsUrl in stream data yet');
				}
				
				if (streamData.liveWatchUrl) {
					liveWatchUrl = streamData.liveWatchUrl;
					console.log('✅ [MOBILE] Live watch URL received:', liveWatchUrl);
				} else {
					console.log('⚠️ [MOBILE] No liveWatchUrl in stream data yet');
				}
			}
		});
		
		console.log('👂 [MOBILE] Listening for stream updates...');
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
			console.log('🔇 [MOBILE] Stopped listening for stream updates');
		}
	});

	async function copyHlsUrl() {
		try {
			await navigator.clipboard.writeText(hlsUrl);
			copiedHls = true;
			setTimeout(() => (copiedHls = false), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			alert('Failed to copy URL. Please copy manually.');
		}
	}

	async function copyIframeUrl() {
		try {
			await navigator.clipboard.writeText(iframeUrl);
			copiedIframe = true;
			setTimeout(() => (copiedIframe = false), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			alert('Failed to copy URL. Please copy manually.');
		}
	}

	async function copyPreviewUrl() {
		try {
			await navigator.clipboard.writeText(liveWatchUrl);
			copiedPreview = true;
			setTimeout(() => (copiedPreview = false), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			alert('Failed to copy URL. Please copy manually.');
		}
	}

	function handleStreamStart() {
		console.log('🔴 [MOBILE] Stream started!');
		isStreaming = true;
	}

	function handleStreamStop() {
		console.log('⏹️ [MOBILE] Stream stopped');
		isStreaming = false;
	}
</script>

<svelte:head>
	<title>Mobile Stream - {data.stream.title} | TributeStream</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<div class="mobile-stream-page">
	<div class="container">
		<!-- Header -->
		<div class="header">
			<div class="header-content">
				<h1>📱 Mobile Camera</h1>
				{#if data.memorial}
					<p class="memorial-info">
						Streaming for <strong>{data.memorial.lovedOneName}</strong>
					</p>
				{/if}
				<p class="stream-title">{data.stream.title}</p>
			</div>
		</div>

		<!-- Streaming Component -->
		<div class="streamer-section">
			<BrowserStreamer
				streamId={data.stream.id}
				whipUrl={data.stream.whipUrl}
				onStreamStart={handleStreamStart}
				onStreamStop={handleStreamStop}
			/>
		</div>

		<!-- OBS Integration Instructions -->
		<div class="obs-section">
			<div class="obs-header">
				<h2>📹 Add to OBS</h2>
				{#if isStreaming}
					<span class="badge badge-live">LIVE</span>
				{:else}
					<span class="badge badge-idle">NOT STREAMING</span>
				{/if}
			</div>

			{#if hlsUrl}
				<!-- HLS URL is available from webhook -->
				<p class="obs-description success-message">
					✅ <strong>HLS URL Ready!</strong> Copy the URL below and add it to OBS as a <strong>Media Source</strong>.
				</p>

				<div class="url-box recommended">
					<div class="url-header">
						<label for="hls-url" class="url-label">✅ HLS Playback URL (For OBS)</label>
						<span class="badge-small">READY</span>
					</div>
					<div class="url-input-group">
						<input
							id="hls-url"
							type="text"
							readonly
							value={hlsUrl}
							class="url-input"
							onclick={(e) => e.currentTarget.select()}
						/>
						<button
							class="copy-btn copy-btn-primary"
							onclick={copyHlsUrl}
							title="Copy HLS URL"
						>
							{#if copiedHls}
								<Check class="icon-check" />
								Copied!
							{:else}
								<Copy class="icon-copy" />
								Copy
							{/if}
						</button>
					</div>
					<p class="url-hint">Use this with <strong>Media Source</strong> in OBS. Uncheck "Local File" and paste this URL.</p>
				</div>
			{:else if isStreaming && iframeUrl}
				<!-- Streaming - show iframe URL immediately -->
				<p class="obs-description success-message">
					✅ <strong>Stream Active!</strong> Use the iframe URL below with OBS <strong>Browser Source</strong>.
				</p>

				<div class="url-box recommended">
					<div class="url-header">
						<label for="iframe-url" class="url-label">🌐 Iframe URL (For OBS Browser Source)</label>
						<span class="badge-small">LIVE</span>
					</div>
					<div class="url-input-group">
						<input
							id="iframe-url"
							type="text"
							readonly
							value={iframeUrl}
							class="url-input"
							onclick={(e) => e.currentTarget.select()}
						/>
						<button
							class="copy-btn copy-btn-primary"
							onclick={copyIframeUrl}
							title="Copy Iframe URL"
						>
							{#if copiedIframe}
								<Check class="icon-check" />
								Copied!
							{:else}
								<Copy class="icon-copy" />
								Copy
							{/if}
						</button>
					</div>
					<p class="url-hint">In OBS: Add <strong>Browser Source</strong> → Paste this URL → Set size to 1920x1080 → Done! ✅</p>
					{#if hlsUrl}
						<p class="url-hint" style="margin-top: 0.5rem; padding: 0.5rem; background: #d4edda; border-left: 3px solid #28a745; border-radius: 4px;">
							💡 <strong>Alternative:</strong> An HLS URL is also available below if you prefer to use OBS Media Source instead of Browser Source.
						</p>
					{/if}
				</div>
			{:else}
				<!-- Not streaming yet -->
				<p class="obs-description waiting-message">
					⏳ <strong>Ready to stream</strong> Click "Start Streaming" above, and the iframe URL will appear instantly for OBS Browser Source.
				</p>

				<div class="url-box waiting">
					<div class="url-header">
						<label class="url-label">Iframe URL (Pending)</label>
						<span class="badge-small badge-waiting">Waiting</span>
					</div>
					<p class="url-hint">Start streaming to get the URL for OBS Browser Source.</p>
				</div>
			{/if}

			{#if liveWatchUrl}
				<!-- Preview URL for viewing in browser -->
				<div class="url-box">
					<label for="preview-url" class="url-label">Preview URL (View in Browser)</label>
					<div class="url-input-group">
						<input
							id="preview-url"
							type="text"
							readonly
							value={liveWatchUrl}
							class="url-input"
							onclick={(e) => e.currentTarget.select()}
						/>
						<button
							class="copy-btn"
							onclick={copyPreviewUrl}
							title="Copy Preview URL"
						>
							{#if copiedPreview}
								<Check class="icon-check" />
								Copied!
							{:else}
								<Copy class="icon-copy" />
								Copy
							{/if}
						</button>
					</div>
					<p class="url-hint">Open this URL in a browser to preview the live stream</p>
				</div>
			{/if}

			<!-- OBS Instructions -->
			<details class="obs-instructions">
				<summary>📖 How to add to OBS</summary>
				
				<div class="instruction-steps">
					<h4>Step-by-Step (Browser Source Method):</h4>
					<ol>
						<li>Click "Start Streaming" above</li>
						<li>Copy the iframe URL that appears immediately</li>
						<li>In OBS Studio, click <strong>+</strong> in Sources panel</li>
						<li>Select <strong>Browser Source</strong></li>
						<li>Name it (e.g., "Mobile Camera")</li>
						<li>Paste the iframe URL into the <strong>URL</strong> field</li>
						<li>Set Width: <strong>1920</strong> and Height: <strong>1080</strong></li>
						<li>Click OK - your phone camera appears instantly in OBS! 📱→🖥️</li>
					</ol>

					<p><strong>💡 Tip:</strong> The iframe URL works immediately - no waiting required! If you prefer using Media Source instead, an HLS URL will appear after 10-30 seconds.</p>
				</div>
			</details>

			{#if data.memorial?.fullSlug}
				<div class="memorial-link">
					<a
						href="/{data.memorial.fullSlug}"
						target="_blank"
						class="link-btn"
					>
						<ExternalLink class="icon" />
						View Memorial Page
					</a>
				</div>
			{/if}
		</div>

		<!-- Tips -->
		<div class="tips-section">
			<h3>💡 Tips</h3>
			<ul>
				<li><strong>Keep your phone plugged in</strong> - Streaming drains battery quickly</li>
				<li><strong>Use WiFi if possible</strong> - More stable than cellular</li>
				<li><strong>Keep the app open</strong> - Don't minimize or switch tabs</li>
				<li><strong>Landscape mode</strong> - Rotate phone sideways for better composition</li>
				<li><strong>Test first</strong> - Start streaming and check OBS before the service</li>
			</ul>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #f5f5f5;
	}

	.mobile-stream-page {
		min-height: 100vh;
		padding: 1rem;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.header-content h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.memorial-info {
		margin: 0.5rem 0;
		opacity: 0.95;
		font-size: 1rem;
	}

	.stream-title {
		margin: 0.25rem 0 0 0;
		opacity: 0.9;
		font-size: 0.9rem;
	}

	.streamer-section {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.obs-section {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.obs-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.obs-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.badge-live {
		background: #dc3545;
		color: white;
		animation: pulse 2s ease-in-out infinite;
	}

	.badge-idle {
		background: #6c757d;
		color: white;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.obs-description {
		color: #666;
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.url-box {
		margin-bottom: 1.5rem;
		padding: 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: #fafafa;
	}

	.url-box.recommended {
		border-color: #667eea;
		background: #f0f4ff;
	}

	.url-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.url-label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.badge-small {
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 600;
		background: #28a745;
		color: white;
		text-transform: uppercase;
	}

	.url-hint {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: #666;
	}

	.url-input-group {
		display: flex;
		gap: 0.5rem;
	}

	.url-input {
		flex: 1;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		background: #f8f9fa;
	}

	.url-input:focus {
		outline: none;
		border-color: #667eea;
	}

	.copy-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.copy-btn:hover {
		background: #5568d3;
		transform: translateY(-1px);
	}

	.copy-btn:active {
		transform: translateY(0);
	}

	.copy-btn-primary {
		background: #28a745;
	}

	.copy-btn-primary:hover {
		background: #218838;
	}

	.icon-check,
	.icon-copy {
		width: 1rem;
		height: 1rem;
	}

	.success-message {
		color: #155724;
		background: #d4edda;
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid #c3e6cb;
	}

	.waiting-message {
		color: #856404;
		background: #fff3cd;
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid #ffeeba;
	}

	.url-box.waiting {
		background: #fafafa;
		border-color: #ddd;
	}

	.badge-waiting {
		background: #6c757d;
	}

	/* Loading spinners */
	.spinner,
	.spinner-small {
		display: inline-block;
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-left-color: #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		border-width: 3px;
		vertical-align: middle;
		margin-right: 0.5rem;
	}

	.spinner-small {
		width: 0.875rem;
		height: 0.875rem;
		border-width: 2px;
		vertical-align: middle;
		margin-right: 0.375rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.instruction-steps {
		padding: 1rem;
	}

	.instruction-steps h4 {
		margin: 0 0 0.75rem 0;
		color: #667eea;
	}

	.instruction-steps ol {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.instruction-steps li {
		margin: 0.5rem 0;
		line-height: 1.6;
	}

	.instruction-steps p {
		margin: 1rem 0 0 0;
		padding: 0.75rem;
		background: #e7f3ff;
		border-left: 3px solid #667eea;
		border-radius: 4px;
	}

	.obs-instructions {
		margin-top: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		padding: 1rem;
	}

	.obs-instructions summary {
		cursor: pointer;
		font-weight: 600;
		color: #667eea;
		user-select: none;
	}

	.obs-instructions summary:hover {
		color: #5568d3;
	}

	.obs-instructions ol {
		margin: 1rem 0 0 0;
		padding-left: 1.5rem;
	}

	.obs-instructions li {
		margin: 0.5rem 0;
		line-height: 1.5;
	}

	.memorial-link {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e0e0e0;
	}

	.link-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #D5BA7F;
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 600;
		transition: all 0.2s;
	}

	.link-btn:hover {
		background: #C5AA6F;
		transform: translateY(-1px);
	}

	.tips-section {
		background: #fffbf5;
		border: 2px solid #D5BA7F;
		padding: 1.5rem;
		border-radius: 12px;
	}

	.tips-section h3 {
		margin: 0 0 1rem 0;
		color: #8B7355;
	}

	.tips-section ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.tips-section li {
		margin: 0.75rem 0;
		color: #5a4a3a;
		line-height: 1.5;
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		.mobile-stream-page {
			padding: 0.5rem;
		}

		.header-content h1 {
			font-size: 1.5rem;
		}

		.url-input-group {
			flex-direction: column;
		}

		.copy-btn {
			justify-content: center;
		}
	}
</style>
