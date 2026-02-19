<script lang="ts">
	import SlideshowPlayer from './SlideshowPlayer.svelte';
	import type { MemorialSlideshow } from '$lib/types/slideshow';
	import { Code, X } from 'lucide-svelte';
	
	interface Props {
		slideshows: MemorialSlideshow[];
		memorialName: string;
		memorialId: string; // Required for create slideshow link
		editable?: boolean;
		currentUserId?: string;
		heroMode?: boolean;
	}
	
	let { slideshows, memorialName, memorialId, editable = false, currentUserId, heroMode = false }: Props = $props();
	
	// Embed code modal state
	let showEmbedModal = $state(false);
	let currentSlideshow = $state<MemorialSlideshow | null>(null);
	let embedCodeInput = $state('');
	let isSaving = $state(false);
	
	function openEmbedModal(slideshow: MemorialSlideshow) {
		currentSlideshow = slideshow;
		embedCodeInput = slideshow.embedCode || '';
		showEmbedModal = true;
	}
	
	function closeEmbedModal() {
		showEmbedModal = false;
		currentSlideshow = null;
		embedCodeInput = '';
	}
	
	async function saveEmbedCode() {
		if (!currentSlideshow) return;
		
		isSaving = true;
		try {
			const response = await fetch(`/api/memorials/${memorialId}/slideshow/${currentSlideshow.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					embedCode: embedCodeInput.trim() || null
				})
			});
			
			if (!response.ok) {
				throw new Error('Failed to save embed code');
			}
			
			alert('Embed code saved successfully! Refresh the page to see changes.');
			closeEmbedModal();
		} catch (error) {
			console.error('Error saving embed code:', error);
			alert('Failed to save embed code. Please try again.');
		} finally {
			isSaving = false;
		}
	}
	
	async function removeEmbedCode() {
		if (!currentSlideshow) return;
		if (!confirm('Remove custom embed code and show generated slideshow?')) return;
		
		embedCodeInput = '';
		await saveEmbedCode();
	}
	
	// Filter and sort slideshows
	const sortedSlideshows = $derived(() => {
		const active = slideshows.filter(s => 
			s.status === 'ready' || s.status === 'processing' || s.status === 'local_only'
		);
		return active.sort((a, b) => 
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	});
</script>

<section class="slideshow-section" class:hero-mode={heroMode}>
	{#if sortedSlideshows().length > 0}
		<div class="slideshows-container" class:hero-container={heroMode}>
			{#each sortedSlideshows() as slideshow (slideshow.id)}
				<div class="slideshow-item">
					<SlideshowPlayer {slideshow} {editable} {currentUserId} />
					
					{#if editable && !heroMode}
						<div class="slideshow-actions">
							<button 
								class="embed-code-btn"
								onclick={() => openEmbedModal(slideshow)}
								title="Manage custom embed code"
							>
								<Code size={16} />
								<span>Embed Code Directly</span>
								{#if slideshow.embedCode}
									<span class="active-badge">Active</span>
								{/if}
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else if editable && !heroMode}
		<!-- Empty state with create button for authorized users -->
		<div class="empty-slideshow-state">
			<div class="empty-content">
				<svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
				</svg>
				<h3>No Slideshow Yet</h3>
				<p>Create a beautiful photo slideshow to commemorate {memorialName}</p>
				<a href="/slideshow-generator?memorialId={memorialId}" class="create-slideshow-btn">
					<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
					</svg>
					Create Slideshow
				</a>
			</div>
		</div>
	{/if}
	
	<!-- Create button for when slideshows exist (non-hero mode only) -->
	{#if editable && sortedSlideshows().length > 0 && !heroMode}
		<div class="add-slideshow-container">
			<a href="/slideshow-generator?memorialId={memorialId}" class="add-slideshow-btn">
				<svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
				</svg>
				Add Another Slideshow
			</a>
		</div>
	{/if}
	
	<!-- Embed Code Modal -->
	{#if showEmbedModal && currentSlideshow}
		<div class="modal-backdrop" onclick={closeEmbedModal}>
			<div class="modal-content" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h3>Manage Embed Code</h3>
					<button class="close-btn" onclick={closeEmbedModal}>
						<X size={20} />
					</button>
				</div>
				
				<div class="modal-body">
					<p class="modal-description">
						Paste custom embed code (YouTube, Vimeo, etc.) to override the generated slideshow.
						Leave empty to show the generated slideshow.
					</p>
					
					<label for="embed-code-input">
						Embed Code:
					</label>
					<textarea
						id="embed-code-input"
						bind:value={embedCodeInput}
						placeholder="<iframe src=...></iframe>"
						rows="8"
					></textarea>
					
					{#if currentSlideshow.embedCode}
						<div class="current-status">
							<strong>Status:</strong> Custom embed code is active (overriding generated slideshow)
						</div>
					{/if}
				</div>
				
				<div class="modal-footer">
					{#if currentSlideshow.embedCode}
						<button class="remove-btn" onclick={removeEmbedCode} disabled={isSaving}>
							Remove Embed Code
						</button>
					{/if}
					<button class="cancel-btn" onclick={closeEmbedModal} disabled={isSaving}>
						Cancel
					</button>
					<button class="save-btn" onclick={saveEmbedCode} disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save Embed Code'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</section>

<style>
	.slideshow-section {
		margin: 2rem 0;
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
		padding: 2rem 1rem;
	}
	
	.slideshows-container {
		max-width: 800px;
		margin: 0 auto;
	}
	
	/* Hero mode styles - much smaller slideshow */
	.slideshow-section.hero-mode {
		margin: 1rem 0;
		max-width: none;
		padding: 0;
	}
	
	.slideshows-container.hero-container {
		max-width: 300px; /* About 1/8 viewport on desktop */
		margin: 0 auto;
	}
	
	/* Empty State */
	.empty-slideshow-state {
		padding: 3rem 2rem;
		text-align: center;
		background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
		border-radius: 16px;
		border: 2px dashed #d1d5db;
	}
	
	.empty-content {
		max-width: 400px;
		margin: 0 auto;
	}
	
	.empty-icon {
		width: 4rem;
		height: 4rem;
		color: #9ca3af;
		margin: 0 auto 1rem;
		display: block;
	}
	
	.empty-content h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}
	
	.empty-content p {
		color: #6b7280;
		font-size: 1rem;
		margin: 0 0 2rem 0;
	}
	
	/* Create Slideshow Button */
	.create-slideshow-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: #D5BA7F;
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		font-size: 1.1rem;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s ease;
	}
	
	.create-slideshow-btn:hover {
		background: #c4a96e;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(213, 186, 127, 0.3);
	}
	
	.btn-icon {
		width: 1.25rem;
		height: 1.25rem;
	}
	
	/* Add Another Slideshow Button */
	.add-slideshow-container {
		text-align: center;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}
	
	.add-slideshow-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: white;
		color: #6b7280;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.2s ease;
		font-size: 0.95rem;
	}
	
	.add-slideshow-btn:hover {
		border-color: #D5BA7F;
		color: #92400e;
		background: #fffbf5;
		transform: translateY(-1px);
	}
	
	@media (max-width: 768px) {
		.slideshow-section {
			margin: 1.5rem 0;
			padding: 0 0.5rem;
		}
		
		.slideshow-section.hero-mode {
			margin: 0.75rem 0;
		}
		
		.slideshows-container.hero-container {
			max-width: 200px; /* Smaller on mobile */
		}
	}
	
	/* Slideshow Item & Actions */
	.slideshow-item {
		position: relative;
		margin-bottom: 1rem;
	}
	
	.slideshow-actions {
		margin-top: 1rem;
		display: flex;
		justify-content: center;
		gap: 0.75rem;
	}
	
	.embed-code-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: white;
		color: #6b7280;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.95rem;
	}
	
	.embed-code-btn:hover {
		border-color: #8b5cf6;
		color: #8b5cf6;
		background: #faf5ff;
		transform: translateY(-1px);
	}
	
	.active-badge {
		background: #8b5cf6;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}
	
	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}
	
	.modal-content {
		background: white;
		border-radius: 16px;
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}
	
	.modal-header h3 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}
	
	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: #6b7280;
		transition: color 0.2s;
		display: flex;
		align-items: center;
	}
	
	.close-btn:hover {
		color: #1f2937;
	}
	
	.modal-body {
		padding: 1.5rem;
	}
	
	.modal-description {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}
	
	.modal-body label {
		display: block;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}
	
	.modal-body textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		resize: vertical;
		min-height: 150px;
	}
	
	.modal-body textarea:focus {
		outline: none;
		border-color: #8b5cf6;
	}
	
	.current-status {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #faf5ff;
		border-left: 3px solid #8b5cf6;
		color: #6b21a8;
		font-size: 0.875rem;
	}
	
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}
	
	.modal-footer button {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}
	
	.cancel-btn {
		background: white;
		color: #6b7280;
		border: 2px solid #e5e7eb;
	}
	
	.cancel-btn:hover {
		background: #f9fafb;
	}
	
	.remove-btn {
		background: #fef2f2;
		color: #dc2626;
		border: 2px solid #fecaca;
		margin-right: auto;
	}
	
	.remove-btn:hover {
		background: #fee2e2;
	}
	
	.save-btn {
		background: #8b5cf6;
		color: white;
	}
	
	.save-btn:hover {
		background: #7c3aed;
	}
	
	.modal-footer button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
