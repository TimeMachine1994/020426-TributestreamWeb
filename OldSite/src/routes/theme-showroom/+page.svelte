<script lang="ts">
  import { getTheme, BACKGROUND_PRESETS } from '$lib/design-tokens/minimal-modern-theme';
  import {
    Button,
    Input,
    Card,
    Badge,
    Steps,
    Timeline,
    Comparison,
    FAQ,
    Stats,
    Gallery,
    VideoPlayer,
    Breadcrumbs,
    TagCloud,
    Toast
  } from '$lib/components/minimal-modern';
  
  const theme = 'minimal';
  const themeConfig = getTheme(theme);
  
  // Sample data
  const timelineEvents = [
    { time: "10:00 AM", title: "Visitation Opens", detail: "Lobby stream soft open." },
    { time: "11:00 AM", title: "Service Begins", detail: "Camera A + audio mix." },
    { time: "12:15 PM", title: "Procession", detail: "End church stream; move to graveside." },
    { time: "1:00 PM", title: "Committal", detail: "Graveside stream with mobile kit." }
  ];
  
  const comparisonTiers = [
    { name: "DIY Record", price: "$395", features: ["2 hr broadcast", "Private link", "Cloud archive"] },
    { name: "Standard", price: "$895", featured: true, features: ["Multi-cam", "On-site tech", "Live support"] },
    { name: "Premium", price: "$1,695", features: ["3+ locations", "Wireless audio", "Custom graphics"] }
  ];
  
  const faqItems = [
    { q: "How fast can we go live?", a: "Same day in most cases; call for availability." },
    { q: "Is the link private?", a: "Yes, you control who receives it. Password optional." },
    { q: "Can we download the video?", a: "Yes, you get an archive file after the event." }
  ];
  
  const statsData = [
    { label: "Streams delivered", value: "1,200+" },
    { label: "Avg. live viewers", value: "85" },
    { label: "Counties served", value: "9" }
  ];
  
  const galleryImages = [
    { alt: "Chapel setup", src: "https://picsum.photos/seed/chapel/400/260" },
    { alt: "Camera kit", src: "https://picsum.photos/seed/camera/400/260" },
    { alt: "Graveside", src: "https://picsum.photos/seed/grave/400/260" }
  ];
  
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Memorials", href: "/memorials" },
    { label: "Maria E. Cruz" }
  ];
  
  const tags = ["Catholic", "Winter Park", "Family First", "Live Music"];
  
  let formData = {
    name: '',
    email: ''
  };
  
  let showToast = false;
  
  function handleSubmit() {
    showToast = true;
    setTimeout(() => showToast = false, 3000);
  }
</script>

<svelte:head>
  <title>Minimal Modern Theme Showroom - Tributestream</title>
</svelte:head>

<div class="{themeConfig.root} min-h-screen w-full transition-colors duration-500" style="font-family: {themeConfig.font.body}">
  
  <!-- Top Bar -->
  <div class="sticky top-0 z-50 border-b border-black/10 backdrop-blur bg-white/70 supports-[backdrop-filter]:bg-white/60">
    <div class="mx-auto max-w-6xl px-6 py-3 flex items-center gap-3 justify-between">
      <div class="text-sm opacity-80">Minimal Modern Theme Showroom</div>
      <div class="flex items-center gap-2">
        <span class="text-xs uppercase tracking-wide opacity-70">Tributestream Design System</span>
      </div>
    </div>
  </div>

  <!-- Hero Section -->
  <section class="{themeConfig.hero.wrap}">
    <div class="{themeConfig.hero.decoration}" aria-hidden="true"></div>
    <div class="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-28">
      <h1 class="text-4xl md:text-6xl font-bold tracking-tight {themeConfig.hero.heading}" style="font-family: {themeConfig.font.heading}">
        Minimal Modern Component Demo
      </h1>
      <p class="mt-4 max-w-2xl text-lg {themeConfig.hero.sub}">
        A comprehensive set of reusable components in the Minimal Modern design language with ABeeZee font and gold accents.
      </p>
      <div class="mt-8 flex gap-3 flex-wrap">
        <Button {theme}>Create Memorial</Button>
        <Button {theme} variant="secondary">View Samples</Button>
      </div>
    </div>
  </section>

  <!-- Content Grid -->
  <section class="mx-auto max-w-6xl px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
    <Card title="Feature Card" {theme}>
      Livestream reliably, invite family anywhere, and preserve memories with respectful design.
    </Card>
    
    <Card title="Pricing Tile" {theme}>
      <div class="text-5xl font-extrabold">$395</div>
      <div class="opacity-80 mt-1">DIY Record Camera Kit</div>
      <ul class="mt-4 space-y-1 text-sm opacity-90">
        <li>• 2 hours broadcast time</li>
        <li>• Share private link</li>
        <li>• Heirloom-quality recording</li>
      </ul>
      <div class="mt-6">
        <Button {theme}>Get Started</Button>
      </div>
    </Card>

    <Card title="Testimonial" {theme}>
      <blockquote class="text-sm md:text-base">
        "It felt like we were together. Simple and beautiful. Thank you."
      </blockquote>
      <div class="mt-3 text-xs opacity-70">— J. Ramirez, Winter Park, FL</div>
    </Card>

    <Card title="Mini Form" {theme}>
      <form class="grid grid-cols-1 gap-3" on:submit|preventDefault={handleSubmit}>
        <Input {theme} placeholder="Loved one's full name" bind:value={formData.name} />
        <Input {theme} placeholder="Your email" type="email" bind:value={formData.email} />
        <Button {theme} type="submit">Generate Tribute Link</Button>
      </form>
    </Card>
  </section>

  <!-- Media Strip -->
  <section class="mx-auto max-w-6xl px-6 pb-6 md:pb-12">
    <h2 class="text-2xl font-semibold mb-4 {themeConfig.text}">Media/Badges</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {#each ["1080p HLS", "Private Access", "Mobile Ready", "Central Florida"] as badge}
        <Badge {theme}>{badge}</Badge>
      {/each}
    </div>
  </section>

  <!-- Extended Components -->
  <section class="mx-auto max-w-6xl px-6 pb-12 md:pb-16 space-y-10">
    <h2 class="text-2xl font-semibold {themeConfig.text}">Extended Components</h2>

    <!-- Process Steps -->
    <Card title="Process Steps" {theme}>
      <Steps {theme} items={["Create Tribute", "Invite Family", "Go Live", "Share Recording"]} current={2} />
    </Card>

    <!-- Timeline -->
    <Card title="Service Day Timeline" {theme}>
      <Timeline {theme} events={timelineEvents} />
    </Card>

    <!-- Comparison -->
    <Card title="Package Comparison" {theme}>
      <Comparison {theme} tiers={comparisonTiers} />
    </Card>

    <!-- FAQ -->
    <Card title="FAQ" {theme}>
      <FAQ {theme} items={faqItems} />
    </Card>

    <!-- Stats -->
    <Card title="Stats" {theme}>
      <Stats {theme} stats={statsData} />
    </Card>

    <!-- Gallery -->
    <Card title="Light Gallery" {theme}>
      <Gallery {theme} images={galleryImages} />
    </Card>

    <!-- Breadcrumbs & Tags -->
    <Card title="Breadcrumbs & Tags" {theme}>
      <div class="space-y-3">
        <Breadcrumbs {theme} items={breadcrumbItems} />
        <TagCloud {theme} tags={tags} />
      </div>
    </Card>
  </section>

  <!-- Video Players -->
  <section class="mx-auto max-w-6xl px-6 pb-12 md:pb-16 space-y-10">
    <h2 class="text-2xl font-semibold {themeConfig.text}">Video Players</h2>
    
    <Card title="Custom Player (Stock)" {theme}>
      <VideoPlayer {theme} poster="https://picsum.photos/seed/poster/800/450" src="#" />
    </Card>
    
    <Card title="Scheduled Placeholder" {theme}>
      <VideoPlayer
        {theme}
        poster="https://picsum.photos/seed/schedule/800/450"
        scheduled={true}
        startTimeLabel="Service starts Oct 12, 11:00 AM"
        cta="Add to Calendar"
      />
    </Card>
  </section>

  <!-- Background Presets -->
  <section class="mx-auto max-w-6xl px-6 pb-12 md:pb-16 space-y-8">
    <h2 class="text-2xl font-semibold {themeConfig.text}">Background Presets</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="rounded-2xl border border-slate-200 shadow-md overflow-hidden {BACKGROUND_PRESETS.goldMist}">
        <div class="h-40"></div>
        <div class="px-4 py-3 text-sm flex items-center justify-between bg-white/70 backdrop-blur">
          <span>Gold Mist (radial)</span>
          <code class="text-xs opacity-70">bg preset</code>
        </div>
      </div>
      
      <div class="rounded-2xl border border-slate-200 shadow-md overflow-hidden {BACKGROUND_PRESETS.emeraldDrift}">
        <div class="h-40"></div>
        <div class="px-4 py-3 text-sm flex items-center justify-between bg-white/70 backdrop-blur">
          <span>Emerald Drift (conic)</span>
          <code class="text-xs opacity-70">bg preset</code>
        </div>
      </div>
      
      <div class="rounded-2xl border border-slate-200 shadow-md overflow-hidden {BACKGROUND_PRESETS.amberVeil}">
        <div class="h-40"></div>
        <div class="px-4 py-3 text-sm flex items-center justify-between bg-white/70 backdrop-blur">
          <span>Amber Veil (layers)</span>
          <code class="text-xs opacity-70">bg preset</code>
        </div>
      </div>
      
      <div class="rounded-2xl border border-slate-200 shadow-md overflow-hidden {BACKGROUND_PRESETS.charcoalFog}">
        <div class="h-40"></div>
        <div class="px-4 py-3 text-sm flex items-center justify-between bg-white/70 backdrop-blur">
          <span>Charcoal Fog (noise)</span>
          <code class="text-xs opacity-70">bg preset</code>
        </div>
      </div>
    </div>
  </section>

  <!-- Toast Demo -->
  {#if showToast}
    <div class="fixed bottom-4 right-4 z-50">
      <Toast {theme} message="Your memorial link has been created. View now." type="success" />
    </div>
  {/if}

  <!-- Footer -->
  <footer class="mt-10 border-t {themeConfig.footer.border} {themeConfig.footer.wrap}">
    <div class="mx-auto max-w-6xl px-6 py-8 md:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class={themeConfig.text}>
        <div class="font-semibold">Tributestream®</div>
        <div class="text-sm opacity-80">Compassionate livestreams across Central Florida.</div>
      </div>
      <div class="text-sm opacity-80 flex gap-6">
        <a class={themeConfig.link} href="#">For Families</a>
        <a class={themeConfig.link} href="#">For Funeral Directors</a>
        <a class={themeConfig.link} href="#">Contact</a>
      </div>
    </div>
  </footer>
</div>
