<script lang="ts">
	import type { PageData } from './$types';
	import SlideshowSection from '$lib/components/SlideshowSection.svelte';
	import MemorialStreamDisplay from '$lib/components/MemorialStreamDisplay.svelte';
	import BlockRenderer from '$lib/components/memorial/BlockRenderer.svelte';
	import BookingReminderBanner from '$lib/components/BookingReminderBanner.svelte';
	import { shouldShowBookingBanner, markBannerAsSeen, debugBannerState } from '$lib/utils/bookingBanner';
	import { getEnabledBlocks } from '$lib/utils/block-utils';
	import { onMount, onDestroy } from 'svelte';
	import { Facebook, Twitter, Linkedin, Share2, X } from 'lucide-svelte';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	// Extract memorial, streams, and slideshows data from server load
	let memorial = $derived(data.memorial);
	let streams = $derived((data.streams || []) as any);
	let slideshows = $derived((data.slideshows || []) as any);
	let user = $derived(data.user);
	
	// Check if memorial has content blocks configured
	let hasContentBlocks = $derived(() => {
		const blocks = (memorial as any)?.contentBlocks || [];
		return blocks.length > 0 && getEnabledBlocks(blocks).length > 0;
	});
	
	// Determine if user can edit slideshows
	let canEditSlideshows = $derived(() => {
		if (!user || !memorial) return false;
		
		return (
			user.role === 'admin' ||
			memorial.ownerUid === user.uid ||
			memorial.funeralDirectorUid === user.uid
		);
	});
	
	
	// Force refresh listener — reloads page when admin triggers force refresh
	let forceRefreshUnsub: (() => void) | null = null;
	let initialForceRefreshAt: string | null = null;

	onMount(async () => {
		console.log('🎨 [MEMORIAL PAGE] Client-side data loaded:', {
			memorialId: memorial?.id
		});

		// Setup force refresh listener on the memorial document
		if (browser && memorial?.id) {
			try {
				const { db } = await import('$lib/firebase');
				const { doc, onSnapshot } = await import('firebase/firestore');

				const memorialRef = doc(db, 'memorials', memorial.id);
				let isFirstSnapshot = true;

				forceRefreshUnsub = onSnapshot(memorialRef, (snapshot) => {
					if (!snapshot.exists()) return;
					const data = snapshot.data();
					const refreshAt = data.forceRefreshAt || null;

					if (isFirstSnapshot) {
						// Store the initial value so we don't reload on page load
						initialForceRefreshAt = refreshAt;
						isFirstSnapshot = false;
						console.log('🔄 [FORCE REFRESH] Listener ready, initial:', refreshAt);
						return;
					}

					// If forceRefreshAt changed from what we initially loaded, reload
					if (refreshAt && refreshAt !== initialForceRefreshAt) {
						console.log('🔄 [FORCE REFRESH] Detected! Reloading page...');
						window.location.reload();
					}
				});
			} catch (err) {
				console.error('❌ [FORCE REFRESH] Failed to setup listener:', err);
			}
		}
	});

	onDestroy(() => {
		forceRefreshUnsub?.();
	});

	// Booking banner state
	let showBookingBanner = $state(false);
	let bannerVisible = $state(false);

	// Social share popup state
	let showSharePopup = $state(false);

	// Get absolute URL for sharing
	let absoluteUrl = $derived(() => {
		if (!browser) return '';
		return window.location.href;
	});

	// Social sharing functions
	function openShareWindow(url) {
		const width = 600;
		const height = 400;
		const left = window.innerWidth / 2 - width / 2;
		const top = window.innerHeight / 2 - height / 2;
		window.open(
			url,
			'share',
			`width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
		);
	}

	function shareOnFacebook() {
		const url = encodeURIComponent(absoluteUrl());
		openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
		showSharePopup = false;
	}

	function shareOnTwitter() {
		const url = encodeURIComponent(absoluteUrl());
		const text = encodeURIComponent(`Celebrating the life of ${memorial?.lovedOneName || ''}`);
		openShareWindow(`https://twitter.com/intent/tweet?url=${url}&text=${text}&via=tributestream`);
		showSharePopup = false;
	}

	function shareOnLinkedIn() {
		const url = encodeURIComponent(absoluteUrl());
		openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
		showSharePopup = false;
	}

	async function copyLink() {
		if (!browser) return;
		try {
			await navigator.clipboard.writeText(absoluteUrl());
			alert('Link copied to clipboard!');
			showSharePopup = false;
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	}

	function toggleSharePopup() {
		showSharePopup = !showSharePopup;
	}

	// Close popup when clicking outside
	$effect(() => {
		if (!browser || !showSharePopup) return;
		
		const handleClickOutside = (e) => {
			const target = e.target;
			if (!target.closest('.share-container')) {
				showSharePopup = false;
			}
		};
		
		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});

	// Check if booking banner should be shown
	let bannerState = $derived(() => {
		if (!memorial || !memorial.id) return { shouldShow: false };
		return shouldShowBookingBanner(memorial.id, user, memorial);
	});

	// Handle banner dismissal
	function handleBannerDismiss() {
		// View counter already incremented when banner was shown
		bannerVisible = false;
		showBookingBanner = false;
	}

	// Enhanced date formatting with better error handling
	function formatDate(dateString: string | null): string {
		if (!dateString) return 'Date TBD';
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				console.warn('Invalid date string:', dateString);
				return dateString;
			}
			return date.toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch (error) {
			console.error('Date formatting error:', error, 'for date:', dateString);
			return dateString || 'Date TBD';
		}
	}

	// Simplified: Use hasCustomHtml flag from server
	let hasCustomHtml = $derived((memorial as any)?.hasCustomHtml || false);

	// Show booking banner after delay if conditions are met
	$effect(() => {
		const currentBannerState = bannerState();
		if (currentBannerState.shouldShow && !showBookingBanner) {
			console.log('🎯 [BOOKING_BANNER] Scheduling banner display in 3 seconds...');
			if (memorial?.id) {
				debugBannerState(memorial.id);
			}
			
			const timer = setTimeout(() => {
				console.log('🎯 [BOOKING_BANNER] Showing booking banner');
				showBookingBanner = true;
				bannerVisible = true;
				
				// Increment view counter when banner is shown
				if (memorial?.id) {
					markBannerAsSeen(memorial.id);
				}
			}, 3000); // 3 second delay

			return () => clearTimeout(timer);
		}
	});

	// Log memorial data for debugging
	$effect(() => {
		if (memorial) {
			console.log('🏠 [MEMORIAL_PAGE] Memorial loaded:', {
				id: memorial.id,
				name: memorial.lovedOneName,
				isPublic: memorial.isPublic,
				hasCustomHtml: hasCustomHtml,
				layoutType: hasCustomHtml ? 'Legacy (custom HTML only)' : 'Standard',
				custom_html_length: (memorial as any)?.custom_html?.length || 0,
				custom_html_preview: (memorial as any)?.custom_html ? 
					(memorial as any).custom_html.substring(0, 100) + '...' : null,
				bannerState: bannerState()
			});
		}
	});
</script>

<svelte:head>
	<title>{memorial?.lovedOneName ? `Celebration of Life for ${memorial.lovedOneName}` : 'Memorial'}</title>
	<meta name="description" content={memorial?.content || 'Memorial service information'} />
	
	{#if memorial}
		<!-- Open Graph / Facebook -->
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Tributestream" />
		<meta property="og:title" content={`Celebration of Life for ${memorial.lovedOneName}`} />
		<meta property="og:description" content={memorial.content || `Join us in celebrating the life of ${memorial.lovedOneName}`} />
		<meta property="og:url" content={browser ? window.location.href : `https://tributestream.com/${memorial.fullSlug}`} />
		{#if memorial.imageUrl}
			<meta property="og:image" content={memorial.imageUrl} />
			<meta property="og:image:alt" content={memorial.lovedOneName} />
			<meta property="og:image:width" content="1200" />
			<meta property="og:image:height" content="630" />
		{/if}
		
		<!-- Twitter Card -->
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:site" content="@tributestream" />
		<meta name="twitter:creator" content="@tributestream" />
		<meta name="twitter:title" content={`Celebration of Life for ${memorial.lovedOneName}`} />
		<meta name="twitter:description" content={memorial.content || `Join us in celebrating the life of ${memorial.lovedOneName}`} />
		{#if memorial.imageUrl}
			<meta name="twitter:image" content={memorial.imageUrl} />
			<meta name="twitter:image:alt" content={memorial.lovedOneName} />
		{/if}
	{/if}
</svelte:head>

<!-- Booking Reminder Banner -->
{#if showBookingBanner && memorial}
	<BookingReminderBanner 
		memorialId={memorial.id}
		memorialName={memorial.lovedOneName}
		onDismiss={handleBannerDismiss}
		visible={bannerVisible}
	/>
{/if}

<div class="memorial-page {showBookingBanner ? 'banner-active' : ''}">
	{#if memorial}
		{#if hasCustomHtml && (memorial as any).custom_html}
			<!-- Legacy Memorial Layout with Custom HTML -->
			<div class="legacy-memorial">
				<div class="memorial-header">
					<!-- Glass box wrapper for title only -->
					<div class="glass-box">
						<h1 class="memorial-title">
							{#if !(memorial as any).customTitle}
								<span class="celebration-prefix">Celebration of Life for</span>
							{/if}
							<span class="loved-one-name">{(memorial as any).customTitle || memorial.lovedOneName}</span>
						</h1>
					</div>
					
					<!-- Share Button with Popup -->
					<div class="share-container">
						<button 
							class="share-button"
							onclick={toggleSharePopup}
							title="Share memorial"
							aria-label="Share memorial"
						>
							<Share2 size={18} />
						</button>
						
						{#if showSharePopup}
							<div class="share-popup">
								<button onclick={shareOnFacebook} class="share-option facebook" title="Share on Facebook">
									<Facebook size={18} />
									<span>Facebook</span>
								</button>
								<button onclick={shareOnTwitter} class="share-option twitter" title="Share on X (Twitter)">
									<Twitter size={18} />
									<span>Twitter</span>
								</button>
								<button onclick={shareOnLinkedIn} class="share-option linkedin" title="Share on LinkedIn">
									<Linkedin size={18} />
									<span>LinkedIn</span>
								</button>
								<button onclick={copyLink} class="share-option copy" title="Copy link">
									<Share2 size={18} />
									<span>Copy Link</span>
								</button>
							</div>
						{/if}
					</div>
					
					<!-- Hero Slideshow Section - Outside glass box -->
					<div class="hero-slideshow">
						<SlideshowSection 
							{slideshows} 
							memorialName={memorial.lovedOneName || 'Unknown'}
							memorialId={memorial.id}
							editable={canEditSlideshows()}
							currentUserId={user?.uid}
							heroMode={true}
						/>
					</div>
				</div>
				<!-- Stream Section - Use BlockRenderer if blocks exist, otherwise MemorialStreamDisplay -->
				<div class="memorial-body">
					<div class="streaming-section">
						{#if hasContentBlocks()}
							<BlockRenderer 
								blocks={(memorial as any).contentBlocks || []}
								{streams}
								{memorial}
							/>
						{:else}
							<MemorialStreamDisplay 
								streams={streams || []} 
								memorialName={(memorial as any).customTitle || memorial.lovedOneName}
							/>
						{/if}
					</div>
				</div>
				
				<!-- Legacy Custom HTML Content -->
				{#if (memorial as any).custom_html}
					<div class="memorial-content-container">
						<div class="legacy-content">
							{@html (memorial as any).custom_html}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<!-- Standard Memorial Layout -->
			<div class="memorial-layout">
				<!-- Header Section -->
				<div class="memorial-header">
					{#if memorial.imageUrl}
						<div class="memorial-image">
							<img src={memorial.imageUrl} alt={memorial.lovedOneName} />
						</div>
					{/if}
					
					<!-- Share Button with Popup -->
					<div class="share-container">
						<button 
							class="share-button"
							onclick={toggleSharePopup}
							title="Share memorial"
							aria-label="Share memorial"
						>
							<Share2 size={18} />
						</button>
						
						{#if showSharePopup}
							<div class="share-popup">
								<button onclick={shareOnFacebook} class="share-option facebook" title="Share on Facebook">
									<Facebook size={18} />
									<span>Facebook</span>
								</button>
								<button onclick={shareOnTwitter} class="share-option twitter" title="Share on X (Twitter)">
									<Twitter size={18} />
									<span>Twitter</span>
								</button>
								<button onclick={shareOnLinkedIn} class="share-option linkedin" title="Share on LinkedIn">
									<Linkedin size={18} />
									<span>LinkedIn</span>
								</button>
								<button onclick={copyLink} class="share-option copy" title="Copy link">
									<Share2 size={18} />
									<span>Copy Link</span>
								</button>
							</div>
						{/if}
					</div>
					
					<div class="memorial-header-content">
						<!-- Glass box wrapper for title and dates only -->
						<div class="glass-box">
							<h1 class="memorial-title">
 								<span class="loved-one-name">{(memorial as any).customTitle || memorial.lovedOneName}</span>
							</h1>
							
							{#if memorial.birthDate || memorial.deathDate}
								<div class="dates">
									{#if memorial.birthDate}
										<span>{formatDate(memorial.birthDate)}</span>
									{/if}
									{#if memorial.birthDate && memorial.deathDate}
										<span> - </span>
									{/if}
									{#if memorial.deathDate}
										<span>{formatDate(memorial.deathDate)}</span>
									{/if}
								</div>
							{/if}
						</div>
						
						<!-- Hero Slideshow Section - Outside glass box but inside header content -->
					<div class="hero-slideshow">
						<SlideshowSection 
							{slideshows} 
							memorialName={memorial.lovedOneName || 'Unknown'}
							memorialId={memorial.id}
							editable={canEditSlideshows()}
							currentUserId={user?.uid}
							heroMode={true}
						/>
					</div>
					</div>
				</div>

				<!-- Body Section -->
				<div class="memorial-body">
					<!-- Stream Section - Use BlockRenderer if blocks exist, otherwise MemorialStreamDisplay -->
					<div class="streaming-section">
						{#if hasContentBlocks()}
							<BlockRenderer 
								blocks={(memorial as any).contentBlocks || []}
								{streams}
								{memorial}
							/>
						{:else}
							<MemorialStreamDisplay 
								streams={streams || []} 
								memorialName={(memorial as any).customTitle || memorial.lovedOneName}
							/>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="loading">
			<p>Loading memorial information...</p>
		</div>
	{/if}
</div>

<style>
	/* Import fonts - MUST BE FIRST */
	@import url('https://fonts.googleapis.com/css2?family=Fanwood+Text:ital,wght@0,400;1,400&display=swap');
	@import url('https://fonts.googleapis.com/css2?family=ABeeZee:ital@0;1&display=swap');

	/* Memorial Page Styles */
	.memorial-page {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: #0a0a1a;
		min-height: 100vh;
		margin: -20px;
		padding: 0;
		width: calc(100% + 40px);
	}

	.memorial-content-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 2rem 0 2rem;
		color: #e0e0e0;
	}

	.memorial-header {
		text-align: center;
		margin: 0;
		padding: 4rem 2rem;
		width: 100vw;
		height: 66.67vh;
		margin-left: calc(-50vw + 50%);
		border-bottom: 1px solid #444;
		background-image: url('https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/Background.jpg?alt=media&token=460aeba9-0879-4e88-b10f-f012dc79c0e6');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		position: relative;
		color: white;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.memorial-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 1;
	}

	.memorial-header > * {
		position: relative;
		z-index: 2;
	}

	.memorial-header-content {
		position: relative;
		z-index: 2;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}
	
	.glass-box {
		padding: 2rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		backdrop-filter: blur(10px);
	}

	.memorial-title {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		line-height: 1.2;
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: white;
		font-weight: 300;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
	}

	.celebration-prefix {
		font-family: 'Fanwood', 'Fanwood Text', serif;
		font-style: italic;
		font-size: 0.7em;
		color: #ccc;
		margin-bottom: 0.25rem;
		font-weight: 300;
	}

	.loved-one-name {
		font-family: 'Fanwood Text', serif;
		font-style: italic;
		font-weight: inherit;
		color: inherit;
	}

	.dates {
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 1rem;
		font-style: italic;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
	}

	.memorial-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.memorial-body {
		padding: 3rem 2rem;
		background: #0a0a1a;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	/* Remove bottom padding when emergency embed is active */
	.memorial-body:has(.emergency-active) {
		padding-bottom: 0;
	}

	.memorial-description {
		max-width: 800px;
		margin: 0 auto;
		font-size: 1.1rem;
		line-height: 1.6;
		color: #e0e0e0;
	}

	.streaming-section {
		margin-bottom: 2rem;
		max-width: 1000px;
		margin: 0 auto;
		width: 100%;
	}

	.streaming-section h2 {
		font-size: 1.8rem;
		font-weight: 300;
		color: #e0e0e0;
		text-align: center;
		margin-bottom: 1.5rem;
		font-family: 'Fanwood Text', serif;
		font-style: italic;
	}

	.loading {
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
		font-style: italic;
	}

	/* Legacy Memorial Styles */
	.legacy-memorial {
		margin-bottom: 0;
	}

	.legacy-memorial .memorial-content-container {
		padding-bottom: 0;
	}

	.legacy-content {
		margin: 2rem 0 0 0; /* Remove bottom margin */
		width: 100%;
	}

	.legacy-content :global(iframe) {
		width: 100%;
		height: auto;
		min-height: 400px;
	}

	.legacy-content :global(div[style*="position:relative"]) {
		width: 100% !important;
		max-width: 800px;
		margin: 0 auto;
	}

	/* Banner integration styles */
	.memorial-page.banner-active {
		padding-top: 80px; /* Space for banner */
		transition: padding-top 0.3s ease-out;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.memorial-content-container {
			padding: 2rem 1rem 0 1rem;
		}

		.memorial-header {
			padding: 3rem 1rem;
			height: 50vh;
			min-height: 400px;
		}

		.memorial-title {
			font-size: 2rem;
		}

		.memorial-header-content {
			padding: 1.5rem;
		}

		.memorial-body {
			padding: 2rem 1rem;
		}

		.legacy-content :global(iframe) {
			min-height: 250px;
		}
	}
	
	/* Hero Slideshow Styles */
	.hero-slideshow {
		display: flex;
		justify-content: center;
		padding: 0 2rem; /* Side padding for mobile */
	}
	
	.hero-slideshow :global(.slideshow-section) {
		margin: 0;
	}
	
	.hero-slideshow :global(.slideshows-container) {
		max-width: 300px; /* About 1/8 viewport */
	}
	
	/* Float nicely outside the glass box */
	.memorial-header .hero-slideshow {
		position: relative;
		z-index: 10; /* Above background elements */
	}
	
	/* Spacing handled by flex gap in memorial-header-content */
	.memorial-header-content .hero-slideshow {
		margin: 0;
	}
	
	@media (max-width: 768px) {
		.hero-slideshow {
			margin: 1.5rem 0 1rem 0;
			padding: 0 1rem;
		}
		
		.hero-slideshow :global(.slideshows-container) {
			max-width: 200px; /* Smaller on mobile */
		}
	}
	

	/* Social Share Styles */
	.share-container {
		position: absolute;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 100;
	}

	.share-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		padding: 0;
		background: rgba(213, 186, 127, 0.95);
		backdrop-filter: blur(10px);
		color: white;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
	}

	.share-button:hover {
		background: rgba(213, 186, 127, 1);
		color: white;
		transform: translateY(-2px) scale(1.05);
		box-shadow: 0 6px 20px rgba(213, 186, 127, 0.4);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.share-popup {
		position: absolute;
		bottom: calc(100% + 0.5rem);
		right: 0;
		background: white;
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 180px;
		animation: slideUp 0.2s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.share-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: white;
		color: #374151;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;
	}

	.share-option:hover {
		background: #f3f4f6;
		transform: translateX(4px);
	}

	.share-option.facebook:hover {
		background: #1877f2;
		color: white;
	}

	.share-option.twitter:hover {
		background: #000000;
		color: white;
	}

	.share-option.linkedin:hover {
		background: #0a66c2;
		color: white;
	}

	.share-option.copy:hover {
		background: #D5BA7F;
		color: white;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.share-container {
			bottom: 1rem;
			right: 1rem;
		}

		.share-button {
			width: 44px;
			height: 44px;
		}

		.share-popup {
			min-width: 160px;
		}

		.share-option {
			padding: 0.625rem 0.875rem;
			font-size: 0.8125rem;
		}
	}
</style>
