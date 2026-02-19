<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  import Button from './Button.svelte';
  
  interface ComparisonTier {
    name: string;
    price: string;
    features: string[];
    featured?: boolean;
  }
  
  interface Props {
    theme?: ThemeKey;
    tiers: ComparisonTier[];
    class?: string;
  }
  
  let {
    theme = 'minimal',
    tiers,
    class: className = ''
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4 {className}">
  {#each tiers as tier}
    <div class="{themeConfig.card} p-6 {tier.featured ? 'ring-2 ring-[#D5BA7F]' : ''}">
      <div class="flex items-baseline justify-between">
        <div class="text-lg font-semibold">{tier.name}</div>
        <div class="text-2xl font-extrabold">{tier.price}</div>
      </div>
      <ul class="mt-4 space-y-2 text-sm">
        {#each tier.features as feature}
          <li class="flex items-start gap-2">
            <span class="mt-1 h-1.5 w-1.5 rounded-full bg-[#D5BA7F]"></span>
            {feature}
          </li>
        {/each}
      </ul>
      <div class="mt-6">
        <Button {theme}>Choose</Button>
      </div>
    </div>
  {/each}
</div>
