<script lang="ts">
	import { Upload, Play, Pause, SkipForward, SkipBack, Settings, X, Download, Video, Code, Share, Heart } from 'lucide-svelte';

	interface Photo {
		id: string;
		file: File;
		url: string;
		caption?: string;
	}

	let photos: Photo[] = $state([]);
	let currentSlide = $state(0);
	let isPlaying = $state(false);
	let slideDuration = $state(3000); // 3 seconds
	let transition = $state('fade');
	let playInterval: number | null = null;
	let isTransitioning = $state(false);
	let slideKey = $state(0); // Force re-render for transitions
	
	// Video export states
	let isExporting = $state(false);
	let exportProgress = $state(0);
	let canvas: HTMLCanvasElement | undefined = undefined;
	let ctx: CanvasRenderingContext2D | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let recordedChunks: Blob[] = [];
	let videoResolution = $state('1920x1080');
	let videoFormat = $state('webm');
	
	// Memorial integration states
	let availableMemorials: any[] = $state([]);
	let selectedMemorial = $state('');
	let isEmbedding = $state(false);
	let slideshowTitle = $state('Photo Slideshow');
	
	// Editing states
	let isEditMode = $state(false);
	let editingSlideshowId = $state('');
	
	// Check for edit mode on component mount
	$effect(() => {
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const editData = urlParams.get('edit');
			
			if (editData) {
				try {
					const slideshowData = JSON.parse(decodeURIComponent(editData));
					loadSlideshowForEditing(slideshowData);
				} catch (error) {
					console.error('Error parsing edit data:', error);
				}
			}
		}
	});
	
	// Load existing slideshow data for editing
	async function loadSlideshowForEditing(slideshowData: any) {
		isEditMode = true;
		editingSlideshowId = slideshowData.id;
		slideshowTitle = slideshowData.title;
		selectedMemorial = slideshowData.memorialId;
		
		// Convert base64 data back to File objects for proper editing
		const loadedPhotos = await Promise.all(
			slideshowData.photos.map(async (photo: any) => {
				try {
					// Convert base64 to File object for better editing experience
					const file = await base64ToFile(photo.data, `photo-${photo.id}.jpg`);
					return {
						id: photo.id,
						file: file,
						url: URL.createObjectURL(file),
						caption: photo.caption || ''
					};
				} catch (error) {
					console.warn('Failed to convert photo to file:', error);
					// Fallback to base64 URL if conversion fails
					return {
						id: photo.id,
						file: null,
						url: photo.data,
						caption: photo.caption || ''
					};
				}
			})
		);
		
		photos = loadedPhotos;
		
		// Load settings
		if (slideshowData.settings) {
			slideDuration = slideshowData.settings.photoDuration * 1000 || 3000;
			transition = slideshowData.settings.transitionType || 'fade';
		}
		
		console.log('Loaded slideshow for editing with', photos.length, 'photos');
	}
	
	// Convert base64 to File object
	async function base64ToFile(base64Data: string, filename: string): Promise<File> {
		const response = await fetch(base64Data);
		const blob = await response.blob();
		return new File([blob], filename, { type: blob.type });
	}

	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			Array.from(input.files).forEach(file => {
				if (file.type.startsWith('image/')) {
					const photo: Photo = {
						id: crypto.randomUUID(),
						file,
						url: URL.createObjectURL(file)
					};
					photos.push(photo);
				}
			});
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const files = event.dataTransfer?.files;
		if (files) {
			Array.from(files).forEach(file => {
				if (file.type.startsWith('image/')) {
					const photo: Photo = {
						id: crypto.randomUUID(),
						file,
						url: URL.createObjectURL(file)
					};
					photos.push(photo);
				}
			});
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function removePhoto(id: string) {
		photos = photos.filter(p => p.id !== id);
		if (currentSlide >= photos.length && photos.length > 0) {
			currentSlide = photos.length - 1;
		}
	}
	
	// Photo reordering functions
	let draggedPhotoId: string | null = null;
	
	function handlePhotodragStart(event: DragEvent, photoId: string) {
		draggedPhotoId = photoId;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}
	
	function handlePhotoDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}
	
	function handlePhotoDrop(event: DragEvent, targetPhotoId: string) {
		event.preventDefault();
		
		if (!draggedPhotoId || draggedPhotoId === targetPhotoId) return;
		
		const draggedIndex = photos.findIndex(p => p.id === draggedPhotoId);
		const targetIndex = photos.findIndex(p => p.id === targetPhotoId);
		
		if (draggedIndex === -1 || targetIndex === -1) return;
		
		// Reorder photos array
		const newPhotos = [...photos];
		const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
		newPhotos.splice(targetIndex, 0, draggedPhoto);
		
		photos = newPhotos;
		draggedPhotoId = null;
		
		console.log('Photos reordered');
	}
	
	function handlePhotoDragEnd() {
		draggedPhotoId = null;
	}

	function nextSlide() {
		if (photos.length > 0) {
			isTransitioning = true;
			currentSlide = (currentSlide + 1) % photos.length;
			slideKey += 1;
			setTimeout(() => isTransitioning = false, 500);
		}
	}

	function prevSlide() {
		if (photos.length > 0) {
			isTransitioning = true;
			currentSlide = currentSlide === 0 ? photos.length - 1 : currentSlide - 1;
			slideKey += 1;
			setTimeout(() => isTransitioning = false, 500);
		}
	}

	function togglePlayback() {
		isPlaying = !isPlaying;
		if (isPlaying) {
			playInterval = setInterval(nextSlide, slideDuration);
		} else if (playInterval) {
			clearInterval(playInterval);
			playInterval = null;
		}
	}

	function goToSlide(index: number) {
		if (index !== currentSlide) {
			isTransitioning = true;
			currentSlide = index;
			slideKey += 1;
			setTimeout(() => isTransitioning = false, 500);
		}
	}

	// Video export functions
	async function exportVideo() {
		if (photos.length === 0 || !canvas) return;
		
		isExporting = true;
		exportProgress = 0;
		recordedChunks = [];
		
		// Setup canvas
		const [width, height] = videoResolution.split('x').map(Number);
		canvas.width = width;
		canvas.height = height;
		ctx = canvas.getContext('2d');
		
		if (!ctx) {
			isExporting = false;
			alert('Canvas context not available');
			return;
		}
		
		// Setup MediaRecorder
		const stream = canvas.captureStream(30); // 30 FPS
		mediaRecorder = new MediaRecorder(stream, {
			mimeType: `video/${videoFormat}`,
			videoBitsPerSecond: 2500000 // 2.5 Mbps
		});
		
		mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				recordedChunks.push(event.data);
			}
		};
		
		mediaRecorder.onstop = () => {
			const blob = new Blob(recordedChunks, { type: `video/${videoFormat}` });
			downloadVideo(blob);
			isExporting = false;
		};
		
		mediaRecorder.start();
		
		// Render slideshow
		await renderSlideshow();
		
		mediaRecorder.stop();
	}
	
	async function renderSlideshow() {
		const totalDuration = photos.length * slideDuration;
		const fps = 30;
		const totalFrames = (totalDuration / 1000) * fps;
		const framesPerSlide = (slideDuration / 1000) * fps;
		
		for (let frame = 0; frame < totalFrames; frame++) {
			const slideIndex = Math.floor(frame / framesPerSlide);
			const photo = photos[slideIndex];
			
			if (photo) {
				await drawImageToCanvas(photo.url);
			}
			
			exportProgress = (frame / totalFrames) * 100;
			
			// Wait for next frame
			await new Promise(resolve => setTimeout(resolve, 1000 / fps));
		}
	}
	
	async function drawImageToCanvas(imageUrl: string): Promise<void> {
		return new Promise((resolve) => {
			if (!ctx || !canvas) {
				resolve();
				return;
			}
			
			const img = new Image();
			img.onload = () => {
				if (!ctx || !canvas) {
					resolve();
					return;
				}
				
				// Clear canvas
				ctx.fillStyle = '#000000';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				
				// Calculate aspect ratio and center image
				const imgAspect = img.width / img.height;
				const canvasAspect = canvas.width / canvas.height;
				
				let drawWidth, drawHeight, drawX, drawY;
				
				if (imgAspect > canvasAspect) {
					drawWidth = canvas.width;
					drawHeight = canvas.width / imgAspect;
					drawX = 0;
					drawY = (canvas.height - drawHeight) / 2;
				} else {
					drawWidth = canvas.height * imgAspect;
					drawHeight = canvas.height;
					drawX = (canvas.width - drawWidth) / 2;
					drawY = 0;
				}
				
				ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
				resolve();
			};
			img.src = imageUrl;
		});
	}
	
	function downloadVideo(blob: Blob) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `slideshow.${videoFormat}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
	
	function generateEmbedCode() {
		const embedUrl = `${window.location.origin}/embed/slideshow/${crypto.randomUUID()}`;
		return `<iframe src="${embedUrl}" width="800" height="600" frameborder="0" allowfullscreen></iframe>`;
	}
	
	function copyEmbedCode() {
		const embedCode = generateEmbedCode();
		navigator.clipboard.writeText(embedCode);
		alert('Embed code copied to clipboard!');
	}
	
	// Memorial integration functions
	async function fetchUserMemorials() {
		try {
			const response = await fetch('/api/user/memorials');
			if (response.ok) {
				availableMemorials = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch memorials:', error);
		}
	}
	
	async function embedInMemorial() {
		if (!selectedMemorial || photos.length === 0) return;
		
		isEmbedding = true;
		
		try {
			// Convert photos to base64 for storage
			const photosData = await Promise.all(
				photos.map(async (photo) => {
					// If photo already has base64 data (from editing), use it
					if (photo.url.startsWith('data:')) {
						return {
							id: photo.id,
							data: photo.url,
							caption: photo.caption || ''
						};
					}
					// Otherwise convert file to base64
					const base64 = await fileToBase64(photo.file);
					return {
						id: photo.id,
						data: base64,
						caption: photo.caption || ''
					};
				})
			);
			
			const slideshowData = {
				id: isEditMode ? editingSlideshowId : crypto.randomUUID(),
				title: slideshowTitle,
				photos: photosData,
				settings: {
					photoDuration: slideDuration / 1000, // Convert back to seconds
					transitionType: transition,
					videoQuality: 'medium',
					aspectRatio: '16:9'
				},
				status: 'local_only', // Set status so it appears on memorial pages
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			
			const response = await fetch(`/api/memorials/${selectedMemorial}/slideshow`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(slideshowData)
			});
			
			if (response.ok) {
				const message = isEditMode 
					? 'Slideshow successfully updated!' 
					: 'Slideshow successfully embedded in memorial page!';
				alert(message);
				
				// Navigate back to memorial page
				if (selectedMemorial) {
					window.location.href = `/memorial/${selectedMemorial}`;
				} else {
					// Reset form if not editing
					if (!isEditMode) {
						photos = [];
						selectedMemorial = '';
						slideshowTitle = 'Photo Slideshow';
					}
				}
			} else {
				const message = isEditMode 
					? 'Failed to update slideshow. Please try again.' 
					: 'Failed to embed slideshow. Please try again.';
				alert(message);
			}
		} catch (error) {
			console.error('Error embedding slideshow:', error);
			alert('Error embedding slideshow. Please try again.');
		} finally {
			isEmbedding = false;
		}
	}
	
	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = error => reject(error);
		});
	}

	// Fetch user memorials on mount
	$effect(() => {
		fetchUserMemorials();
	});

	// Cleanup on destroy
	$effect(() => {
		return () => {
			if (playInterval) {
				clearInterval(playInterval);
			}
			// Cleanup object URLs
			photos.forEach(photo => URL.revokeObjectURL(photo.url));
		};
	});
</script>

<div class="slideshow-generator">
	<div class="header">
		<h2 class="title">
			{isEditMode ? '✏️ Edit Slideshow' : 'Photo Slideshow Generator'}
		</h2>
		{#if isEditMode}
			<div class="edit-indicator">
				<span class="edit-badge">Editing: {slideshowTitle}</span>
			</div>
		{/if}
		<p class="subtitle">Create beautiful slideshows from your photos</p>
	</div>
	
	<!-- Upload Section -->
	<div class="upload-section">
		<label 
			class="upload-area"
			ondrop={handleDrop}
			ondragover={handleDragOver}
		>
			<Upload class="upload-icon" />
			<span class="upload-title">Upload Photos</span>
			<span class="upload-subtitle">Drag & drop or click to select multiple images</span>
			<input 
				type="file" 
				multiple 
				accept="image/*" 
				onchange={handleFileUpload} 
				class="file-input" 
			/>
		</label>
	</div>

	{#if photos.length > 0}
		<!-- Photo Grid -->
		<div class="photo-grid">
			<h3 class="grid-title">Photos ({photos.length})</h3>
			<div class="grid">
				{#each photos as photo, index (photo.id)}
					<div 
						class="photo-item" 
						class:active={index === currentSlide}
						class:dragging={draggedPhotoId === photo.id}
						draggable="true"
						ondragstart={(e) => handlePhotodragStart(e, photo.id)}
						ondragover={handlePhotoDragOver}
						ondrop={(e) => handlePhotoDrop(e, photo.id)}
						ondragend={handlePhotoDragEnd}
						onclick={() => goToSlide(index)}
						title="Drag to reorder photos"
					>
						<img src={photo.url} alt="Slide {index + 1}" />
						<button 
							onclick={(e) => { e.stopPropagation(); removePhoto(photo.id); }} 
							class="remove-btn"
							aria-label="Remove photo"
						>
							<X class="w-4 h-4" />
						</button>
						<div class="photo-number">{index + 1}</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Settings Panel -->
		<div class="settings-panel">
			<h3 class="settings-title">
				<Settings class="w-5 h-5" />
				Slideshow Settings
			</h3>
			<div class="settings-grid">
				<div class="setting-item">
					<label for="duration">Slide Duration (seconds)</label>
					<input 
						id="duration"
						type="range" 
						min="1" 
						max="10" 
						step="0.5"
						bind:value={slideDuration}
						oninput={(e) => slideDuration = parseFloat(e.target.value) * 1000}
					/>
					<span class="setting-value">{slideDuration / 1000}s</span>
				</div>
				<div class="setting-item">
					<label for="transition">Transition Effect</label>
					<select id="transition" bind:value={transition}>
						<option value="fade">Fade</option>
						<option value="slide">Slide</option>
						<option value="zoom">Zoom</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Memorial Integration Section -->
		<div class="memorial-section">
			<h3 class="memorial-title">
				<Heart class="w-5 h-5" />
				Add to Memorial Page
			</h3>
			<div class="memorial-grid">
				<div class="memorial-settings">
					<div class="setting-item">
						<label for="slideshow-title">Slideshow Title</label>
						<input 
							id="slideshow-title"
							type="text" 
							bind:value={slideshowTitle}
							placeholder="Enter slideshow title"
							class="memorial-input"
						/>
					</div>
					<div class="setting-item">
						<label for="memorial-select">Select Memorial</label>
						<select id="memorial-select" bind:value={selectedMemorial} class="memorial-select">
							<option value="">Choose a memorial...</option>
							{#each availableMemorials as memorial}
								<option value={memorial.id}>{memorial.lovedOneName}</option>
							{/each}
						</select>
					</div>
				</div>
				
				<div class="memorial-actions">
					<button 
						onclick={embedInMemorial} 
						class="memorial-btn primary"
						disabled={isEmbedding || photos.length === 0 || !selectedMemorial}
					>
						<Heart class="w-5 h-5" />
						{#if isEmbedding}
							{isEditMode ? 'Updating...' : 'Embedding...'}
						{:else}
							{isEditMode ? 'Update Slideshow' : 'Embed in Memorial'}
						{/if}
					</button>
				</div>
			</div>
			
			{#if availableMemorials.length === 0}
				<div class="no-memorials">
					<p>No memorials found. <a href="/memorials/create" class="memorial-link">Create a memorial</a> to add slideshows.</p>
				</div>
			{/if}
		</div>

		<!-- Export Section -->
		<div class="export-section">
			<h3 class="export-title">
				<Video class="w-5 h-5" />
				Export & Share
			</h3>
			<div class="export-grid">
				<div class="export-settings">
					<div class="setting-item">
						<label for="resolution">Video Resolution</label>
						<select id="resolution" bind:value={videoResolution}>
							<option value="1920x1080">1080p (1920x1080)</option>
							<option value="1280x720">720p (1280x720)</option>
							<option value="854x480">480p (854x480)</option>
						</select>
					</div>
					<div class="setting-item">
						<label for="format">Video Format</label>
						<select id="format" bind:value={videoFormat}>
							<option value="webm">WebM</option>
							<option value="mp4">MP4</option>
						</select>
					</div>
				</div>
				
				<div class="export-actions">
					<button 
						onclick={exportVideo} 
						class="export-btn primary"
						disabled={isExporting || photos.length === 0}
					>
						<Download class="w-5 h-5" />
						{#if isExporting}
							Exporting... {Math.round(exportProgress)}%
						{:else}
							Download Video
						{/if}
					</button>
					
					<button 
						onclick={copyEmbedCode} 
						class="export-btn secondary"
						disabled={photos.length === 0}
					>
						<Code class="w-5 h-5" />
						Get Embed Code
					</button>
				</div>
			</div>
			
			{#if isExporting}
				<div class="export-progress">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {exportProgress}%"></div>
					</div>
					<p class="progress-text">Rendering video... {Math.round(exportProgress)}%</p>
				</div>
			{/if}
		</div>

		<!-- Hidden Canvas for Video Export -->
		<canvas bind:this={canvas} class="hidden-canvas"></canvas>

		<!-- Preview Section -->
		<div class="preview-section">
			<h3 class="preview-title">Preview</h3>
			<div class="preview-container">
				{#if photos[currentSlide]}
					{#key slideKey}
						<img 
							src={photos[currentSlide].url} 
							alt="Current slide" 
							class="preview-image transition-{transition}" 
						/>
					{/key}
				{/if}
				
				<!-- Slide Counter -->
				<div class="slide-counter">
					{currentSlide + 1} / {photos.length}
				</div>
			</div>
			
			<!-- Controls -->
			<div class="controls">
				<button onclick={prevSlide} class="control-btn" disabled={photos.length <= 1}>
					<SkipBack class="w-5 h-5" />
				</button>
				<button onclick={togglePlayback} class="control-btn play-btn">
					{#if isPlaying}
						<Pause class="w-6 h-6" />
					{:else}
						<Play class="w-6 h-6" />
					{/if}
				</button>
				<button onclick={nextSlide} class="control-btn" disabled={photos.length <= 1}>
					<SkipForward class="w-5 h-5" />
				</button>
			</div>

			<!-- Thumbnail Navigation -->
			<div class="thumbnail-nav">
				{#each photos as photo, index (photo.id)}
					<button 
						class="thumbnail" 
						class:active={index === currentSlide}
						onclick={() => goToSlide(index)}
					>
						<img src={photo.url} alt="Thumbnail {index + 1}" />
					</button>
				{/each}
			</div>
		</div>
	{:else}
		<div class="empty-state">
			<Upload class="empty-icon" />
			<h3>No photos uploaded yet</h3>
			<p>Upload some photos to get started with your slideshow</p>
		</div>
	{/if}
</div>

<style>
	.slideshow-generator {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0;
	}
	
	.edit-indicator {
		margin: 1rem 0;
	}
	
	.edit-badge {
		display: inline-block;
		background: linear-gradient(135deg, #D5BA7F 0%, #c4a96e 100%);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 500;
		box-shadow: 0 2px 4px rgba(213, 186, 127, 0.3);
	}

	/* Upload Section */
	.upload-section {
		margin-bottom: 3rem;
	}

	.upload-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 3px dashed #d1d5db;
		border-radius: 16px;
		padding: 4rem 2rem;
		cursor: pointer;
		transition: all 0.3s ease;
		background: #fafafa;
	}

	.upload-area:hover {
		border-color: #3b82f6;
		background: #f0f9ff;
		transform: translateY(-2px);
	}

	.upload-icon {
		width: 3rem;
		height: 3rem;
		color: #9ca3af;
		margin-bottom: 1rem;
	}

	.upload-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.upload-subtitle {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.file-input {
		display: none;
	}

	/* Photo Grid */
	.photo-grid {
		margin-bottom: 3rem;
	}

	.grid-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.photo-item {
		position: relative;
		aspect-ratio: 1;
		border-radius: 12px;
		overflow: hidden;
		border: 3px solid transparent;
		transition: all 0.2s ease;
		cursor: pointer;
		background: #f3f4f6;
	}

	.photo-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}

	.photo-item.active {
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}
	
	.photo-item.dragging {
		opacity: 0.5;
		transform: rotate(5deg) scale(0.95);
		z-index: 1000;
	}
	
	.photo-item {
		cursor: grab;
	}
	
	.photo-item:active {
		cursor: grabbing;
	}

	.photo-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.remove-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 28px;
		height: 28px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		opacity: 0;
	}

	.photo-item:hover .remove-btn {
		opacity: 1;
	}

	.remove-btn:hover {
		background: #dc2626;
		transform: scale(1.1);
	}

	.photo-number {
		position: absolute;
		bottom: 8px;
		left: 8px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	/* Settings Panel */
	.settings-panel {
		background: #f9fafb;
		border-radius: 16px;
		padding: 2rem;
		margin-bottom: 3rem;
		border: 1px solid #e5e7eb;
	}

	/* Memorial Section */
	.memorial-section {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		border-radius: 16px;
		padding: 2rem;
		margin-bottom: 3rem;
		color: white;
	}

	.memorial-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: white;
	}

	.memorial-grid {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 2rem;
		align-items: end;
	}

	.memorial-settings {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.memorial-input,
	.memorial-select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
	}

	.memorial-input::placeholder {
		color: rgba(255, 255, 255, 0.7);
	}

	.memorial-input:focus,
	.memorial-select:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.6);
		background: rgba(255, 255, 255, 0.2);
	}

	.memorial-select option {
		background: #1f2937;
		color: white;
	}

	.memorial-actions {
		display: flex;
		gap: 1rem;
	}

	.memorial-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.memorial-btn.primary {
		background: rgba(255, 255, 255, 0.9);
		color: #f5576c;
	}

	.memorial-btn.primary:hover:not(:disabled) {
		background: white;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.memorial-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.no-memorials {
		margin-top: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		text-align: center;
	}

	.memorial-link {
		color: white;
		text-decoration: underline;
		font-weight: 600;
	}

	.memorial-link:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	/* Export Section */
	.export-section {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 16px;
		padding: 2rem;
		margin-bottom: 3rem;
		color: white;
	}

	.export-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: white;
	}

	.export-grid {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 2rem;
		align-items: end;
	}

	.export-settings {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.export-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.export-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.export-btn.primary {
		background: #10b981;
		color: white;
	}

	.export-btn.primary:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-2px);
	}

	.export-btn.secondary {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		backdrop-filter: blur(10px);
	}

	.export-btn.secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-2px);
	}

	.export-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.export-progress {
		margin-top: 1.5rem;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: #10b981;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.progress-text {
		text-align: center;
		font-size: 0.875rem;
		margin: 0;
		opacity: 0.9;
	}

	.hidden-canvas {
		position: absolute;
		left: -9999px;
		top: -9999px;
		visibility: hidden;
	}

	.settings-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1.5rem;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-item label {
		font-weight: 500;
		color: #374151;
	}

	.setting-item input[type="range"] {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: #d1d5db;
		outline: none;
		cursor: pointer;
	}

	.setting-item select {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: white;
		cursor: pointer;
	}

	.setting-value {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	/* Preview Section */
	.preview-section {
		text-align: center;
	}

	.preview-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1.5rem;
	}

	.preview-container {
		position: relative;
		max-width: 700px;
		margin: 0 auto 2rem;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		background: #000;
	}

	.preview-image {
		width: 100%;
		height: 500px;
		object-fit: contain;
		background: #000;
	}

	.transition-fade {
		animation: fadeIn 0.5s ease-in-out;
	}

	.transition-slide {
		animation: slideIn 0.5s ease-in-out;
	}

	.transition-zoom {
		animation: zoomIn 0.5s ease-in-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideIn {
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	}

	@keyframes zoomIn {
		from { transform: scale(0.8); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	.slide-counter {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	/* Controls */
	.controls {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.control-btn {
		padding: 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control-btn:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-2px);
	}

	.control-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.play-btn {
		background: #10b981;
		padding: 1.25rem;
	}

	.play-btn:hover {
		background: #059669;
	}

	/* Thumbnail Navigation */
	.thumbnail-nav {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		max-width: 600px;
		margin: 0 auto;
	}

	.thumbnail {
		width: 60px;
		height: 60px;
		border-radius: 8px;
		overflow: hidden;
		border: 2px solid transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		background: none;
		padding: 0;
	}

	.thumbnail:hover {
		transform: scale(1.1);
	}

	.thumbnail.active {
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}

	.empty-icon {
		width: 4rem;
		height: 4rem;
		margin: 0 auto 1rem;
		color: #d1d5db;
	}

	.empty-state h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #374151;
	}

	.empty-state p {
		margin: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.slideshow-generator {
			padding: 1rem;
		}

		.title {
			font-size: 2rem;
		}

		.upload-area {
			padding: 2rem 1rem;
		}

		.settings-grid {
			grid-template-columns: 1fr;
		}

		.preview-image {
			height: 300px;
		}

		.controls {
			gap: 0.5rem;
		}

		.control-btn {
			padding: 0.75rem;
		}

		.thumbnail-nav {
			gap: 0.25rem;
		}

		.thumbnail {
			width: 50px;
			height: 50px;
		}
	}
</style>
