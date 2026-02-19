<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  import Button from './Button.svelte';
  import Badge from './Badge.svelte';
  
  interface Memorial {
    id: string;
    name: string;
    dates: string;
    description?: string;
    imageUrl?: string;
    isLive?: boolean;
    isPrivate?: boolean;
    viewerCount?: number;
    serviceDate?: string;
    location?: string;
  }
  
  interface Props {
    theme?: ThemeKey;
    memorial: Memorial;
    class?: string;
    onView?: () => void;
    onShare?: () => void;
  }
  
  let {
    theme = 'minimal',
    memorial,
    class: className = '',
    onView,
    onShare
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<div class="{themeConfig.card} p-6 {className} hover:shadow-lg transition-shadow duration-200">
  <!-- Memorial Image -->
  {#if memorial.imageUrl}
    <div class="relative mb-4 overflow-hidden rounded-xl">
      <img 
        src={memorial.imageUrl} 
        alt={memorial.name}
        class="w-full h-48 object-cover"
      />
      {#if memorial.isLive}
        <div class="absolute top-3 right-3">
          <Badge theme={theme} class="bg-red-500 text-white animate-pulse">
            🔴 Live
          </Badge>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Memorial Header -->
  <div class="mb-4">
    <div class="flex items-start justify-between mb-2">
      <h3 class="text-xl font-semibold {themeConfig.text}" style="font-family: {themeConfig.font.heading}">
        {memorial.name}
      </h3>
      <div class="flex gap-2">
        {#if memorial.isPrivate}
          <Badge theme={theme} class="bg-slate-100 text-slate-700 text-xs">
            🔒 Private
          </Badge>
        {/if}
      </div>
    </div>
    
    <p class="text-sm {themeConfig.hero.sub} font-medium">
      {memorial.dates}
    </p>
    
    {#if memorial.location}
      <p class="text-sm {themeConfig.hero.sub} mt-1">
        📍 {memorial.location}
      </p>
    {/if}
  </div>

  <!-- Memorial Description -->
  {#if memorial.description}
    <p class="text-sm {themeConfig.hero.sub} mb-4 line-clamp-3">
      {memorial.description}
    </p>
  {/if}

  <!-- Service Information -->
  {#if memorial.serviceDate}
    <div class="mb-4 p-3 rounded-lg bg-[#D5BA7F]/10 border border-[#D5BA7F]/20">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium {themeConfig.text}">Service:</span>
        <span class="text-sm {themeConfig.hero.sub}">{memorial.serviceDate}</span>
      </div>
      {#if memorial.viewerCount !== undefined}
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs {themeConfig.hero.sub}">
            {memorial.viewerCount} {memorial.viewerCount === 1 ? 'viewer' : 'viewers'}
            {memorial.isLive ? 'watching' : 'attended'}
          </span>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="flex gap-3">
    <Button theme={theme} onclick={onView} class="flex-1">
      {memorial.isLive ? 'Watch Live' : 'View Memorial'}
    </Button>
    {#if onShare}
      <Button theme={theme} variant="secondary" onclick={onShare}>
        Share
      </Button>
    {/if}
  </div>
</div>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
