/**
 * Minimal Modern Theme System for Tributestream
 * Ported from React design system - clean, airy design with ABeeZee font and gold accents
 */

export type ThemeKey = 'minimal';

export interface ThemeDefinition {
  label: string;
  font: {
    heading: string;
    body: string;
  };
  root: string;
  text: string;
  link: string;
  hero: {
    wrap: string;
    heading: string;
    sub: string;
    decoration: string;
  };
  card: string;
  button: {
    primary: string;
    secondary: string;
  };
  input: string;
  badge: {
    wrap: string;
    item: string;
  };
  footer: {
    border: string;
    wrap: string;
  };
}

export const MINIMAL_MODERN_THEME: Record<ThemeKey, ThemeDefinition> = {
  minimal: {
    label: 'Minimal Modern',
    font: {
      heading: '"ABeeZee", system-ui, sans-serif',
      body: '"ABeeZee", system-ui, sans-serif'
    },
    root: 'bg-gradient-to-b from-[#faf8f5] via-white to-[#faf8f5] text-slate-800',
    text: 'text-slate-800',
    link: 'text-slate-700 hover:text-slate-900 transition-colors',
    hero: {
      wrap: 'py-20 md:py-28 relative overflow-hidden',
      heading: 'text-slate-900',
      sub: 'text-slate-600',
      decoration: 'absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,_rgba(213,186,127,0.18),_transparent_40%)]'
    },
    card: 'bg-white border border-slate-200 shadow-md rounded-2xl',
    button: {
      primary: 'bg-[#D5BA7F] text-[#070707] hover:brightness-110 transition-all duration-200 rounded-xl px-4 py-2 font-medium',
      secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 transition-all duration-200 rounded-xl px-4 py-2 font-medium'
    },
    input: 'bg-white border border-slate-300 placeholder-slate-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#D5BA7F] focus:border-[#D5BA7F] transition-all duration-200',
    badge: {
      wrap: '',
      item: 'bg-slate-900 text-white rounded-xl px-3 py-2 text-sm inline-flex items-center justify-center'
    },
    footer: {
      border: 'border-slate-200',
      wrap: 'bg-white'
    }
  }
};

// Background presets for the theme
export const BACKGROUND_PRESETS = {
  goldMist: 'bg-[radial-gradient(40%_30%_at_10%_10%,rgba(213,186,127,0.25),transparent),radial-gradient(40%_30%_at_90%_20%,rgba(7,7,7,0.05),transparent)]',
  emeraldDrift: 'bg-[conic-gradient(at_70%_30%,rgba(16,185,129,0.15),transparent_40%,rgba(213,186,127,0.2),transparent_80%)]',
  amberVeil: 'bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.16),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(213,186,127,0.18),transparent_45%)]',
  charcoalFog: 'bg-neutral-50 relative after:content-[\'\'] after:absolute after:inset-0 after:opacity-[0.06] after:[background-image:radial-gradient(#000_1px,transparent_1px)] after:[background-size:8px_8px]'
};

// Helper function to get theme
export function getTheme(themeKey: ThemeKey = 'minimal'): ThemeDefinition {
  return MINIMAL_MODERN_THEME[themeKey];
}

// CSS custom properties for the theme
export function generateMinimalModernCSS(): string {
  const theme = getTheme('minimal');
  
  return `
    :root {
      --mm-color-primary: #D5BA7F;
      --mm-color-primary-dark: #070707;
      --mm-color-text: rgb(30 41 59); /* slate-800 */
      --mm-color-text-muted: rgb(100 116 139); /* slate-500 */
      --mm-color-border: rgb(226 232 240); /* slate-200 */
      --mm-color-background: #ffffff;
      --mm-color-background-soft: #faf8f5;
      --mm-font-family: "ABeeZee", system-ui, sans-serif;
      --mm-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --mm-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --mm-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --mm-radius-sm: 0.5rem;
      --mm-radius-md: 0.75rem;
      --mm-radius-lg: 1rem;
      --mm-radius-xl: 1.5rem;
    }
  `;
}

export default {
  MINIMAL_MODERN_THEME,
  BACKGROUND_PRESETS,
  getTheme,
  generateMinimalModernCSS
};
