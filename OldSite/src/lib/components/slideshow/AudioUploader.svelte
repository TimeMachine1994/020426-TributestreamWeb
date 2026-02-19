<script lang="ts">
	import { Music, Upload, X, Volume2, Play, Pause } from 'lucide-svelte';
	import type { SlideshowAudio } from '$lib/types/slideshow';

	interface Props {
		audio?: SlideshowAudio | null;
		volume?: number;
		fadeIn?: boolean;
		fadeOut?: boolean;
		maxFileSize?: number; // in MB, default 50
	}

	let {
		audio = $bindable(null),
		volume = $bindable(0.5),
		fadeIn = $bindable(true),
		fadeOut = $bindable(true),
		maxFileSize = 50
	}: Props = $props();

	let fileInput: HTMLInputElement;
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let audioElement: HTMLAudioElement | null = null;
	let previewUrl = $state<string | null>(null);

	// Accepted audio formats
	const acceptedFormats = 'audio/mpeg, audio/mp3, audio/wav, audio/ogg, audio/m4a';

	// Handle file selection
	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];
		await processAudioFile(file);
	}

	// Process uploaded audio file
	async function processAudioFile(file: File) {
		// Validate file type
		if (!file.type.startsWith('audio/')) {
			alert(`File ${file.name} is not an audio file`);
			return;
		}

		// Validate file size
		if (file.size > maxFileSize * 1024 * 1024) {
			alert(`File ${file.name} is too large (max ${maxFileSize}MB)`);
			return;
		}

		try {
			// Get audio duration
			const duration = await getAudioDuration(file);

			// Create preview URL
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
			previewUrl = URL.createObjectURL(file);

			// Create audio object
			const audioData: SlideshowAudio = {
				id: crypto.randomUUID(),
				name: file.name,
				file: file,
				duration: duration,
				size: file.size,
				type: file.type
			};

			audio = audioData;

			console.log('🎵 Audio uploaded:', {
				name: file.name,
				duration: `${Math.round(duration)}s`,
				size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
			});
		} catch (error) {
			console.error('Error processing audio file:', error);
			alert('Failed to process audio file. Please try again.');
		}
	}

	// Get audio duration using Audio element
	function getAudioDuration(file: File): Promise<number> {
		return new Promise((resolve, reject) => {
			const audio = new Audio();
			const url = URL.createObjectURL(file);

			audio.onloadedmetadata = () => {
				URL.revokeObjectURL(url);
				resolve(audio.duration);
			};

			audio.onerror = () => {
				URL.revokeObjectURL(url);
				reject(new Error('Failed to load audio metadata'));
			};

			audio.src = url;
		});
	}

	// Remove audio
	function removeAudio() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
		if (audioElement) {
			audioElement.pause();
			audioElement = null;
		}
		audio = null;
		isPlaying = false;
		currentTime = 0;
	}

	// Toggle audio playback
	function togglePlayback() {
		if (!previewUrl && !audio?.url) return;

		if (!audioElement) {
			audioElement = new Audio(previewUrl || audio?.url);
			audioElement.volume = volume;
			audioElement.ontimeupdate = () => {
				if (audioElement) {
					currentTime = audioElement.currentTime;
				}
			};
			audioElement.onended = () => {
				isPlaying = false;
				currentTime = 0;
			};
		}

		if (isPlaying) {
			audioElement.pause();
			isPlaying = false;
		} else {
			audioElement.play();
			isPlaying = true;
		}
	}

	// Update volume
	function handleVolumeChange(event: Event) {
		const input = event.target as HTMLInputElement;
		volume = parseFloat(input.value);
		if (audioElement) {
			audioElement.volume = volume;
		}
	}

	// Format time
	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	// Cleanup on destroy
	$effect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
			if (audioElement) {
				audioElement.pause();
			}
		};
	});
</script>

<div class="audio-uploader">
	<div class="audio-header">
		<Music class="header-icon" />
		<h3 class="header-title">Background Music</h3>
		<span class="header-subtitle">(Optional)</span>
	</div>

	{#if !audio}
		<!-- Upload Area -->
		<div 
			class="audio-upload-area"
			onclick={() => fileInput?.click()}
			role="button"
			tabindex="0"
		>
			<Upload class="upload-icon" />
			<p class="upload-text">Click to upload audio</p>
			<p class="upload-hint">MP3, WAV, OGG • Max {maxFileSize}MB</p>
		</div>
	{:else}
		<!-- Audio Preview -->
		<div class="audio-preview">
			<div class="audio-info">
				<div class="audio-details">
					<Music class="audio-icon" />
					<div class="audio-text">
						<p class="audio-name">{audio.name}</p>
						<p class="audio-meta">
							{formatTime(audio.duration)} • {(audio.size / 1024 / 1024).toFixed(2)}MB
						</p>
					</div>
				</div>
				<button class="remove-audio-btn" onclick={removeAudio} title="Remove audio">
					<X class="remove-icon" />
				</button>
			</div>

			<!-- Playback Controls -->
			<div class="playback-controls">
				<button class="play-btn" onclick={togglePlayback}>
					{#if isPlaying}
						<Pause size={20} />
					{:else}
						<Play size={20} />
					{/if}
				</button>
				<div class="progress-bar">
					<div 
						class="progress-fill" 
						style="width: {(currentTime / audio.duration) * 100}%"
					></div>
				</div>
				<span class="time-display">
					{formatTime(currentTime)} / {formatTime(audio.duration)}
				</span>
			</div>

			<!-- Audio Settings -->
			<div class="audio-settings">
				<div class="setting-group">
					<label class="setting-label">
						<Volume2 size={16} />
						Volume: <strong>{Math.round(volume * 100)}%</strong>
					</label>
					<input 
						type="range" 
						min="0" 
						max="1" 
						step="0.05"
						value={volume}
						oninput={handleVolumeChange}
						class="volume-slider"
					/>
				</div>

				<div class="setting-checkboxes">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={fadeIn} />
						Fade in at start
					</label>
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={fadeOut} />
						Fade out at end
					</label>
				</div>
			</div>
		</div>
	{/if}

	<!-- Hidden file input -->
	<input 
		bind:this={fileInput}
		type="file" 
		accept={acceptedFormats}
		onchange={handleFileSelect}
		style="display: none;"
	/>
</div>

<style>
	.audio-uploader {
		margin: 2rem 0;
	}

	.audio-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.header-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: #D5BA7F;
	}

	.header-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.header-subtitle {
		color: #6b7280;
		font-size: 0.9rem;
		font-style: italic;
	}

	/* Upload Area */
	.audio-upload-area {
		border: 2px dashed #d1d5db;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
		background: #f9fafb;
	}

	.audio-upload-area:hover {
		border-color: #D5BA7F;
		background: #fffbf5;
		transform: translateY(-2px);
	}

	.upload-icon {
		width: 2.5rem;
		height: 2.5rem;
		color: #9ca3af;
		margin: 0 auto 1rem;
		display: block;
	}

	.upload-text {
		font-size: 1.1rem;
		font-weight: 500;
		color: #374151;
		margin: 0 0 0.5rem 0;
	}

	.upload-hint {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	/* Audio Preview */
	.audio-preview {
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		background: white;
	}

	.audio-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.audio-details {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.audio-icon {
		width: 2rem;
		height: 2rem;
		color: #D5BA7F;
	}

	.audio-name {
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.25rem 0;
	}

	.audio-meta {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.remove-audio-btn {
		padding: 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.remove-audio-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		transform: scale(1.1);
	}

	.remove-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: #dc2626;
	}

	/* Playback Controls */
	.playback-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.play-btn {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: #D5BA7F;
		color: white;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.play-btn:hover {
		background: #c4a96e;
		transform: scale(1.05);
	}

	.progress-bar {
		flex: 1;
		height: 6px;
		background: #e5e7eb;
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #D5BA7F;
		transition: width 0.1s linear;
	}

	.time-display {
		font-size: 0.875rem;
		color: #6b7280;
		min-width: 80px;
		text-align: right;
	}

	/* Audio Settings */
	.audio-settings {
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.setting-group {
		margin-bottom: 1rem;
	}

	.setting-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.volume-slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: #e5e7eb;
		outline: none;
		-webkit-appearance: none;
	}

	.volume-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #D5BA7F;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.volume-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #D5BA7F;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.setting-checkboxes {
		display: flex;
		gap: 1.5rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #374151;
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		width: 1.125rem;
		height: 1.125rem;
		cursor: pointer;
	}

	@media (max-width: 768px) {
		.audio-upload-area {
			padding: 1.5rem 1rem;
		}

		.playback-controls {
			flex-wrap: wrap;
		}

		.time-display {
			width: 100%;
			text-align: center;
			margin-top: 0.5rem;
		}

		.setting-checkboxes {
			flex-direction: column;
			gap: 0.75rem;
		}
	}
</style>
