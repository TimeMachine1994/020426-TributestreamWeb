<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface Props {
    theme?: ThemeKey;
    items: string[];
    current: number;
    class?: string;
  }
  
  let {
    theme = 'minimal',
    items,
    current,
    class: className = ''
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<ol class="grid grid-cols-2 md:grid-cols-4 gap-3 {className}">
  {#each items as label, i}
    <li class="rounded-xl px-3 py-2 border {themeConfig.footer.border} {i <= current ? 'bg-[#D5BA7F]/10' : 'bg-white'}">
      <div class="text-xs opacity-60">Step {i + 1}</div>
      <div class="font-medium">{label}</div>
    </li>
  {/each}
</ol>
