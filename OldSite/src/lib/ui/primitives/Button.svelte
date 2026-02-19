<script lang="ts">
	import { colors, roleColors } from '../tokens/colors.js';
	import { getTextStyle } from '../tokens/typography.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';
	import type { RoleColorScheme } from '../tokens/colors.js';

	interface Props {
		// Appearance
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'role';
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		role?: RoleColorScheme;
		
		// State
		disabled?: boolean;
		loading?: boolean;
		
		// Behavior
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		target?: '_blank' | '_self' | '_parent' | '_top';
		
		// Styling
		fullWidth?: boolean;
		rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
		
		// Events
		onclick?: (event: MouseEvent) => void;
		
		// Accessibility
		ariaLabel?: string;
		ariaDescribedby?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		role,
		disabled = false,
		loading = false,
		type = 'button',
		href,
		target,
		fullWidth = false,
		rounded = 'md',
		onclick,
		ariaLabel,
		ariaDescribedby,
		children
	}: Props = $props();

	// Size configurations
	const sizeConfig = {
		xs: {
			padding: getSemanticSpacing('button', 'padding').xs,
			textStyle: getTextStyle('ui', 'button').sm,
			height: '2rem', // 32px
			iconSize: '0.875rem' // 14px
		},
		sm: {
			padding: getSemanticSpacing('button', 'padding').sm,
			textStyle: getTextStyle('ui', 'button').sm,
			height: '2.25rem', // 36px
			iconSize: '1rem' // 16px
		},
		md: {
			padding: getSemanticSpacing('button', 'padding').md,
			textStyle: getTextStyle('ui', 'button').md,
			height: '2.5rem', // 40px
			iconSize: '1.125rem' // 18px
		},
		lg: {
			padding: getSemanticSpacing('button', 'padding').lg,
			textStyle: getTextStyle('ui', 'button').lg,
			height: '3rem', // 48px
			iconSize: '1.25rem' // 20px
		},
		xl: {
			padding: getSemanticSpacing('button', 'padding').xl,
			textStyle: getTextStyle('ui', 'button').lg,
			height: '3.5rem', // 56px
			iconSize: '1.5rem' // 24px
		}
	};

	// Rounded configurations
	const roundedConfig = {
		none: '0',
		sm: '0.25rem',
		md: '0.375rem',
		lg: '0.5rem',
		full: '9999px'
	};

	// Get variant styles
	const getVariantStyles = (variant: string, role?: RoleColorScheme) => {
		if (variant === 'role' && role) {
			const roleColor = roleColors[role];
			return {
				background: roleColor.primary,
				color: colors.text.inverse,
				border: `1px solid ${roleColor.primary}`,
				hover: {
					background: roleColor.accent,
					border: `1px solid ${roleColor.accent}`,
					color: colors.text.inverse
				}
			};
		}

		switch (variant) {
			case 'primary':
				return {
					background: colors.primary[600],
					color: colors.text.inverse,
					border: `1px solid ${colors.primary[600]}`,
					hover: {
						background: colors.primary[700],
						border: `1px solid ${colors.primary[700]}`
					}
				};
			case 'secondary':
				return {
					background: colors.secondary[100],
					color: colors.secondary[900],
					border: `1px solid ${colors.secondary[200]}`,
					hover: {
						background: colors.secondary[200],
						border: `1px solid ${colors.secondary[300]}`
					}
				};
			case 'outline':
				return {
					background: 'transparent',
					color: colors.primary[600],
					border: `1px solid ${colors.primary[600]}`,
					hover: {
						background: colors.primary[50],
						border: `1px solid ${colors.primary[700]}`
					}
				};
			case 'ghost':
				return {
					background: 'transparent',
					color: colors.secondary[700],
					border: '1px solid transparent',
					hover: {
						background: colors.secondary[100],
						border: '1px solid transparent'
					}
				};
			case 'danger':
				return {
					background: colors.error[600],
					color: colors.text.inverse,
					border: `1px solid ${colors.error[600]}`,
					hover: {
						background: colors.error[700],
						border: `1px solid ${colors.error[700]}`
					}
				};
			default:
				return {
					background: colors.primary[600],
					color: colors.text.inverse,
					border: `1px solid ${colors.primary[600]}`,
					hover: {
						background: colors.primary[700],
						border: `1px solid ${colors.primary[700]}`
					}
				};
		}
	};

	const variantStyles = getVariantStyles(variant, role);
	const config = sizeConfig[size];

	// Base styles
	const baseStyles = `
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: ${getSemanticSpacing('button', 'gap')};
		padding: ${config.padding};
		height: ${config.height};
		font-family: ${config.textStyle.fontFamily};
		font-size: ${config.textStyle.fontSize};
		font-weight: ${config.textStyle.fontWeight};
		line-height: ${config.textStyle.lineHeight};
		letter-spacing: ${config.textStyle.letterSpacing};
		border-radius: ${roundedConfig[rounded]};
		border: ${variantStyles.border};
		background: ${variantStyles.background};
		color: ${variantStyles.color};
		cursor: ${disabled || loading ? 'not-allowed' : 'pointer'};
		opacity: ${disabled || loading ? '0.6' : '1'};
		transition: all 0.2s ease-in-out;
		text-decoration: none;
		user-select: none;
		white-space: nowrap;
		width: ${fullWidth ? '100%' : 'auto'};
		--hover-bg: ${variantStyles.hover.background};
		--hover-border: ${variantStyles.hover.border};
		--hover-color: ${variantStyles.hover.color || variantStyles.color};
	`;

	const hoverStyles = `
		background: ${variantStyles.hover.background};
		border: ${variantStyles.hover.border};
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	`;

	const activeStyles = `
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	`;

	const focusStyles = `
		outline: 2px solid ${colors.primary[500]};
		outline-offset: 2px;
	`;

	// Handle click events
	const handleClick = (event: MouseEvent) => {
		if (disabled || loading) {
			event.preventDefault();
			return;
		}
		onclick?.(event);
	};

	// Component element (button vs anchor)
	const isLink = !!href;
	const element = isLink ? 'a' : 'button';
</script>

{#if isLink}
	<a
		{href}
		{target}
		style={baseStyles}
		class="tribute-button"
		onclick={handleClick}
		aria-label={ariaLabel}
		aria-describedby={ariaDescribedby}
		tabindex={disabled ? -1 : 0}
	>
		{#if loading}
			<svg
				class="animate-spin"
				style="width: {config.iconSize}; height: {config.iconSize};"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		{/if}
		{@render children?.()}
	</a>
{:else}
	<button
		{type}
		style={baseStyles}
		class="tribute-button"
		{disabled}
		onclick={handleClick}
		aria-label={ariaLabel}
		aria-describedby={ariaDescribedby}
	>
		{#if loading}
			<svg
				class="animate-spin"
				style="width: {config.iconSize}; height: {config.iconSize};"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		{/if}
		{@render children?.()}
	</button>
{/if}

<style>
	:global(.tribute-button:hover:not(:disabled)) {
		background: var(--hover-bg) !important;
		border: var(--hover-border) !important;
		color: var(--hover-color, inherit) !important;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	:global(.tribute-button:active:not(:disabled)) {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:global(.tribute-button:focus-visible) {
		outline: 2px solid var(--focus-color, #3b82f6);
		outline-offset: 2px;
	}

	/* Animation for spinner */
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}
</style>
