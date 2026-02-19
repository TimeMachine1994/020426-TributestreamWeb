<script lang="ts">
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Stats, FAQ, Comparison, Steps, Timeline, VideoPlayer } from '$lib/components/minimal-modern';
	import OptimizedImage from '$lib/components/OptimizedImage.svelte';
	import { OPTIMIZED_VIDEO_POSTERS, getResponsivePoster } from '$lib/utils/optimizedPosters';
	import { Star, Shield, Users, Play, Search, Phone, Clock, Pause, Volume2, Maximize, CheckCircle, Globe } from 'lucide-svelte';

	let lovedOneName = $state('');
	let searchQuery = $state('');
	let activeTab = $state('families');
	let currentStep = $state(0);
	
	// Hero video player state
	let heroVideo: HTMLVideoElement;
	let heroIsPlaying = $state(false);
	let heroCurrentTime = $state(0);
	let heroDuration = $state(0);
	let heroVolume = $state(1);

	// About Us video player state (existing)
	let video: HTMLVideoElement = $state();
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);

	const theme = getTheme('minimal');

	// Trust badges
	const trustBadges = [
		{ icon: Globe, text: "Worldwide Streaming" },
		{ icon: Users, text: "Custom Link to Share" },
		{ icon: Phone, text: "Expert On-Site Support" }
	];

	// Testimonials
	const testimonials = [
		{ text: "I joined an online funeral held for my coworker that was streamed by Tributestream. The streaming quality was great and they really respected and honored our friend. I was not able to go to the physical funeral and I still felt as if I was there.", author: "Joshua Hernandez", rating: 5, date: "Dec 6, 2022" },
		{ text: "These guys are great. My wife who passed was European, and we had well over 100 live viewers who could not make it to the states for the event. Everyone said the audio and video was top notch. Flawless. They are self sufficient and practically invisible. I highly recommend this service.", author: "Troy Kelly", rating: 5, date: "Sep 16, 2024" },
		{ text: "What an awesome company. They captured the entire experience. From the service to the entombment. Highly recommended.", author: "Donna Hinckson-Torres", rating: 5, date: "Sep 24, 2024" }
	];

	// How it works steps
	const familySteps = [
		{ title: "Create Memorial", description: "Set up your loved one's memorial page in minutes" },
		{ title: "Schedule Service", description: "Choose date, time, and streaming options" },
		{ title: "Share & Stream", description: "Send custom link to family and friends" }
	];

	const directorSteps = [
		{ title: "Book Demo", description: "Schedule a consultation with our team" },
		{ title: "Setup Service", description: "We handle all technical setup on-site" },
		{ title: "Go Live", description: "Professional streaming with expert support" }
	];

	// Timeline example
	const sampleTimeline = [
		{ time: "1:00 PM", title: "Tributestream Setup", detail: "Tributestream arrives early to setup gear" },
		{ time: "2:00 PM", title: "Livestream", detail: "Memorial service broadcast" },
		{ time: "3:00 PM", title: "Recording Available", detail: "Complimentary download available shortly after the service" }
	];

	const faqItems = [
		{ q: "How quickly can we set up streaming?", a: "Same-day streaming available in most areas. Call 407-221-5922 for immediate availability." },
		{ q: "Is the memorial link private?", a: "Yes, you control who receives the custom link. Optional password protection available." },
		{ q: "Can we download the recording?", a: "Yes, you receive a high-quality downloadable archive after the service." },
		{ q: "What if there are technical issues?", a: "Our expert technicians provide on-site support to ensure flawless streaming." },
		{ q: "How many people can watch?", a: "Unlimited viewers. Our worldwide content delivery network handles any audience size." },
		{ q: "Do you work with funeral homes?", a: "Yes, we partner with funeral directors to provide seamless memorial streaming services." },
		{ q: "What's included in the recording?", a: "Full HD recording, downloadable file, and optional edited highlights reel." },
		{ q: "How do we share the link?", a: "We provide a custom, secure link that you can share via email, text, or social media." }
	];

	const packages = [
		{ 
			name: "Record", 
			description: "Perfect for intimate services",
			features: ["Single camera", "Custom link", "HD streaming", "Complimentary download"],
			popular: false,
			familyCta: "Select Package",
			directorCta: "Get Quote"
		},
		{ 
			name: "Live", 
			description: "Complete professional service",
			popular: false,
			features: ["Multi-camera setup", "On-site technician", "Live support", "Custom graphics"],
			familyCta: "Select Package",
			directorCta: "Get Quote"
		},
		{ 
			name: "Legacy", 
			description: "Complete professional service",
			features: ["2+ locations", "On-site videographer", "Professional editing", "Custom USB"],
			popular: true,
			premium: true,
			familyCta: "Select Package",
			directorCta: "Get Quote"
		}
	];


	function renderStars(rating: number) {
		return Array(5).fill(0).map((_, i) => i < rating);
	}

	function handleCreateTribute() {
		console.log('🎯 Creating tribute for:', lovedOneName);
		const params = new URLSearchParams();
		if (lovedOneName.trim()) {
			params.set('name', lovedOneName.trim());
		}
		goto(`/register/loved-one?${params.toString()}`);
	}

	function handleSearchTributes() {
		console.log('🔍 Searching tributes for:', searchQuery);
		if (searchQuery.trim()) {
			goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	function handleBookDemo() {
		console.log('📞 Booking demo');
		goto('/book-demo');
	}

	function handleHowItWorks() {
		console.log('📋 Scrolling to how it works');
		document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
	}

	// Hero video player functions
	function heroTogglePlay() {
		if (!heroVideo) return;
		if (heroVideo.paused) {
			heroVideo.play();
			heroIsPlaying = true;
		} else {
			heroVideo.pause();
			heroIsPlaying = false;
		}
	}

	function heroHandleTimeUpdate() {
		if (!heroVideo) return;
		heroCurrentTime = heroVideo.currentTime;
	}

	function heroHandleLoadedMetadata() {
		if (!heroVideo) return;
		heroDuration = heroVideo.duration;
	}

	function heroHandleSeek(event: Event) {
		if (!heroVideo) return;
		const target = event.target as HTMLInputElement;
		const time = (parseFloat(target.value) / 100) * heroDuration;
		heroVideo.currentTime = time;
		heroCurrentTime = time;
	}

	function heroHandleVolumeChange(event: Event) {
		if (!heroVideo) return;
		const target = event.target as HTMLInputElement;
		heroVolume = parseFloat(target.value) / 100;
		heroVideo.volume = heroVolume;
	}

	function heroToggleFullscreen() {
		if (!heroVideo || !heroVideo.requestFullscreen) return;
		heroVideo.requestFullscreen();
	}

	// About Us video player functions (existing)
	function togglePlay() {
		if (!video) return;
		if (video.paused) {
			video.play();
			isPlaying = true;
		} else {
			video.pause();
			isPlaying = false;
		}
	}

	function handleTimeUpdate() {
		if (!video) return;
		currentTime = video.currentTime;
	}

	function handleLoadedMetadata() {
		if (!video) return;
		duration = video.duration;
	}

	function handleSeek(event: Event) {
		if (!video) return;
		const target = event.target as HTMLInputElement;
		const time = (parseFloat(target.value) / 100) * duration;
		video.currentTime = time;
		currentTime = time;
	}

	function handleVolumeChange(event: Event) {
		if (!video) return;
		const target = event.target as HTMLInputElement;
		volume = parseFloat(target.value) / 100;
		video.volume = volume;
	}

	function toggleFullscreen() {
		if (!video || !video.requestFullscreen) return;
		video.requestFullscreen();
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function handlePackageSelection(packageName: string) {
		console.log('📦 Package selected:', packageName);
		const params = new URLSearchParams();
		params.set('package', packageName.toLowerCase());
		if (lovedOneName.trim()) {
			params.set('name', lovedOneName.trim());
		}
		goto(`/register/loved-one?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>Beautiful, reliable memorial livestreams - Tributestream</title>
	<meta name="description" content="Custom links. On-site technicians. Heirloom recordings. Professional memorial livestreaming for families and funeral directors." />
</svelte:head>

<div class="bg-white text-gray-900" style="font-family: {theme.font.body}">
	<!-- Hero Section with Stacked Layout -->
	<section class="relative min-h-[90vh] flex flex-col bg-black">
		<!-- Video Background -->
		<video
			class="absolute inset-0 w-full h-full object-cover"
			autoplay
			muted
			loop
			playsinline
		>
			<source src="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/tributestream_advertisment%20(720p)%20(1).mp4?alt=media&token=301d3835-f64a-4ba3-8619-343600cb1117" type="video/mp4">
		</video>
		
		<!-- Dark overlay for text readability -->
		<div class="absolute inset-0 bg-black/50"></div>
		
		<!-- Stacked Content Container -->
		<div class="relative z-10 flex flex-col min-h-[80vh]">
			<!-- Top: Forms and Text -->
			<div class="pt-8 pb-8">
				<div class="mx-auto max-w-7xl px-6">
					<div class="text-center mb-8">
						<h1 class="text-4xl md:text-6xl font-bold text-white mb-4" style="font-family: {theme.font.heading}">
							Beautiful, reliable memorial livestreams
						</h1>
						<p class="text-xl md:text-2xl text-white max-w-3xl mx-auto mb-8">
							Bring everyone together—at church, graveside, or from home
						</p>
					</div>

					<!-- Dual CTA Clusters -->
					<div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
						<!-- Families CTA Cluster -->
						<div class="text-center">
							<h3 class="text-2xl font-semibold text-white mb-4">For Families</h3>
							<div class="space-y-3">
								<div class="flex gap-2">
									<Input
										type="text"
										placeholder="Loved one's name"
										bind:value={lovedOneName}
										theme="minimal"
										class="flex-1"
									/>
									<Button theme="minimal" onclick={handleCreateTribute} class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F]">
										Create Memorial
									</Button>
								</div>
								<div class="flex gap-2">
									<Input
										type="text"
										placeholder="Search memorials..."
										bind:value={searchQuery}
										theme="minimal"
										class="flex-1"
									/>
									<Button theme="minimal" onclick={handleSearchTributes} class="bg-white text-gray-900 hover:bg-gray-100 flex items-center">
										<Search class="h-4 w-4 mr-2" />
										Search
									</Button>
								</div>
							</div>
						</div>

						<!-- Funeral Directors CTA Cluster -->
						<div class="text-center">
							<h3 class="text-2xl font-semibold text-white mb-4">For Funeral Directors</h3>
							<div class="space-y-3">
								<Button theme="minimal" onclick={handleBookDemo} class="w-full bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center">
									<Phone class="h-4 w-4 mr-2" />
									Book a Demo
								</Button>
								<Button theme="minimal" variant="secondary" onclick={handleHowItWorks} class="w-full">
									How it works
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Middle: Demo Video - Own row -->
			<div class="px-6 py-8">
				<div class="w-full max-w-md mx-auto">
					<div class="relative rounded-lg overflow-hidden shadow-2xl bg-black/20 backdrop-blur-sm border border-white/10">
						<video
							bind:this={heroVideo}
							class="w-full aspect-video object-cover scale-110"
							ontimeupdate={heroHandleTimeUpdate}
							onloadedmetadata={heroHandleLoadedMetadata}
							onplay={() => heroIsPlaying = true}
							onpause={() => heroIsPlaying = false}
							preload="metadata"
						>
							<source src="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/tributestream_advertisment%20(720p)%20(1).mp4?alt=media&token=301d3835-f64a-4ba3-8619-343600cb1117" type="video/mp4">
							<track kind="captions" src="" srclang="en" label="English captions" default>
							Your browser does not support the video tag.
						</video>

					<!-- Play Button Overlay - Only visible when paused -->
					{#if !heroIsPlaying}
						<div class="absolute inset-0 flex items-center justify-center">
							<button
								onclick={heroTogglePlay}
								class="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg z-20"
								aria-label="Play video"
							>
								<Play class="w-6 h-6 text-black ml-0.5" />
							</button>
						</div>
					{/if}

					<!-- Custom Video Controls - Show pause on hover when playing -->
					<div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/20 group">
						{#if heroIsPlaying}
							<button
								onclick={heroTogglePlay}
								class="w-16 h-16 rounded-full bg-[#D5BA7F]/90 hover:bg-[#D5BA7F] flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
								aria-label="Pause video"
							>
								<Pause class="w-6 h-6 text-black ml-0" />
							</button>
						{/if}
					</div>

					<!-- Progress Bar and Controls -->
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
						<div class="flex items-center gap-2 text-white text-sm">
							<!-- Play/Pause Button -->
							<button
								onclick={heroTogglePlay}
								class="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
								aria-label={heroIsPlaying ? 'Pause' : 'Play'}
							>
								{#if heroIsPlaying}
									<Pause class="w-3 h-3" />
								{:else}
									<Play class="w-3 h-3 ml-0.5" />
								{/if}
							</button>

							<!-- Time Display -->
							<span class="text-xs font-medium">
								{formatTime(heroCurrentTime)} / {formatTime(heroDuration)}
							</span>

							<!-- Progress Bar -->
							<div class="flex-1 mx-2">
								<input
									type="range"
									min="0"
									max="100"
									value={heroDuration ? (heroCurrentTime / heroDuration) * 100 : 0}
									onchange={heroHandleSeek}
									class="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
								/>
							</div>

							<!-- Volume Control -->
							<div class="flex items-center gap-1">
								<Volume2 class="w-4 h-4" />
								<input
									type="range"
									min="0"
									max="100"
									value={heroVolume * 100}
									onchange={heroHandleVolumeChange}
									class="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
								/>
							</div>

							<!-- Fullscreen Button -->
							<button
								onclick={heroToggleFullscreen}
								class="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
								aria-label="Fullscreen"
							>
								<Maximize class="w-3 h-3" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Trust Badges Section -->
	<section class="py-8 bg-slate-900">
		<div class="max-w-6xl mx-auto px-6">
			<div class="flex justify-center items-center gap-8 flex-wrap">
				{#each trustBadges as badge}
					{@const IconComponent = badge.icon}
					<div class="flex items-center gap-2 text-sm text-white">
						<IconComponent class="h-5 w-5 text-[#D5BA7F]" />
						<span>{badge.text}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Social Proof Row -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid md:grid-cols-3 gap-8 mb-12">
				{#each testimonials as testimonial}
					<Card theme="minimal" class="text-center">
						<div class="flex justify-center mb-3">
							{#each renderStars(testimonial.rating) as filled}
								<Star class="h-4 w-4 {filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}" />
							{/each}
						</div>
						<p class="text-sm text-slate-600 mb-4 leading-relaxed">"{testimonial.text}"</p>
						<div class="space-y-1">
							<p class="font-medium text-slate-900">— {testimonial.author}</p>
							<p class="text-xs text-slate-500">{testimonial.date}</p>
						</div>
					</Card>
				{/each}
			</div>
			
			<div class="text-center">
				<p class="text-sm text-slate-600 mb-4">Trusted by funeral homes across Central Florida</p>
				<div class="space-y-2">
					<div class="text-xs font-medium text-slate-500 uppercase tracking-wider">PARTNER FUNERAL HOMES</div>
					<div class="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-slate-400">
						<span>A Community Funeral Home</span>
						<span class="hidden sm:inline">•</span>
						<span>Osceola Memory Gardens (All Locations)</span>
						<span class="hidden sm:inline">•</span>
						<span>De Guispe Funeral Home</span>
						<span class="hidden sm:inline">•</span>
						<span>Woodward Funeral Home</span>
						<span class="hidden sm:inline">•</span>
						<span>Baldwin Bros. Funeral Home</span>
						<span class="hidden sm:inline">•</span>
						<span>Lohman Funeral Home</span>
						<span class="hidden sm:inline">•</span>
						<span>Cape Canaveral National Cemetery</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- How It Works (Split by Audience) -->
	<section id="how-it-works" class="py-16 bg-slate-50">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900" style="font-family: {theme.font.heading}">
					How It Works
				</h2>
			</div>

			<!-- Tabs -->
			<div class="flex justify-center mb-12">
				<div class="bg-white rounded-lg p-1 shadow-sm">
					<button 
						class="px-6 py-2 rounded-md transition-colors {activeTab === 'families' ? 'bg-[#D5BA7F] text-white' : 'text-gray-600 hover:text-gray-900'}"
						onclick={() => { activeTab = 'families'; currentStep = 0; }}
					>
						Families
					</button>
					<button 
						class="px-6 py-2 rounded-md transition-colors {activeTab === 'directors' ? 'bg-[#D5BA7F] text-white' : 'text-gray-600 hover:text-gray-900'}"
						onclick={() => { activeTab = 'directors'; currentStep = 0; }}
					>
						Funeral Directors
					</button>
				</div>
			</div>

			<div class="grid md:grid-cols-2 gap-12 items-start">
				<div>
					<!-- Interactive Step Buttons -->
					<div class="flex flex-col sm:flex-row gap-3 mb-8">
						{#each (activeTab === 'families' ? familySteps : directorSteps) as step, index}
							<button
								class="flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 text-left {currentStep === index ? 'border-[#D5BA7F] bg-[#D5BA7F]/10' : 'border-gray-200 bg-white hover:border-[#D5BA7F]/50'}"
								onclick={() => currentStep = index}
							>
								<div class="text-xs font-semibold text-[#D5BA7F] mb-1">Step {index + 1}</div>
								<div class="font-medium text-slate-900">{step.title}</div>
							</button>
						{/each}
					</div>

					<!-- Dynamic Step Description -->
					<div class="mb-8">
						{#if activeTab === 'families'}
							<p class="text-slate-600 text-lg leading-relaxed">
								{familySteps[currentStep].description}
							</p>
						{:else}
							<p class="text-slate-600 text-lg leading-relaxed">
								{directorSteps[currentStep].description}
							</p>
						{/if}
					</div>

					<!-- CTA Button -->
					<div class="flex justify-center sm:justify-start">
						{#if activeTab === 'families'}
							<Button theme="minimal" class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] px-8 py-3">
								<a href="/register/loved-one" class="no-underline text-black font-semibold">
									Create Memorial
								</a>
							</Button>
						{:else}
							<Button theme="minimal" class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] px-8 py-3">
								<a href="/contact" class="no-underline text-black font-semibold">
									Book Demo
								</a>
							</Button>
						{/if}
					</div>
				</div>
				
				<div>
					<h4 class="text-lg font-semibold text-slate-900 mb-4">Service Day Timeline</h4>
					<Timeline theme="minimal" events={sampleTimeline} />
				</div>
			</div>
		</div>
	</section>

	<!-- Product Proof -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid md:grid-cols-2 gap-12 items-center">
				<div>
					<div class="video-player-custom rounded-lg overflow-hidden shadow-lg bg-black relative">
						<!-- Video Element -->
						<video 
							bind:this={video}
							class="w-full aspect-video"
							preload="metadata"
							poster="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/image_assets%2Fthumb%20for%20homevid%20002.png?alt=media&token=b5a29196-eceb-44cf-8e65-1b135d6b03ad"
							ontimeupdate={handleTimeUpdate}
							onloadedmetadata={handleLoadedMetadata}
							onplay={() => isPlaying = true}
							onpause={() => isPlaying = false}
							onloadstart={() => console.log('About Us video loading started')}
							oncanplay={() => console.log('About Us video can play')}
							onerror={(e) => console.error('About Us video error:', e)}
						>
							<source src="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/tributestream_-_about_us%20(1080p).mp4?alt=media&token=54cb483c-aa04-4b60-8f3d-15a3085a365a" type="video/mp4">
							<track kind="captions" src="" srclang="en" label="English captions" default>
							Your browser does not support the video tag.
						</video>

						<!-- Play Button Overlay for Thumbnail -->
						{#if !isPlaying && video && video.paused}
							<div class="absolute inset-0 flex items-center justify-center bg-black/10">
								<button
									onclick={togglePlay}
									class="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
									aria-label="Play video"
								>
									<Play class="w-8 h-8 text-black ml-1" />
								</button>
							</div>
						{/if}
						
						<!-- Custom Control Bar -->
						<div class="bg-gradient-to-r from-[#D5BA7F] to-[#C5AA6F] p-4 border-t border-[#B59A5F]">
							<div class="flex items-center space-x-4">
								<!-- Play/Pause Button -->
								<button 
									onclick={togglePlay}
									class="flex items-center justify-center w-12 h-12 bg-black text-[#D5BA7F] rounded-full hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
								>
									{#if isPlaying}
										<Pause class="h-6 w-6" />
									{:else}
										<Play class="h-6 w-6 ml-0.5" />
									{/if}
								</button>
								
								<!-- Progress Bar -->
								<div class="flex-1 flex items-center space-x-3">
									<span class="text-black text-sm font-bold min-w-[45px] tabular-nums">
										{formatTime(currentTime)}
									</span>
									<div class="flex-1 relative">
										<input
											type="range"
											min="0"
											max="100"
											value={duration ? (currentTime / duration) * 100 : 0}
											oninput={handleSeek}
											class="w-full progress-slider"
										/>
									</div>
									<span class="text-black text-sm font-bold min-w-[45px] tabular-nums">
										{formatTime(duration)}
									</span>
								</div>
								
								<!-- Volume Control -->
								<div class="flex items-center space-x-2">
									<Volume2 class="h-5 w-5 text-black" />
									<div class="w-24">
										<input
											type="range"
											min="0"
											max="100"
											value={volume * 100}
											oninput={handleVolumeChange}
											class="w-full volume-slider"
										/>
									</div>
								</div>
								
								<!-- Fullscreen Button -->
								<button 
									onclick={toggleFullscreen}
									class="flex items-center justify-center w-10 h-10 text-black hover:bg-black/10 rounded-lg transition-colors"
								>
									<Maximize class="h-5 w-5" />
								</button>
							</div>
						</div>
					</div>
					
					<!-- AI Generation Attribution -->
					<div class="text-center mt-4">
						<p class="text-sm text-slate-500 italic">This Ad was made with AI Generation.</p>
					</div>
				</div>
				<div>
					<h3 class="text-2xl font-bold text-slate-900 mb-6">Professional Streaming Technology</h3>
					<ul class="space-y-4">
						<li class="flex items-start gap-3">
							<Shield class="h-5 w-5 text-[#D5BA7F] mt-0.5 flex-shrink-0" />
							<div>
								<strong>Reliability:</strong> 99.9% uptime with automatic failover systems
							</div>
						</li>
						<li class="flex items-start gap-3">
							<Users class="h-5 w-5 text-[#D5BA7F] mt-0.5 flex-shrink-0" />
							<div>
								<strong>Custom links:</strong> Unique, custom links allow easy access for your invited guests
							</div>
						</li>
						<li class="flex items-start gap-3">
							<Play class="h-5 w-5 text-[#D5BA7F] mt-0.5 flex-shrink-0" />
							<div>
								<strong>Downloadable archive:</strong> High-quality recording available within 24 hours
							</div>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- Packages & Pricing -->
	<section class="py-16 bg-slate-50">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900" style="font-family: {theme.font.heading}">
					Packages & Pricing
				</h2>
				<p class="mt-4 text-lg text-slate-600">
					Professional memorial streaming options for every family's needs
				</p>
			</div>
			<!-- Custom Package Cards -->
			<div class="grid md:grid-cols-3 gap-8">
				{#each packages as pkg}
					<Card theme="minimal" class="relative p-8 text-center {pkg.popular ? 'ring-2 ring-[#D5BA7F] ring-offset-2' : ''}">
						{#if pkg.popular}
							<div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#D5BA7F] text-black px-4 py-1 rounded-full text-sm font-semibold">
								Most Popular
							</div>
						{/if}
						<h3 class="text-2xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
						<p class="text-slate-600 mb-6">{pkg.description}</p>
						<ul class="space-y-3 mb-8">
							{#each pkg.features as feature}
								<li class="flex items-center justify-center space-x-2">
									<CheckCircle class="h-4 w-4 text-[#D5BA7F] flex-shrink-0" />
									<span class="text-slate-700">{feature}</span>
								</li>
							{/each}
						</ul>
						<Button 
							theme="minimal" 
							class="w-full {pkg.popular ? 'bg-[#D5BA7F] text-black hover:bg-[#C5AA6F]' : ''}"
							onclick={() => handlePackageSelection(pkg.name)}
						>
							{pkg.familyCta}
						</Button>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Regional Trust & Availability -->
	<section class="py-16 bg-white">
		<div class="max-w-4xl mx-auto px-6 text-center">
			<h3 class="text-2xl font-bold text-slate-900 mb-8">Central Florida Coverage</h3>
			<div class="grid md:grid-cols-3 gap-8 mb-8">
				<div>
					<Clock class="h-8 w-8 text-[#D5BA7F] mx-auto mb-3" />
					<h4 class="font-semibold text-slate-900 mb-2">Same-Day Available</h4>
					<p class="text-sm text-slate-600">Emergency streaming setup in most areas</p>
				</div>
				<div>
					<Phone class="h-8 w-8 text-[#D5BA7F] mx-auto mb-3" />
					<h4 class="font-semibold text-slate-900 mb-2">24/7 Support</h4>
					<p class="text-sm text-slate-600">Call or text: <a href="tel:407-221-5922" class="text-[#D5BA7F] hover:underline">407-221-5922</a></p>
				</div>
				<div>
					<Users class="h-8 w-8 text-[#D5BA7F] mx-auto mb-3" />
					<h4 class="font-semibold text-slate-900 mb-2">9 Counties</h4>
					<p class="text-sm text-slate-600">Orange, Seminole, Lake, Volusia & more</p>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	<section id="faq" class="py-16 bg-slate-50">
		<div class="max-w-4xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900" style="font-family: {theme.font.heading}">
					Frequently Asked Questions
				</h2>
			</div>
			<Card theme="minimal">
				<FAQ theme="minimal" items={faqItems} />
			</Card>
			<div class="text-center mt-8">
				<p class="text-lg text-slate-600 mb-4">Still have questions?</p>
				<Button theme="minimal" onclick={() => goto('/contact')}>
					Contact Us
				</Button>
			</div>
		</div>
	</section>
</div>

<style>
	/* Custom video player styling */
	:global(.video-player-custom video) {
		background-color: transparent;
	}

	:global(.video-player-custom video:focus) {
		outline: 2px solid #D5BA7F;
		outline-offset: 2px;
	}

	/* Progress Slider Styling */
	:global(.progress-slider) {
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 3px;
		outline: none;
		cursor: pointer;
	}

	:global(.progress-slider::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #000;
		border: 3px solid #D5BA7F;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		margin-top: -6px;
		transition: all 0.2s ease;
	}

	:global(.progress-slider::-webkit-slider-thumb:hover) {
		transform: scale(1.15);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
	}

	:global(.progress-slider::-moz-range-thumb) {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #000;
		border: 3px solid #D5BA7F;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		-moz-appearance: none;
		transition: all 0.2s ease;
	}

	:global(.progress-slider::-moz-range-track) {
		height: 6px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 3px;
		border: none;
	}

	/* Volume Slider Styling */
	:global(.volume-slider) {
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 2px;
		outline: none;
		cursor: pointer;
	}

	:global(.volume-slider::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #000;
		border: 2px solid #D5BA7F;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		margin-top: -5px; /* Centers 14px thumb on 4px track */
		transition: all 0.2s ease;
	}

	:global(.volume-slider::-webkit-slider-thumb:hover) {
		transform: scale(1.1);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
	}

	:global(.volume-slider::-moz-range-thumb) {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #000;
		border: 2px solid #D5BA7F;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		-moz-appearance: none;
		transition: all 0.2s ease;
		margin-top: 0;
	}

	:global(.volume-slider::-moz-range-track) {
		height: 4px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 2px;
		border: none;
	}

	/* Progress bar fill effect */
	:global(.progress-slider::-webkit-slider-runnable-track) {
		background: linear-gradient(
			to right,
			#000 0%,
			#000 var(--progress, 0%),
			rgba(0, 0, 0, 0.2) var(--progress, 0%),
			rgba(0, 0, 0, 0.2) 100%
		);
		height: 8px;
		border-radius: 4px;
	}

	/* Video Player Slider Styles */
	:global(.slider) {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		cursor: pointer;
	}

	:global(.slider::-webkit-slider-track) {
		background: rgba(255, 255, 255, 0.2);
		height: 4px;
		border-radius: 2px;
	}

	:global(.slider::-webkit-slider-thumb) {
		-webkit-appearance: none;
		appearance: none;
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: #D5BA7F;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	:global(.slider::-moz-range-track) {
		background: rgba(255, 255, 255, 0.2);
		height: 4px;
		border-radius: 2px;
		border: none;
	}

	:global(.slider::-moz-range-thumb) {
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: #D5BA7F;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	/* Video container hover effects */
	:global(.video-container:hover .video-controls) {
		opacity: 1;
	}

	/* Hero video zoom effect */
	:global(.hero-video-zoom) {
		transform: scale(1.2);
		transform-origin: center center;
	}

	/* Sunrise/Sunset radial gradients */
	:global(.bg-gradient-radial) {
		background-image: radial-gradient(circle, var(--tw-gradient-stops));
	}

	/* Floating Light Flare Animations */
	@keyframes float-slow {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
		25% { transform: translateY(-20px) translateX(10px) scale(1.1); }
		50% { transform: translateY(-10px) translateX(-5px) scale(0.9); }
		75% { transform: translateY(-30px) translateX(-10px) scale(1.05); }
	}

	@keyframes float-medium {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
		33% { transform: translateY(-15px) translateX(-8px) scale(1.2); }
		66% { transform: translateY(-25px) translateX(12px) scale(0.8); }
	}

	@keyframes float-fast {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
		20% { transform: translateY(-10px) translateX(5px) scale(1.1); }
		40% { transform: translateY(-20px) translateX(-3px) scale(0.9); }
		60% { transform: translateY(-15px) translateX(-8px) scale(1.2); }
		80% { transform: translateY(-25px) translateX(7px) scale(0.85); }
	}

	@keyframes float-reverse {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
		25% { transform: translateY(20px) translateX(-10px) scale(0.9); }
		50% { transform: translateY(10px) translateX(5px) scale(1.1); }
		75% { transform: translateY(30px) translateX(10px) scale(0.95); }
	}

	@keyframes float-slow-reverse {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
		33% { transform: translateY(15px) translateX(8px) scale(0.8); }
		66% { transform: translateY(25px) translateX(-12px) scale(1.2); }
	}

	@keyframes float-tiny {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
		50% { transform: translateY(-8px) translateX(4px) scale(1.3); }
	}

	@keyframes float-tiny-reverse {
		0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
		50% { transform: translateY(8px) translateX(-4px) scale(0.7); }
	}

	:global(.animate-float-slow) { animation: float-slow 25s ease-in-out infinite; }
	:global(.animate-float-medium) { animation: float-medium 18s ease-in-out infinite; }
	:global(.animate-float-fast) { animation: float-fast 12s ease-in-out infinite; }
	:global(.animate-float-reverse) { animation: float-reverse 22s ease-in-out infinite; }
	:global(.animate-float-slow-reverse) { animation: float-slow-reverse 28s ease-in-out infinite; }
	:global(.animate-float-tiny) { animation: float-tiny 8s ease-in-out infinite; }
	:global(.animate-float-tiny-reverse) { animation: float-tiny-reverse 10s ease-in-out infinite; }
</style>
