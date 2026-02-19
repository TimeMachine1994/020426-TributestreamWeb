<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  import Button from './Button.svelte';
  import Badge from './Badge.svelte';
  
  interface ScheduleEvent {
    id: string;
    title: string;
    time: string;
    duration?: string;
    location?: string;
    description?: string;
    isLive?: boolean;
    streamUrl?: string;
  }
  
  interface Props {
    theme?: ThemeKey;
    title?: string;
    date: string;
    events: ScheduleEvent[];
    class?: string;
    onJoinStream?: (event: ScheduleEvent) => void;
  }
  
  let {
    theme = 'minimal',
    title = 'Service Schedule',
    date,
    events,
    class: className = '',
    onJoinStream
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
  
  function formatTime(timeString: string): string {
    try {
      const time = new Date(`2000-01-01 ${timeString}`);
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timeString;
    }
  }
</script>

<div class="{themeConfig.card} p-6 {className}">
  <!-- Header -->
  <div class="mb-6">
    <h3 class="text-xl font-semibold {themeConfig.text} mb-2" style="font-family: {themeConfig.font.heading}">
      {title}
    </h3>
    <p class="text-lg {themeConfig.hero.sub} font-medium">
      {date}
    </p>
  </div>

  <!-- Timeline -->
  <div class="relative">
    <!-- Timeline line -->
    <div class="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>
    
    <div class="space-y-6">
      {#each events as event, index}
        <div class="relative flex items-start gap-4">
          <!-- Timeline dot -->
          <div class="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full {event.isLive ? 'bg-red-100 ring-2 ring-red-500' : 'bg-[#D5BA7F]/20'}">
            {#if event.isLive}
              <div class="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
            {:else}
              <div class="h-3 w-3 rounded-full bg-[#D5BA7F]"></div>
            {/if}
          </div>

          <!-- Event content -->
          <div class="flex-1 min-w-0 pb-6">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h4 class="font-semibold {themeConfig.text} text-lg">
                  {event.title}
                </h4>
                <div class="flex items-center gap-4 mt-1">
                  <span class="text-sm {themeConfig.hero.sub} font-medium">
                    {formatTime(event.time)}
                  </span>
                  {#if event.duration}
                    <span class="text-xs {themeConfig.hero.sub}">
                      ({event.duration})
                    </span>
                  {/if}
                </div>
              </div>
              
              {#if event.isLive}
                <Badge theme={theme} class="bg-red-500 text-white animate-pulse">
                  🔴 Live Now
                </Badge>
              {/if}
            </div>

            {#if event.location}
              <p class="text-sm {themeConfig.hero.sub} mb-2">
                📍 {event.location}
              </p>
            {/if}

            {#if event.description}
              <p class="text-sm {themeConfig.hero.sub} mb-3">
                {event.description}
              </p>
            {/if}

            {#if event.streamUrl && onJoinStream}
              <Button 
                theme={theme} 
                onclick={() => onJoinStream?.(event)}
                class={event.isLive ? 'bg-red-500 text-white hover:bg-red-600' : ''}
              >
                {event.isLive ? 'Join Live Stream' : 'Set Reminder'}
              </Button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Footer note -->
  <div class="mt-6 pt-4 border-t {themeConfig.footer.border}">
    <p class="text-xs {themeConfig.hero.sub} text-center">
      All times are local. Live streams will begin automatically at scheduled times.
    </p>
  </div>
</div>
