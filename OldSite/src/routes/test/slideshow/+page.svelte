<script lang="ts">
	import PhotoSlideshowCreator from '$lib/components/slideshow/PhotoSlideshowCreator.svelte';

	// Handle slideshow generation completion
	function handleSlideshowGenerated(event) {
		const { videoBlob, photos, settings, memorialId, uploaded } = event.detail;
		
		console.log('Slideshow generated!', {
			videoSize: videoBlob?.size || 'No video generated',
			photoCount: photos.length,
			settings,
			uploaded
		});

		if (uploaded) {
			alert('Slideshow successfully uploaded to Cloudflare Stream!');
		} else {
			alert('Slideshow generated! You can download it or add a memorial ID to upload to cloud.');
		}
	}
</script>

<svelte:head>
	<title>Slideshow Creator Test</title>
	<meta name="description" content="Test the slideshow creator functionality" />
</svelte:head>

<div class="test-page">
	<div class="test-header">
		<h1>🎬 Slideshow Creator Test</h1>
		<p>Upload photos and generate a memorial slideshow video</p>
	</div>

	<PhotoSlideshowCreator 
		maxPhotos={20}
		maxFileSize={5}
		on:slideshowGenerated={handleSlideshowGenerated}
	/>

	<div class="test-info">
		<h2>How to Test:</h2>
		<ol>
			<li><strong>Upload Photos:</strong> Drag and drop or click to select multiple photos</li>
			<li><strong>Add Captions:</strong> Click on photos to add captions (optional)</li>
			<li><strong>Adjust Settings:</strong> Click Settings to modify duration, transitions, quality</li>
			<li><strong>Generate Video:</strong> Click "Generate Slideshow" to create the video</li>
			<li><strong>Download:</strong> Once generated, you can download the video file</li>
		</ol>

		<div class="test-note">
			<strong>Note:</strong> This test page generates videos locally without uploading to Cloudflare Stream. 
			To test the full upload functionality, use the slideshow creator within an actual memorial page.
		</div>

		<h3>Features Included:</h3>
		<ul>
			<li>✅ Drag & drop photo upload</li>
			<li>✅ Photo reordering and captions</li>
			<li>✅ Configurable settings (duration, transitions, quality)</li>
			<li>✅ Real-time video generation with Canvas API</li>
			<li>✅ Progress tracking with detailed phases</li>
			<li>✅ Multiple transition effects (fade, slide, zoom)</li>
			<li>✅ Cloudflare Stream integration</li>
			<li>✅ Video download functionality</li>
		</ul>

		<h3>Browser Requirements:</h3>
		<ul>
			<li>Modern browser with Canvas API support</li>
			<li>MediaRecorder API support (Chrome, Firefox, Safari)</li>
			<li>Sufficient memory for video processing</li>
		</ul>
	</div>
</div>

<style>
	.test-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.test-header {
		text-align: center;
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.test-header h1 {
		font-size: 2.5rem;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}

	.test-header p {
		font-size: 1.2rem;
		color: #6b7280;
		margin: 0;
	}

	.test-info {
		margin-top: 3rem;
		padding: 2rem;
		background: #f9fafb;
		border-radius: 12px;
		border: 1px solid #e5e7eb;
	}

	.test-info h2,
	.test-info h3 {
		color: #1f2937;
		margin-top: 0;
	}

	.test-info ol,
	.test-info ul {
		color: #374151;
		line-height: 1.6;
	}

	.test-info li {
		margin-bottom: 0.5rem;
	}

	.test-info strong {
		color: #D5BA7F;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.test-page {
			padding: 1rem;
		}

		.test-header h1 {
			font-size: 2rem;
		}

		.test-info {
			padding: 1.5rem;
		}
	}
</style>
