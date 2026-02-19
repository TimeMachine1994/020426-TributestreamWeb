<script lang="ts">
	import { onMount } from 'svelte';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Card } from '$lib/components/minimal-modern';
	import { Star, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-svelte';

	interface GoogleReview {
		author_name: string;
		rating: number;
		text: string;
		relative_time_description: string;
		profile_photo_url: string;
		time: number;
	}

	interface GoogleReviewsData {
		reviews: GoogleReview[];
		rating: number;
		total_reviews: number;
		source: 'google' | 'fallback';
	}

	let reviews: GoogleReview[] = [];
	let currentIndex = $state(0);
	let isLoading = $state(true);
	let error = $state('');
	let autoplayInterval: NodeJS.Timeout;
	let overallRating = $state(0);
	let totalReviews = $state(0);
	let source = $state<'google' | 'fallback'>('fallback');

	const theme = getTheme('minimal');

	// Auto-advance carousel every 5 seconds
	function startAutoplay() {
		autoplayInterval = setInterval(() => {
			nextReview();
		}, 5000);
	}

	function stopAutoplay() {
		if (autoplayInterval) {
			clearInterval(autoplayInterval);
		}
	}

	function nextReview() {
		currentIndex = (currentIndex + 1) % reviews.length;
	}

	function prevReview() {
		currentIndex = currentIndex === 0 ? reviews.length - 1 : currentIndex - 1;
	}

	function goToReview(index: number) {
		currentIndex = index;
	}

	function renderStars(rating: number) {
		return Array.from({ length: 5 }, (_, i) => i < rating);
	}

	function truncateText(text: string, maxLength: number = 150) {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength).trim() + '...';
	}

	onMount(async () => {
		try {
			const response = await fetch('/api/google-reviews');
			const data: GoogleReviewsData = await response.json();
			
			reviews = data.reviews;
			overallRating = data.rating;
			totalReviews = data.total_reviews;
			source = data.source;
			
			if (reviews.length > 0) {
				startAutoplay();
			}
		} catch (err) {
			error = 'Failed to load reviews';
			console.error('Error loading Google reviews:', err);
		} finally {
			isLoading = false;
		}

		// Cleanup on component destroy
		return () => {
			stopAutoplay();
		};
	});
</script>

<div class="google-reviews-carousel" onmouseenter={stopAutoplay} onmouseleave={startAutoplay}>
	{#if isLoading}
		<div class="text-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D5BA7F] mx-auto"></div>
			<p class="text-slate-600 mt-2">Loading reviews...</p>
		</div>
	{:else if error}
		<div class="text-center py-8">
			<p class="text-red-600">{error}</p>
		</div>
	{:else if reviews.length > 0}
		<!-- Overall Rating Header -->
		<div class="text-center mb-8">
			<div class="flex justify-center items-center gap-2 mb-2">
				<div class="flex">
					{#each renderStars(Math.round(overallRating)) as filled}
						<Star class="h-5 w-5 {filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}" />
					{/each}
				</div>
				<span class="text-lg font-semibold text-slate-900">{overallRating.toFixed(1)}</span>
			</div>
			<p class="text-sm text-slate-600">
				Based on {totalReviews} Google reviews
				{#if source === 'google'}
					<ExternalLink class="h-3 w-3 inline ml-1" />
				{/if}
			</p>
		</div>

		<!-- Carousel Container -->
		<div class="relative">
			<!-- Navigation Buttons -->
			{#if reviews.length > 1}
				<button
					class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
					onclick={prevReview}
					aria-label="Previous review"
				>
					<ChevronLeft class="h-5 w-5 text-slate-600" />
				</button>

				<button
					class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
					onclick={nextReview}
					aria-label="Next review"
				>
					<ChevronRight class="h-5 w-5 text-slate-600" />
				</button>
			{/if}

			<!-- Reviews Display -->
			<div class="overflow-hidden">
				<div 
					class="flex transition-transform duration-500 ease-in-out"
					style="transform: translateX(-{currentIndex * 100}%)"
				>
					{#each reviews as review, index}
						<div class="w-full flex-shrink-0 px-4">
							<Card theme="minimal" class="text-center h-full">
								<!-- Profile Photo -->
								{#if review.profile_photo_url}
									<div class="flex justify-center mb-4">
										<img 
											src={review.profile_photo_url} 
											alt="{review.author_name}'s profile"
											class="w-12 h-12 rounded-full object-cover"
											loading="lazy"
										/>
									</div>
								{/if}

								<!-- Star Rating -->
								<div class="flex justify-center mb-3">
									{#each renderStars(review.rating) as filled}
										<Star class="h-4 w-4 {filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}" />
									{/each}
								</div>

								<!-- Review Text -->
								<p class="text-sm text-slate-600 mb-4 leading-relaxed">
									"{truncateText(review.text)}"
								</p>

								<!-- Author and Time -->
								<div class="space-y-1">
									<p class="font-medium text-slate-900">— {review.author_name}</p>
									<p class="text-xs text-slate-500">{review.relative_time_description}</p>
								</div>
							</Card>
						</div>
					{/each}
				</div>
			</div>

			<!-- Dots Indicator -->
			{#if reviews.length > 1}
				<div class="flex justify-center mt-6 gap-2">
					{#each reviews as _, index}
						<button
							class="w-2 h-2 rounded-full transition-colors {index === currentIndex ? 'bg-[#D5BA7F]' : 'bg-gray-300'}"
							onclick={() => goToReview(index)}
							aria-label="Go to review {index + 1}"
						></button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Google Attribution -->
		{#if source === 'google'}
			<div class="text-center mt-4">
				<p class="text-xs text-slate-500">
					Reviews powered by 
					<a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" class="text-[#D5BA7F] hover:underline">
						Google
					</a>
				</p>
			</div>
		{/if}
	{:else}
		<div class="text-center py-8">
			<p class="text-slate-600">No reviews available at this time.</p>
		</div>
	{/if}
</div>

<style>
	.google-reviews-carousel {
		max-width: 800px;
		margin: 0 auto;
	}
</style>
