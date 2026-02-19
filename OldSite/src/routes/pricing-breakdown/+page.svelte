<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const locations = [
		'A Community Funeral Home and Sunset Cremations',
		'Good Life Funeral Home',
		'Osceola Memory Gardens',
		'Woodward Funeral Home',
		'Fisk Funeral Home',
		'DeGusipe Funeral Home',
		'Loahman Funeral Home',
		'Baldwin Fairchild Funeral Home',
		'Woodlawn Funeral Home & Memorial Park',
		'Churches',
		'Graveside',
		'Special Locations',
		'Funeral Homes Not Listed'
	];

	const addons = [
		['Additional Location', '+$325'],
		['Additional Broadcast Time', '+$125'],
		['Additional Wooden USB Drive', '+$200 first, +$50 each add.'],
		['Custom Editing', '+$45 / labor hr'],
		['Additional Videographer', '+$325 / 1st hr'],
		['Photographer', '+$400 / 4 hrs']
	];

	const extendedNetwork = [
		['DJ', '+$500 / 4 hrs'],
		['Pianist / Guitarist', '+$500 / 4 hrs'],
		['Harpist*', '+$1,750 / 4 hrs'],
		['Dove Release', 'Inquire'],
		['Butterfly Release', 'Inquire'],
		['Balloon Release', 'Inquire']
	];

	const bookingItems = [
		'Your Name',
		"Loved One's Full Name",
		'Location of Service',
		'Livestream Start Time',
		'Livestream End Time',
		'Additional Locations (Yes/No)',
		'Location B: Address, Start, End, New Day (date)',
		'Location C: Address, Start, End, New Day (date)'
	];
</script>

<svelte:head>
	<title>Tributestream Pricing Breakdown - Private Page</title>
	<meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
	<meta name="googlebot" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-white text-zinc-900">
	<!-- Header -->
	<header class="sticky top-16 z-40 border-b bg-white/90 backdrop-blur">
		<div class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="h-9 w-9 rounded-full bg-[#D5BA7F]"></div>
				<span class="font-semibold tracking-wide">Tributestream®</span>
			</div>
			<nav class="hidden md:flex items-center gap-6 text-sm">
				<a href="#packages" class="hover:opacity-80">Packages</a>
				<a href="#addons" class="hover:opacity-80">Add‑Ons</a>
				<a href="#payment" class="hover:opacity-80">Payment</a>
				<a href="#guarantee" class="hover:opacity-80">Guarantee</a>
				<a href="#booking" class="hover:opacity-80">Booking</a>
				<a href="#faqs" class="hover:opacity-80">FAQs</a>
			</nav>
			<a
				href="#booking"
				class="rounded-2xl px-4 py-2 text-sm font-medium bg-[#070707] text-white hover:opacity-90"
				>Start a Booking</a
			>
		</div>
	</header>

	<!-- Hero / Value Prop -->
	<section class="border-b bg-gradient-to-b from-zinc-50 to-white">
		<div class="mx-auto max-w-7xl px-4 py-14 grid gap-8 md:grid-cols-2 items-center">
			<div>
				<p class="text-xs uppercase tracking-widest text-zinc-500">Effective April 5, 2025</p>
				<h1 class="mt-2 text-3xl md:text-4xl font-semibold leading-tight">
					Memorial Livestreaming—clear pricing, compassionate service.
				</h1>
				<p class="mt-4 text-zinc-600">
					Since 2019, we've focused exclusively on Celebrations of Life. We handle the tech—so your
					family can honor, remember, and participate from anywhere.
				</p>
				<div class="mt-6 flex gap-3">
					<a
						href="#packages"
						class="rounded-xl px-4 py-2 bg-[#D5BA7F] text-black font-medium hover:opacity-90"
						>Compare Packages</a
					>
					<a href="#payment" class="rounded-xl px-4 py-2 border font-medium hover:bg-zinc-50"
						>See Payment Plans</a
					>
				</div>
				<ul class="mt-6 grid grid-cols-2 gap-2 text-sm text-zinc-700">
					<li class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full bg-[#D5BA7F]"></span> 24/7 producers
					</li>
					<li class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full bg-[#D5BA7F]"></span> No‑hidden‑fees guarantee
					</li>
					<li class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full bg-[#D5BA7F]"></span> Funeral‑centric platform
					</li>
					<li class="flex items-center gap-2">
						<span class="h-1.5 w-1.5 rounded-full bg-[#D5BA7F]"></span> One custom link + 1‑yr hosting
					</li>
				</ul>
			</div>
			<div class="md:pl-8">
				<div class="rounded-2xl border shadow-sm p-4 bg-white">
					<h2 class="text-lg font-medium">Locations We Livestream</h2>
					<ul class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-zinc-700">
						{#each locations as item}
							<li class="flex gap-2">
								<span class="mt-2 h-1.5 w-1.5 rounded-full bg-[#070707]"></span>
								<span>{item}</span>
							</li>
						{/each}
					</ul>
					<p class="mt-4 text-sm text-zinc-500">
						Servicing families from Central Florida to across the world.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Why Tributestream -->
	<section class="border-b" id="why">
		<div class="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-2">
			<div class="space-y-4">
				<h2 class="text-2xl font-semibold">Why Tributestream</h2>
				<div class="grid gap-4">
					<div class="rounded-xl border p-4">
						<h3 class="font-medium">Focused & Exceptional</h3>
						<p class="mt-1 text-sm text-zinc-700">
							We specialize in memorials and celebrations of life—kind, gentle, and knowledgeable
							support without pressure.
						</p>
					</div>
					<div class="rounded-xl border p-4">
						<h3 class="font-medium">Price & Value</h3>
						<p class="mt-1 text-sm text-zinc-700">
							Funeral‑focused operations allow us to cut costs responsibly and pass savings on to you.
						</p>
					</div>
					<div class="rounded-xl border p-4">
						<h3 class="font-medium">One‑Stop Support</h3>
						<p class="mt-1 text-sm text-zinc-700">
							From livestream to photographers, musicians, TVs, and sound systems—we coordinate for
							you.
						</p>
					</div>
					<div class="rounded-xl border p-4">
						<h3 class="font-medium">Funeral‑Centric Platform</h3>
						<p class="mt-1 text-sm text-zinc-700">
							The only funeral‑centric streaming platform in Florida—families value the lasting
							recording.
						</p>
					</div>
					<div class="rounded-xl border p-4">
						<h3 class="font-medium">Our Guarantees</h3>
						<p class="mt-1 text-sm text-zinc-700">
							No Hidden Fees, Satisfaction, and Best Price—match or beat identical services in Central
							Florida.
						</p>
					</div>
				</div>
			</div>
			<div class="md:pl-8">
				<div class="rounded-2xl border shadow-sm p-6">
					<h3 class="text-lg font-medium">Why Host a Tributestream?</h3>
					<p class="mt-3 text-zinc-700">
						Funerals help the living reconstruct life after loss. Modern distance shouldn't prevent
						participation. Livestreaming lets anyone gather, reconcile, and later revisit the service
						as part of healing.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Packages -->
	<section id="packages" class="border-b bg-zinc-50">
		<div class="mx-auto max-w-7xl px-4 py-12">
			<h2 class="text-2xl font-semibold">Complete Packages</h2>
			<p class="mt-2 text-zinc-600">
				Each package includes: 1 hr setup · 2 hrs videography · professional video & audio · custom
				link + 1‑yr hosting · complimentary original download.
			</p>

			<div class="mt-8 grid gap-6 md:grid-cols-3">
				<!-- Legacy Package -->
				<div class="relative rounded-2xl border bg-white p-6 shadow-sm">
					<span
						class="absolute -top-3 right-4 rounded-full bg-[#070707] px-3 py-1 text-xs font-medium text-white"
						>Most Complete</span
					>
					<h3 class="text-lg font-semibold">Tributestream Legacy</h3>
					<p class="mt-1 text-3xl font-semibold">$1,699</p>
					<ul class="mt-4 grid gap-2 text-sm text-zinc-800">
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>Setup + Videographer + Livestream Tech + Remote Producer</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>Plays back your pre‑sent media to the online audience</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>Post‑editing included</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>Wooden USB drive mailed after service</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>Flower montage when applicable</span>
						</li>
					</ul>
					<a
						href="#booking"
						class="mt-6 inline-block rounded-xl bg-[#070707] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
						>Choose Legacy</a
					>
				</div>

				<!-- Live Package -->
				<div class="relative rounded-2xl border bg-white p-6 shadow-sm">
					<h3 class="text-lg font-semibold">Tributestream Live</h3>
					<p class="mt-1 text-3xl font-semibold">$1,299</p>
					<ul class="mt-4 grid gap-2 text-sm text-zinc-800">
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>Setup + Videographer + Livestream Tech + Remote Producer</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>Media playback to online audience</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>No post‑edit or USB drive</span>
						</li>
					</ul>
					<a
						href="#booking"
						class="mt-6 inline-block rounded-xl bg-[#070707] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
						>Choose Live</a
					>
				</div>

				<!-- Record Package -->
				<div class="relative rounded-2xl border bg-white p-6 shadow-sm">
					<h3 class="text-lg font-semibold">Tributestream Record</h3>
					<p class="mt-1 text-3xl font-semibold">$699</p>
					<ul class="mt-4 grid gap-2 text-sm text-zinc-800">
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>Most economical—no live stream</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>Professional videographer records up to 2 hours</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#D5BA7F]"></span>
							<span>Recording uploaded to the link within 24 hours</span>
						</li>
					</ul>
					<a
						href="#booking"
						class="mt-6 inline-block rounded-xl bg-[#070707] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
						>Choose Record</a
					>
				</div>
			</div>

			<div class="mt-6">
				<a
					href="#booking"
					class="inline-block rounded-xl bg-[#070707] text-white px-5 py-2.5 font-medium hover:opacity-90"
					>Reserve a Date</a
				>
			</div>
		</div>
	</section>

	<!-- Add‑Ons -->
	<section id="addons" class="border-b">
		<div class="mx-auto max-w-7xl px-4 py-12">
			<h2 class="text-2xl font-semibold">Add‑Ons</h2>
			<div class="mt-6 grid gap-6 md:grid-cols-2">
				<div class="rounded-2xl border p-6">
					<ul class="grid gap-3 text-zinc-800">
						{#each addons as [label, val]}
							<li
								class="flex items-center justify-between border-b py-2 last:border-none"
							>
								<span>{label}</span>
								<span class="font-medium">{val}</span>
							</li>
						{/each}
					</ul>
					<div class="mt-4 text-sm text-zinc-600">
						<p class="mb-2">
							<span class="font-medium">Additional Locations</span>: includes up to 1 hr travel and 1
							extra hour of broadcast time.
						</p>
						<p>
							<span class="font-medium">Additional Broadcast Time</span>: per‑location. Setup/standby
							before go‑live counts toward broadcast time.
						</p>
					</div>
				</div>

				<div class="rounded-2xl border p-6">
					<h3 class="font-medium">
						Extended Partner Network <span class="text-zinc-500 font-normal"
							>(+$249 service fee if used)</span
						>
					</h3>
					<ul class="mt-3 grid gap-3">
						{#each extendedNetwork as [label, val]}
							<li
								class="flex items-center justify-between border-b py-2 last:border-none"
							>
								<span>{label}</span>
								<span class="font-medium">{val}</span>
							</li>
						{/each}
					</ul>
					<p class="mt-3 text-xs text-zinc-500">*Availability not guaranteed.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Payment Options -->
	<section id="payment" class="border-b bg-zinc-50">
		<div class="mx-auto max-w-7xl px-4 py-12">
			<h2 class="text-2xl font-semibold">Payment Options</h2>
			<div class="mt-6 grid gap-6 md:grid-cols-2">
				<div class="rounded-2xl border p-6">
					<h3 class="font-medium">How to Pay</h3>
					<ul class="mt-3 grid gap-2 text-zinc-800">
						<li>
							<span class="font-medium">Square Invoice</span>: credit/debit via secure link (can split
							between parties).
						</li>
						<li>
							<span class="font-medium">Direct Deposit (ACH)</span>: initiate ≥ 3 business days before
							the first service.
						</li>
						<li><span class="font-medium">Cash App</span>: available via Square.</li>
					</ul>
				</div>
				<div class="rounded-2xl border p-6">
					<h3 class="font-medium">Payment Plans & Financing</h3>
					<p class="mt-2 text-zinc-700">
						After‑Pay offers interest‑free bi‑weekly options or 6/12‑month plans with interest.
					</p>
					<div class="mt-4 overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="text-left text-zinc-600">
								<tr>
									<th class="py-2 pr-4">Package</th>
									<th class="py-2 pr-4">2× Bi‑Weekly</th>
									<th class="py-2 pr-4">4× Bi‑Weekly</th>
									<th class="py-2 pr-4">6× Monthly*</th>
									<th class="py-2">12× Monthly*</th>
								</tr>
							</thead>
							<tbody class="align-top">
								<tr class="border-t">
									<td class="py-2 pr-4">Legacy ($1,699)</td>
									<td class="py-2 pr-4">$799.50</td>
									<td class="py-2 pr-4">$399.75</td>
									<td class="py-2 pr-4">as low as $266.50</td>
									<td class="py-2">as low as $133.25</td>
								</tr>
								<tr class="border-t">
									<td class="py-2 pr-4">Live ($1,299)</td>
									<td class="py-2 pr-4">$649.50</td>
									<td class="py-2 pr-4">$324.75</td>
									<td class="py-2 pr-4">as low as $216.50</td>
									<td class="py-2">as low as $108.25</td>
								</tr>
								<tr class="border-t">
									<td class="py-2 pr-4">Record ($699)</td>
									<td class="py-2 pr-4">$299.50</td>
									<td class="py-2 pr-4">$174.75</td>
									<td class="py-2 pr-4">as low as $116.50</td>
									<td class="py-2">as low as $58.25</td>
								</tr>
							</tbody>
						</table>
						<p class="mt-2 text-xs text-zinc-500">
							*Monthly options include interest; exact terms shown at checkout.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Guarantee -->
	<section id="guarantee" class="border-b">
		<div class="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-2">
			<div class="rounded-2xl border p-6">
				<h2 class="text-2xl font-semibold">Our Tributestream Guarantee</h2>
				<p class="mt-3 text-zinc-700">
					If payment and details are received ≥ 4 business days before the start date, we guarantee
					coverage via our partner videographer network—anytime, anywhere.
				</p>
				<ul class="mt-4 list-disc pl-5 text-zinc-700 space-y-2">
					<li>No Hidden Fees Guarantee</li>
					<li>Satisfaction Guarantee</li>
					<li>Best Price Guarantee (match/beat identical services in Central Florida)</li>
				</ul>
			</div>
			<div class="rounded-2xl border p-6">
				<h3 class="font-medium">Reliability Measures</h3>
				<p class="mt-2 text-zinc-700">
					We mitigate livestream risks by recording locally, bringing backup audio/video, using
					wireless hotspots, and staffing a remote producer to QC the stream. If issues arise, we
					provide complimentary editing for the final video.
				</p>
			</div>
		</div>
	</section>

	<!-- Booking -->
	<section id="booking" class="border-b bg-zinc-50">
		<div class="mx-auto max-w-7xl px-4 py-12">
			<h2 class="text-2xl font-semibold">Booking Details</h2>
			<p class="mt-2 text-zinc-700">Have the following ready to complete your reservation.</p>

			{#if data.userMemorial}
				<!-- CTA for logged-in users with a memorial -->
				<div class="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
					<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h3 class="text-lg font-semibold">Ready to Complete Your Booking?</h3>
							<p class="mt-1 text-zinc-600">
								Complete your booking details for <span class="font-medium">{data.userMemorial.lovedOneName}</span>
							</p>
						</div>
						<a
							href="/{data.userMemorial.fullSlug}#booking"
							class="inline-block rounded-xl bg-[#D5BA7F] px-6 py-3 text-center font-semibold text-black hover:opacity-90 whitespace-nowrap"
						>
							Go to My Memorial Booking →
						</a>
					</div>
				</div>
			{/if}

			<div class="mt-6 grid gap-6 md:grid-cols-2">
				<div class="rounded-2xl border p-6">
					<ul class="grid gap-3">
						{#each bookingItems as item}
							<li class="flex items-center gap-2">
								<span class="h-1.5 w-1.5 rounded-full bg-[#070707]"></span>
								<span>{item}</span>
							</li>
						{/each}
					</ul>
				</div>
				<div class="rounded-2xl border p-6">
					<h3 class="font-medium">Booking Process</h3>
					<ol class="mt-3 list-decimal pl-5 text-zinc-800 space-y-2">
						<li>
							<a class="underline hover:text-[#D5BA7F]" href="/profile">Create custom link</a>
						</li>
						<li>
							<a class="underline hover:text-[#D5BA7F]" href="/login">Login to account</a>
						</li>
						<li>Enter booking details</li>
						<li>Checkout to lock in the reservation</li>
					</ol>
					<div class="mt-5">
						<a
							href="https://www.tributestream.com"
							target="_blank"
							rel="noreferrer"
							class="inline-block rounded-xl bg-[#D5BA7F] px-5 py-2.5 font-medium hover:opacity-90"
							>Visit Tributestream.com</a
						>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQs -->
	<section id="faqs">
		<div class="mx-auto max-w-7xl px-4 py-12">
			<h2 class="text-2xl font-semibold">FAQs</h2>
			<div class="mt-6 grid gap-4">
				<details class="group rounded-xl border p-4">
					<summary
						class="cursor-pointer list-none font-medium flex items-center justify-between"
					>
						<span>Can you play my media for online viewers?</span>
						<span class="transition-transform group-open:rotate-45 text-xl leading-none">+</span>
					</summary>
					<p class="mt-2 text-sm text-zinc-700">
						Yes. For Legacy and Live, we'll receive your media ahead of time and play it back during
						the stream.
					</p>
				</details>

				<details class="group rounded-xl border p-4">
					<summary
						class="cursor-pointer list-none font-medium flex items-center justify-between"
					>
						<span>How fast is the Record package upload?</span>
						<span class="transition-transform group-open:rotate-45 text-xl leading-none">+</span>
					</summary>
					<p class="mt-2 text-sm text-zinc-700">
						Within 24 hours, we upload the full recording to your custom link.
					</p>
				</details>

				<details class="group rounded-xl border p-4">
					<summary
						class="cursor-pointer list-none font-medium flex items-center justify-between"
					>
						<span>What if the venue has poor internet?</span>
						<span class="transition-transform group-open:rotate-45 text-xl leading-none">+</span>
					</summary>
					<p class="mt-2 text-sm text-zinc-700">
						We bring hotspots, record locally, and have a remote producer monitoring quality. If
						issues occur, we provide complimentary editing for the final video.
					</p>
				</details>

				<details class="group rounded-xl border p-4">
					<summary
						class="cursor-pointer list-none font-medium flex items-center justify-between"
					>
						<span>Do you work outside listed funeral homes?</span>
						<span class="transition-transform group-open:rotate-45 text-xl leading-none">+</span>
					</summary>
					<p class="mt-2 text-sm text-zinc-700">
						Yes. We serve churches, graveside, special locations, and funeral homes not listed.
					</p>
				</details>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t">
		<div class="mx-auto max-w-7xl px-4 py-10 text-sm text-zinc-600">
			<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<p>Tributestream® Memorial Livestreaming</p>
					<p>Effective 4/5/2025 · Prices subject to change without notice.</p>
				</div>
				<div class="flex items-center gap-4">
					<a
						href="https://www.tributestream.com"
						target="_blank"
						rel="noreferrer"
						class="underline">tributestream.com</a
					>
					<a href="tel:14072215922" class="underline">(407) 221‑5922</a>
				</div>
			</div>
		</div>
	</footer>
</div>
