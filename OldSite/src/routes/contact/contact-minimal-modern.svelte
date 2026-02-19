<script lang="ts">
	import { ArrowRight, Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Toast, FAQ } from '$lib/components/minimal-modern';

	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');
	let isSubmitting = $state(false);
	let error = $state('');
	let success = $state(false);

	const theme = getTheme('minimal');

	const faqItems = [
		{ 
			q: "How quickly can I set up a memorial?", 
			a: "Most memorials can be set up within minutes. Our team is also available to help with setup if needed." 
		},
		{ 
			q: "Do you offer technical support during services?", 
			a: "Yes, we provide live technical support during memorial services to ensure everything runs smoothly." 
		},
		{ 
			q: "Can I customize the memorial page?", 
			a: "Absolutely! You can add photos, videos, stories, and customize the design to reflect your loved one's personality." 
		}
	];

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
			error = 'Please fill in all fields';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					subject: subject.trim(),
					message: message.trim()
				})
			});

			const result = await response.json();

			if (response.ok) {
				success = true;
				// Reset form
				name = '';
				email = '';
				subject = '';
				message = '';

				// Redirect to confirmation page after 2 seconds
				setTimeout(() => {
					goto('/contact/confirmation');
				}, 2000);
			} else {
				error = result.error || 'Failed to send message. Please try again.';
			}
		} catch (err) {
			error = 'Network error. Please check your connection and try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Contact Us - Tributestream</title>
	<meta
		name="description"
		content="Get in touch with Tributestream. We're here to help with your memorial services and answer any questions you may have."
	/>
</svelte:head>

<div class="{theme.root} min-h-screen" style="font-family: {theme.font.body}">
	<!-- Hero Section -->
	<section class="{theme.hero.wrap}">
		<div class="{theme.hero.decoration}" aria-hidden="true"></div>
		<div class="relative z-10 mx-auto max-w-4xl px-6 text-center">
			<h1 class="text-4xl md:text-5xl font-bold {theme.hero.heading} mb-6" style="font-family: {theme.font.heading}">
				Get in Touch
			</h1>
			<p class="text-lg md:text-xl {theme.hero.sub} max-w-2xl mx-auto">
				We're here to help you create meaningful memorials and support you through every step of the process.
			</p>
		</div>
	</section>

	<div class="mx-auto max-w-6xl px-6 pb-16">
		<div class="grid gap-12 lg:grid-cols-2">
			<!-- Contact Form -->
			<Card title="Send us a Message" theme="minimal" class="p-8">
				{#if success}
					<Toast 
						theme="minimal" 
						message="Message sent successfully! We'll get back to you within 24 hours. Redirecting to confirmation page..." 
						type="success" 
						class="mb-6"
					/>
				{/if}

				{#if error}
					<Toast 
						theme="minimal" 
						message={error} 
						type="error" 
						class="mb-6"
					/>
				{/if}

				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="grid gap-6 md:grid-cols-2">
						<div>
							<label for="name" class="block text-sm font-medium {theme.text} mb-2">
								Full Name *
							</label>
							<Input
								id="name"
								type="text"
								bind:value={name}
								required
								placeholder="Your full name"
								theme="minimal"
							/>
						</div>
						<div>
							<label for="email" class="block text-sm font-medium {theme.text} mb-2">
								Email Address *
							</label>
							<Input
								id="email"
								type="email"
								bind:value={email}
								required
								placeholder="your@email.com"
								theme="minimal"
							/>
						</div>
					</div>

					<div>
						<label for="subject" class="block text-sm font-medium {theme.text} mb-2">
							Subject *
						</label>
						<Input
							id="subject"
							type="text"
							bind:value={subject}
							required
							placeholder="What can we help you with?"
							theme="minimal"
						/>
					</div>

					<div>
						<label for="message" class="block text-sm font-medium {theme.text} mb-2">
							Message *
						</label>
						<textarea
							id="message"
							bind:value={message}
							required
							rows="6"
							class="{theme.input} resize-vertical h-32"
							placeholder="Tell us more about how we can help you..."
						></textarea>
					</div>

					<Button
						type="submit"
						theme="minimal"
						class="w-full"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							Sending Message...
						{:else}
							<Send class="h-5 w-5 mr-2" />
							Send Message
						{/if}
					</Button>
				</form>
			</Card>

			<!-- Contact Information & FAQ -->
			<div class="space-y-8">
				<Card title="Contact Information" theme="minimal" class="p-8">
					<div class="space-y-6">
						<div class="flex items-start space-x-4">
							<div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#D5BA7F]/20">
								<Mail class="h-6 w-6 text-[#D5BA7F]" />
							</div>
							<div>
								<h4 class="font-semibold {theme.text}">Email</h4>
								<p class="{theme.hero.sub}">contact@tributestream.com</p>
								<p class="text-sm opacity-70">We typically respond within 24 hours</p>
							</div>
						</div>

						<div class="flex items-start space-x-4">
							<div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#D5BA7F]/20">
								<Phone class="h-6 w-6 text-[#D5BA7F]" />
							</div>
							<div>
								<h4 class="font-semibold {theme.text}">Phone</h4>
								<p class="{theme.hero.sub}">
									<a href="tel:407-221-5922" class="{theme.link}">407-221-5922</a>
								</p>
								<p class="text-sm opacity-70">Monday - Friday, 9 AM - 6 PM EST</p>
							</div>
						</div>

						<div class="flex items-start space-x-4">
							<div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#D5BA7F]/20">
								<MapPin class="h-6 w-6 text-[#D5BA7F]" />
							</div>
							<div>
								<h4 class="font-semibold {theme.text}">Service Area</h4>
								<p class="{theme.hero.sub}">
									Central Florida<br />
									Orlando, Winter Park, Kissimmee<br />
									and surrounding areas
								</p>
							</div>
						</div>
					</div>
				</Card>

				<!-- FAQ Section -->
				<Card title="Frequently Asked Questions" theme="minimal" class="p-8">
					<FAQ theme="minimal" items={faqItems} />
				</Card>

				<!-- Emergency Contact -->
				<Card title="Emergency Support" theme="minimal" class="p-6 bg-amber-50 border-amber-200">
					<div class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
							<Phone class="h-8 w-8 text-amber-600" />
						</div>
						<h4 class="font-semibold {theme.text} mb-2">Need immediate assistance?</h4>
						<p class="text-sm {theme.hero.sub} mb-4">
							For urgent technical support during a service, call our emergency line:
						</p>
						<Button theme="minimal" class="bg-amber-600 text-white hover:bg-amber-700">
							<a href="tel:407-221-5922" class="no-underline text-white">Call Emergency Line</a>
						</Button>
					</div>
				</Card>
			</div>
		</div>
	</div>
</div>
