<script lang="ts">
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Card } from '$lib/components/minimal-modern';
	import { CheckCircle, Users, Wrench, Palette, Megaphone, Search, Share2 } from 'lucide-svelte';

	const theme = getTheme('minimal');

	const features = [
		{ icon: Wrench, title: "On-Site Technical Support", description: "Dedicated technicians arrive early to handle all setup and provide live support throughout services" },
		{ icon: Users, title: "Funeral Home Technical Support", description: "Comprehensive technical support specifically tailored to funeral home operations and workflows" },
		{ icon: Palette, title: "Custom Branding", description: "Fully customized branding with your funeral home's colors, logo, and messaging across all platforms" },
		{ icon: Megaphone, title: "Marketing Materials", description: "Professional marketing campaigns, brochures, and promotional materials designed specifically for your funeral home" },
		{ icon: Search, title: "SEO Optimization", description: "Search engine optimization to help families find your streaming services online when they need them most" },
		{ icon: Share2, title: "Social Media Marketing", description: "Comprehensive social media strategy and content creation to promote your streaming services" }
	];

	function handleLearnMore() {
		goto('/contact?partnership=premium');
	}

	function handleScheduleCall() {
		goto('/contact?action=schedule-call&partnership=premium');
	}
</script>

<svelte:head>
	<title>Premium Partnership - Tributestream</title>
	<meta name="description" content="Elevate your funeral home with our Premium Partnership. Get on-site support, custom branding, marketing materials, and comprehensive digital marketing." />
</svelte:head>

<!-- Hero Section -->
<section class="py-20 bg-gradient-to-br from-[#D5BA7F]/10 to-slate-50">
	<div class="max-w-4xl mx-auto px-6 text-center">
		<div class="mb-6">
			<span class="bg-[#D5BA7F] text-black px-4 py-2 rounded-full text-sm font-semibold">Most Popular</span>
		</div>
		<h1 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6" style="font-family: {theme.font.heading}">
			Premium Partnership
		</h1>
		<p class="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
			The complete solution for funeral homes ready to offer world-class memorial streaming services with full marketing support and custom branding.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<Button theme="minimal" class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] px-8 py-3" onclick={handleLearnMore}>
				Learn More
			</Button>
			<Button theme="minimal" variant="secondary" class="px-8 py-3" onclick={handleScheduleCall}>
				Schedule a Call
			</Button>
		</div>
	</div>
</section>

<!-- What's Included -->
<section class="py-16 bg-white">
	<div class="max-w-6xl mx-auto px-6">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
				Premium Features & Support
			</h2>
			<p class="text-lg text-slate-600">
				Everything you need to become the premier memorial streaming provider in your area
			</p>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
			{#each features as feature}
				<Card theme="minimal" class="p-6 h-full">
					<div class="text-center">
						<div class="bg-[#D5BA7F]/10 p-4 rounded-lg inline-flex mb-4">
							<svelte:component this={feature.icon} class="h-8 w-8 text-[#D5BA7F]" />
						</div>
						<h3 class="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
						<p class="text-slate-600">{feature.description}</p>
					</div>
				</Card>
			{/each}
		</div>
	</div>
</section>

<!-- Benefits -->
<section class="py-16 bg-slate-50">
	<div class="max-w-6xl mx-auto px-6">
		<div class="grid md:grid-cols-2 gap-12 items-center">
			<div>
				<h2 class="text-3xl font-bold text-slate-900 mb-6" style="font-family: {theme.font.heading}">
					Why Choose Premium?
				</h2>
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<CheckCircle class="h-6 w-6 text-[#D5BA7F] flex-shrink-0 mt-0.5" />
						<div>
							<h4 class="font-semibold text-slate-900">White-Glove Service</h4>
							<p class="text-slate-600">Our technicians handle everything so you can focus on the family</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="h-6 w-6 text-[#D5BA7F] flex-shrink-0 mt-0.5" />
						<div>
							<h4 class="font-semibold text-slate-900">Your Brand, Elevated</h4>
							<p class="text-slate-600">Custom branding that reinforces your funeral home's reputation</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="h-6 w-6 text-[#D5BA7F] flex-shrink-0 mt-0.5" />
						<div>
							<h4 class="font-semibold text-slate-900">Marketing That Works</h4>
							<p class="text-slate-600">Professional marketing campaigns that bring in new families</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<CheckCircle class="h-6 w-6 text-[#D5BA7F] flex-shrink-0 mt-0.5" />
						<div>
							<h4 class="font-semibold text-slate-900">Digital Presence</h4>
							<p class="text-slate-600">SEO and social media marketing to reach families online</p>
						</div>
					</div>
				</div>
			</div>
			<div class="bg-white p-8 rounded-lg shadow-lg">
				<h3 class="text-2xl font-bold text-slate-900 mb-4">Ready to Elevate Your Services?</h3>
				<p class="text-slate-600 mb-6">
					Our Premium Partnership is designed for funeral homes that want to offer the highest level of memorial streaming services with comprehensive support.
				</p>
				<div class="space-y-3">
					<Button theme="minimal" class="w-full bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] py-3" onclick={handleLearnMore}>
						Get Custom Pricing
					</Button>
					<Button theme="minimal" variant="secondary" class="w-full py-3" onclick={handleScheduleCall}>
						Schedule Consultation
					</Button>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Process -->
<section class="py-16 bg-white">
	<div class="max-w-4xl mx-auto px-6">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
				Our Partnership Process
			</h2>
		</div>

		<div class="grid md:grid-cols-4 gap-8">
			<div class="text-center">
				<div class="bg-[#D5BA7F] text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
				<h3 class="text-lg font-semibold text-slate-900 mb-2">Consultation</h3>
				<p class="text-slate-600">We discuss your needs and create a custom partnership plan</p>
			</div>
			<div class="text-center">
				<div class="bg-[#D5BA7F] text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
				<h3 class="text-lg font-semibold text-slate-900 mb-2">Setup</h3>
				<p class="text-slate-600">Custom branding, training, and marketing materials are created</p>
			</div>
			<div class="text-center">
				<div class="bg-[#D5BA7F] text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
				<h3 class="text-lg font-semibold text-slate-900 mb-2">Launch</h3>
				<p class="text-slate-600">We launch your streaming services with full marketing support</p>
			</div>
			<div class="text-center">
				<div class="bg-[#D5BA7F] text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">4</div>
				<h3 class="text-lg font-semibold text-slate-900 mb-2">Ongoing</h3>
				<p class="text-slate-600">Continuous support, marketing, and service optimization</p>
			</div>
		</div>
	</div>
</section>

<!-- Final CTA -->
<section class="py-16 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
	<div class="max-w-4xl mx-auto px-6 text-center">
		<h2 class="text-3xl font-bold mb-6" style="font-family: {theme.font.heading}">
			Ready to Transform Your Funeral Home?
		</h2>
		<p class="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
			Join our Premium Partnership and become the go-to funeral home for memorial streaming services in your area.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<Button theme="minimal" class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] px-8 py-3" onclick={handleLearnMore}>
				Get Started Today
			</Button>
			<Button theme="minimal" class="bg-transparent border-2 border-white text-white hover:bg-white hover:text-slate-900 px-8 py-3" onclick={handleScheduleCall}>
				Schedule Call
			</Button>
		</div>
	</div>
</section>
