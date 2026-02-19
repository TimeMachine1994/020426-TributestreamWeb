<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface Props {
    theme?: ThemeKey;
    title?: string;
    class?: string;
    children?: import('svelte').Snippet;
  }
  
  let {
    theme = 'minimal',
    title,
    class: className = '',
    children
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
  
  const cardClasses = $derived(`${themeConfig.card} p-6 ${className}`);
</script>

<div class={cardClasses}>
  {#if title}
    <div class="mb-3 text-center">
      <h3 class="text-lg font-semibold {themeConfig.text}" style="font-family: {themeConfig.font.heading}">
        {title}
      </h3>
    </div>
  {/if}
  <div class={themeConfig.text}>
    {@render children?.()}
  </div>
</div>
