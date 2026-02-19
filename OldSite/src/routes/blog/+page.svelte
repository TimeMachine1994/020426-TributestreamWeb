<script lang="ts">
	import { onMount } from 'svelte';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Card, Button } from '$lib/components/minimal-modern';

	const theme = getTheme('minimal');

	let { data } = $props();

	const { featuredPosts, latestPosts, categoryCounts, totalPosts, error, usingMockData } = $derived(data);

	function formatDate(date: Date | string | null): string {
		if (!date) return '';
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(new Date(date));
	}

	function getCategoryColor(category: string): string {
		const colors: Record<string, string> = {
			'memorial-planning': '#D5BA7F',
			'grief-support': '#8B9DC3',
			'technology': '#7C9885',
			'funeral-industry': '#A67C7C',
			'livestreaming': '#B8860B',
			'company-news': '#6B7280',
			'customer-stories': '#DC2626'
		};
		return colors[category] || '#6B7280';
	}

	function getCategoryLabel(category: string): string {
		const labels: Record<string, string> = {
			'memorial-planning': 'Memorial Planning',
			'grief-support': 'Grief Support',
			'technology': 'Technology',
			'funeral-industry': 'Funeral Industry',
			'livestreaming': 'Live Streaming',
			'company-news': 'Company News',
			'customer-stories': 'Customer Stories'
		};
		return labels[category] || category;
	}

	// Slider banner functionality
	let currentSlide = 0;
	const bannerSlides = [
		{
			title: 'Need Help Planning a Memorial Service?',
			subtitle: 'Our expert team is here to guide you through every step',
			cta: 'Get Started Free',
			link: '/register/loved-one',
			background: 'linear-gradient(135deg, #D5BA7F 0%, #B8860B 100%)'
		},
		{
			title: 'Professional Live Streaming Services',
			subtitle: 'Bring distant family and friends together for your memorial',
			cta: 'Book Demo',
			link: '/book-demo',
			background: 'linear-gradient(135deg, #8B9DC3 0%, #6B7280 100%)'
		},
		{
			title: 'Funeral Directors: Partner with Us',
			subtitle: 'Offer professional streaming services to your families',
			cta: 'Learn More',
			link: '/for-funeral-directors',
			background: 'linear-gradient(135deg, #7C9885 0%, #059669 100%)'
		}
	];

	onMount(() => {
		const interval = setInterval(() => {
			currentSlide = (currentSlide + 1) % bannerSlides.length;
		}, 5000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Tributestream Blog - Memorial Planning & Live Streaming Insights</title>
	<meta name="description" content="Expert guidance on memorial planning, live streaming services, and supporting families during difficult times. Professional insights for funeral directors and families." />
	<meta name="keywords" content="memorial planning, live streaming, funeral services, grief support, tribute stream" />
	
	<!-- Canonical URL -->
	<link rel="canonical" href="https://tributestream.com/blog" />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Tributestream" />
	<meta property="og:title" content="Tributestream Blog - Memorial Planning & Live Streaming" />
	<meta property="og:description" content="Expert guidance on memorial planning, live streaming services, and supporting families during difficult times." />
	<meta property="og:url" content="https://tributestream.com/blog" />
	<meta property="og:image" content="https://tributestream.com/blog-og-image.jpg" />
	<meta property="og:image:alt" content="Tributestream Blog" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	
	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@tributestream" />
	<meta name="twitter:creator" content="@tributestream" />
	<meta name="twitter:title" content="Tributestream Blog - Memorial Planning & Live Streaming" />
	<meta name="twitter:description" content="Expert guidance on memorial planning, live streaming services, and supporting families during difficult times." />
	<meta name="twitter:image" content="https://tributestream.com/blog-og-image.jpg" />
	<meta name="twitter:image:alt" content="Tributestream Blog" />
	
	<!-- Structured Data (JSON-LD) -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Blog',
		name: 'Tributestream Blog',
		description: 'Expert guidance on memorial planning, live streaming services, and supporting families during difficult times.',
		url: 'https://tributestream.com/blog',
		publisher: {
			'@type': 'Organization',
			name: 'Tributestream',
			logo: {
				'@type': 'ImageObject',
				url: 'https://tributestream.com/logo.png'
			}
		}
	})}</script>`}
</svelte:head>

<div class="blog-container" style="font-family: {theme.font.body}">
	<!-- Hero Section -->
	<section class="hero-section">
		<div class="hero-content">
			<h1 class="hero-title">Tributestream Blog</h1>
			<p class="hero-subtitle">Expert guidance on memorial planning, live streaming, and supporting families</p>
			{#if usingMockData}
				<div class="mock-data-notice">
					<p>📝 Currently showing sample content. Use FireCMS to create real blog posts.</p>
				</div>
			{/if}
			{#if error}
				<div class="error-notice">
					<p>⚠️ {error}</p>
				</div>
			{/if}
		</div>
	</section>

	<div class="container">
		<!-- Featured Posts -->
		{#if featuredPosts && featuredPosts.length > 0}
			<section class="featured-section">
				<h2 class="section-title">Featured Articles</h2>
				<div class="featured-grid">
					{#each featuredPosts as post}
						<Card theme="minimal" class="featured-card">
							<div class="card-image">
								{#if post.featuredImage}
									<img src={post.featuredImage} alt={post.title} loading="lazy" />
								{:else}
									<div class="placeholder-image">
										<div class="placeholder-content">
											<span>📝</span>
											<p>No Image</p>
										</div>
									</div>
								{/if}
								<div class="category-badge" style="background-color: {getCategoryColor(post.category)}">
									{getCategoryLabel(post.category)}
								</div>
							</div>
							<div class="card-content">
								<h3 class="card-title">{post.title}</h3>
								<p class="card-excerpt">{post.excerpt}</p>
								<div class="card-meta">
									<span class="author">By {post.authorName}</span>
									<span class="date">{formatDate(post.publishedAt)}</span>
									{#if post.readingTime}
										<span class="reading-time">{post.readingTime} min read</span>
									{/if}
								</div>
								<div class="card-actions">
									<a href="/blog/{post.slug}" class="read-more-btn">Read More</a>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Latest Posts -->
		{#if latestPosts && latestPosts.length > 0}
			<section class="latest-section">
				<h2 class="section-title">Latest Articles</h2>
				<div class="latest-grid">
					{#each latestPosts as post}
						<Card theme="minimal" class="latest-card">
							<div class="card-image">
								{#if post.featuredImage}
									<img src={post.featuredImage} alt={post.title} loading="lazy" />
								{:else}
									<div class="placeholder-image">
										<div class="placeholder-content">
											<span>📝</span>
											<p>No Image</p>
										</div>
									</div>
								{/if}
							</div>
							<div class="card-content">
								<div class="category-badge" style="background-color: {getCategoryColor(post.category)}">
									{getCategoryLabel(post.category)}
								</div>
								<h3 class="card-title">{post.title}</h3>
								<p class="card-excerpt">{post.excerpt}</p>
								<div class="card-meta">
									<span class="author">By {post.authorName}</span>
									<span class="date">{formatDate(post.publishedAt)}</span>
								</div>
								<div class="card-actions">
									<a href="/blog/{post.slug}" class="read-more-btn">Read More</a>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Categories Overview -->
		{#if categoryCounts && Object.keys(categoryCounts).length > 0}
			<section class="categories-section">
				<h2 class="section-title">Browse by Category</h2>
				<div class="categories-grid">
					{#each Object.entries(categoryCounts) as [category, count]}
						<div class="category-card" style="border-color: {getCategoryColor(category)}">
							<div class="category-icon" style="background-color: {getCategoryColor(category)}"></div>
							<h3 class="category-name">{getCategoryLabel(category)}</h3>
							<p class="category-count">{count} article{count !== 1 ? 's' : ''}</p>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</div>

	<!-- Slider Banner Section -->
	<section class="banner-section">
		<div class="banner-slider">
			{#each bannerSlides as slide, index}
				<div 
					class="banner-slide" 
					class:active={index === currentSlide}
					style="background: {slide.background}"
				>
					<div class="banner-content">
						<h3 class="banner-title">{slide.title}</h3>
						<p class="banner-subtitle">{slide.subtitle}</p>
						<a href={slide.link} class="banner-cta-link">
							{slide.cta}
						</a>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Slider Indicators -->
		<div class="slider-indicators">
			{#each bannerSlides as _, index}
				<button 
					class="indicator" 
					class:active={index === currentSlide}
					on:click={() => currentSlide = index}
					aria-label="Go to slide {index + 1}"
				></button>
			{/each}
		</div>
	</section>
</div>

<style>
	.blog-container {
		min-height: 100vh;
		background-color: #fafafa;
	}

	.hero-section {
		background: linear-gradient(135deg, #D5BA7F 0%, #B8860B 100%);
		color: white;
		padding: 80px 20px;
		text-align: center;
	}

	.hero-title {
		font-size: 3.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		text-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.hero-subtitle {
		font-size: 1.25rem;
		opacity: 0.9;
		max-width: 600px;
		margin: 0 auto;
	}

	.mock-data-notice {
		margin-top: 1rem;
		padding: 1rem;
		background: rgba(255,255,255,0.15);
		border-radius: 8px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255,255,255,0.2);
	}

	.error-notice {
		margin-top: 1rem;
		padding: 1rem;
		background: rgba(255,255,255,0.1);
		border-radius: 8px;
		backdrop-filter: blur(10px);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.section-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 4rem 0 2rem 0;
		text-align: center;
	}

	/* Featured Posts */
	.featured-section {
		padding: 4rem 0;
	}

	.featured-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}

	/* Latest Posts */
	.latest-section {
		padding: 2rem 0 4rem 0;
	}

	.latest-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-top: 2rem;
	}

	/* Card Styles */
	:global(.featured-card), :global(.latest-card) {
		overflow: hidden;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	:global(.featured-card:hover), :global(.latest-card:hover) {
		transform: translateY(-4px);
		box-shadow: 0 20px 40px rgba(0,0,0,0.1);
	}

	.card-image {
		position: relative;
		width: 100%;
		height: 200px;
		overflow: hidden;
	}

	.card-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.placeholder-image {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-content {
		text-align: center;
		color: #9ca3af;
	}

	.placeholder-content span {
		font-size: 2rem;
		display: block;
		margin-bottom: 0.5rem;
	}

	.placeholder-content p {
		font-size: 0.875rem;
		margin: 0;
		font-weight: 500;
	}

	:global(.featured-card:hover) .card-image img,
	:global(.latest-card:hover) .card-image img {
		transform: scale(1.05);
	}

	.category-badge {
		position: absolute;
		top: 1rem;
		left: 1rem;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: capitalize;
	}

	.card-content {
		padding: 1.5rem;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.75rem;
		line-height: 1.4;
	}

	.card-excerpt {
		color: #6b7280;
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	.card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.875rem;
		color: #9ca3af;
		margin-bottom: 1rem;
	}

	.card-actions {
		margin-top: 1rem;
	}

	.read-more-btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background-color: #D5BA7F;
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.3s ease;
		border: none;
		cursor: pointer;
	}

	.read-more-btn:hover {
		background-color: #C5AA6F;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(213, 186, 127, 0.3);
	}

	/* Categories Section */
	.categories-section {
		padding: 2rem 0 4rem 0;
	}

	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 2rem;
	}

	.category-card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		border: 2px solid transparent;
		text-align: center;
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.category-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px rgba(0,0,0,0.1);
	}

	.category-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		margin: 0 auto 1rem auto;
	}

	.category-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.category-count {
		color: #6b7280;
		font-size: 0.875rem;
	}

	/* Banner Section */
	.banner-section {
		position: relative;
		height: 300px;
		overflow: hidden;
		margin-top: 4rem;
	}

	.banner-slider {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.banner-slide {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.5s ease-in-out;
	}

	.banner-slide.active {
		opacity: 1;
	}

	.banner-content {
		text-align: center;
		color: white;
		max-width: 600px;
		padding: 0 2rem;
	}

	.banner-title {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		text-shadow: 0 2px 4px rgba(0,0,0,0.2);
	}

	.banner-subtitle {
		font-size: 1.1rem;
		margin-bottom: 2rem;
		opacity: 0.9;
	}

	.banner-cta-link {
		display: inline-block;
		background: white;
		color: #1f2937;
		font-weight: 600;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		text-decoration: none;
		border-radius: 6px;
		transition: all 0.3s ease;
		border: none;
		cursor: pointer;
	}

	.banner-cta-link:hover {
		background: #f9fafb;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.slider-indicators {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.5rem;
	}

	.indicator {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: rgba(255,255,255,0.5);
		border: none;
		cursor: pointer;
		transition: background 0.3s ease;
	}

	.indicator.active {
		background: white;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-title {
			font-size: 2.5rem;
		}

		.section-title {
			font-size: 2rem;
		}

		.featured-grid, .latest-grid {
			grid-template-columns: 1fr;
		}

		.banner-title {
			font-size: 1.8rem;
		}

		.banner-subtitle {
			font-size: 1rem;
		}

		.categories-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}
	}
</style>
