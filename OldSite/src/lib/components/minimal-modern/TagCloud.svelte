<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface Props {
    theme?: ThemeKey;
    tags: string[];
    class?: string;
  }
  
  let {
    theme = 'minimal',
    tags,
    class: className = ''
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<div class="flex flex-wrap gap-2 {className}">
  {#each tags as tag}
    <span class="px-3 py-1 rounded-full text-xs border {themeConfig.footer.border} hover:bg-slate-50 transition-colors">
      {tag}
    </span>
  {/each}
</div>
