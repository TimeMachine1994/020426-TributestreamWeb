<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface Props {
    theme?: ThemeKey;
    class?: string;
    children?: import('svelte').Snippet;
  }
  
  let {
    theme = 'minimal',
    class: className = '',
    children
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
  
  const badgeClasses = $derived(`${themeConfig.badge.item} ${className}`);
</script>

<div class={badgeClasses}>
  {@render children?.()}
</div>
