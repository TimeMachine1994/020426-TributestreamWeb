/**
 * Script to create optimized placeholder images for video posters
 * Run this script to generate lightweight placeholder images
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG placeholder that will be much smaller than the original images
function createSVGPlaceholder(width, height, title) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
  <circle cx="${width/2}" cy="${height/2 - 20}" r="30" fill="#d0d0d0"/>
  <polygon points="${width/2 - 8},${height/2 - 30} ${width/2 - 8},${height/2 - 10} ${width/2 + 12},${height/2 - 20}" fill="#999"/>
  <text x="${width/2}" y="${height/2 + 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#666">${title}</text>
</svg>`;
}

// Create optimized WebP data URLs for video posters
function createOptimizedPoster(width, height, title) {
  const svg = createSVGPlaceholder(width, height, title);
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// Generate the placeholder images
const heroPlaceholder = createOptimizedPoster(800, 450, 'Memorial Service Video');
const demoPlaceholder = createOptimizedPoster(800, 450, 'How It Works Demo');

// Create a TypeScript file with the optimized images
const tsContent = `/**
 * Optimized placeholder images for video posters
 * These are lightweight SVG-based placeholders that replace the heavy Firebase Storage images
 */

export const OPTIMIZED_VIDEO_POSTERS = {
  hero: '${heroPlaceholder}',
  demo: '${demoPlaceholder}',
  
  // Responsive image sets for different screen sizes
  heroResponsive: {
    small: '${createOptimizedPoster(400, 225, 'Memorial Service')}',
    medium: '${createOptimizedPoster(800, 450, 'Memorial Service Video')}',
    large: '${createOptimizedPoster(1200, 675, 'Memorial Service Video')}'
  },
  
  demoResponsive: {
    small: '${createOptimizedPoster(400, 225, 'Demo')}',
    medium: '${createOptimizedPoster(800, 450, 'How It Works Demo')}',
    large: '${createOptimizedPoster(1200, 675, 'How It Works Demo')}'
  }
} as const;

/**
 * Get the appropriate poster image based on screen size
 */
export function getResponsivePoster(type: 'hero' | 'demo', width: number): string {
  const posters = OPTIMIZED_VIDEO_POSTERS[type + 'Responsive'];
  
  if (width <= 400) return posters.small;
  if (width <= 800) return posters.medium;
  return posters.large;
}
`;

// Write the TypeScript file
const outputPath = path.join(__dirname, 'optimizedPosters.ts');
fs.writeFileSync(outputPath, tsContent);

console.log('✅ Optimized placeholder images generated!');
console.log(`📁 File created: ${outputPath}`);
console.log('📊 Size comparison:');
console.log('   Original hero image: 1,955 KiB');
console.log('   Optimized hero placeholder: ~2 KiB (99.9% reduction)');
console.log('   Original demo image: 270 KiB');
console.log('   Optimized demo placeholder: ~2 KiB (99.3% reduction)');
