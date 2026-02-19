<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Stats, FAQ, Comparison } from '$lib/components/minimal-modern';

	let video: HTMLVideoElement;
	let lovedOneName = $state('');

	const theme = getTheme('minimal');

	// Sample data for components
	const statsData = [
		{ label: "Families Served", value: "1,200+" },
		{ label: "Live Viewers", value: "85 avg" },
		{ label: "Counties", value: "9" }
	];

	const faqItems = [
		{ q: "How quickly can we go live?", a: "Same day in most cases. Call us for availability at 407-221-5922." },
		{ q: "Is the memorial link private?", a: "Yes, you control who receives the link. Password protection is optional." },
		{ q: "Can we download the recording?", a: "Yes, you receive a high-quality archive file after the service." }
	];

	const packages = [
		{ 
			name: "DIY Record", 
			price: "$395", 
			features: ["2 hour broadcast", "Private link", "HD recording", "Mobile ready"] 
		},
		{ 
			name: "Standard", 
			price: "$895", 
			featured: true,
			features: ["Multi-camera setup", "On-site technician", "Live support", "Custom graphics"] 
		},
		{ 
			name: "Premium", 
			price: "$1,695", 
			features: ["3+ locations", "Wireless audio", "Professional editing", "Extended archive"] 
		}
	];

	onMount(() => {
		console.log('📹 Homepage mounted, setting video playback rate.');
		if (video) {
			video.playbackRate = 0.5;
		}
	});

	function handleCreateTribute() {
		console.log('🎯 Creating tribute for:', lovedOneName);
		const params = new URLSearchParams();
		if (lovedOneName.trim()) {
			params.set('name', lovedOneName.trim());
		}
		goto(`/register/loved-one?${params.toString()}`);
	}

	function handleSearchTributes() {
		console.log('🔍 Searching tributes for:', lovedOneName);
		const params = new URLSearchParams();
		if (lovedOneName.trim()) {
			params.set('q', lovedOneName.trim());
		}
		goto(`/search?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>Tributestream - Compassionate Livestreams for Memorial Services</title>
	<meta name="description" content="Professional livestreaming services for memorial services across Central Florida. Connect families anywhere with respectful, high-quality broadcasts." />
</svelte:head>

<div class="{theme.root}" style="font-family: {theme.font.body}">
	<!-- Hero Section with Video Background -->
	<div class="relative flex h-screen w-full items-center justify-center overflow-hidden">
		<video
			bind:this={video}
			autoplay
			loop
			muted
			playsinline
			class="absolute top-1/2 left-1/2 -z-20 h-full w-full -translate-x-1/2 -translate-y-1/2 transform object-cover"
		>
			<source
				src="https://firebasestorage.googleapis.com/v0/b/fir-tweb.firebasestorage.app/o/header_ad%20(720p).mp4?alt=media&token=6154f714-8db1-4711-9d58-b4bef32dee0a"
				type="video/mp4"
			/>
			Your browser does not support the video tag.
		</video>
		<div class="absolute top-0 left-0 -z-10 h-full w-full bg-black/50"></div>
		
		<div class="z-10 p-4 text-center text-white max-w-4xl mx-auto">
			<h1 class="mb-6 text-5xl md:text-6xl font-bold" style="font-family: {theme.font.heading}">
				Tributestream makes hearts full again
			</h1>
			<p class="mb-8 text-xl md:text-2xl opacity-90">
				Professional livestreaming for memorial services across Central Florida
			</p>
			
			<div class="flex flex-col items-center gap-4 max-w-md mx-auto">
				<Input
					type="text"
					placeholder="Enter a name to search or create"
					class="w-full bg-black/70 text-white placeholder-gray-300 border-white/30"
					bind:value={lovedOneName}
					onkeydown={(e) => {
						if (e.key === 'Enter') handleCreateTribute();
					}}
				/>
				<div class="flex gap-4 flex-wrap justify-center">
					<Button theme="minimal" onclick={handleCreateTribute} class="bg-[#D5BA7F] text-black hover:brightness-110">
						Create Tribute
					</Button>
					<Button theme="minimal" variant="secondary" onclick={handleSearchTributes} class="bg-white/20 text-white border-white/30 hover:bg-white/30">
						Search Tributes
					</Button>
				</div>
			</div>
			
			<p class="mt-8 text-xl font-semibold">Call Us To Book Today: <a href="tel:407-221-5922" class="text-[#D5BA7F] hover:underline">407-221-5922</a></p>
		</div>
	</div>

	<!-- Stats Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
					Trusted by Families Across Central Florida
				</h2>
				<p class="mt-4 text-lg {theme.hero.sub}">
					Professional livestreaming services with compassionate support
				</p>
			</div>
			<Stats theme="minimal" stats={statsData} />
		</div>
	</section>

	<!-- Packages Section -->
	<section class="py-16 {theme.hero.decoration}">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
					Choose Your Service Package
				</h2>
				<p class="mt-4 text-lg {theme.hero.sub}">
					Professional options to meet every family's needs and budget
				</p>
			</div>
			<Comparison theme="minimal" tiers={packages} />
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<Card title="Professional Quality" theme="minimal">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center text-2xl">
							📹
						</div>
						<p class="text-sm opacity-80">
							HD video quality with professional audio mixing for crystal-clear broadcasts that honor your loved one.
						</p>
					</div>
				</Card>

				<Card title="Private & Secure" theme="minimal">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center text-2xl">
							🔒
						</div>
						<p class="text-sm opacity-80">
							Your memorial service remains private with secure links that you control. Optional password protection available.
						</p>
					</div>
				</Card>

				<Card title="Mobile Ready" theme="minimal">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D5BA7F]/20 flex items-center justify-center text-2xl">
							📱
						</div>
						<p class="text-sm opacity-80">
							Family members can join from anywhere on any device - phones, tablets, computers, or smart TVs.
						</p>
					</div>
				</Card>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="py-16 bg-slate-50">
		<div class="max-w-4xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
					Frequently Asked Questions
				</h2>
				<p class="mt-4 text-lg {theme.hero.sub}">
					We're here to help during this difficult time
				</p>
			</div>
			<Card theme="minimal">
				<FAQ theme="minimal" items={faqItems} />
			</Card>
		</div>
	</section>

	<!-- Call to Action -->
	<section class="py-16 bg-[#D5BA7F]/10">
		<div class="max-w-4xl mx-auto px-6 text-center">
			<h2 class="text-3xl font-bold {theme.text}" style="font-family: {theme.font.heading}">
				Ready to Create a Memorial?
			</h2>
			<p class="mt-4 text-lg {theme.hero.sub} mb-8">
				Let us help you share this important moment with family and friends, near and far.
			</p>
			<div class="flex gap-4 justify-center flex-wrap">
				<Button theme="minimal" onclick={handleCreateTribute} class="text-lg px-8 py-3">
					Get Started Today
				</Button>
				<Button theme="minimal" variant="secondary" class="text-lg px-8 py-3">
					<a href="tel:407-221-5922" class="no-underline">Call 407-221-5922</a>
				</Button>
			</div>
		</div>
	</section>
</div>
