<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface Props {
    theme?: ThemeKey;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    visible?: boolean;
    class?: string;
  }
  
  let {
    theme = 'minimal',
    message,
    type = 'info',
    visible = true,
    class: className = ''
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
  
  const typeColors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800'
  };
  
  const dotColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500'
  };
</script>

{#if visible}
  <div class="rounded-xl p-4 flex items-center gap-3 border {typeColors[type]} {className}">
    <div class="h-2 w-2 rounded-full {dotColors[type]}"></div>
    <div class="text-sm">{message}</div>
  </div>
{/if}
