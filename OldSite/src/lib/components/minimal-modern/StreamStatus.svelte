<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  import Badge from './Badge.svelte';
  import Button from './Button.svelte';
  
  interface Props {
    theme?: ThemeKey;
    status: 'offline' | 'starting' | 'live' | 'ended' | 'scheduled';
    viewerCount?: number;
    startTime?: string;
    endTime?: string;
    scheduledTime?: string;
    streamUrl?: string;
    class?: string;
    onJoin?: () => void;
    onNotify?: () => void;
  }
  
  let {
    theme = 'minimal',
    status,
    viewerCount = 0,
    startTime,
    endTime,
    scheduledTime,
    streamUrl,
    class: className = '',
    onJoin,
    onNotify
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
  
  const statusConfig = {
    offline: {
      label: 'Offline',
      color: 'bg-slate-500 text-white',
      icon: '⚫',
      description: 'Stream is not currently active'
    },
    starting: {
      label: 'Starting Soon',
      color: 'bg-amber-500 text-white animate-pulse',
      icon: '🟡',
      description: 'Stream is preparing to go live'
    },
    live: {
      label: 'Live Now',
      color: 'bg-red-500 text-white animate-pulse',
      icon: '🔴',
      description: 'Stream is currently live'
    },
    ended: {
      label: 'Stream Ended',
      color: 'bg-slate-600 text-white',
      icon: '⚪',
      description: 'Stream has concluded'
    },
    scheduled: {
      label: 'Scheduled',
      color: 'bg-blue-500 text-white',
      icon: '📅',
      description: 'Stream is scheduled for later'
    }
  };
  
  const currentStatus = statusConfig[status];
  
  function formatTime(timeString?: string): string {
    if (!timeString) return '';
    try {
      const time = new Date(timeString);
      return time.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  }
  
  function getTimeUntilStart(scheduledTime: string): string {
    try {
      const now = new Date();
      const scheduled = new Date(scheduledTime);
      const diff = scheduled.getTime() - now.getTime();
      
      if (diff <= 0) return 'Starting soon';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `Starts in ${hours}h ${minutes}m`;
      } else {
        return `Starts in ${minutes}m`;
      }
    } catch {
      return '';
    }
  }
</script>

<div class="{themeConfig.card} p-6 {className}">
  <!-- Status Header -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <Badge theme={theme} class={currentStatus.color}>
        {currentStatus.icon} {currentStatus.label}
      </Badge>
      
      {#if status === 'live' && viewerCount > 0}
        <span class="text-sm {themeConfig.hero.sub}">
          {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
        </span>
      {/if}
    </div>
  </div>

  <!-- Status Description -->
  <p class="text-sm {themeConfig.hero.sub} mb-4">
    {currentStatus.description}
  </p>

  <!-- Time Information -->
  <div class="space-y-2 mb-6">
    {#if status === 'scheduled' && scheduledTime}
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium {themeConfig.text}">Scheduled:</span>
        <span class="text-sm {themeConfig.hero.sub}">{formatTime(scheduledTime)}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-amber-600">{getTimeUntilStart(scheduledTime)}</span>
      </div>
    {/if}
    
    {#if status === 'live' && startTime}
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium {themeConfig.text}">Started:</span>
        <span class="text-sm {themeConfig.hero.sub}">{formatTime(startTime)}</span>
      </div>
    {/if}
    
    {#if status === 'ended' && endTime}
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium {themeConfig.text}">Ended:</span>
        <span class="text-sm {themeConfig.hero.sub}">{formatTime(endTime)}</span>
      </div>
    {/if}
  </div>

  <!-- Action Buttons -->
  <div class="flex gap-3">
    {#if status === 'live' && onJoin}
      <Button theme={theme} onclick={onJoin} class="flex-1 bg-red-500 text-white hover:bg-red-600">
        Join Live Stream
      </Button>
    {:else if status === 'starting' && onJoin}
      <Button theme={theme} onclick={onJoin} class="flex-1 bg-amber-500 text-white hover:bg-amber-600">
        Join Stream
      </Button>
    {:else if status === 'scheduled' && onNotify}
      <Button theme={theme} variant="secondary" onclick={onNotify} class="flex-1">
        Notify Me When Live
      </Button>
    {:else if status === 'ended'}
      <Button theme={theme} variant="secondary" class="flex-1" disabled>
        Stream Ended
      </Button>
    {:else}
      <Button theme={theme} variant="secondary" class="flex-1" disabled>
        Stream Unavailable
      </Button>
    {/if}
  </div>

  <!-- Additional Info -->
  {#if status === 'live'}
    <div class="mt-4 pt-4 border-t {themeConfig.footer.border}">
      <p class="text-xs {themeConfig.hero.sub} text-center">
        Stream quality will automatically adjust based on your connection
      </p>
    </div>
  {:else if status === 'scheduled'}
    <div class="mt-4 pt-4 border-t {themeConfig.footer.border}">
      <p class="text-xs {themeConfig.hero.sub} text-center">
        This page will automatically refresh when the stream begins
      </p>
    </div>
  {/if}
</div>
