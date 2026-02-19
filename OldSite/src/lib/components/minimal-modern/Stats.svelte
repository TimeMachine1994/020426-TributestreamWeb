<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface Stat {
    label: string;
    value: string;
  }
  
  interface Props {
    theme?: ThemeKey;
    stats: Stat[];
    class?: string;
  }
  
  let {
    theme = 'minimal',
    stats,
    class: className = ''
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<div class="grid grid-cols-3 gap-4 {className}">
  {#each stats as stat}
    <div class="{themeConfig.card} p-4 text-center">
      <div class="text-2xl font-bold">{stat.value}</div>
      <div class="text-xs opacity-70 mt-1">{stat.label}</div>
    </div>
  {/each}
</div>
