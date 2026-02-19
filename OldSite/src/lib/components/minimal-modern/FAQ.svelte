<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface FAQItem {
    q: string;
    a: string;
  }
  
  interface Props {
    theme?: ThemeKey;
    items: FAQItem[];
    class?: string;
  }
  
  let {
    theme = 'minimal',
    items,
    class: className = ''
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<div class="divide-y divide-slate-200 {className}">
  {#each items as item}
    <details class="group">
      <summary class="cursor-pointer py-3 font-medium {themeConfig.text} list-none">
        <div class="flex items-center justify-between">
          {item.q}
          <span class="text-[#D5BA7F] group-open:rotate-45 transition-transform">+</span>
        </div>
      </summary>
      <div class="pb-3 text-sm opacity-80">{item.a}</div>
    </details>
  {/each}
</div>
