<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface Props {
    theme?: ThemeKey;
    type?: string;
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    class?: string;
    id?: string;
    required?: boolean;
    oninput?: (event: Event) => void;
  }
  
  let {
    theme = 'minimal',
    type = 'text',
    placeholder = '',
    value = $bindable(''),
    disabled = false,
    class: className = '',
    id,
    required = false,
    oninput,
    ...restProps
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
  
  const inputClasses = $derived(`w-full ${themeConfig.input} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`);
</script>

<input
  {type}
  {placeholder}
  bind:value
  {disabled}
  class={inputClasses}
  style="font-family: {themeConfig.font.body}"
  oninput={oninput}
  {...restProps}
/>
