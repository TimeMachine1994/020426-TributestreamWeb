<script lang="ts">
	import { colors } from '../tokens/colors.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';

	interface Props {
		// Appearance
		variant?: 'default' | 'outlined' | 'elevated' | 'glass';
		padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
		
		// Layout
		fullWidth?: boolean;
		
		// Interaction
		hoverable?: boolean;
		clickable?: boolean;
		onclick?: (event: MouseEvent) => void;
		
		// Styling
		rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
		shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
		
		// Accessibility
		role?: string;
		ariaLabel?: string;
	}

	let {
		variant = 'default',
		padding = 'md',
		fullWidth = false,
		hoverable = false,
		clickable = false,
		onclick,
		rounded = 'md',
		shadow = 'sm',
		role,
		ariaLabel,
		children
	}: Props = $props();

	// Padding configurations
	const paddingConfig = {
		none: '0',
		xs: getSemanticSpacing('card', 'padding').xs,
		sm: getSemanticSpacing('card', 'padding').sm,
		md: getSemanticSpacing('card', 'padding').md,
		lg: getSemanticSpacing('card', 'padding').lg
	};

	// Rounded configurations
	const roundedConfig = {
		none: '0',
		sm: '0.25rem',
		md: '0.375rem',
		lg: '0.5rem',
		xl: '0.75rem'
	};

	// Shadow configurations
	const shadowConfig = {
		none: 'none',
		sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
		md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
		lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
		xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
	};

	// Get variant styles
	const getVariantStyles = (variant: string) => {
		switch (variant) {
			case 'outlined':
				return {
					background: colors.background.primary,
					border: `1px solid ${colors.border.primary}`,
					shadow: shadowConfig.none
				};
			case 'elevated':
				return {
					background: colors.background.primary,
					border: 'none',
					shadow: shadowConfig.lg
				};
			case 'glass':
				return {
					background: colors.background.glass,
					border: `1px solid ${colors.border.primary}`,
					backdropFilter: 'blur(10px)',
					shadow: shadowConfig.md
				};
			default: // 'default'
				return {
					background: colors.background.primary,
					border: `1px solid ${colors.border.primary}`,
					shadow: shadowConfig[shadow]
				};
		}
	};

	const variantStyles = getVariantStyles(variant);

	// Base styles
	const baseStyles = `
		display: block;
		padding: ${paddingConfig[padding]};
		background: ${variantStyles.background};
		border: ${variantStyles.border};
		border-radius: ${roundedConfig[rounded]};
		box-shadow: ${variantStyles.shadow};
		width: ${fullWidth ? '100%' : 'auto'};
		transition: all 0.2s ease-in-out;
		${variantStyles.backdropFilter ? `backdrop-filter: ${variantStyles.backdropFilter};` : ''}
		${clickable ? 'cursor: pointer;' : ''}
	`;

	// Hover styles
	const hoverStyles = `
		transform: translateY(-2px);
		box-shadow: ${shadowConfig.lg};
		border-color: ${colors.border.secondary};
	`;

	// Handle click events
	const handleClick = (event: MouseEvent) => {
		if (clickable && onclick) {
			onclick(event);
		}
	};

	// Determine if card should have hover effects
	const shouldHover = hoverable || clickable;
</script>

<div
	style={baseStyles}
	class="tribute-card {shouldHover ? 'hoverable' : ''}"
	onclick={handleClick}
	{role}
	aria-label={ariaLabel}
	tabindex={clickable ? 0 : undefined}
	onkeydown={(e) => {
		if (clickable && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			handleClick(e as any);
		}
	}}
>
	{@render children?.()}
</div>

<style>
	:global(.tribute-card.hoverable:hover) {
		transform: translateY(-2px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}

	:global(.tribute-card:focus-visible) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Smooth transitions */
	:global(.tribute-card) {
		transition: all 0.2s ease-in-out;
	}
</style>
