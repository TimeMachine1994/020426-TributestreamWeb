<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface Props {
    theme?: ThemeKey;
    variant?: 'primary' | 'secondary';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    class?: string;
    onclick?: () => void;
    children?: import('svelte').Snippet;
  }
  
  let {
    theme = 'minimal',
    variant = 'primary',
    type = 'button',
    disabled = false,
    class: className = '',
    onclick,
    children,
    ...restProps
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
  
  const buttonClasses = $derived(`${themeConfig.button[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`);
</script>

<button
  {type}
  {disabled}
  class={buttonClasses}
  style="font-family: {themeConfig.font.body}"
  onclick={onclick}
  {...restProps}
>
  {@render children?.()}
</button>
