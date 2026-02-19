<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface BreadcrumbItem {
    label: string;
    href?: string;
  }
  
  interface Props {
    theme?: ThemeKey;
    items: BreadcrumbItem[];
    class?: string;
  }
  
  let {
    theme = 'minimal',
    items,
    class: className = ''
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<nav class="text-sm {className}">
  <ol class="flex flex-wrap items-center gap-2">
    {#each items as item, i}
      <li class="flex items-center gap-2">
        {#if item.href}
          <a href={item.href} class={themeConfig.link}>{item.label}</a>
        {:else}
          <span class={themeConfig.text}>{item.label}</span>
        {/if}
        {#if i < items.length - 1}
          <span class="opacity-50">/</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
