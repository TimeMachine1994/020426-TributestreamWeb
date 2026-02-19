<script lang="ts">
	import { Upload, X, Play, Settings, Plus, ExternalLink, ChevronUp, ChevronDown } from 'lucide-svelte';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { SimpleSlideshowGenerator, type GenerationProgress } from '$lib/utils/SimpleSlideshowGenerator';
	import { uploadPhotosToFirebaseStorage, uploadAudioToFirebaseStorage, uploadVideoToFirebaseStorage } from '$lib/utils/clientFirebaseStorage';
	import AudioUploader from './AudioUploader.svelte';
	import type { SlideshowAudio } from '$lib/types/slideshow';

	interface SlideshowPhoto {
		id: string;
		file: File;
		preview: string;
		caption: string;
		duration: number;
	}

	interface SlideshowSettings {
		photoDuration: number;
		transitionType: 'fade' | 'slide' | 'zoom';
		videoQuality: 'low' | 'medium' | 'high';
		aspectRatio: '16:9' | '4:3' | '1:1';
	}

	// Props
	interface Props {
		memorialId?: string;
		maxPhotos?: number;
		maxFileSize?: number; // in MB
	}

	let { 
		memorialId, 
		maxPhotos = 50, 
		maxFileSize = 10 
	}: Props = $props();

	// State
	let photos = $state<SlideshowPhoto[]>([]);
	let isDragOver = $state(false);
	let isGenerating = $state(false);
	let generationProgress = $state(0);
	let generationPhase = $state<string>('');
	let currentPhoto = $state(0);
	let generatedVideoBlob = $state<Blob | null>(null);
	let showVideoPreview = $state(false);
	let previewVideoUrl = $state<string | null>(null);
	let hasDraft = $state(false);
	let isLoadingDraft = $state(false);
	let isSavingDraft = $state(false);
	let lastSaveTime = $state<Date | null>(null);
	// Published slideshow state
	let isPublished = $state(false);
	let publishedSlideshow = $state<any>(null);
	
	// Draft state management
	let hasDraftChanges = $state(false);
	let originalPublishedPhotos = $state<SlideshowPhoto[]>([]);
	let draftVideoBlob = $state<Blob | null>(null);
	let draftVideoUrl = $state<string | null>(null);
	let isUnpublishing = $state(false);
	
	// Drag and drop state for photo reordering
	let draggedPhotoIndex = $state<number | null>(null);
	
	// Memorial data for navigation
	let memorial = $state<any>(null);
	
	let settings = $state<SlideshowSettings>({
		photoDuration: 3,
		transitionType: 'fade', // Fixed to fade transition
		videoQuality: 'medium', // Fixed to 1080p
		aspectRatio: '16:9' // Fixed to widescreen
	});

	// Audio state
	let audioTrack = $state<SlideshowAudio | null>(null);
	let audioVolume = $state(0.5);
	let audioFadeIn = $state(true);
	let audioFadeOut = $state(true);

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Cleanup function
	function cleanup() {
		if (previewVideoUrl) {
			URL.revokeObjectURL(previewVideoUrl);
			previewVideoUrl = null;
		}
		// Clean up photo preview URLs
		photos.forEach(photo => {
			if (photo.preview) {
				URL.revokeObjectURL(photo.preview);
			}
		});
	}

	// Cleanup on component destroy
	onDestroy(() => {
		cleanup();
	});

	// Check if current photos differ from published version
	function checkForDraftChanges() {
		if (!isPublished || originalPublishedPhotos.length === 0) {
			hasDraftChanges = false;
			return;
		}

		// Compare current photos with original published photos
		const currentPhotoIds = photos.map(p => p.id).sort();
		const originalPhotoIds = originalPublishedPhotos.map(p => p.id).sort();
		
		// Check if photo count or IDs are different
		const photosChanged = currentPhotoIds.length !== originalPhotoIds.length || 
			!currentPhotoIds.every((id, index) => id === originalPhotoIds[index]);
		
		// Check if settings changed
		const settingsChanged = publishedSlideshow && 
			settings.photoDuration !== publishedSlideshow.settings?.photoDuration;

		hasDraftChanges = photosChanged || settingsChanged;
		
		console.log('🔄 Draft changes detected:', {
			photosChanged,
			settingsChanged,
			hasDraftChanges,
			currentCount: photos.length,
			originalCount: originalPublishedPhotos.length
		});
	}
	
	// File input reference
	let fileInput: HTMLInputElement;
	
	// Draft management
	// Auto-load draft and check for published slideshow on component mount
	$effect(() => {
		console.log('🎬 PhotoSlideshowCreator mounted with memorialId:', memorialId);
		if (memorialId) {
			loadDraftAndPublished();
		}
	});
	
	// Load memorial data
	async function loadMemorialData() {
		if (!memorialId) return;
		
		try {
			console.log('🔍 Loading memorial data for:', memorialId);
			const response = await fetch(`/api/memorials/${memorialId}`);
			
			if (response.ok) {
				memorial = await response.json();
				console.log('✅ Memorial data loaded:', memorial?.fullSlug);
			} else {
				console.warn('⚠️ Could not load memorial data');
			}
		} catch (error) {
			console.error('❌ Error loading memorial data:', error);
		}
	}

	// Load both draft and published slideshow
	async function loadDraftAndPublished() {
		if (!memorialId) return;
		
		try {
			// Load memorial data for navigation
			await loadMemorialData();
			
			// First check for published slideshow
			await loadPublishedSlideshow();
			
			// If no published slideshow found, check for draft
			if (!isPublished) {
				await loadDraft();
			}
		} catch (error) {
			console.error('❌ Error loading slideshow data:', error);
		}
	}
	
	// Load published slideshow from memorial
	async function loadPublishedSlideshow() {
		if (!memorialId) {
			console.log('⚠️ No memorialId provided for slideshow loading');
			return;
		}
		
		try {
			console.log('🔍 Checking for published slideshow for memorial:', memorialId);
			console.log('🔍 Making API call to:', `/api/memorials/${memorialId}/slideshow`);
			
			const response = await fetch(`/api/memorials/${memorialId}/slideshow`);
			console.log('📡 API Response status:', response.status, response.statusText);
			
			if (response.ok) {
				const result = await response.json();
				console.log('📦 API Response data:', JSON.stringify(result, null, 2));
				
				// Handle both array response and object response
				let slideshow = null;
				
				if (Array.isArray(result) && result.length > 0) {
					// API returned array of slideshows, take the most recent one
					slideshow = result[0];
					console.log('📋 Found array of slideshows, using most recent:', slideshow.id);
				} else if (result.success && result.slideshow) {
					// API returned wrapped slideshow object
					slideshow = result.slideshow;
					console.log('📋 Found wrapped slideshow object:', slideshow.id);
				} else if (result.id) {
					// API returned single slideshow object
					slideshow = result;
					console.log('📋 Found single slideshow object:', slideshow.id);
				}
				
				if (slideshow) {
					publishedSlideshow = slideshow;
					isPublished = true;
					
					console.log('🎬 Published slideshow found:', {
						id: slideshow.id,
						title: slideshow.title,
						hasPhotos: slideshow.photos?.length || 0,
						hasPlaybackUrl: !!slideshow.playbackUrl,
						hasFirebaseUrl: !!slideshow.firebaseStorageUrl,
						playbackUrl: slideshow.playbackUrl,
						firebaseUrl: slideshow.firebaseStorageUrl
					});
					
					// Load the published slideshow photos for editing
					await loadPublishedPhotos(slideshow);
					
					console.log('✅ Loaded published slideshow successfully:', slideshow.id);
					return;
				} else {
					console.log('⚠️ No valid slideshow data found in response:', result);
				}
			} else {
				const errorText = await response.text();
				console.log('❌ API request failed:', response.status, errorText);
			}
			
			// No published slideshow found
			console.log('📝 No published slideshow found, will check for draft');
			isPublished = false;
			publishedSlideshow = null;
		} catch (error) {
			console.error('❌ Error loading published slideshow:', error);
			console.error('❌ Error details:', {
				message: error.message,
				stack: error.stack
			});
			isPublished = false;
			publishedSlideshow = null;
		}
	}
	
	// Load photos from published slideshow for editing
	async function loadPublishedPhotos(slideshow: any) {
		console.log('📸 Loading photos from published slideshow:', {
			photoCount: slideshow.photos?.length || 0,
			photos: slideshow.photos
		});
		
		if (!slideshow.photos || slideshow.photos.length === 0) {
			console.log('⚠️ No photos found in published slideshow');
			return;
		}
		
		try {
			console.log('🔄 Processing photos for editing...');
			const loadedPhotos = await Promise.all(
				slideshow.photos.map(async (slideshowPhoto: any, index: number) => {
					console.log(`📸 Processing photo ${index + 1}:`, {
						id: slideshowPhoto.id,
						hasUrl: !!slideshowPhoto.url,
						hasData: !!slideshowPhoto.data,
						url: slideshowPhoto.url,
						caption: slideshowPhoto.caption
					});
					
					// If photo has a Firebase Storage URL, use it
					if (slideshowPhoto.url) {
						try {
							console.log(`🌐 Fetching photo from URL via proxy: ${slideshowPhoto.url}`);
							// Use proxy endpoint to avoid CORS issues
							const proxyUrl = `/api/proxy/firebase-image?url=${encodeURIComponent(slideshowPhoto.url)}`;
							const response = await fetch(proxyUrl);
							if (!response.ok) {
								console.error(`❌ Failed to fetch photo ${slideshowPhoto.id} via proxy:`, response.status);
								return null;
							}
							const blob = await response.blob();
							const file = new File([blob], `photo-${slideshowPhoto.id}.jpg`, { type: 'image/jpeg' });
							
							console.log(`✅ Successfully loaded photo ${slideshowPhoto.id} from URL`);
							return {
								id: slideshowPhoto.id,
								file: file,
								preview: proxyUrl, // Use proxy URL for preview to avoid CORS issues
								caption: slideshowPhoto.caption || '',
								duration: slideshowPhoto.duration || settings.photoDuration,
								storedUrl: slideshowPhoto.url,
								storagePath: slideshowPhoto.storagePath
							};
						} catch (error) {
							console.error(`❌ Error loading photo ${slideshowPhoto.id} from URL:`, error);
							return null;
						}
					}
					
					// Fallback to base64 if available
					if (slideshowPhoto.data) {
						try {
							console.log(`📄 Loading photo ${slideshowPhoto.id} from base64 data`);
							const file = await base64ToFile(
								slideshowPhoto.data,
								`photo-${slideshowPhoto.id}.jpg`,
								'image/jpeg'
							);
							
							console.log(`✅ Successfully loaded photo ${slideshowPhoto.id} from base64`);
							return {
								id: slideshowPhoto.id,
								file: file,
								preview: slideshowPhoto.data,
								caption: slideshowPhoto.caption || '',
								duration: slideshowPhoto.duration || settings.photoDuration
							};
						} catch (error) {
							console.error(`❌ Error loading photo ${slideshowPhoto.id} from base64:`, error);
							return null;
						}
					}
					
					console.log(`⚠️ Photo ${slideshowPhoto.id} has no URL or base64 data`);
					return null;
				})
			);
			
			// Filter out failed conversions and set photos
			const validPhotos = loadedPhotos.filter(photo => photo !== null);
			console.log(`📊 Photo loading results: ${validPhotos.length}/${slideshow.photos.length} photos loaded successfully`);
			
			if (validPhotos.length > 0) {
				photos = validPhotos;
				// Store original published photos for draft comparison
				originalPublishedPhotos = [...validPhotos];
				console.log('✅ Photos set in component state and original photos stored');
				
				// Load slideshow settings if available
				if (slideshow.settings) {
					settings = { ...settings, ...slideshow.settings };
					console.log('⚙️ Slideshow settings loaded:', slideshow.settings);
				}
				
				// Set up video preview if slideshow has a playback URL
				if (slideshow.playbackUrl || slideshow.firebaseStorageUrl) {
					previewVideoUrl = slideshow.playbackUrl || slideshow.firebaseStorageUrl;
					showVideoPreview = true;
					console.log('🎥 Video preview setup:', {
						url: previewVideoUrl,
						showPreview: showVideoPreview
					});
				} else {
					console.log('⚠️ No video URL found in slideshow data');
				}
				
				// If no photos were loaded (due to CORS), create placeholder photos for display
				if (validPhotos.length === 0 && slideshow.photos && slideshow.photos.length > 0) {
					console.log('📸 Creating placeholder photos for display (CORS workaround)');
					photos = slideshow.photos.map((slideshowPhoto: any) => {
						// Use proxy URL for preview to avoid CORS issues
						const proxyUrl = `/api/proxy/firebase-image?url=${encodeURIComponent(slideshowPhoto.url)}`;
						return {
							id: slideshowPhoto.id,
							file: null, // Will be loaded when needed for editing
							preview: proxyUrl, // Use proxy URL for preview to avoid CORS issues
							caption: slideshowPhoto.caption || '',
							duration: slideshowPhoto.duration || settings.photoDuration,
							storedUrl: slideshowPhoto.url,
							storagePath: slideshowPhoto.storagePath,
							isPlaceholder: true // Flag to indicate this needs to be loaded for editing
						};
					});
					console.log(`✅ Created ${photos.length} placeholder photos for display`);
				}
				
				console.log(`✅ Successfully loaded ${validPhotos.length} photos from published slideshow`);
			} else {
				console.log('❌ No valid photos could be loaded from published slideshow');
			}
		} catch (error) {
			console.error('❌ Error loading published photos:', error);
			console.error('❌ Error details:', {
				message: error.message,
				stack: error.stack
			});
		}
	}
	
	// Unpublish slideshow (convert back to draft)
	async function unpublishSlideshow() {
		if (!publishedSlideshow?.id) return;
		
		try {
			console.log('🔄 Unpublishing slideshow:', publishedSlideshow.id);
			
			// Delete the published slideshow
			const response = await fetch(`/api/memorials/${memorialId}/slideshow`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				// Convert to draft
				isPublished = false;
				publishedSlideshow = null;
				
				// Save current state as draft
				await saveDraft();
				
				console.log('✅ Slideshow unpublished and converted to draft');
				alert('Slideshow unpublished! You can now edit and republish it.');
			} else {
				throw new Error('Failed to unpublish slideshow');
			}
		} catch (error) {
			console.error('❌ Error unpublishing slideshow:', error);
			alert('Failed to unpublish slideshow. Please try again.');
		}
	}
	
	// Save draft to database
	async function saveDraft() {
		if (!memorialId || photos.length === 0) {
			console.log('⚠️ Skipping draft save - memorialId:', memorialId, 'photos:', photos.length);
			return;
		}
		
		try {
			isSavingDraft = true;
			console.log('💾 Saving draft for memorial:', memorialId, 'with', photos.length, 'photos');
			
			// Convert photos to simple serializable format (avoid complex nested objects)
			const draftPhotos = photos.map((photo) => ({
				id: photo.id,
				caption: photo.caption || '',
				duration: photo.duration || settings.photoDuration,
				fileName: photo.file?.name || '',
				fileSize: photo.file?.size || 0,
				fileType: photo.file?.type || '',
				// Store preview URL if available, otherwise we'll need to re-upload
				preview: photo.preview || null,
				storedUrl: photo.storedUrl || null,
				storagePath: photo.storagePath || null
			}));
			
			// Clean settings object to ensure it's serializable
			const cleanSettings = {
				photoDuration: settings.photoDuration || 3,
				transitionType: settings.transitionType || 'fade',
				videoQuality: settings.videoQuality || 'medium',
				aspectRatio: settings.aspectRatio || '16:9'
			};
			
			console.log('📤 Sending draft data:', { memorialId, photoCount: draftPhotos.length, settings: cleanSettings });
			
			const response = await fetch('/api/slideshow/draft', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					memorialId,
					photos: draftPhotos,
					settings: cleanSettings
				})
			});
			
			if (response.ok) {
				hasDraft = true;
				lastSaveTime = new Date();
				console.log('✅ Draft saved to database successfully');
				return true;
			} else {
				const error = await response.json();
				console.error('❌ Failed to save draft:', error.error);
				return false;
			}
		} catch (error) {
			console.error('❌ Error saving draft:', error);
			return false;
		} finally {
			isSavingDraft = false;
		}
	}
	
	// Load draft from database
	async function loadDraft() {
		if (!memorialId) return;
		
		try {
			isLoadingDraft = true;
			console.log('🔍 Loading draft for memorial:', memorialId);
			
			const response = await fetch(`/api/slideshow/draft?memorialId=${memorialId}`);
			console.log('📡 Draft API response status:', response.status);
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Draft API error:', response.status, errorText);
				hasDraft = false;
				return;
			}
			
			const result = await response.json();
			console.log('📦 Draft API result:', result);
			
			if (!result.success || !result.draft || !result.draft.photos) {
				hasDraft = false;
				return;
			}
			
			const draftData = result.draft;
			
			// Convert base64 back to File objects and create photos
			const loadedPhotos = await Promise.all(
				draftData.photos.map(async (draftPhoto: any) => {
					if (!draftPhoto.fileData) return null;
					
					try {
						// Convert base64 back to File
						const file = await base64ToFile(
							draftPhoto.fileData,
							draftPhoto.fileName,
							draftPhoto.fileType
						);
						
						return {
							id: draftPhoto.id,
							file: file,
							preview: URL.createObjectURL(file),
							caption: draftPhoto.caption || '',
							duration: draftPhoto.duration || settings.photoDuration
						};
					} catch (error) {
						console.error('Error converting draft photo:', error);
						return null;
					}
				})
			);
			
			// Filter out failed conversions
			const validPhotos = loadedPhotos.filter(photo => photo !== null);
			
			if (validPhotos.length > 0) {
				photos = validPhotos;
				if (draftData.settings) {
					settings = { ...settings, ...draftData.settings };
				}
				hasDraft = true;
				console.log(`✅ Loaded draft from database with ${validPhotos.length} photos`);
			} else {
				hasDraft = false;
			}
			
		} catch (error) {
			console.error('❌ Error loading draft:', error);
			hasDraft = false;
		} finally {
			isLoadingDraft = false;
		}
	}
	
	// Clear draft from database
	async function clearDraft() {
		if (!memorialId) return;
		
		try {
			const response = await fetch(`/api/slideshow/draft?memorialId=${memorialId}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				hasDraft = false;
				photos = [];
				console.log('🗑️ Draft cleared from database');
			} else {
				console.error('❌ Failed to clear draft');
			}
		} catch (error) {
			console.error('❌ Error clearing draft:', error);
		}
	}
	
	// Utility: Convert File to base64
	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}
	
	// Utility: Convert base64 to File
	function base64ToFile(base64: string, fileName: string, fileType: string): Promise<File> {
		return new Promise((resolve) => {
			fetch(base64)
				.then(res => res.blob())
				.then(blob => {
					const file = new File([blob], fileName, { type: fileType });
					resolve(file);
				});
		});
	}
	
	// Auto-save draft when photos change (immediate for better UX)
	$effect(() => {
		if (photos.length > 0 && !isLoadingDraft) {
			// Short debounce for immediate feedback (500ms)
			const timeoutId = setTimeout(() => {
				saveDraft();
			}, 500);
			
			return () => clearTimeout(timeoutId);
		}
	});
	
	// Auto-save when settings change
	$effect(() => {
		if (photos.length > 0 && !isLoadingDraft) {
			const timeoutId = setTimeout(() => {
				saveDraft();
			}, 500);
			
			return () => clearTimeout(timeoutId);
		}
	});
	
	// Handle file selection
	function handleFileSelect(event: Event) {
		console.log('📁 File input changed, event:', event);
		const input = event.target as HTMLInputElement;
		console.log('📁 Input files:', input.files);
		if (input.files) {
			processFiles(Array.from(input.files));
		}
	}

	// Handle drag and drop
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		
		if (event.dataTransfer?.files) {
			processFiles(Array.from(event.dataTransfer.files));
		}
	}

	// Process uploaded files
	async function processFiles(files: File[]) {
		const validFiles = files.filter(file => {
			if (!file.type.startsWith('image/')) {
				alert(`File ${file.name} is not an image`);
				return false;
			}
			if (file.size > maxFileSize * 1024 * 1024) {
				alert(`File ${file.name} is too large (max ${maxFileSize}MB)`);
				return false;
			}
			return true;
		});

		validFiles.forEach(file => {
			const photo: SlideshowPhoto = {
				id: crypto.randomUUID(),
				file,
				preview: URL.createObjectURL(file),
				caption: '',
				duration: settings.photoDuration
			};

			photos = [...photos, photo];
		});

		console.log(`Added ${validFiles.length} photos. Total: ${photos.length}`);
		
		// Check for draft changes after adding photos
		if (validFiles.length > 0) {
			checkForDraftChanges();
			setTimeout(() => saveDraft(), 100);
		}
	}

	// Create image preview
	function createImagePreview(file: File): Promise<string> {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target?.result as string);
			reader.readAsDataURL(file);
		});
	}

	// Remove photo
	function removePhoto(id: string) {
		const index = photos.findIndex(p => p.id === id);
		if (index !== -1) {
			photos.splice(index, 1);
			photos = [...photos]; // Trigger reactivity
			
			// Check for draft changes and auto-save after removing photo
			checkForDraftChanges();
			setTimeout(() => saveDraft(), 100);
		}
	}
	
	// Photo reordering functions
	function handlePhotoDragStart(event: DragEvent, index: number) {
		draggedPhotoIndex = index;
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
	
	function handlePhotoDrop(event: DragEvent, targetIndex: number) {
		event.preventDefault();
		
		if (draggedPhotoIndex === null || draggedPhotoIndex === targetIndex) return;
		
		// Reorder photos array
		const newPhotos = [...photos];
		const [draggedPhoto] = newPhotos.splice(draggedPhotoIndex, 1);
		newPhotos.splice(targetIndex, 0, draggedPhoto);
		
		photos = newPhotos;
		draggedPhotoIndex = null;
		
		console.log('Photos reordered');
		
		// Auto-save after reordering
		setTimeout(() => saveDraft(), 100);
	}
	
	function handlePhotoDragEnd() {
		draggedPhotoIndex = null;
	}


	// Reorder photos (drag and drop within grid)
	function movePhoto(fromIndex: number, toIndex: number) {
		const newPhotos = [...photos];
		const [movedPhoto] = newPhotos.splice(fromIndex, 1);
		newPhotos.splice(toIndex, 0, movedPhoto);
		photos = newPhotos;
		
		console.log(`Photo moved from position ${fromIndex + 1} to ${toIndex + 1}`);
		
		// Auto-save draft after reordering
		if (memorialId) {
			saveDraft();
		}
	}

	// Mobile-friendly photo reordering functions
	function movePhotoUp(index: number) {
		if (index > 0) {
			movePhoto(index, index - 1);
		}
	}

	function movePhotoDown(index: number) {
		if (index < photos.length - 1) {
			movePhoto(index, index + 1);
		}
	}

	// Generate slideshow video
	async function generateSlideshow() {
		if (photos.length === 0) {
			alert('Please add at least one photo.');
			return;
		}

		isGenerating = true;
		generationProgress = 0;
		generationPhase = 'Initializing...';
		currentPhoto = 0;
		generatedVideoBlob = null;

		try {
			// Create canvas for video generation
			const canvas = document.createElement('canvas');
			const generator = new SimpleSlideshowGenerator(canvas);
			
			// Progress callback
			const onProgress = (progress: GenerationProgress) => {
				generationProgress = progress.progress;
				currentPhoto = progress.currentPhoto || 0;
				
				switch (progress.phase) {
					case 'loading':
						generationPhase = `Loading images... (${progress.currentPhoto || 0}/${progress.totalPhotos})`;
						break;
					case 'rendering':
						generationPhase = `Rendering slideshow... (${progress.currentPhoto || 0}/${progress.totalPhotos})`;
						break;
					case 'encoding':
						generationPhase = 'Encoding video...';
						break;
					default:
						generationPhase = 'Processing...';
						break;
				}
			};

			console.log('🎬 Starting slideshow generation with:', { 
				photos: photos.length, 
				settings,
				hasAudio: !!audioTrack 
			});
			
			// Prepare audio parameter if audio is selected
			const audioParam = audioTrack ? {
				file: audioTrack.file!,
				duration: audioTrack.duration,
				volume: audioVolume,
				fadeIn: audioFadeIn,
				fadeOut: audioFadeOut
			} : undefined;
			
			// Generate the video WITH AUDIO
			const videoBlob = await generator.generateVideo(
				photos, 
				settings, 
				onProgress,
				audioParam
			);
			
			// Cleanup
			generator.dispose();
			
			generatedVideoBlob = videoBlob;
			console.log('✅ Slideshow generated successfully:', videoBlob.size, 'bytes');

			// Create preview URL and show video preview
			if (previewVideoUrl) {
				URL.revokeObjectURL(previewVideoUrl);
			}
			previewVideoUrl = URL.createObjectURL(videoBlob);
			showVideoPreview = true;
			generationPhase = 'Preview ready!';
			generationProgress = 100;

			// Debug: Check if Step 4 should appear
			console.log('🔍 [STEP 4 DEBUG] After video generation:', {
				showVideoPreview,
				isPublished,
				hasDraftChanges,
				draftVideoBlob: !!draftVideoBlob,
				memorialId,
				generatedVideoBlob: !!generatedVideoBlob,
				shouldShowStep4: showVideoPreview && (!isPublished || (hasDraftChanges && !!draftVideoBlob)),
				shouldShowButton: !!memorialId
			});

			// Auto-scroll to step 4 on mobile after video generation
			setTimeout(() => {
				if (window.innerWidth <= 768) { // Mobile breakpoint
					const step4Element = document.querySelector('.workflow-step:nth-of-type(4)');
					if (step4Element) {
						step4Element.scrollIntoView({ 
							behavior: 'smooth', 
							block: 'start' 
						});
					}
				}
			}, 500); // Small delay to ensure DOM is updated

		} catch (error) {
			console.error('Error generating slideshow:', error);
			alert(`Failed to generate slideshow: ${error.message}`);
		} finally {
			isGenerating = false;
			generationProgress = 0;
			generationPhase = '';
			currentPhoto = 0;
		}
	}

	// Upload video and photos to Firebase Storage (WebM approach)
	async function uploadToFirebase(videoBlob: Blob, photos: SlideshowPhoto[], settings: SlideshowSettings) {
		try {
			const title = `Memorial Slideshow - ${new Date().toLocaleDateString()}`;
			
			// Step 1: Upload audio if present
			let audioData = null;
			if (audioTrack?.file) {
				generationPhase = 'Uploading audio...';
				generationProgress = 85;
				
				const audioResult = await uploadAudioToFirebaseStorage(
					audioTrack.file,
					memorialId || '',
					(progress) => {
							generationProgress = 85 + (progress * 0.05); // 85-90%
					}
				);
				
				audioData = {
					name: audioTrack.name,
					duration: audioTrack.duration,
					url: audioResult.downloadURL,
					storagePath: audioResult.storagePath
				};
				
				console.log('✅ [CLIENT] Audio uploaded:', audioData);
			}
			
			// Step 2: Upload WebM video to Firebase Storage
			console.log('📤 [CLIENT] Uploading WebM video to Firebase Storage...');
			generationPhase = 'Uploading video...';
			generationProgress = 90;
			
			const videoResult = await uploadVideoToFirebaseStorage(
				videoBlob,
				memorialId || '',
				title,
				(progress) => {
					generationProgress = 90 + (progress * 0.05); // 90-95%
				}
			);
			
			console.log('✅ [CLIENT] Video uploaded:', videoResult);
			generationProgress = 95;
			
			// Step 3: Upload photos that don't have stored URLs yet
			generationPhase = 'Uploading photos...';
			generationProgress = 95;
			
			const photosToUpload = photos
				.filter(photo => photo.file && !photo.storedUrl)
				.map(photo => ({
					id: photo.id,
					file: photo.file,
					caption: photo.caption,
					duration: photo.duration
				}));
			
			let uploadedPhotos: any[] = [];
			if (photosToUpload.length > 0) {
				uploadedPhotos = await uploadPhotosToFirebaseStorage(
					photosToUpload,
					memorialId || ''
				);
				console.log(`✅ [CLIENT] Uploaded ${uploadedPhotos.length} new photos`);
			}
			
			// Step 4: Build complete photos array with URLs
			const allPhotos = photos.map(photo => {
				// Find uploaded photo if this was newly uploaded
				const uploaded = uploadedPhotos.find(p => p.id === photo.id);
				
				return {
					id: photo.id,
					caption: photo.caption || '',
					duration: photo.duration || settings.photoDuration,
					url: uploaded?.downloadURL || photo.storedUrl || photo.preview,
					storagePath: uploaded?.storagePath || photo.storagePath || ''
				};
			});
			
			// Step 5: Send metadata to API (lightweight JSON, no files)
			generationPhase = 'Saving slideshow metadata...';
			generationProgress = 98;
			
			const settingsWithAudio = {
				...settings,
				audioVolume,
				audioFadeIn,
				audioFadeOut
			};
			
			const metadata = {
				memorialId: memorialId || '',
				title,
				// Firebase Storage URLs
				firebaseStoragePath: videoResult.storagePath,
				playbackUrl: videoResult.downloadURL,
				isFirebaseHosted: true,
				photos: allPhotos,
				settings: settingsWithAudio,
				audio: audioData,
				status: 'ready'
			};
			
			const response = await fetch('/api/slideshow/save-metadata', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(metadata)
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `API failed: ${response.status}`);
			}
			
			const result = await response.json();
			console.log('✅ Slideshow metadata saved successfully:', result);
			return result;
			
		} catch (error) {
			console.error('❌ Upload failed:', error);
			throw error;
		}
	}
	
	// Add slideshow to memorial (upload to Firebase)
	async function addToMemorial() {
		if (!generatedVideoBlob || !memorialId) {
			console.warn('⚠️ Cannot add to memorial: missing video or memorial ID');
			alert('Please generate a video and ensure memorial ID is set.');
			return;
		}

		try {
			isGenerating = true;
			generationPhase = 'Adding to memorial...';
			generationProgress = 95;

			// uploadToFirebase returns the parsed JSON result directly, not a Response object
			const result = await uploadToFirebase(generatedVideoBlob, photos, settings);

			if (result && result.slideshowId) {
				console.log('✅ Slideshow uploaded successfully:', result);
				
				// Update published status
				isPublished = true;
				publishedSlideshow = {
					id: result.slideshowId,
					title: `Memorial Slideshow - ${new Date().toLocaleDateString()}`,
					playbackUrl: result.downloadURL,
					photos: photos.map(photo => ({
						id: photo.id,
						caption: photo.caption || '',
						duration: photo.duration || settings.photoDuration,
						url: photo.storedUrl || photo.preview,
						storagePath: photo.storagePath
					})),
					settings: settings
				};
				
				// Clear draft since slideshow is now saved
				clearDraft();
				
				// Dispatch success event with upload confirmation
				dispatch('slideshowGenerated', {
					videoBlob: generatedVideoBlob,
					photos,
					settings,
					uploaded: true,
					result
				});
				
				alert('Slideshow successfully added to memorial!');
			} else {
				console.error('❌ Failed to upload slideshow: Invalid response', result);
				alert('Failed to upload slideshow. Please try again.');
			}
		} catch (error) {
			console.error('❌ Error adding to memorial:', error);
			alert(`Failed to add to memorial: ${error.message}`);
		} finally {
			isGenerating = false;
			generationProgress = 0;
			generationPhase = '';
		}
	}

	// Save for later (just download)
	function saveForLater() {
		downloadVideo();
		// Dispatch event without upload
		dispatch('slideshowGenerated', {
			videoBlob: generatedVideoBlob,
			photos,
			settings,
			memorialId,
			uploaded: false
		});
		showPreview = false;
	}

	// Go back to edit photos (hide video, show photos)
	async function editVideo() {
		// If we have placeholder photos, load them properly for editing
		if (photos.some(photo => photo.isPlaceholder)) {
			console.log('📸 Loading placeholder photos for editing...');
			await loadPlaceholderPhotos();
		}
		
		showVideoPreview = false;
		previewVideoUrl = '';
	}
	
	// Load placeholder photos for actual editing
	async function loadPlaceholderPhotos() {
		try {
			const loadedPhotos = await Promise.all(
				photos.map(async (photo) => {
					if (!photo.isPlaceholder || photo.file) {
						return photo; // Already loaded
					}
					
					try {
						console.log(`🌐 Loading placeholder photo for editing: ${photo.id}`);
						const proxyUrl = `/api/proxy/firebase-image?url=${encodeURIComponent(photo.storedUrl)}`;
						const response = await fetch(proxyUrl);
						
						if (!response.ok) {
							console.error(`❌ Failed to load photo ${photo.id} for editing:`, response.status);
							return photo; // Keep as placeholder
						}
						
						const blob = await response.blob();
						const file = new File([blob], `photo-${photo.id}.jpg`, { type: 'image/jpeg' });
						
						return {
							...photo,
							file: file,
							isPlaceholder: false
						};
					} catch (error) {
						console.error(`❌ Error loading photo ${photo.id} for editing:`, error);
						return photo; // Keep as placeholder
					}
				})
			);
			
			photos = loadedPhotos;
			console.log('✅ Placeholder photos loaded for editing');
		} catch (error) {
			console.error('❌ Error loading placeholder photos:', error);
		}
	}

	// Save slideshow to memorial
	async function saveToMemorial() {
		if (!memorialId) return;
		
		// Check if we have a video to save
		if (!generatedVideoBlob) {
			console.log('No video to save - need to generate slideshow first');
			alert('Please generate a slideshow first before saving to memorial.');
			return;
		}

		try {
			isGenerating = true;
			generationPhase = 'Saving to memorial...';
			generationProgress = 95;

			// Upload new video to Firebase
			const result = await uploadToFirebase(generatedVideoBlob, photos, settings);

			// Fix: Check for both result.slideshowId and result.success
			if (result.success && result.slideshowId) {
				// Update published status
				isPublished = true;
				publishedSlideshow = {
					id: result.slideshowId,
					title: result.title || `Memorial Slideshow - ${new Date().toLocaleDateString()}`,
					playbackUrl: result.downloadURL,
					photos: photos.map(photo => ({
						id: photo.id,
						caption: photo.caption || '',
						duration: photo.duration || settings.photoDuration,
						url: photo.storedUrl || photo.preview,
						storagePath: photo.storagePath
					})),
					settings: settings
				};
				
				// Clear draft since slideshow is now published
				clearDraft();
				
				// Dispatch event to notify parent component
				dispatch('slideshowGenerated', {
					videoBlob: generatedVideoBlob,
					photos,
					settings,
					uploaded: true,
					result
				});

				alert('Slideshow published to memorial successfully!');
			} else {
				// Handle case where API succeeded but didn't return expected data
				throw new Error('API response missing required data');
			}

			generationProgress = 100;
		} catch (error) {
			console.error('Error saving slideshow to memorial:', error);
			// More detailed error message
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			alert(`Failed to save slideshow to memorial: ${errorMessage}. Please try again.`);
		} finally {
			isGenerating = false;
			generationProgress = 0;
			generationPhase = '';
		}
	}

	// Unpublish slideshow from memorial
	async function unpublishFromMemorial() {
		if (!memorialId || !publishedSlideshow) return;

		const confirmUnpublish = confirm('Are you sure you want to unpublish this slideshow from the memorial? Visitors will no longer be able to see it.');
		if (!confirmUnpublish) return;

		try {
			isUnpublishing = true;

			// Call API to delete the slideshow from memorial
			const response = await fetch(`/api/memorials/${memorialId}/slideshow`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				// Update status to unpublished
				isPublished = false;
				publishedSlideshow = null;
				
				// Show video preview again so user can re-publish if desired
				showVideoPreview = true;
				
				alert('Slideshow unpublished from memorial successfully!');
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to unpublish slideshow');
			}
		} catch (error) {
			console.error('Error unpublishing slideshow:', error);
			alert('Failed to unpublish slideshow. Please try again.');
		} finally {
			isUnpublishing = false;
		}
	}

	// Discard draft changes and revert to published version
	function discardDraftChanges() {
		const confirmDiscard = confirm('Are you sure you want to discard all changes and revert to the published version?');
		if (!confirmDiscard) return;

		// Revert photos to original published state
		photos = [...originalPublishedPhotos];
		
		// Revert settings if they were changed
		if (publishedSlideshow?.settings) {
			settings = { ...settings, ...publishedSlideshow.settings };
		}

		// Clear draft video
		if (draftVideoUrl) {
			URL.revokeObjectURL(draftVideoUrl);
			draftVideoUrl = null;
		}
		draftVideoBlob = null;

		// Reset to published video preview
		if (publishedSlideshow?.playbackUrl || publishedSlideshow?.firebaseStorageUrl) {
			previewVideoUrl = publishedSlideshow.playbackUrl || publishedSlideshow.firebaseStorageUrl;
			showVideoPreview = true;
		}

		// Clear draft state
		hasDraftChanges = false;
		
		console.log('🔄 Draft changes discarded, reverted to published version');
	}

	// Generate new video for draft
	async function generateDraftVideo() {
		if (photos.length === 0) return;

		try {
			isGenerating = true;
			generationProgress = 0;
			generationPhase = 'Generating draft video...';
			currentPhoto = 0;

			// Create canvas for video generation
			const canvas = document.createElement('canvas');
			const generator = new SimpleSlideshowGenerator(canvas);
			
			// Progress callback
			const onProgress = (progress: GenerationProgress) => {
				generationProgress = progress.progress;
				currentPhoto = progress.currentPhoto || 0;
				
				switch (progress.phase) {
					case 'loading':
						generationPhase = `Loading images... (${progress.currentPhoto || 0}/${progress.totalPhotos})`;
						break;
					case 'rendering':
						generationPhase = `Rendering draft... (${progress.currentPhoto || 0}/${progress.totalPhotos})`;
						break;
					case 'encoding':
						generationPhase = 'Encoding draft video...';
						break;
					default:
						generationPhase = 'Processing draft...';
						break;
				}
			};

			console.log('🎬 Starting draft video generation with:', { 
				photos: photos.length, 
				settings,
				hasAudio: !!audioTrack 
			});
		
			// Prepare audio parameter if audio is selected
			const audioParam = audioTrack ? {
				file: audioTrack.file!,
				duration: audioTrack.duration,
				volume: audioVolume,
				fadeIn: audioFadeIn,
				fadeOut: audioFadeOut
			} : undefined;
		
			// Generate the video WITH AUDIO
			const videoBlob = await generator.generateVideo(
				photos, 
				settings, 
				onProgress,
				audioParam
			);
		
			// Cleanup
			generator.dispose();
			
			if (videoBlob) {
				// Store as draft video
				draftVideoBlob = videoBlob;
				if (draftVideoUrl) {
					URL.revokeObjectURL(draftVideoUrl);
				}
				draftVideoUrl = URL.createObjectURL(videoBlob);
				
				// Update preview to show draft video
				if (previewVideoUrl && previewVideoUrl !== (publishedSlideshow?.playbackUrl || publishedSlideshow?.firebaseStorageUrl)) {
					URL.revokeObjectURL(previewVideoUrl);
				}
				previewVideoUrl = draftVideoUrl;
				showVideoPreview = true;
				
				console.log('✅ Draft video generated successfully:', videoBlob.size, 'bytes');
			}
		} catch (error) {
			console.error('❌ Error generating draft video:', error);
			alert('Failed to generate draft video. Please try again.');
		} finally {
			isGenerating = false;
			generationProgress = 0;
			generationPhase = '';
		}
	}

	// Publish draft and replace published version
	async function publishDraftAndReplace() {
		if (!draftVideoBlob || !memorialId) return;

		const confirmPublish = confirm('Are you sure you want to publish this draft and replace the current version on the memorial?');
		if (!confirmPublish) return;

		try {
			isGenerating = true;
			generationPhase = 'Publishing draft to memorial...';
			generationProgress = 50;

			// Upload new video to Firebase (this will replace the old one)
			const result = await uploadToFirebase(draftVideoBlob, photos, settings);

			if (result.slideshowId) {
				// Update published slideshow data
				publishedSlideshow = {
					id: result.slideshowId,
					title: result.title || `Memorial Slideshow - ${new Date().toLocaleDateString()}`,
					playbackUrl: result.downloadURL,
					photos: photos.map(photo => ({
						id: photo.id,
						caption: photo.caption || '',
						duration: photo.duration || settings.photoDuration,
						url: photo.storedUrl || photo.preview,
						storagePath: photo.storagePath
					})),
					settings: settings
				};

				// Update original photos to current state
				originalPublishedPhotos = [...photos];
				
				// Clear draft state
				hasDraftChanges = false;
				if (draftVideoUrl) {
					URL.revokeObjectURL(draftVideoUrl);
					draftVideoUrl = null;
				}
				draftVideoBlob = null;

				// Update preview URL to published URL
				if (previewVideoUrl && previewVideoUrl !== result.downloadURL) {
					URL.revokeObjectURL(previewVideoUrl);
				}
				previewVideoUrl = result.downloadURL;

				generationProgress = 100;
				alert('Draft published successfully! The memorial now shows your updated slideshow.');
			}
		} catch (error) {
			console.error('❌ Error publishing draft:', error);
			alert('Failed to publish draft. Please try again.');
		} finally {
			isGenerating = false;
			generationProgress = 0;
			generationPhase = '';
		}
	}

	// Download generated video
	function downloadVideo() {
		if (!generatedVideoBlob) return;

		const url = URL.createObjectURL(generatedVideoBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `memorial-slideshow-${Date.now()}.webm`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// Download WebM video from Firebase Storage
	async function downloadFromFirebase() {
		if (!publishedSlideshow?.playbackUrl) {
			alert('No video available to download');
			return;
		}
		
		try {
			const response = await fetch(publishedSlideshow.playbackUrl);
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			
			const a = document.createElement('a');
			a.href = url;
			a.download = `${publishedSlideshow.title || 'memorial-slideshow'}.webm`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Download failed:', error);
			alert('Failed to download video');
		}
	}

	// Clear all photos
	function clearPhotos() {
		if (confirm('Are you sure you want to remove all photos?')) {
			photos = [];
		}
	}
	
	// Save slideshow to memorial (with photos as base64)
	async function saveSlideshow() {
		if (!memorialId || photos.length === 0) {
			alert('Please add photos and ensure memorial ID is set.');
			return;
		}
		
		try {
			// Convert photos to base64 for storage
			const photosData = await Promise.all(
				photos.map(async (photo) => {
					let base64Data;
					
					if (photo.preview && photo.preview.startsWith('data:')) {
						// Already base64
						base64Data = photo.preview;
					} else if (photo.file) {
						// Convert file to base64
						base64Data = await fileToBase64(photo.file);
					} else {
						throw new Error('Photo has no file or preview data');
					}
					
					return {
						id: photo.id,
						data: base64Data,
						caption: photo.caption || '',
						duration: photo.duration || settings.photoDuration
					};
				})
			);
			
			const slideshowData = {
				id: crypto.randomUUID(),
				title: `Memorial Slideshow - ${new Date().toLocaleDateString()}`,
				photos: photosData,
				settings: {
					photoDuration: settings.photoDuration,
					transitionType: settings.transitionType,
					videoQuality: settings.videoQuality,
					aspectRatio: settings.aspectRatio
				},
				status: 'local_only',
				memorialId: memorialId
			};
			
			console.log('Saving slideshow data:', slideshowData);
			
			const response = await fetch(`/api/memorials/${memorialId}/slideshow`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(slideshowData)
			});
			
			if (response.ok) {
				alert('Slideshow saved successfully!');
				
				// Dispatch event for parent components (like Profile modal)
				dispatch('slideshowGenerated', {
					videoBlob: null, // No video blob for save-only operation
					photos: photos,
					settings: settings,
					memorialId: memorialId,
					uploaded: true,
					slideshow: slideshowData
				});
				
				// Refresh to show the updated slideshow
				await fetchExistingSlideshow();
			} else {
				const errorText = await response.text();
				console.error('Failed to save slideshow:', errorText);
				alert('Failed to save slideshow. Please try again.');
			}
		} catch (error) {
			console.error('Error saving slideshow:', error);
			alert('Error saving slideshow. Please try again.');
		}
	}
</script>

<div class="slideshow-creator">
	<!-- Simplified Header with Clear Hierarchy -->
	<div class="creator-header">
		{#if isLoadingDraft}
			<h2 class="creator-title">Loading draft...</h2>
			<p class="creator-subtitle">Restoring your saved photos</p>
		{:else}
			<div class="header-content">
				<h2 class="creator-title">
					<Upload class="title-icon" />
					Create Memorial Slideshow
				</h2>
				<p class="creator-subtitle">
					Upload photos to create a beautiful memorial slideshow
				</p>
				
				<!-- Single Status Indicator (Miller's Rule - reduce cognitive load) -->
				{#if photos.length > 0}
					<div class="status-indicator">
						{#if isPublished}
							<span class="status-badge published">🌟 Published to Memorial</span>
						{:else if isSavingDraft}
							<span class="status-badge saving">💾 Saving...</span>
						{:else if lastSaveTime}
							<span class="status-badge saved">✅ Saved recently</span>
						{:else}
							<span class="status-badge draft">📝 Draft</span>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>


	<!-- Step 1: Upload Photos - Always Visible -->
	<div class="workflow-step active">
		<div class="step-header">
			<div class="step-number">1</div>
			<h3 class="step-title">Upload Photos</h3>
			{#if photos.length > 0}
				<div class="step-status completed">✓ {photos.length} photos added</div>
			{/if}
		</div>
		
		{#if photos.length === 0}
			<div 
				class="primary-upload-area"
				class:drag-over={isDragOver}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
				role="button"
				tabindex="0"
				onclick={() => {
					console.log('🖱️ Upload area clicked, fileInput:', fileInput);
					if (fileInput) {
						fileInput.click();
					} else {
						console.error('❌ fileInput is not available');
					}
				}}
				onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
			>
				<div class="upload-content">
					<Upload class="upload-icon" />
					<h4 class="upload-title">Choose Photos</h4>
					<p class="upload-text">
						Drag and drop photos here, or click to browse
					</p>
					<div class="upload-button">
						<button class="primary-btn large">
							<Upload class="btn-icon" />
							Select Photos
						</button>
					</div>
					<p class="upload-limits">
						Up to {maxPhotos} photos • {maxFileSize}MB per file
					</p>
				</div>
			</div>
		{:else}
			<div class="upload-summary">
				<div class="summary-content">
					<Upload class="summary-icon" />
					<span class="summary-text">{photos.length} photos ready</span>
					<button 
						class="secondary-btn"
						onclick={() => {
							if (fileInput) {
								fileInput.click();
							}
						}}
					>
						<Plus class="btn-icon" />
						Add More
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Step 2: Organize Photos (Always show when photos exist) -->
	{#if photos.length > 0}
		<div class="workflow-step active">
			<div class="step-header">
				<div class="step-number">2</div>
				<h3 class="step-title">Organize Your Photos ({photos.length})</h3>
				{#if isPublished && !hasDraftChanges}
					<div class="step-status completed">✓ Published to Memorial</div>
				{:else if isPublished && hasDraftChanges}
					<div class="step-status draft">📝 Draft Changes</div>
				{:else if showVideoPreview}
					<div class="step-status unpublished">📝 Ready to Publish</div>
				{/if}
			</div>
			
			<!-- Miller's Rule: Chunk Photos in Groups of 6 (Always show when photos exist) -->
			<div class="photo-grid-container">
				{#each Array(Math.ceil(photos.length / 6)) as _, chunkIndex}
					<div class="photo-chunk">
						<div class="chunk-header">
							<span class="chunk-label">Photos {chunkIndex * 6 + 1}-{Math.min((chunkIndex + 1) * 6, photos.length)}</span>
						</div>
						<div class="photo-grid">
							{#each photos.slice(chunkIndex * 6, (chunkIndex + 1) * 6) as photo, index (photo.id)}
								<div 
									class="photo-card"
									class:dragging={draggedPhotoIndex === chunkIndex * 6 + index}
									draggable="true"
									ondragstart={(e) => handlePhotoDragStart(e, chunkIndex * 6 + index)}
									ondragover={handlePhotoDragOver}
									ondrop={(e) => handlePhotoDrop(e, chunkIndex * 6 + index)}
									ondragend={handlePhotoDragEnd}
									title="Drag to reorder photos"
								>
									<div class="photo-preview">
										<img src={photo.preview} alt="Photo {chunkIndex * 6 + index + 1}" />
										<!-- Larger Remove Button (Fitts's Law) -->
										<button 
											class="remove-btn large"
											onclick={() => removePhoto(photo.id)}
											aria-label="Remove photo"
										>
											<X class="remove-icon" />
										</button>
										<div class="photo-number">#{chunkIndex * 6 + index + 1}</div>
										
										<!-- Mobile Reordering Arrows -->
										<div class="mobile-reorder-controls">
											<button 
												class="reorder-btn up"
												onclick={() => movePhotoUp(chunkIndex * 6 + index)}
												disabled={chunkIndex * 6 + index === 0}
												aria-label="Move photo up"
												title="Move photo up"
											>
												<ChevronUp size={16} />
											</button>
											<button 
												class="reorder-btn down"
												onclick={() => movePhotoDown(chunkIndex * 6 + index)}
												disabled={chunkIndex * 6 + index === photos.length - 1}
												aria-label="Move photo down"
												title="Move photo down"
											>
												<ChevronDown size={16} />
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Step 2.5: Background Music (Optional) - Show when photos exist and not published -->
	{#if photos.length > 0 && (!isPublished || hasDraftChanges)}
		<div class="workflow-step active">
			<div class="step-header">
				<div class="step-number">2.5</div>
				<h3 class="step-title">Background Music (Optional)</h3>
				{#if audioTrack}
					<div class="step-status completed">✓ Music added</div>
				{/if}
			</div>
			<AudioUploader 
				bind:audio={audioTrack}
				bind:volume={audioVolume}
				bind:fadeIn={audioFadeIn}
				bind:fadeOut={audioFadeOut}
				maxFileSize={50}
			/>
		</div>
	{/if}

	<!-- Step 3: Settings & Generate (Show for new slideshows or when there are draft changes) -->
	{#if photos.length > 0 && (!isPublished || hasDraftChanges)}
		<div class="workflow-step active">
			<div class="step-header">
				<div class="step-number">3</div>
				<h3 class="step-title">
					{hasDraftChanges ? 'Generate New Video' : 'Customize & Generate'}
				</h3>
				{#if showVideoPreview && !hasDraftChanges}
					<div class="step-status completed">✓ Video Ready</div>
				{:else if hasDraftChanges}
					<div class="step-status draft">📝 Changes Need Preview</div>
				{/if}
			</div>
			
			<!-- Simplified Settings (Hick's Law - Fewer Choices) -->
			<div class="settings-section">
				<div class="setting-group">
					<label for="photo-duration" class="setting-label">
						Photo Duration: <strong>{settings.photoDuration}s</strong>
					</label>
					<input 
						id="photo-duration"
						type="range" 
						min="1" 
						max="10" 
						step="0.5"
						bind:value={settings.photoDuration}
						class="range-slider"
					/>
				</div>
			</div>
			
			<!-- Primary Action (Fitts's Law - Large, Prominent) -->
			<div class="action-section">
				{#if isGenerating}
					<div class="progress-container">
						<div class="progress-header">
							<h4 class="progress-title">Creating Your Slideshow</h4>
							<span class="progress-percentage">{Math.round(generationProgress)}%</span>
						</div>
						<div class="progress-bar">
							<div 
								class="progress-fill" 
								style="width: {generationProgress}%"
							></div>
						</div>
						<p class="progress-text">{generationPhase}</p>
						{#if currentPhoto > 0}
							<p class="progress-detail">
								Processing photo {currentPhoto} of {photos.length}
							</p>
						{/if}
					</div>
				{:else}
					<button 
						class="primary-btn extra-large"
						onclick={hasDraftChanges ? generateDraftVideo : generateSlideshow}
						disabled={photos.length === 0}
					>
						<Play class="btn-icon" />
						{hasDraftChanges ? 'Generate New Video' : 'Create Slideshow Video'}
					</button>
					<p class="action-help">
						{hasDraftChanges 
							? `Preview your changes with ${photos.length} photos` 
							: `This will create a video from your ${photos.length} photos`}
					</p>
					
					{#if hasDraftChanges}
						<div class="draft-actions">
							<button 
								class="secondary-btn"
								onclick={discardDraftChanges}
							>
								<X class="btn-icon" />
								Discard Changes
							</button>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}

	<!-- Step 4: Save to Memorial (When video is ready and not published, or when there are draft changes) -->
	{#if showVideoPreview && (!isPublished || (hasDraftChanges && draftVideoBlob))}
		<div class="workflow-step active">
			<div class="step-header">
				<div class="step-number">4</div>
				<h3 class="step-title">
					{hasDraftChanges ? 'Publish Draft' : 'Save to Memorial'}
				</h3>
				{#if hasDraftChanges && draftVideoBlob}
					<div class="step-status draft">📝 Draft Ready to Publish</div>
				{/if}
			</div>
			
			<div class="video-preview-container">
				<div class="video-preview">
					<video 
						src={previewVideoUrl} 
						controls 
						class="preview-video"
						preload="metadata"
					>
						<track kind="captions" src="" srclang="en" label="English" />
						Your browser does not support the video tag.
					</video>
				</div>
				<p class="video-info">
					Video size: {generatedVideoBlob ? (generatedVideoBlob.size / 1024 / 1024).toFixed(2) : '0'} MB • {photos.length} photos
				</p>
			</div>
			
			<!-- Final Actions (Law of Proximity - Group Related Actions) -->
			<div class="final-actions">
				<button 
					class="secondary-btn"
					onclick={editVideo}
				>
					<Settings class="btn-icon" />
					Edit Photos
				</button>
				
				{#if hasDraftChanges && draftVideoBlob}
					<!-- Draft Actions -->
					<button 
						class="secondary-btn"
						onclick={() => {
							if (previewVideoUrl) URL.revokeObjectURL(previewVideoUrl);
							previewVideoUrl = draftVideoUrl;
							showVideoPreview = true;
						}}
					>
						Preview Draft
					</button>
					
					<button 
						class="secondary-btn"
						onclick={discardDraftChanges}
					>
						<X class="btn-icon" />
						Discard Changes
					</button>
					
					<!-- Download button for draft video -->
					<button 
						class="secondary-btn"
						onclick={() => {
							if (!draftVideoBlob) return;
							const url = URL.createObjectURL(draftVideoBlob);
							const a = document.createElement('a');
							a.href = url;
							a.download = `memorial-slideshow-draft-${Date.now()}.webm`;
							document.body.appendChild(a);
							a.click();
							document.body.removeChild(a);
							URL.revokeObjectURL(url);
						}}
					>
						<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
						</svg>
						Download Draft
					</button>
					
					{#if memorialId}
						<button 
							class="primary-btn extra-large"
							onclick={publishDraftAndReplace}
							disabled={isGenerating}
						>
							{#if isGenerating}
								<svg class="btn-icon animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
								</svg>
								Publishing Draft...
							{:else}
								<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
								</svg>
								Publish & Replace
							{/if}
						</button>
					{/if}
				{:else if memorialId}
					<!-- Regular Publish Action - Add to Memorial -->
					<div class="button-group">
						<button 
							class="secondary-btn"
							onclick={downloadVideo}
						>
							<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
							</svg>
							Download Video
						</button>
						
						<button 
							class="primary-btn extra-large"
							onclick={addToMemorial}
							disabled={isGenerating}
						>
							{#if isGenerating}
								<svg class="btn-icon animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
								</svg>
								Adding to Memorial...
							{:else}
								<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
								</svg>
								Add to Memorial
							{/if}
						</button>
					</div>
				{:else}
					<!-- No Memorial ID - Show Warning and Download Option -->
					<div class="no-memorial-warning">
						<p class="warning-text">⚠️ No memorial linked. You can download the video, but can't publish to a memorial.</p>
						<p class="warning-hint">To publish to a memorial, access this page from your profile or a memorial page.</p>
					</div>
					<button 
						class="secondary-btn"
						onclick={downloadVideo}
					>
						<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
						</svg>
						Download Video
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Step 3: Settings (Read-only for published slideshows) -->
	{#if photos.length > 0 && isPublished}
		<div class="workflow-step active">
			<div class="step-header">
				<div class="step-number">3</div>
				<h3 class="step-title">Slideshow Settings</h3>
				<div class="step-status completed">✓ Published to Memorial</div>
			</div>
			
			<!-- Read-only Settings Display -->
			<div class="settings-section readonly">
				<div class="setting-group">
					<div class="setting-display">
						<span class="setting-label">Photo Duration:</span>
						<span class="setting-value">{settings.photoDuration}s per photo</span>
					</div>
					<div class="setting-display">
						<span class="setting-label">Total Photos:</span>
						<span class="setting-value">{photos.length} photos</span>
					</div>
					<div class="setting-display">
						<span class="setting-label">Estimated Duration:</span>
						<span class="setting-value">{Math.round(photos.length * settings.photoDuration)}s total</span>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Published Slideshow Display (Separate from workflow) -->
	{#if isPublished && publishedSlideshow}
		<div class="published-slideshow-section">
			<div class="published-header">
				<h3 class="published-title">
					<span class="published-icon">🌟</span>
					Published to Memorial
				</h3>
				<div class="published-actions">
					<button 
						class="secondary-btn"
						onclick={editVideo}
					>
						<Settings class="btn-icon" />
						Edit Photos
					</button>
					<button 
						class="secondary-btn"
						onclick={() => window.open(`/${memorial?.fullSlug || `memorial/${memorialId}`}`, '_blank')}
					>
						<ExternalLink class="btn-icon" />
						View on Memorial
					</button>
					<button 
						class="danger-btn"
						onclick={unpublishFromMemorial}
						disabled={isUnpublishing}
					>
						{#if isUnpublishing}
							<svg class="btn-icon animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
							</svg>
							Unpublishing...
						{:else}
							<X class="btn-icon" />
							Unpublish from Memorial
						{/if}
					</button>
				</div>
			</div>
			
			<div class="published-video-container">
				<div class="video-preview">
					{#if publishedSlideshow.playbackUrl}
						<video 
							src={publishedSlideshow.playbackUrl} 
							controls 
							class="preview-video"
							preload="metadata"
						>
							<track kind="captions" src="" srclang="en" label="English" />
							Your browser does not support the video tag.
						</video>
					{:else if publishedSlideshow.firebaseStorageUrl}
						<video 
							src={publishedSlideshow.firebaseStorageUrl} 
							controls 
							class="preview-video"
							preload="metadata"
						>
							<track kind="captions" src="" srclang="en" label="English" />
							Your browser does not support the video tag.
						</video>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Hidden file input -->
	<input 
		bind:this={fileInput}
		type="file" 
		multiple 
		accept="image/*"
		onchange={handleFileSelect}
		style="display: none;"
	/>
</div>

<style>
	.slideshow-creator {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Header - Simplified */
	.creator-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.header-content {
		max-width: 600px;
		margin: 0 auto;
	}

	.creator-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}

	.title-icon {
		width: 2.5rem;
		height: 2.5rem;
		color: #D5BA7F;
	}

	.creator-subtitle {
		color: #6b7280;
		font-size: 1.2rem;
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}

	/* Status Indicator - Single, Clear */
	.status-indicator {
		margin-top: 1rem;
	}

	.status-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.status-badge.published {
		background: rgba(5, 150, 105, 0.1);
		color: #059669;
		border: 1px solid rgba(5, 150, 105, 0.2);
	}

	.status-badge.saving {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
		border: 1px solid rgba(59, 130, 246, 0.2);
	}

	.status-badge.saved {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	.status-badge.draft {
		background: rgba(156, 163, 175, 0.1);
		color: #6b7280;
		border: 1px solid rgba(156, 163, 175, 0.2);
	}

	.skip-loading-btn {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #6b7280;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.skip-loading-btn:hover {
		background: #4b5563;
	}

	.editing-header {
		text-align: left;
	}

	.back-btn {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		font-size: 0.9rem;
		margin-bottom: 1rem;
		padding: 0.5rem 0;
		transition: color 0.2s ease;
	}

	.back-btn:hover {
		color: #D5BA7F;
	}

	/* Existing Slideshows Section */
	.existing-slideshows-section {
		margin-bottom: 3rem;
		padding: 2rem;
		background: #f8fafc;
		border-radius: 16px;
		border: 1px solid #e2e8f0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.new-slideshow-btn,
	.start-new-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #D5BA7F;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.new-slideshow-btn:hover,
	.start-new-btn:hover {
		background: #c4a96e;
		transform: translateY(-1px);
	}

	.btn-icon {
		width: 1rem;
		height: 1rem;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		color: #6b7280;
	}

	.empty-state p {
		margin-bottom: 1.5rem;
		font-size: 1.1rem;
	}

	.slideshows-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.slideshow-card {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.slideshow-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.slideshow-preview {
		position: relative;
		aspect-ratio: 16/9;
		background: #f3f4f6;
	}

	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.photo-count {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.no-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #9ca3af;
	}

	.camera-icon {
		width: 2rem;
		height: 2rem;
	}

	.slideshow-info {
		padding: 1rem;
	}

	.slideshow-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.slideshow-date {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
	}

	.edit-slideshow-btn {
		width: 100%;
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.edit-slideshow-btn:hover {
		background: #2563eb;
	}

	/* Workflow Steps - Progressive Disclosure */
	.workflow-step {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 16px;
		padding: 2rem;
		margin-bottom: 2rem;
		transition: all 0.3s ease;
	}

	.workflow-step.active {
		border-color: #D5BA7F;
		box-shadow: 0 4px 20px rgba(213, 186, 127, 0.1);
	}

	.step-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		justify-content: space-between;
		flex-wrap: wrap;
	}

	.step-number {
		width: 3rem;
		height: 3rem;
		background: #D5BA7F;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.step-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
		flex: 1;
	}

	.step-actions {
		display: flex;
		gap: 0.75rem;
	}

	/* Primary Upload Area - Fitts's Law Applied */
	.primary-upload-area {
		border: 3px dashed #d1d5db;
		border-radius: 20px;
		padding: 4rem 2rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s ease;
		background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
		position: relative;
		min-height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.primary-upload-area:hover,
	.primary-upload-area.drag-over {
		border-color: #D5BA7F;
		background: linear-gradient(135deg, #fffbf5 0%, #fef7e7 100%);
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(213, 186, 127, 0.25);
	}

	.upload-content {
		max-width: 500px;
		margin: 0 auto;
	}

	.upload-icon {
		width: 4rem;
		height: 4rem;
		color: #D5BA7F;
		margin-bottom: 1.5rem;
	}

	.upload-title {
		font-size: 1.75rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}

	.upload-text {
		color: #6b7280;
		font-size: 1.1rem;
		margin: 0 0 2rem 0;
		line-height: 1.5;
	}

	.upload-button {
		margin: 2rem 0;
	}

	.upload-limits {
		color: #9ca3af;
		font-size: 0.9rem;
		margin: 0;
	}

	/* Button Styles - Fitts's Law Applied */
	.primary-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		background: #D5BA7F;
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		font-family: inherit;
		font-size: 1rem;
		padding: 1rem 2rem;
	}

	.primary-btn.large {
		padding: 1.25rem 2.5rem;
		font-size: 1.1rem;
	}

	.primary-btn.extra-large {
		padding: 1.5rem 3rem;
		font-size: 1.25rem;
		border-radius: 16px;
	}

	.primary-btn:hover:not(:disabled) {
		background: #c4a96e;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(213, 186, 127, 0.3);
	}

	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.secondary-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: white;
		color: #6b7280;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.9rem;
	}

	.secondary-btn:hover {
		border-color: #D5BA7F;
		color: #92400e;
		background: #fffbf5;
		transform: translateY(-1px);
	}

	.btn-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.danger-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #dc2626;
		color: white;
		border: 2px solid #dc2626;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.9rem;
	}

	.danger-btn:hover:not(:disabled) {
		background: #b91c1c;
		border-color: #b91c1c;
		transform: translateY(-1px);
	}

	.danger-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* Add More Photos Section */
	.add-more-section {
		margin: 2rem 0;
	}

	.add-more-section h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.add-more-area {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.5rem;
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		background: #f9fafb;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-more-area:hover,
	.add-more-area.drag-over {
		border-color: #D5BA7F;
		background: #fffbf5;
	}

	.add-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: #6b7280;
	}

	.add-more-area span {
		color: #6b7280;
		font-weight: 500;
	}

	/* Photo Section */
	.photo-section {
		margin-top: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.section-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		color: #374151;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn:hover {
		background: #f3f4f6;
	}

	.action-btn.primary {
		background: #D5BA7F;
		color: white;
		border-color: #D5BA7F;
		font-weight: 600;
	}

	.action-btn.primary:hover {
		background: #c4a96e;
		border-color: #c4a96e;
	}

	.action-btn.secondary {
		border-color: #D5BA7F;
		color: #92400e;
	}

	.action-btn.secondary:hover {
		background: #fffbf5;
	}

	.action-btn.danger {
		border-color: #ef4444;
		color: #dc2626;
	}

	.action-btn.danger:hover {
		background: #fef2f2;
	}

	.btn-icon {
		width: 1rem;
		height: 1rem;
	}

	/* Settings Panel */
	.settings-panel {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.settings-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 1rem 0;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-item label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #374151;
	}

	.range-input,
	.select-input {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.range-value {
		font-size: 0.8rem;
		color: #6b7280;
		text-align: center;
	}

	/* Photo Grid */
	.photo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.photo-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.2s ease;
		cursor: grab;
	}

	.photo-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	
	.photo-card:active {
		cursor: grabbing;
	}
	
	.photo-card.dragging {
		opacity: 0.5;
		transform: rotate(2deg) scale(0.95);
		z-index: 1000;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
	}

	.photo-preview {
		position: relative;
		aspect-ratio: 16/9;
		overflow: hidden;
	}

	.photo-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Photo Management - Miller's Rule Applied */
	.photo-grid-container {
		margin: 1.5rem 0;
	}

	.photo-chunk {
		margin-bottom: 2rem;
	}

	.chunk-header {
		margin-bottom: 1rem;
		padding: 0.5rem 1rem;
		background: #f3f4f6;
		border-radius: 8px;
		border-left: 4px solid #D5BA7F;
	}

	.chunk-label {
		font-size: 0.9rem;

/* Action Sections */
.action-section {
	text-align: center;
	padding: 2rem;
	background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
	border-radius: 16px;
}

.action-help {
	color: #6b7280;
	font-size: 1rem;
	margin: 1rem 0 0 0;
	font-style: italic;
}
		top: 0.75rem;
		right: 0.75rem;
	}

	.remove-btn:hover {
		background: rgba(239, 68, 68, 0.9);
		transform: scale(1.1);
	}

	.remove-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Mobile Reordering Controls */
	.mobile-reorder-controls {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		display: none; /* Hidden by default, shown on mobile */
		flex-direction: column;
		gap: 0.25rem;
		z-index: 10;
	}

	.reorder-btn {
		width: 2rem;
		height: 2rem;
		background: rgba(213, 186, 127, 0.9);
		border: none;
		border-radius: 4px;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		font-size: 0.75rem;
	}

	.reorder-btn:hover:not(:disabled) {
		background: rgba(213, 186, 127, 1);
		transform: scale(1.1);
	}

	.reorder-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.reorder-btn.up {
		border-radius: 4px 4px 2px 2px;
	}

	.reorder-btn.down {
		border-radius: 2px 2px 4px 4px;
	}

	/* Show mobile controls on touch devices and small screens */
	@media (max-width: 768px), (hover: none) {
		.mobile-reorder-controls {
			display: flex;
		}
		
		/* Hide drag cursor on mobile since drag-and-drop doesn't work well */
		.photo-card {
			cursor: default;
		}
		
		.photo-card[draggable="true"] {
			-webkit-user-drag: none;
			-khtml-user-drag: none;
			-moz-user-drag: none;
			-o-user-drag: none;
			user-select: none;
		}
	}

	/* Settings Section - Simplified */
	.settings-section {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.setting-group {
		max-width: 400px;
		margin: 0 auto;
	}

	.setting-label {
		display: block;
		font-size: 1.1rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 1rem;
		text-align: center;
	}

	.range-slider {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: #e5e7eb;
		outline: none;
		-webkit-appearance: none;
		margin: 1rem 0;
	}

	.range-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #D5BA7F;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.range-slider::-moz-range-thumb {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #D5BA7F;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	/* Action Sections */
	.action-section {
		text-align: center;
		padding: 2rem;
		background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
		border-radius: 16px;
	}

	.action-help {
		color: #6b7280;
		font-size: 1rem;
		margin: 1rem 0 0 0;
		font-style: italic;
	}

	.final-actions {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 2rem;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		width: 100%;
	}

	.button-group .secondary-btn,
	.button-group .primary-btn {
		flex: 0 1 auto;
	}

	/* No Memorial Warning */
	.no-memorial-warning {
		background: rgba(251, 191, 36, 0.1);
		border: 2px solid rgba(251, 191, 36, 0.3);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1rem;
		text-align: center;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.warning-text {
		color: #92400e;
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.warning-hint {
		color: #78350f;
		font-size: 0.9rem;
		margin: 0;
		font-style: italic;
	}

	.draft-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	/* Step Status */
	.step-status {
		font-size: 0.9rem;
		font-weight: 500;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
	}

	.step-status.completed {
		color: #059669;
		background: rgba(5, 150, 105, 0.1);
		border: 1px solid rgba(5, 150, 105, 0.2);
	}

	.step-status.unpublished {
		color: #d97706;
		background: rgba(217, 119, 6, 0.1);
		border: 1px solid rgba(217, 119, 6, 0.2);
	}

	.step-status.draft {
		color: #7c3aed;
		background: rgba(124, 58, 237, 0.1);
		border: 1px solid rgba(124, 58, 237, 0.2);
	}

	/* Upload Summary */
	.upload-summary {
		background: #f0fdf4;
		border: 2px solid #bbf7d0;
		border-radius: 12px;
		padding: 1.5rem;
	}

	.summary-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.summary-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: #059669;
	}

	.summary-text {
		font-size: 1.1rem;
		font-weight: 500;
		color: #065f46;
	}

	/* Published Slideshow Section */
	.published-slideshow-section {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border: 2px solid #f59e0b;
		border-radius: 16px;
		padding: 2rem;
		margin-top: 2rem;
	}

	.published-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.published-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: #92400e;
		margin: 0;
	}

	.published-icon {
		font-size: 1.5rem;
	}

	.published-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.published-video-container {
		background: white;
		border-radius: 12px;
		padding: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	/* Read-only Settings */
	.settings-section.readonly {
		background: #f8fafc;
		border: 2px solid #e2e8f0;
	}

	.setting-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.setting-display:last-child {
		border-bottom: none;
	}

	.setting-display .setting-label {
		font-weight: 500;
		color: #374151;
		margin: 0;
	}

	.setting-value {
		font-weight: 600;
		color: #1f2937;
		background: #f3f4f6;
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-size: 0.9rem;
	}

	.video-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 16/9;
		background: #000;
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.preview-video {
		width: 100%;
		height: 100%;
		border: none;
		display: block;
	}

	/* Draft Status Styles */
	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.title-section {
		flex: 1;
	}

	.draft-status {
		flex-shrink: 0;
	}

	.draft-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
	}

	.draft-badge {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1d4ed8;
	}

	.continue-later-btn {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.2);
		color: #16a34a;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.continue-later-btn:hover {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.3);
		transform: translateY(-1px);
	}

	.clear-draft-btn {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #dc2626;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.clear-draft-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.3);
	}

	.unpublish-btn {
		background: rgba(251, 191, 36, 0.1);
		border: 1px solid rgba(251, 191, 36, 0.2);
		color: #d97706;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.unpublish-btn:hover {
		background: rgba(251, 191, 36, 0.2);
		border-color: rgba(251, 191, 36, 0.3);
		transform: translateY(-1px);
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: stretch;
		}
		
		.draft-controls {
			justify-content: space-between;
			flex-wrap: wrap;
		}
	}

	.video-info {
		text-align: center;
		color: #6b7280;
		font-size: 0.9rem;
		margin: 0;
	}

	.video-actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	/* Generate Section */
	.generate-section {
		text-align: center;
		padding: 2rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.generate-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: #D5BA7F;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.generate-btn:hover:not(:disabled) {
		background: #c4a96e;
		transform: translateY(-1px);
	}

	.generate-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.progress-container {
		max-width: 500px;
		margin: 0 auto;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.progress-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.progress-percentage {
		font-size: 1.1rem;
		font-weight: 600;
		color: #D5BA7F;
	}

	.progress-bar {
		width: 100%;
		height: 12px;
		background: #e5e7eb;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 1rem;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #D5BA7F 0%, #c4a96e 100%);
		transition: width 0.3s ease;
		border-radius: 6px;
	}

	.progress-text {
		color: #374151;
		font-size: 1rem;
		font-weight: 500;
		margin: 0 0 0.5rem 0;
		text-align: center;
	}

	.progress-detail {
		color: #6b7280;
		font-size: 0.9rem;
		margin: 0;
		text-align: center;
	}

	.success-container {
		max-width: 500px;
		margin: 0 auto;
		text-align: center;
	}

	.success-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #059669;
		margin: 0 0 0.5rem 0;
	}

	.success-text {
		color: #6b7280;
		font-size: 0.9rem;
		margin: 0 0 1.5rem 0;
	}

	.success-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.preview-container {
		max-width: 600px;
		margin: 0 auto;
		text-align: center;
	}

	.preview-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.preview-text {
		color: #6b7280;
		font-size: 0.9rem;
		margin: 0 0 1.5rem 0;
	}

	.video-preview {
		margin: 0 0 2rem 0;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		background: #000;
	}

	.preview-video {
		width: 100%;
		height: auto;
		max-height: 400px;
		display: block;
		border-radius: 12px;
	}

	.preview-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		align-items: center;
	}


	.btn-icon {
		width: 16px;
		height: 16px;
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.slideshow-creator {
			padding: 1rem;
		}

		.creator-title {
			font-size: 1.5rem;
		}

		.upload-area {
			padding: 2rem 1rem;
		}

		.section-header {
			flex-direction: column;
			align-items: stretch;
		}

		.section-actions {
			justify-content: center;
		}

		.photo-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		}

		.settings-grid {
			grid-template-columns: 1fr;
		}

		/* Fix button overflow on mobile */
		.primary-btn.extra-large {
			padding: 1rem 1.5rem;
			font-size: 1.1rem;
			max-width: 100%;
			word-wrap: break-word;
		}

		.action-section {
			padding: 1.5rem 1rem;
		}

		.final-actions {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.final-actions .primary-btn {
			width: 100%;
			justify-content: center;
		}
	}

	/* Add More Photos Card */
	.add-more-card {
		aspect-ratio: 16/9;
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		background: #f9fafb;
		min-height: 120px;
	}

	.add-more-card:hover {
		border-color: #D5BA7F;
		background: #fffbf5;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(213, 186, 127, 0.2);
	}

	.add-more-content {
		text-align: center;
		color: #6b7280;
	}

	.add-more-icon {
		width: 1.5rem;
		height: 1.5rem;
		margin: 0 auto 0.5rem;
		display: block;
		color: #9ca3af;
	}

	.add-more-text {
		display: block;
		font-weight: 500;
		margin-bottom: 0.25rem;
		color: #374151;
		font-size: 0.875rem;
	}

	.add-more-limit {
		font-size: 0.75rem;
		color: #6b7280;
	}

	/* Header Add Photos Button */
	.header-actions {
		margin-top: 1rem;
	}

	.add-photos-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #D5BA7F;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
	}

	.add-photos-btn:hover {
		background: #C5AA6F;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(213, 186, 127, 0.3);
	}

	.add-photos-btn .btn-icon {
		width: 1rem;
		height: 1rem;
	}

	/* Published Indicator */
	.published-indicator {
		font-size: 0.75rem;
		font-weight: 400;
		color: #059669;
		margin-left: 0.5rem;
		background: rgba(5, 150, 105, 0.1);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		border: 1px solid rgba(5, 150, 105, 0.2);
	}
</style>
