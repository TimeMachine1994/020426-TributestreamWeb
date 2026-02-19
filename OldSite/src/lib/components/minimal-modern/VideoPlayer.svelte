<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface Props {
    theme?: ThemeKey;
    poster?: string;
    src?: string;
    scheduled?: boolean;
    startTimeLabel?: string;
    cta?: string;
    class?: string;
  }
  
  let {
    theme = 'minimal',
    poster = '',
    src = '',
    scheduled = false,
    startTimeLabel = '',
    cta = 'Add to Calendar',
    class: className = ''
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<div class="{themeConfig.card} overflow-hidden {className}">
  <div class="relative">
    <img src={poster} alt="video poster" class="w-full aspect-video object-cover" />
    
    {#if scheduled}
      <div class="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
        <div class="text-center px-6">
          <div class="text-sm uppercase tracking-wide opacity-70">Livestream Scheduled</div>
          <div class="mt-1 text-xl font-semibold">{startTimeLabel}</div>
          <div class="mt-2 text-sm opacity-80">This page will go live automatically. Refresh not required.</div>
          <div class="mt-4 flex items-center justify-center gap-2 text-sm">
            <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 border border-slate-200 bg-white">
              <span class="h-1.5 w-1.5 rounded-full bg-[#D5BA7F]"></span>
              Notify me
            </span>
            <button class="underline">{cta}</button>
          </div>
        </div>
      </div>
    {:else}
      <button 
        aria-label="Play" 
        class="absolute inset-0 m-auto h-16 w-16 rounded-full flex items-center justify-center bg-[#D5BA7F] text-[#070707] shadow-lg hover:brightness-110 transition-all"
      >
        ▶
      </button>
    {/if}
  </div>
  
  {#if !scheduled}
    <div class="px-4 py-3 flex items-center gap-3 border-t border-slate-200">
      <button class="text-sm hover:text-[#D5BA7F] transition-colors">Play</button>
      <button class="text-sm hover:text-[#D5BA7F] transition-colors">Mute</button>
      <div class="flex-1 h-1 bg-slate-200 rounded">
        <div class="h-1 w-1/5 bg-[#D5BA7F] rounded"></div>
      </div>
      <div class="text-xs opacity-70">00:24 / 10:00</div>
      <button class="text-sm hover:text-[#D5BA7F] transition-colors">⛶</button>
    </div>
  {/if}
</div>
