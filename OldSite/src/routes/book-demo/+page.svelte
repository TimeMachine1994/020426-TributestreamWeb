<script lang="ts">
	import { Calendar, Clock, MapPin, Phone, Mail, Gift, Users, Shield, Send } from 'lucide-svelte';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input, Card, Toast } from '$lib/components/minimal-modern';
	import { executeRecaptcha, RECAPTCHA_ACTIONS } from '$lib/utils/recaptcha';

	let funeralHomeName = $state('');
	let contactName = $state('');
	let email = $state('');
	let phone = $state('');
	let preferredDate = $state('');
	let preferredTime = $state('');
	let address = $state('');
	let notes = $state('');
	let wantAdvertising = $state(true);
	let isSubmitting = $state(false);
	let success = $state(false);
	let error = $state('');

	const theme = getTheme('minimal');

	const benefits = [
		{ icon: Users, title: "Live Demo", description: "See our streaming technology in action" },
		{ icon: Shield, title: "Setup Training", description: "Learn our simple setup process" },
		{ icon: Gift, title: "Free Materials", description: "Brochures, business cards, and signage" }
	];

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		
		if (!funeralHomeName.trim() || !contactName.trim() || !email.trim() || !phone.trim()) {
			error = 'Please fill in all required fields';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			// Execute reCAPTCHA (only in browser)
			let recaptchaToken = null;
			if (typeof window !== 'undefined') {
				try {
					console.log('📞 Booking demo');
					recaptchaToken = await executeRecaptcha(RECAPTCHA_ACTIONS.BOOK_DEMO);
					if (!recaptchaToken) {
						console.warn('reCAPTCHA returned null token');
					}
				} catch (recaptchaError) {
					console.warn('reCAPTCHA failed, proceeding without token:', recaptchaError);
				}
			}

			const response = await fetch('/api/book-demo', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					funeralHomeName: funeralHomeName.trim(),
					contactName: contactName.trim(),
					email: email.trim(),
					phone: phone.trim(),
					preferredDate,
					preferredTime,
					address: address.trim(),
					notes: notes.trim(),
					wantAdvertising,
					recaptchaToken
				})
			});

			if (response.ok) {
				success = true;
				// Reset form
				funeralHomeName = '';
				contactName = '';
				email = '';
				phone = '';
				preferredDate = '';
				preferredTime = '';
				address = '';
				notes = '';
			} else {
				// Try to get error message from response
				const result = await response.json();
				error = result.error || 'Failed to submit request. Please try again.';
				console.error('[BOOK_DEMO] Submission failed:', result);
			}
		} catch (err) {
			console.error('[BOOK_DEMO] Error:', err);
			error = 'Network error. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Book a Demo - Tributestream for Funeral Directors</title>
	<meta name="description" content="Schedule a personalized demo of Tributestream's memorial livestreaming technology. Free on-site demonstration and marketing materials included." />
</svelte:head>

<div class="{theme.root} min-h-screen" style="font-family: {theme.font.body}">
	<!-- Hero Section -->
	<section class="{theme.hero.wrap}">
		<div class="{theme.hero.decoration}" aria-hidden="true"></div>
		<div class="relative z-10 mx-auto max-w-4xl px-6 text-center">
			<h1 class="text-4xl md:text-5xl font-bold {theme.hero.heading} mb-6" style="font-family: {theme.font.heading}">
				Book Your Free Demo
			</h1>
			<p class="text-lg md:text-xl {theme.hero.sub} max-w-2xl mx-auto">
				See Tributestream in action. We'll bring our equipment to your location for a personalized demonstration and leave you with free marketing materials.
			</p>
		</div>
	</section>

	<div class="mx-auto max-w-6xl px-6 pb-16">
		<div class="grid gap-12 lg:grid-cols-3">
			<!-- Demo Request Form -->
			<div class="lg:col-span-2">
				<Card title="Schedule Your Demo" theme="minimal" class="p-8">
					{#if success}
						<Toast 
							theme="minimal" 
							message="Demo request submitted! We'll contact you within 24 hours to confirm your appointment." 
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
								<label class="block text-sm font-medium {theme.text} mb-2">
									Funeral Home Name *
								</label>
								<Input 
									type="text" 
									bind:value={funeralHomeName} 
									required 
									placeholder="Your funeral home name" 
									theme="minimal" 
								/>
							</div>
							<div>
								<label class="block text-sm font-medium {theme.text} mb-2">
									Contact Name *
								</label>
								<Input 
									type="text" 
									bind:value={contactName} 
									required 
									placeholder="Your full name" 
									theme="minimal" 
								/>
							</div>
						</div>

						<div class="grid gap-6 md:grid-cols-2">
							<div>
								<label class="block text-sm font-medium {theme.text} mb-2">
									Email Address *
								</label>
								<Input 
									type="email" 
									bind:value={email} 
									required 
									placeholder="your@funeralhome.com" 
									theme="minimal" 
								/>
							</div>
							<div>
								<label class="block text-sm font-medium {theme.text} mb-2">
									Phone Number *
								</label>
								<Input 
									type="tel" 
									bind:value={phone} 
									required 
									placeholder="(407) 555-0123" 
									theme="minimal" 
								/>
							</div>
						</div>

						<div class="grid gap-6 md:grid-cols-2">
							<div>
								<label class="block text-sm font-medium {theme.text} mb-2">
									Preferred Date
								</label>
								<Input 
									type="date" 
									bind:value={preferredDate} 
									theme="minimal" 
								/>
							</div>
							<div>
								<label class="block text-sm font-medium {theme.text} mb-2">
									Preferred Time
								</label>
								<select bind:value={preferredTime} class="{theme.input}">
									<option value="">Select time</option>
									<option value="9:00 AM">9:00 AM</option>
									<option value="10:00 AM">10:00 AM</option>
									<option value="11:00 AM">11:00 AM</option>
									<option value="1:00 PM">1:00 PM</option>
									<option value="2:00 PM">2:00 PM</option>
									<option value="3:00 PM">3:00 PM</option>
									<option value="4:00 PM">4:00 PM</option>
								</select>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium {theme.text} mb-2">
								Funeral Home Address
							</label>
							<Input 
								type="text" 
								bind:value={address} 
								placeholder="123 Main St, Orlando, FL 32801" 
								theme="minimal" 
							/>
						</div>

						<div class="col-span-full">
							<label class="block text-sm font-medium {theme.text} mb-2">
								Additional Notes
							</label>
							<textarea 
								bind:value={notes} 
								rows="4" 
								class="{theme.input} resize-vertical w-full" 
								placeholder="Any specific questions or requirements for the demo?"
							></textarea>
						</div>

						<div class="flex items-center space-x-3">
							<input 
								type="checkbox" 
								bind:checked={wantAdvertising} 
								id="advertising" 
								class="rounded border-gray-300 text-[#D5BA7F] focus:ring-[#D5BA7F]" 
							/>
							<label for="advertising" class="text-sm {theme.text}">
								Yes, please bring free marketing materials (brochures, business cards, signage)
							</label>
						</div>

						<Button type="submit" theme="minimal" class="w-full flex items-center justify-center" disabled={isSubmitting}>
							{#if isSubmitting}
								Submitting Request...
							{:else}
								<Calendar class="h-5 w-5 mr-2" />
								Schedule Demo
							{/if}
						</Button>
					</form>
				</Card>
			</div>

			<!-- What's Included Sidebar -->
			<div class="space-y-6">
				<Card title="What's Included" theme="minimal" class="p-6">
					<div class="space-y-4">
						{#each benefits as benefit}
							{@const IconComponent = benefit.icon}
							<div class="flex items-start space-x-3">
								<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#D5BA7F]/20">
									<IconComponent class="h-5 w-5 text-[#D5BA7F]" />
								</div>
								<div>
									<h4 class="font-semibold {theme.text}">{benefit.title}</h4>
									<p class="text-sm {theme.hero.sub}">{benefit.description}</p>
								</div>
							</div>
						{/each}
					</div>
				</Card>

				<Card title="Contact Info" theme="minimal" class="p-6">
					<div class="space-y-4">
						<div class="flex items-center space-x-3">
							<Phone class="h-5 w-5 text-[#D5BA7F]" />
							<div>
								<p class="font-medium {theme.text}">Call Direct</p>
								<a href="tel:407-221-5922" class="text-[#D5BA7F] hover:underline">407-221-5922</a>
							</div>
						</div>
						<div class="flex items-center space-x-3">
							<Mail class="h-5 w-5 text-[#D5BA7F]" />
							<div>
								<p class="font-medium {theme.text}">Email</p>
								<a href="mailto:contact@tributestream.com" class="text-[#D5BA7F] hover:underline">contact@tributestream.com</a>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<MapPin class="h-5 w-5 text-[#D5BA7F] mt-0.5" />
							<div>
								<p class="font-medium {theme.text}">Service Area</p>
								<p class="text-sm {theme.hero.sub}">Central Florida<br />Orlando & surrounding areas</p>
							</div>
						</div>
					</div>
				</Card>

				<!-- Demo Benefits -->
				<Card title="Why Partner With Us?" theme="minimal" class="p-6 bg-[#D5BA7F]/5">
					<div class="space-y-3 text-sm">
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-[#D5BA7F] rounded-full"></div>
							<span>No upfront costs or equipment investment</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-[#D5BA7F] rounded-full"></div>
							<span>Professional on-site technical support</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-[#D5BA7F] rounded-full"></div>
							<span>Additional revenue stream for your business</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-[#D5BA7F] rounded-full"></div>
							<span>Enhanced service offering for families</span>
						</div>
					</div>
				</Card>
			</div>
		</div>
	</div>
</div>
