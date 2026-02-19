<script lang="ts">
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Card } from '$lib/components/minimal-modern';
	import { CheckCircle, Phone, Users, BookOpen, Award } from 'lucide-svelte';

	const theme = getTheme('minimal');

	const features = [
		{ icon: BookOpen, title: "Free Advertising Materials", description: "Professional brochures, flyers, and digital assets to promote streaming services to families" },
		{ icon: Users, title: "Basic Training", description: "Comprehensive online training modules and documentation to get your team up to speed" },
		{ icon: Phone, title: "Phone Support", description: "Dedicated phone support during business hours for technical assistance and questions" },
		{ icon: Award, title: "Standard Branding", description: "Professional Tributestream branding on all streaming materials and interfaces" }
	];

	function handleGetStarted() {
		goto('/register/funeral-home');
	}

	function handleContactUs() {
		goto('/contact');
	}
</script>

<svelte:head>
	<title>Basic Partnership - Tributestream</title>
	<meta name="description" content="Start offering memorial streaming services with our no-cost Basic Partnership. Get free marketing materials, training, and support." />
</svelte:head>

<!-- Hero Section -->
<section class="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
	<div class="max-w-4xl mx-auto px-6 text-center">
		<div class="mb-6">
			<span class="bg-[#D5BA7F] text-black px-4 py-2 rounded-full text-sm font-semibold">No Cost Partnership</span>
		</div>
		<h1 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6" style="font-family: {theme.font.heading}">
			Basic Partnership
		</h1>
		<p class="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
			Start offering professional memorial streaming services to families at no upfront cost. Everything you need to get started is included.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<Button theme="minimal" class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] px-8 py-3" onclick={handleGetStarted}>
				Get Started Today
			</Button>
			<Button theme="minimal" variant="secondary" class="px-8 py-3" onclick={handleContactUs}>
				Have Questions?
			</Button>
		</div>
	</div>
</section>

<!-- What's Included -->
<section class="py-16 bg-white">
	<div class="max-w-6xl mx-auto px-6">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
				What's Included
			</h2>
			<p class="text-lg text-slate-600">
				Everything you need to start offering memorial streaming services
			</p>
		</div>

		<div class="grid md:grid-cols-2 gap-8">
			{#each features as feature}
				<Card theme="minimal" class="p-6 h-full">
					<div class="flex items-start gap-4">
						<div class="bg-[#D5BA7F]/10 p-3 rounded-lg flex-shrink-0">
							<svelte:component this={feature.icon} class="h-6 w-6 text-[#D5BA7F]" />
						</div>
						<div>
							<h3 class="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
							<p class="text-slate-600">{feature.description}</p>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	</div>
</section>

<!-- How It Works -->
<section class="py-16 bg-slate-50">
	<div class="max-w-4xl mx-auto px-6">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
				How It Works
			</h2>
		</div>

		<div class="grid md:grid-cols-3 gap-8">
			<div class="text-center">
				<div class="bg-[#D5BA7F] text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
				<h3 class="text-lg font-semibold text-slate-900 mb-2">Sign Up</h3>
				<p class="text-slate-600">Complete our simple registration process and get instant access to your partner portal</p>
			</div>
			<div class="text-center">
				<div class="bg-[#D5BA7F] text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
				<h3 class="text-lg font-semibold text-slate-900 mb-2">Get Trained</h3>
				<p class="text-slate-600">Access our comprehensive training materials and get your team up to speed</p>
			</div>
			<div class="text-center">
				<div class="bg-[#D5BA7F] text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
				<h3 class="text-lg font-semibold text-slate-900 mb-2">Start Serving</h3>
				<p class="text-slate-600">Begin offering streaming services to families with our full support</p>
			</div>
		</div>
	</div>
</section>

<!-- Final CTA -->
<section class="py-16 bg-white">
	<div class="max-w-4xl mx-auto px-6 text-center">
		<h2 class="text-3xl font-bold text-slate-900 mb-6" style="font-family: {theme.font.heading}">
			Ready to Get Started?
		</h2>
		<p class="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
			Join our Basic Partnership program today and start offering professional memorial streaming services to families at no cost to you.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<Button theme="minimal" class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] px-8 py-3" onclick={handleGetStarted}>
				Get Started Now
			</Button>
			<Button theme="minimal" variant="secondary" class="px-8 py-3" onclick={handleContactUs}>
				Contact Us
			</Button>
		</div>
	</div>
</section>
