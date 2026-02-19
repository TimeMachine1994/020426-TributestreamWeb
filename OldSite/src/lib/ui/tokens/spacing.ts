/**
 * Tributestream Design System - Spacing Tokens
 * 
 * Consistent spacing scale for margins, padding, and layout.
 * Based on Tailwind's spacing scale but customizable.
 */

export const spacing = {
  // Base spacing units (rem)
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem'        // 384px
} as const;

// Semantic spacing tokens for common use cases
export const semanticSpacing = {
  // Component internal spacing
  component: {
    xs: spacing[1],      // 4px - tight spacing
    sm: spacing[2],      // 8px - small spacing
    md: spacing[4],      // 16px - medium spacing
    lg: spacing[6],      // 24px - large spacing
    xl: spacing[8]       // 32px - extra large spacing
  },

  // Layout spacing
  layout: {
    xs: spacing[4],      // 16px
    sm: spacing[6],      // 24px
    md: spacing[8],      // 32px
    lg: spacing[12],     // 48px
    xl: spacing[16],     // 64px
    xxl: spacing[24]     // 96px
  },

  // Container spacing
  container: {
    xs: spacing[4],      // 16px - mobile
    sm: spacing[6],      // 24px - small screens
    md: spacing[8],      // 32px - medium screens
    lg: spacing[12],     // 48px - large screens
    xl: spacing[16]      // 64px - extra large screens
  },

  // Form spacing
  form: {
    field: spacing[4],   // 16px - between form fields
    group: spacing[6],   // 24px - between form groups
    section: spacing[8]  // 32px - between form sections
  },

  // Card spacing
  card: {
    padding: {
      xs: spacing[3],    // 12px
      sm: spacing[4],    // 16px
      md: spacing[6],    // 24px
      lg: spacing[8]     // 32px
    },
    gap: {
      xs: spacing[2],    // 8px
      sm: spacing[3],    // 12px
      md: spacing[4],    // 16px
      lg: spacing[6]     // 24px
    }
  },

  // Button spacing
  button: {
    padding: {
      xs: `${spacing[1]} ${spacing[2]}`,      // 4px 8px
      sm: `${spacing[2]} ${spacing[3]}`,      // 8px 12px
      md: `${spacing[2.5]} ${spacing[4]}`,    // 10px 16px
      lg: `${spacing[3]} ${spacing[6]}`,      // 12px 24px
      xl: `${spacing[4]} ${spacing[8]}`       // 16px 32px
    },
    gap: spacing[2]  // 8px - gap between button elements
  },

  // Navigation spacing
  nav: {
    item: spacing[4],    // 16px - between nav items
    section: spacing[8], // 32px - between nav sections
    padding: spacing[6]  // 24px - nav container padding
  }
} as const;

// Responsive spacing utilities
export const responsiveSpacing = {
  mobile: {
    container: spacing[4],    // 16px
    section: spacing[8],      // 32px
    component: spacing[4]     // 16px
  },
  tablet: {
    container: spacing[6],    // 24px
    section: spacing[12],     // 48px
    component: spacing[6]     // 24px
  },
  desktop: {
    container: spacing[8],    // 32px
    section: spacing[16],     // 64px
    component: spacing[8]     // 32px
  }
} as const;

// Utility function to get spacing value
export const getSpacing = (key: keyof typeof spacing): string => {
  return spacing[key];
};

// Utility function to get semantic spacing
export const getSemanticSpacing = (category: string, size: string): string => {
  const categorySpacing = (semanticSpacing as any)[category];
  if (!categorySpacing) {
    console.warn(`Spacing category "${category}" not found`);
    return spacing[4]; // fallback
  }
  
  const value = categorySpacing[size];
  if (!value) {
    console.warn(`Spacing size "${size}" not found in category "${category}"`);
    return spacing[4]; // fallback
  }
  
  return value;
};

export type SpacingToken = keyof typeof spacing;
export type SemanticSpacingCategory = keyof typeof semanticSpacing;
