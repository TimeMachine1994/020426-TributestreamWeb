/**
 * Tributestream Design Tokens
 * Centralized design system values for consistent theming
 */

// Color Palette
export const colors = {
	// Role-based colors
	owner: {
		primary: '#f59e0b', // amber-500
		secondary: '#fbbf24', // amber-400
		accent: '#d97706', // amber-600
		gradient: 'from-yellow-500 to-amber-600',
		light: '#fef3c7', // amber-100
		dark: '#92400e' // amber-800
	},
	funeral_director: {
		primary: '#8b5cf6', // violet-500
		secondary: '#a78bfa', // violet-400
		accent: '#7c3aed', // violet-600
		gradient: 'from-purple-500 to-violet-600',
		light: '#ede9fe', // violet-100
		dark: '#5b21b6' // violet-800
	},
	admin: {
		primary: '#3b82f6', // blue-500
		secondary: '#60a5fa', // blue-400
		accent: '#2563eb', // blue-600
		gradient: 'from-blue-500 to-indigo-600',
		light: '#dbeafe', // blue-100
		dark: '#1e40af' // blue-800
	},
	viewer: {
		primary: '#10b981', // emerald-500
		secondary: '#34d399', // emerald-400
		accent: '#059669', // emerald-600
		gradient: 'from-emerald-500 to-teal-600',
		light: '#d1fae5', // emerald-100
		dark: '#047857' // emerald-800
	},
	
	// Semantic colors
	success: '#10b981', // emerald-500
	warning: '#f59e0b', // amber-500
	error: '#ef4444', // red-500
	info: '#3b82f6', // blue-500
	
	// Neutral colors
	gray: {
		50: '#f9fafb',
		100: '#f3f4f6',
		200: '#e5e7eb',
		300: '#d1d5db',
		400: '#9ca3af',
		500: '#6b7280',
		600: '#4b5563',
		700: '#374151',
		800: '#1f2937',
		900: '#111827'
	},
	
	// Background colors
	background: {
		primary: '#ffffff',
		secondary: '#f9fafb',
		tertiary: '#f3f4f6',
		dark: '#1f2937',
		overlay: 'rgba(0, 0, 0, 0.5)'
	}
} as const;

// Typography
export const typography = {
	fontFamily: {
		sans: ['Inter', 'system-ui', 'sans-serif'],
		mono: ['JetBrains Mono', 'Consolas', 'monospace']
	},
	fontSize: {
		xs: '0.75rem',
		sm: '0.875rem',
		base: '1rem',
		lg: '1.125rem',
		xl: '1.25rem',
		'2xl': '1.5rem',
		'3xl': '1.875rem',
		'4xl': '2.25rem',
		'5xl': '3rem'
	},
	fontWeight: {
		normal: '400',
		medium: '500',
		semibold: '600',
		bold: '700'
	},
	lineHeight: {
		tight: '1.25',
		normal: '1.5',
		relaxed: '1.75'
	}
} as const;

// Spacing
export const spacing = {
	px: '1px',
	0: '0',
	1: '0.25rem',
	2: '0.5rem',
	3: '0.75rem',
	4: '1rem',
	5: '1.25rem',
	6: '1.5rem',
	8: '2rem',
	10: '2.5rem',
	12: '3rem',
	16: '4rem',
	20: '5rem',
	24: '6rem',
	32: '8rem'
} as const;

// Border radius
export const borderRadius = {
	none: '0',
	sm: '0.125rem',
	md: '0.375rem',
	lg: '0.5rem',
	xl: '0.75rem',
	'2xl': '1rem',
	full: '9999px'
} as const;

// Shadows
export const shadows = {
	sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
	md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
	lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
	xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
	'2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
} as const;

// Transitions
export const transitions = {
	fast: '150ms ease-in-out',
	normal: '200ms ease-in-out',
	slow: '300ms ease-in-out'
} as const;

// Breakpoints
export const breakpoints = {
	sm: '640px',
	md: '768px',
	lg: '1024px',
	xl: '1280px',
	'2xl': '1536px'
} as const;

// Component-specific tokens
export const components = {
	button: {
		height: {
			xs: '1.75rem',
			sm: '2rem',
			md: '2.5rem',
			lg: '3rem',
			xl: '3.5rem'
		},
		padding: {
			xs: '0.25rem 0.5rem',
			sm: '0.375rem 0.75rem',
			md: '0.5rem 1rem',
			lg: '0.75rem 1.5rem',
			xl: '1rem 2rem'
		}
	},
	card: {
		padding: '1.5rem',
		borderRadius: '0.75rem',
		shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
	},
	modal: {
		backdrop: 'rgba(0, 0, 0, 0.5)',
		borderRadius: '1rem',
		padding: '2rem'
	}
} as const;

// Helper functions
export const getRoleColors = (role: keyof typeof colors) => {
	if (role in colors) {
		return colors[role as keyof typeof colors];
	}
	return colors.gray;
};

export const getSpacing = (size: keyof typeof spacing) => spacing[size];
export const getBorderRadius = (size: keyof typeof borderRadius) => borderRadius[size];
export const getShadow = (size: keyof typeof shadows) => shadows[size];

// CSS Custom Properties generator
export const generateCSSVariables = () => {
	const cssVars: Record<string, string> = {};
	
	// Colors
	Object.entries(colors).forEach(([key, value]) => {
		if (typeof value === 'object') {
			Object.entries(value).forEach(([subKey, subValue]) => {
				cssVars[`--color-${key}-${subKey}`] = subValue;
			});
		} else {
			cssVars[`--color-${key}`] = value;
		}
	});
	
	// Spacing
	Object.entries(spacing).forEach(([key, value]) => {
		cssVars[`--spacing-${key}`] = value;
	});
	
	// Typography
	Object.entries(typography.fontSize).forEach(([key, value]) => {
		cssVars[`--font-size-${key}`] = value;
	});
	
	return cssVars;
};

export default {
	colors,
	typography,
	spacing,
	borderRadius,
	shadows,
	transitions,
	breakpoints,
	components,
	getRoleColors,
	getSpacing,
	getBorderRadius,
	getShadow,
	generateCSSVariables
};
