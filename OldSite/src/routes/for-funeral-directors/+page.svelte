<script lang="ts">
	import { ArrowRight, CheckCircle, Video, Users, Sparkles, Shield, Star, Phone, Calendar, Gift, Play, Clock } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Card, Steps, Timeline, Comparison } from '$lib/components/minimal-modern';

	const theme = getTheme('minimal');

	const benefits = [
		{ 
			icon: Video, 
			title: "Professional Streaming", 
			description: "worldwide content delivery network with automatic failover systems. 99.9% uptime guarantee for your most important services." 
		},
		{ 
			icon: Users, 
			title: "Memorial Creation & Management", 
			description: "Create beautiful memorial pages for families with digital guestbooks, photo galleries, slideshow creation, and easy-to-use management interface." 
		},
		{ 
			icon: Shield, 
			title: "Your Brand Featured", 
			description: "Your funeral home's name and branding prominently displayed on each memorial page, reinforcing your value (coming soon). " 
		}
	];

	const steps = [
		{ title: "Schedule Demo", description: "Book a free on-site demonstration" },
		{ title: "Partner Setup", description: "Simple onboarding and training process" },
		{ title: "Go Live", description: "Start offering streaming to families" }
	];

	const packages = [
		{ 
			name: "Basic Partnership", 
			price: "No Cost", 
			features: ["Free advertising materials", "Basic training", "Phone support", "Standard branding"],
			popular: false,
			familyCta: "Learn More",
			directorCta: "Get Started"
		},
		{ 
			name: "Premium Partnership", 
			price: "Contact Us", 
			popular: true,
			features: ["On-site technical support", "Funeral home technical support", "Custom branding", "Marketing materials", "SEO optimization", "Social media marketing"],
			familyCta: "Learn More",
			directorCta: "Learn More"
		}
	];

	function handleBookDemo() {
		goto('/book-demo');
	}

	function handleRegister() {
		goto('/register/funeral-home');
	}
</script>

<svelte:head>
	<title>For Funeral Directors - Tributestream</title>
	<meta
		name="description"
		content="Elevate your services with Tributestream. Offer beautiful, seamless memorial livestreams and digital guestbooks for the families you serve."
	/>
</svelte:head>

<div class="bg-white text-gray-900" style="font-family: {theme.font.body}">
	<!-- Hero Section -->
	<section class="{theme.hero.wrap}">
		<div class="{theme.hero.decoration}" aria-hidden="true"></div>
		<div class="relative z-10 mx-auto max-w-4xl px-6 text-center">
			<div class="mb-4 inline-block rounded-full bg-[#D5BA7F]/20 px-4 py-2 text-sm font-semibold text-[#D5BA7F]">
				Partner with Tributestream
			</div>
			<h1 class="text-4xl md:text-6xl font-bold {theme.hero.heading} mb-6" style="font-family: {theme.font.heading}">
				Create Beautiful Memorials for Your Families
			</h1>
			<p class="text-lg md:text-xl {theme.hero.sub} max-w-2xl mx-auto mb-10">
				Register your individual director account to create memorial pages, manage livestreams, and help families build lasting digital tributes with photos, videos, and slideshows.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button theme="minimal" onclick={handleBookDemo} class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] flex items-center justify-center">
					<Calendar class="h-5 w-5 mr-2" />
					Book Free Demo
				</Button>
				<Button theme="minimal" variant="secondary" onclick={handleRegister} class="flex items-center justify-center">
					<ArrowRight class="h-5 w-5 mr-2" />
					Create Your Director Account
				</Button>
			</div>
		</div>
	</section>

	<!-- Benefits Section -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Why Create Your Director Account?
				</h2>
				<p class="text-lg text-slate-600 max-w-2xl mx-auto">
					Get your own dashboard to create memorials for families, track their progress, and provide comprehensive digital memorial services.
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

	<!-- How It Works Section -->
	<section class="py-16 bg-slate-50">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Simple Steps to Get Started
				</h2>
				<p class="text-lg text-slate-600">
					Partner with us in three easy steps
				</p>
			</div>
			<div class="grid md:grid-cols-2 gap-12 items-center">
				<div>
					<Steps theme="minimal" items={steps.map(s => s.title)} current={0} />
					<p class="mt-6 text-slate-600">
						Getting started is simple. Create your individual director account, get access to your dashboard, and start creating beautiful memorials for the families you serve.
					</p>
				</div>
				<Card theme="minimal" class="p-8">
					<h3 class="text-xl font-bold text-slate-900 mb-6">Your Director Dashboard Includes</h3>
					<div class="space-y-4">
						<div class="flex items-center space-x-3">
							<Users class="h-5 w-5 text-[#D5BA7F]" />
							<span class="text-slate-700">Create memorials for families</span>
						</div>
						<div class="flex items-center space-x-3">
							<Video class="h-5 w-5 text-[#D5BA7F]" />
							<span class="text-slate-700">Manage livestreams & recordings</span>
						</div>
						<div class="flex items-center space-x-3">
							<Sparkles class="h-5 w-5 text-[#D5BA7F]" />
							<span class="text-slate-700">Help families create slideshows</span>
						</div>
						<div class="flex items-center space-x-3">
							<Phone class="h-5 w-5 text-[#D5BA7F]" />
							<span class="text-slate-700">Track memorial progress & analytics</span>
						</div>
					</div>
				</Card>
			</div>
		</div>
	</section>

	<!-- Partnership Packages -->
	<section class="py-16 bg-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="text-center mb-12">
				<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
					Partnership Options
				</h2>
				<p class="text-lg text-slate-600">
					Choose the partnership level that works best for your funeral home
				</p>
			</div>
			
			<!-- Centered Two-Column Layout -->
			<div class="flex justify-center">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
					{#each packages as pkg}
						<div class="bg-white rounded-lg border-2 p-8 shadow-lg transition-all duration-200 hover:shadow-xl {pkg.popular ? 'border-[#D5BA7F] ring-2 ring-[#D5BA7F]/20' : 'border-gray-200 hover:border-[#D5BA7F]/50'}">
							{#if pkg.popular}
								<div class="text-center mb-4">
									<span class="bg-[#D5BA7F] text-black px-3 py-1 rounded-full text-sm font-semibold">Most Popular</span>
								</div>
							{/if}
							
							<div class="text-center mb-6">
								<h3 class="text-2xl font-bold text-slate-900 mb-2" style="font-family: {theme.font.heading}">
									{pkg.name}
								</h3>
								<div class="text-3xl font-extrabold text-[#D5BA7F]">{pkg.price}</div>
							</div>
							
							<ul class="space-y-4 mb-8">
								{#each pkg.features as feature}
									<li class="flex items-start gap-3">
										<div class="mt-1.5 h-2 w-2 rounded-full bg-[#D5BA7F] flex-shrink-0"></div>
										<span class="text-slate-700">{feature}</span>
									</li>
								{/each}
							</ul>
							
							<div class="text-center">
								<Button theme="minimal" class="w-full bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] py-3">
									<a href="/partnership/{pkg.name.toLowerCase().replace(' ', '-')}" class="no-underline text-black">
										{pkg.directorCta}
									</a>
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="py-16 bg-slate-50">
		<div class="max-w-4xl mx-auto px-6 text-center">
			<h2 class="text-3xl font-bold text-slate-900 mb-6" style="font-family: {theme.font.heading}">
				Ready to Start Creating Memorials?
			</h2>
			<p class="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
				Create your director account today and start building beautiful, lasting memorials for the families you serve. Help them create slideshows, manage livestreams, and preserve precious memories.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button theme="minimal" onclick={handleBookDemo} class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] flex items-center justify-center">
					<Calendar class="h-5 w-5 mr-2" />
					Schedule Free Demo
				</Button>
				<Button theme="minimal" onclick={handleRegister} class="flex items-center justify-center">
					<ArrowRight class="h-5 w-5 mr-2" />
					Register Now
				</Button>
			</div>
			
			<!-- Contact Information -->
			<div class="mt-12 pt-8 border-t border-slate-200">
				<div class="grid md:grid-cols-2 gap-8 text-center">
					<div>
						<Phone class="h-6 w-6 text-[#D5BA7F] mx-auto mb-2" />
						<h4 class="font-semibold text-slate-900 mb-1">Call Direct</h4>
						<a href="tel:407-221-5922" class="text-[#D5BA7F] hover:underline">407-221-5922</a>
					</div>
					<div>
						<Clock class="h-6 w-6 text-[#D5BA7F] mx-auto mb-2" />
						<h4 class="font-semibold text-slate-900 mb-1">Service Area</h4>
						<p class="text-slate-600">Central Florida & Surrounding Areas</p>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>
