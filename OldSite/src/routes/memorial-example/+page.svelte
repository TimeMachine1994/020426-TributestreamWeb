<script lang="ts">
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import {
		MemorialCard,
		ServiceSchedule,
		CondolenceForm,
		StreamStatus,
		Stats,
		Gallery,
		VideoPlayer,
		Breadcrumbs,
		TagCloud
	} from '$lib/components/minimal-modern';

	const theme = getTheme('minimal');

	// Sample memorial data
	const memorial = {
		id: 'memorial-123',
		name: 'Maria Elena Cruz',
		dates: '1946 – 2025',
		description: 'A gentle light, a steady hand, and a song for every season. Maria\'s kindness reached everyone she met. She was a devoted mother, grandmother, and friend who brought joy to all who knew her.',
		imageUrl: 'https://picsum.photos/seed/maria/400/300',
		isLive: false,
		isPrivate: false,
		viewerCount: 127,
		serviceDate: 'January 15, 2025 at 11:00 AM',
		location: 'St. Mary\'s Catholic Church, Winter Park, FL'
	};

	// Sample schedule data
	const scheduleEvents = [
		{
			id: 'visitation',
			title: 'Visitation',
			time: '10:00 AM',
			duration: '1 hour',
			location: 'Church Lobby',
			description: 'Family will receive friends and visitors',
			isLive: false,
			streamUrl: '/stream/visitation'
		},
		{
			id: 'service',
			title: 'Memorial Service',
			time: '11:00 AM',
			duration: '45 minutes',
			location: 'Main Sanctuary',
			description: 'Celebration of life service with family and friends',
			isLive: true,
			streamUrl: '/stream/service'
		},
		{
			id: 'reception',
			title: 'Reception',
			time: '12:00 PM',
			duration: '2 hours',
			location: 'Fellowship Hall',
			description: 'Light refreshments and time for sharing memories',
			isLive: false,
			streamUrl: '/stream/reception'
		}
	];

	// Sample gallery images
	const galleryImages = [
		{ alt: 'Maria with family at Christmas', src: 'https://picsum.photos/seed/family1/400/300' },
		{ alt: 'Maria\'s garden', src: 'https://picsum.photos/seed/garden/400/300' },
		{ alt: 'Wedding day 1968', src: 'https://picsum.photos/seed/wedding/400/300' },
		{ alt: 'Grandchildren visit', src: 'https://picsum.photos/seed/grandkids/400/300' },
		{ alt: 'Church volunteer work', src: 'https://picsum.photos/seed/church/400/300' },
		{ alt: 'Birthday celebration', src: 'https://picsum.photos/seed/birthday/400/300' }
	];

	// Sample stats
	const memorialStats = [
		{ label: 'Messages of Love', value: '47' },
		{ label: 'Photos Shared', value: '23' },
		{ label: 'Live Viewers', value: '127' }
	];

	// Sample breadcrumbs
	const breadcrumbItems = [
		{ label: 'Home', href: '/' },
		{ label: 'Memorials', href: '/memorials' },
		{ label: 'Maria Elena Cruz' }
	];

	// Sample tags
	const memorialTags = ['Catholic', 'Winter Park', 'Family First', 'Gardening', 'Volunteer', 'Music'];

	// Event handlers
	function handleViewMemorial() {
		console.log('Viewing memorial:', memorial.id);
	}

	function handleShareMemorial() {
		console.log('Sharing memorial:', memorial.id);
	}

	function handleJoinStream(event: any) {
		console.log('Joining stream for event:', event.id);
	}

	function handleStreamJoin() {
		console.log('Joining main stream');
	}

	function handleStreamNotify() {
		console.log('Setting up stream notification');
	}

	async function handleCondolenceSubmit(condolence: any) {
		console.log('Submitting condolence:', condolence);
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
</script>

<svelte:head>
	<title>Maria Elena Cruz Memorial - Tributestream</title>
	<meta name="description" content="Memorial service for Maria Elena Cruz. Join family and friends in celebrating her life." />
</svelte:head>

<div class="{theme.root} min-h-screen" style="font-family: {theme.font.body}">
	<!-- Navigation -->
	<div class="bg-white border-b {theme.footer.border} sticky top-0 z-50">
		<div class="max-w-6xl mx-auto px-6 py-4">
			<Breadcrumbs theme="minimal" items={breadcrumbItems} />
		</div>
	</div>

	<!-- Hero Section -->
	<section class="py-12 bg-gradient-to-b from-slate-50 to-white">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Memorial Card -->
				<div class="lg:col-span-1">
					<MemorialCard 
						theme="minimal" 
						{memorial} 
						onView={handleViewMemorial}
						onShare={handleShareMemorial}
					/>
				</div>

				<!-- Stream Status -->
				<div class="lg:col-span-2">
					<StreamStatus
						theme="minimal"
						status="live"
						viewerCount={127}
						startTime="2025-01-15T11:00:00"
						onJoin={handleStreamJoin}
						class="mb-6"
					/>

					<!-- Video Player -->
					<VideoPlayer
						theme="minimal"
						poster="https://picsum.photos/seed/service/800/450"
						src="/stream/service"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- Main Content -->
	<section class="py-12">
		<div class="max-w-6xl mx-auto px-6">
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Left Column -->
				<div class="lg:col-span-2 space-y-8">
					<!-- Service Schedule -->
					<ServiceSchedule
						theme="minimal"
						title="Service Schedule"
						date="Tuesday, January 15, 2025"
						events={scheduleEvents}
						onJoinStream={handleJoinStream}
					/>

					<!-- Photo Gallery -->
					<div class="{theme.card} p-6">
						<h3 class="text-xl font-semibold {theme.text} mb-4" style="font-family: {theme.font.heading}">
							Celebrating Maria's Life
						</h3>
						<Gallery theme="minimal" images={galleryImages} />
					</div>

					<!-- Memorial Stats -->
					<div class="{theme.card} p-6">
						<h3 class="text-xl font-semibold {theme.text} mb-4" style="font-family: {theme.font.heading}">
							Memorial Impact
						</h3>
						<Stats theme="minimal" stats={memorialStats} />
					</div>
				</div>

				<!-- Right Column -->
				<div class="space-y-8">
					<!-- Condolence Form -->
					<CondolenceForm
						theme="minimal"
						memorialId={memorial.id}
						onSubmit={handleCondolenceSubmit}
					/>

					<!-- Memorial Tags -->
					<div class="{theme.card} p-6">
						<h3 class="text-lg font-semibold {theme.text} mb-4" style="font-family: {theme.font.heading}">
							Remembering Maria
						</h3>
						<TagCloud theme="minimal" tags={memorialTags} />
					</div>

					<!-- Memorial Details -->
					<div class="{theme.card} p-6">
						<h3 class="text-lg font-semibold {theme.text} mb-4" style="font-family: {theme.font.heading}">
							Service Details
						</h3>
						<div class="space-y-3 text-sm {theme.hero.sub}">
							<div class="flex items-start gap-2">
								<span class="font-medium {theme.text}">Date:</span>
								<span>Tuesday, January 15, 2025</span>
							</div>
							<div class="flex items-start gap-2">
								<span class="font-medium {theme.text}">Time:</span>
								<span>11:00 AM - 12:00 PM EST</span>
							</div>
							<div class="flex items-start gap-2">
								<span class="font-medium {theme.text}">Location:</span>
								<span>St. Mary's Catholic Church<br />123 Church Street<br />Winter Park, FL 32789</span>
							</div>
							<div class="flex items-start gap-2">
								<span class="font-medium {theme.text}">Officiant:</span>
								<span>Father Michael Rodriguez</span>
							</div>
						</div>
					</div>

					<!-- Family Contact -->
					<div class="{theme.card} p-6 bg-amber-50 border-amber-200">
						<h3 class="text-lg font-semibold {theme.text} mb-3" style="font-family: {theme.font.heading}">
							Contact Family
						</h3>
						<p class="text-sm {theme.hero.sub} mb-4">
							For flowers, donations, or other arrangements, please contact the family directly.
						</p>
						<div class="text-sm">
							<p class="font-medium {theme.text}">Elena Cruz (Daughter)</p>
							<p class="{theme.hero.sub}">elena.cruz@email.com</p>
							<p class="{theme.hero.sub}">(407) 555-0123</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="mt-16 border-t {theme.footer.border} {theme.footer.wrap}">
		<div class="max-w-6xl mx-auto px-6 py-8 text-center">
			<p class="text-sm {theme.hero.sub}">
				This memorial page was created with love by the Cruz family using Tributestream.
			</p>
			<p class="text-xs {theme.hero.sub} mt-2">
				© 2025 Tributestream. Compassionate technology for meaningful moments.
			</p>
		</div>
	</footer>
</div>
