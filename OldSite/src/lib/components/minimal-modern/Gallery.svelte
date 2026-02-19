<script lang="ts">
  import { getTheme, type ThemeKey } from '$lib/design-tokens/minimal-modern-theme';
  
  interface GalleryImage {
    src: string;
    alt: string;
  }
  
  interface Props {
    theme?: ThemeKey;
    images: GalleryImage[];
    class?: string;
  }
  
  let {
    theme = 'minimal',
    images,
    class: className = ''
  }: Props = $props();
  
  const themeConfig = getTheme(theme);
</script>

<div class="grid grid-cols-2 md:grid-cols-3 gap-3 {className}">
  {#each images as img}
    <figure class="overflow-hidden rounded-xl {themeConfig.card}">
      <img src={img.src} alt={img.alt} class="w-full h-40 object-cover" />
      <figcaption class="p-2 text-xs opacity-70">{img.alt}</figcaption>
    </figure>
  {/each}
</div>
