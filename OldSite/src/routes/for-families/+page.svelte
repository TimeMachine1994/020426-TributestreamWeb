<script lang="ts">
	import { ArrowRight, Heart, Users, Video, Star, Shield, Clock, CheckCircle, Camera, Play, Gift, Sparkles } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Card, Input } from '$lib/components/minimal-modern';

	const theme = getTheme('minimal');

	let lovedOneName = $state('');
	let isSubmitting = $state(false);

	function handleFormSubmit(event: Event) {
		event.preventDefault();
		
		if (!lovedOneName.trim()) {
			// Focus the input if empty
			const input = document.querySelector('input[placeholder="Enter their full name"]') as HTMLInputElement;
			input?.focus();
			return;
		}

		isSubmitting = true;
		
		// Navigate to registration with pre-filled name
		goto(`/register/loved-one?name=${encodeURIComponent(lovedOneName.trim())}`);
	}

	function handleCreateMemorial() {
		if (lovedOneName.trim()) {
			goto(`/register/loved-one?name=${encodeURIComponent(lovedOneName.trim())}`);
		} else {
			goto('/register/loved-one');
		}
	}

	function handleGetStarted() {
		goto('/register/loved-one');
	}

	const benefits = [
		{
			icon: Heart,
			title: "Beautiful Memorial Pages",
			description: "Create a stunning, personalized memorial that truly captures their spirit and celebrates their life."
		},
		{
			icon: Users,
			title: "Bring Family Together",
			description: "Connect loved ones from around the world with live streaming and interactive features."
		},
		{
			icon: Camera,
			title: "Share Precious Memories",
			description: "Upload photos, videos, and stories that family can cherish and revisit forever."
		}
	];

	const features = [
		{ title: "Professional Live Streaming", description: "HD quality streaming for services and celebrations" },
		{ title: "Interactive Digital Guestbook", description: "Collect heartfelt messages and condolences" },
		{ title: "Beautiful Photo Galleries", description: "Showcase life's most precious moments" },
		{ title: "Private Family Access", description: "Control who can view and contribute" },
		{ title: "Mobile-Friendly Design", description: "Access from any device, anywhere" },
		{ title: "Permanent Archive", description: "Memories preserved for generations" }
	];

	const testimonials = [
		{ text: "I joined an online funeral held for my coworker that was streamed by Tributestream. The streaming quality was great and they really respected and honored our friend. I was not able to go to the physical funeral and I still felt as if I was there.", author: "Joshua Hernandez", rating: 5, date: "Dec 6, 2022" },
		{ text: "These guys are great. My wife who passed was European, and we had well over 100 live viewers who could not make it to the states for the event. Everyone said the audio and video was top notch. Flawless. They are self sufficient and practically invisible. I highly recommend this service.", author: "Troy Kelly", rating: 5, date: "Sep 16, 2024" },
		{ text: "What an awesome company. They captured the entire experience. From the service to the entombment. Highly recommended.", author: "Donna Hinckson-Torres", rating: 5, date: "Sep 24, 2024" }
	];
</script>

<svelte:head>
	<title>For Families - Tributestream</title>
	<meta
		name="description"
		content="Create a beautiful memorial for your loved one. Share memories, connect with family and friends, and honor their legacy with Tributestream."
	/>
</svelte:head>

<div class="bg-white text-gray-900" style="font-family: {theme.font.body}">
	<!-- Hero Section -->
	<section class="{theme.hero.wrap}">
		<div class="{theme.hero.decoration}" aria-hidden="true"></div>
		<div class="relative z-10 mx-auto max-w-4xl px-6 text-center">
			<div class="mb-4 inline-block rounded-full bg-[#D5BA7F]/20 px-4 py-2 text-sm font-semibold text-[#D5BA7F]">
				✨ Honor Their Memory
			</div>
			<h1 class="text-4xl md:text-6xl font-bold {theme.hero.heading} mb-6" style="font-family: {theme.font.heading}">
				Celebrate a Life Well-Lived
			</h1>
			<p class="text-lg md:text-xl {theme.hero.sub} max-w-2xl mx-auto mb-10">
				Create a beautiful, lasting memorial that brings family together and honors your loved one's legacy. Share memories, connect hearts, and celebrate the life that touched so many.
			</p>

			<!-- Quick Memorial Creation Form -->
			<Card theme="minimal" class="mx-auto mb-8 max-w-md p-8">
				<h3 class="mb-4 text-xl font-semibold text-slate-900 text-center">Start Your Memorial</h3>
				<form onsubmit={handleFormSubmit} class="space-y-4">
					<div>
						<label for="lovedOneName" class="mb-2 block text-sm font-medium text-slate-700">
							Your Loved One's Name
						</label>
						<Input
							theme="minimal"
							bind:value={lovedOneName}
							placeholder="Enter their full name"
							class="w-full"
						/>
					</div>
					<div class="flex justify-center">
						<Button
							theme="minimal"
							type="submit"
							disabled={isSubmitting || !lovedOneName.trim()}
							class="bg-white text-black border border-gray-300 hover:bg-[#D5BA7F] hover:text-black flex items-center justify-center px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if isSubmitting}
								<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
								Creating...
							{:else}
								<Sparkles class="h-5 w-5 mr-2" />
								Get Started Free
							{/if}
						</Button>
					</div>
				</form>
			</Card>

			<p class="mb-6 text-sm text-slate-500">✨ Free to start • No credit card required • Setup in minutes</p>

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button
					theme="minimal"
					onclick={handleGetStarted}
					class="bg-white text-black border border-gray-300 hover:bg-[#D5BA7F] hover:text-black flex items-center justify-center transition-colors"
				>
					<Sparkles class="h-5 w-5 mr-2" />
					Get Started Free
				</Button>
				<Button
					theme="minimal"
					variant="secondary"
					onclick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
					class="flex items-center justify-center"
				>
					<Play class="h-5 w-5 mr-2" />
					See How It Works
				</Button>
			</div>
		</div>
	</section>

	<!-- Benefits Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Why Families Choose Tributestream
				</h2>
				<p class="text-lg text-slate-600 max-w-2xl mx-auto">
					Create a meaningful space to honor your loved one and bring family together during life's most important moments.
				</p>
			</div>
			<div class="grid md:grid-cols-3 gap-8">
				{#each benefits as benefit}
					{@const IconComponent = benefit.icon}
					<Card theme="minimal" class="p-8 text-center">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#D5BA7F]/20 mx-auto mb-4">
							<IconComponent class="h-6 w-6 text-[#D5BA7F]" />
						</div>
						<h3 class="text-xl font-bold text-slate-900 mb-4">{benefit.title}</h3>
						<p class="text-slate-600">{benefit.description}</p>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="py-16 bg-slate-50">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Everything You Need to Honor Their Memory
				</h2>
				<p class="text-lg text-slate-600">
					Comprehensive tools to create a meaningful tribute that lasts forever
				</p>
			</div>
			<div class="grid md:grid-cols-2 gap-12 items-center">
				<!-- Feature List -->
				<div class="space-y-6">
					{#each features as feature}
						<div class="flex items-start space-x-4">
							<CheckCircle class="mt-1 h-6 w-6 flex-shrink-0 text-[#D5BA7F]" />
							<div>
								<h4 class="font-semibold text-slate-900 mb-1">{feature.title}</h4>
								<p class="text-slate-600">{feature.description}</p>
							</div>
						</div>
					{/each}
				</div>

				<!-- Visual Element -->
				<Card theme="minimal" class="p-8">
					<div class="text-center">
						<div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-[#D5BA7F] to-[#C5AA6F]">
							<Heart class="h-10 w-10 text-white" />
						</div>
						<h3 class="mb-4 text-2xl font-bold text-slate-900">Start in Minutes</h3>
						<p class="mb-6 text-slate-600">
							Creating a memorial is simple and takes just a few minutes. No technical skills required - just love and memories to share.
						</p>
						<div class="flex justify-center">
							<Button
								theme="minimal"
								onclick={handleGetStarted}
								class="bg-white text-black border border-gray-300 hover:bg-[#D5BA7F] hover:text-black flex items-center justify-center px-6 py-3 transition-colors"
							>
								<Sparkles class="h-5 w-5 mr-2" />
								Get Started Free
							</Button>
						</div>
					</div>
				</Card>
			</div>
		</div>
	</section>

	<!-- Testimonials Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Trusted by Families Everywhere
				</h2>
				<p class="text-lg text-slate-600">
					See how Tributestream has helped families honor their loved ones
				</p>
			</div>
			<div class="grid md:grid-cols-3 gap-8">
				{#each testimonials as testimonial}
					<Card theme="minimal" class="p-6">
						<div class="mb-4 flex items-center">
							<div class="flex text-[#D5BA7F]">
								{#each Array(testimonial.rating) as _}
									<Star class="h-4 w-4 fill-current" />
								{/each}
							</div>
						</div>
						<p class="mb-4 text-slate-600 italic leading-relaxed">"{testimonial.text}"</p>
						<div class="space-y-1">
							<p class="font-medium text-slate-900">— {testimonial.author}</p>
							<p class="text-xs text-slate-500">{testimonial.date}</p>
						</div>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="bg-gradient-to-r from-slate-900 to-slate-800 py-24 text-center">
		<div class="max-w-4xl mx-auto px-6">
			<h2 class="text-3xl md:text-4xl font-bold text-white mb-6" style="font-family: {theme.font.heading}">
				Ready to Create Something Beautiful?
			</h2>
			<p class="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
				Join thousands of families who have created lasting tributes with Tributestream. Your loved one's story deserves to be celebrated and remembered forever.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center mb-6">
				<Button
					theme="minimal"
					onclick={handleGetStarted}
					class="bg-white text-black border border-gray-300 hover:bg-[#D5BA7F] hover:text-black flex items-center justify-center text-lg px-8 py-4 transition-colors"
				>
					<Sparkles class="h-6 w-6 mr-2" />
					Get Started Free
				</Button>
			</div>
			<p class="text-sm text-slate-400">✨ Free to start • No credit card required • Setup in minutes • Cancel anytime</p>
		</div>
	</section>
</div>
