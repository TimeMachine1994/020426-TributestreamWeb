<script lang="ts">
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Card } from '$lib/components/minimal-modern';
	import { Phone, Clock, AlertTriangle, CheckCircle } from 'lucide-svelte';

	const theme = getTheme('minimal');

	const emergencyScenarios = [
		"Live streaming has stopped during a memorial service",
		"Audio or video quality issues during the service",
		"Families cannot access the memorial stream",
		"Technical equipment failure on-site",
		"Network connectivity problems affecting the broadcast",
		"Any urgent technical issue during a scheduled service"
	];
</script>

<svelte:head>
	<title>Emergency Support Line - Tributestream</title>
	<meta name="description" content="Get immediate technical support during memorial services. Our emergency line provides urgent assistance when you need it most." />
</svelte:head>

<div class="{theme.root} min-h-screen" style="font-family: {theme.font.body}">
	<!-- Hero Section -->
	<section class="py-20 bg-gradient-to-br from-red-50 to-orange-50">
		<div class="max-w-4xl mx-auto px-6 text-center">
			<div class="mb-6">
				<div class="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
					<AlertTriangle class="h-10 w-10 text-red-600" />
				</div>
			</div>
			<h1 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6" style="font-family: {theme.font.heading}">
				Emergency Support Line
			</h1>
			<p class="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
				When technical issues arise during a memorial service, we're here to help immediately. Our emergency line provides urgent support when every moment matters.
			</p>
		</div>
	</section>

	<div class="mx-auto max-w-6xl px-6 pb-16">
		<!-- Current Emergency Number -->
		<section class="mb-16">
			<Card theme="minimal" class="p-8 bg-red-50 border-red-200 text-center">
				<div class="mb-6">
					<Phone class="h-16 w-16 mx-auto text-red-600 mb-4" />
					<h2 class="text-2xl font-bold text-slate-900 mb-4" style="font-family: {theme.font.heading}">
						Current Emergency Line
					</h2>
					<p class="text-lg text-slate-600 mb-6">
						If you need immediate assistance, the current emergency line is:
					</p>
					<div class="bg-white p-6 rounded-lg border-2 border-red-200 mb-6">
						<a href="tel:407-221-5922" class="text-4xl font-bold text-red-600 hover:text-red-700 transition-colors">
							407-221-5922
						</a>
					</div>
					<p class="text-sm text-slate-500">
						<strong>Note:</strong> This number may change based on current staffing and availability. Always check this page for the most current emergency contact information.
					</p>
				</div>
				<Button theme="minimal" class="bg-red-600 text-white hover:bg-red-700 px-8 py-3">
					<a href="tel:407-221-5922" class="no-underline text-white flex items-center">
						<Phone class="h-5 w-5 mr-2" />
						Call Emergency Line Now
					</a>
				</Button>
			</Card>
		</section>

		<div class="grid lg:grid-cols-2 gap-12">
			<!-- When to Use Emergency Line -->
			<Card title="When to Use the Emergency Line" theme="minimal" class="p-8">
				<p class="text-slate-600 mb-6">
					The emergency line is specifically for urgent technical issues that occur during scheduled memorial services. Use this line when:
				</p>
				<ul class="space-y-3">
					{#each emergencyScenarios as scenario}
						<li class="flex items-start gap-3">
							<CheckCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
							<span class="text-slate-700">{scenario}</span>
						</li>
					{/each}
				</ul>
				<div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
					<div class="flex items-start gap-3">
						<AlertTriangle class="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
						<div>
							<h4 class="font-semibold text-amber-800 mb-1">Important</h4>
							<p class="text-sm text-amber-700">
								This line is for emergency technical support during active services only. For general inquiries, please use our regular contact methods.
							</p>
						</div>
					</div>
				</div>
			</Card>

			<!-- What to Expect -->
			<Card title="What to Expect" theme="minimal" class="p-8">
				<div class="space-y-6">
					<div class="flex items-start gap-4">
						<div class="bg-green-100 p-3 rounded-lg flex-shrink-0">
							<Clock class="h-6 w-6 text-green-600" />
						</div>
						<div>
							<h4 class="font-semibold text-slate-900 mb-2">Immediate Response</h4>
							<p class="text-slate-600">Our emergency line is monitored during all scheduled services. You'll reach a live technician who can provide immediate assistance.</p>
						</div>
					</div>

					<div class="flex items-start gap-4">
						<div class="bg-blue-100 p-3 rounded-lg flex-shrink-0">
							<Phone class="h-6 w-6 text-blue-600" />
						</div>
						<div>
							<h4 class="font-semibold text-slate-900 mb-2">Expert Support</h4>
							<p class="text-slate-600">Our technicians are experienced with memorial service requirements and can quickly diagnose and resolve technical issues.</p>
						</div>
					</div>

					<div class="flex items-start gap-4">
						<div class="bg-purple-100 p-3 rounded-lg flex-shrink-0">
							<CheckCircle class="h-6 w-6 text-purple-600" />
						</div>
						<div>
							<h4 class="font-semibold text-slate-900 mb-2">Quick Resolution</h4>
							<p class="text-slate-600">Most technical issues can be resolved remotely within minutes. If on-site assistance is needed, we'll coordinate immediately.</p>
						</div>
					</div>
				</div>
			</Card>
		</div>

		<!-- Regular Support Options -->
		<section class="mt-16">
			<Card title="For Non-Emergency Support" theme="minimal" class="p-8 bg-slate-50">
				<div class="text-center">
					<h3 class="text-xl font-semibold text-slate-900 mb-4">Need help but it's not an emergency?</h3>
					<p class="text-slate-600 mb-6">
						For general questions, service setup, or non-urgent technical support, please use our regular contact methods:
					</p>
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<Button theme="minimal" class="bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] px-6 py-3">
							<a href="/contact" class="no-underline text-black">Contact Us</a>
						</Button>
						<Button theme="minimal" variant="secondary" class="px-6 py-3">
							<a href="tel:407-221-5922" class="no-underline">Call Regular Support</a>
						</Button>
					</div>
				</div>
			</Card>
		</section>
	</div>
</div>
