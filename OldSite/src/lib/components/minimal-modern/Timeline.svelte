<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface TimelineEvent {
    time: string;
    title: string;
    detail: string;
  }
  
  interface Props {
    theme?: ThemeKey;
    events: TimelineEvent[];
    class?: string;
  }
  
  let {
    theme = 'minimal',
    events,
    class: className = ''
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<div class="relative pl-8 {className}">
  <div class="absolute left-3 top-0 bottom-0 w-px bg-slate-200"></div>
  <ul class="space-y-4">
    {#each events as event, idx}
      <li class="relative">
        <div class="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#D5BA7F]"></div>
        <div class="text-xs opacity-60">{event.time}</div>
        <div class="font-medium">{event.title}</div>
        <div class="text-sm opacity-80">{event.detail}</div>
      </li>
    {/each}
  </ul>
</div>
