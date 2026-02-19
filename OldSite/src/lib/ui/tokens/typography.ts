/**
 * Tributestream Design System - Typography Tokens
 * 
 * Consistent typography scale for headings, body text, and UI elements.
 * Based on a modular scale for visual hierarchy.
 */

export const typography = {
  // Font families
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ],
    mono: [
      '"JetBrains Mono"',
      'Menlo',
      'Monaco',
      'Consolas',
      '"Liberation Mono"',
      '"Courier New"',
      'monospace'
    ],
    display: [
      '"Inter Display"',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'sans-serif'
    ]
  },

  // Font sizes (rem units)
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
    '8xl': '6rem',      // 96px
    '9xl': '8rem'       // 128px
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
} as const;

// Semantic typography tokens for consistent text styles
export const textStyles = {
  // Display text (large headings, hero text)
  display: {
    '2xl': {
      fontSize: typography.fontSize['7xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.none,
      letterSpacing: typography.letterSpacing.tight,
      fontFamily: typography.fontFamily.display.join(', ')
    },
    xl: {
      fontSize: typography.fontSize['6xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.none,
      letterSpacing: typography.letterSpacing.tight,
      fontFamily: typography.fontFamily.display.join(', ')
    },
    lg: {
      fontSize: typography.fontSize['5xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.tight,
      fontFamily: typography.fontFamily.display.join(', ')
    },
    md: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.display.join(', ')
    },
    sm: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.display.join(', ')
    }
  },

  // Headings
  heading: {
    h1: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },
    h2: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },
    h3: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.snug,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },
    h4: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.snug,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },
    h5: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },
    h6: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.wide,
      fontFamily: typography.fontFamily.sans.join(', ')
    }
  },

  // Body text
  body: {
    xl: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.relaxed,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },
    lg: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.relaxed,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },
    md: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },
    sm: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },
    xs: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    }
  },

  // UI elements
  ui: {
    // Button text
    button: {
      lg: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.none,
        letterSpacing: typography.letterSpacing.normal,
        fontFamily: typography.fontFamily.sans.join(', ')
      },
      md: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.none,
        letterSpacing: typography.letterSpacing.normal,
        fontFamily: typography.fontFamily.sans.join(', ')
      },
      sm: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.none,
        letterSpacing: typography.letterSpacing.wide,
        fontFamily: typography.fontFamily.sans.join(', ')
      }
    },

    // Form labels
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },

    // Input text
    input: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },

    // Caption/helper text
    caption: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.sans.join(', ')
    },

    // Code/monospace
    code: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
      fontFamily: typography.fontFamily.mono.join(', ')
    }
  }
} as const;

// Utility function to get text style CSS
export const getTextStyle = (category: string, variant: string): Record<string, string> => {
  const categoryStyles = (textStyles as any)[category];
  if (!categoryStyles) {
    console.warn(`Text style category "${category}" not found`);
    return textStyles.body.md;
  }
  
  const style = categoryStyles[variant];
  if (!style) {
    console.warn(`Text style variant "${variant}" not found in category "${category}"`);
    return textStyles.body.md;
  }
  
  return style;
};

// CSS custom properties for typography
export const typographyCSSVars = {
  '--font-sans': typography.fontFamily.sans.join(', '),
  '--font-mono': typography.fontFamily.mono.join(', '),
  '--font-display': typography.fontFamily.display.join(', '),
  
  // Font sizes
  '--text-xs': typography.fontSize.xs,
  '--text-sm': typography.fontSize.sm,
  '--text-base': typography.fontSize.base,
  '--text-lg': typography.fontSize.lg,
  '--text-xl': typography.fontSize.xl,
  '--text-2xl': typography.fontSize['2xl'],
  '--text-3xl': typography.fontSize['3xl'],
  '--text-4xl': typography.fontSize['4xl'],
  '--text-5xl': typography.fontSize['5xl'],
  
  // Font weights
  '--font-normal': typography.fontWeight.normal,
  '--font-medium': typography.fontWeight.medium,
  '--font-semibold': typography.fontWeight.semibold,
  '--font-bold': typography.fontWeight.bold,
  
  // Line heights
  '--leading-tight': typography.lineHeight.tight,
  '--leading-normal': typography.lineHeight.normal,
  '--leading-relaxed': typography.lineHeight.relaxed
} as const;

export type TextStyleCategory = keyof typeof textStyles;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
