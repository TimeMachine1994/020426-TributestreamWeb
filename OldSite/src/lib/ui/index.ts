/**
 * Tributestream UI Component Library
 * 
 * Centralized exports for all UI components and design tokens.
 */

// Design Tokens
export { colors, roleColors, getColorValue } from './tokens/colors.js';
export { spacing, semanticSpacing, getSpacing, getSemanticSpacing } from './tokens/spacing.js';
export { typography, textStyles, getTextStyle, typographyCSSVars } from './tokens/typography.js';

// Primitive Components
export { default as Button } from './primitives/Button.svelte';
export { default as Card } from './primitives/Card.svelte';
export { default as Input } from './primitives/Input.svelte';

// Navigation Components
export { default as Navbar } from './navigation/Navbar.svelte';

// Stream Components - REMOVED FOR REBUILD
// TODO: Re-export new stream components here after rebuilding

// Re-export existing components that fit the new system
export { default as LoadingSpinner } from '../components/LoadingSpinner.svelte';

// Type exports
export type { ColorToken, RoleColorScheme } from './tokens/colors.js';
export type { SpacingToken, SemanticSpacingCategory } from './tokens/spacing.js';
export type { TextStyleCategory, FontSize, FontWeight } from './tokens/typography.js';
