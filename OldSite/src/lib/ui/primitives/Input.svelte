<script lang="ts">
	import { colors } from '../tokens/colors.js';
	import { getTextStyle } from '../tokens/typography.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';

	interface Props {
		// Input attributes
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
		value?: string | number;
		placeholder?: string;
		name?: string;
		id?: string;
		
		// Validation
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		pattern?: string;
		minlength?: number;
		maxlength?: number;
		min?: number;
		max?: number;
		step?: number;
		
		// Appearance
		size?: 'sm' | 'md' | 'lg';
		variant?: 'default' | 'filled' | 'flushed';
		
		// State
		error?: boolean;
		success?: boolean;
		
		// Layout
		fullWidth?: boolean;
		
		// Events
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		onfocus?: (event: FocusEvent) => void;
		onblur?: (event: FocusEvent) => void;
		onkeydown?: (event: KeyboardEvent) => void;
		
		// Accessibility
		ariaLabel?: string;
		ariaDescribedby?: string;
		ariaInvalid?: boolean;
		
		// Additional content
		leftIcon?: any;
		rightIcon?: any;
		helperText?: string;
		errorMessage?: string;
	}

	let {
		type = 'text',
		value = $bindable(''),
		placeholder,
		name,
		id,
		required = false,
		disabled = false,
		readonly = false,
		pattern,
		minlength,
		maxlength,
		min,
		max,
		step,
		size = 'md',
		variant = 'default',
		error = false,
		success = false,
		fullWidth = false,
		oninput,
		onchange,
		onfocus,
		onblur,
		onkeydown,
		ariaLabel,
		ariaDescribedby,
		ariaInvalid,
		leftIcon,
		rightIcon,
		helperText,
		errorMessage
	}: Props = $props();

	// Size configurations
	const sizeConfig = {
		sm: {
			height: '2.25rem', // 36px
			padding: '0.5rem 0.75rem', // 8px 12px
			fontSize: getTextStyle('ui', 'input').fontSize,
			iconSize: '1rem' // 16px
		},
		md: {
			height: '2.5rem', // 40px
			padding: '0.625rem 1rem', // 10px 16px
			fontSize: getTextStyle('ui', 'input').fontSize,
			iconSize: '1.125rem' // 18px
		},
		lg: {
			height: '3rem', // 48px
			padding: '0.75rem 1.25rem', // 12px 20px
			fontSize: getTextStyle('ui', 'input').fontSize,
			iconSize: '1.25rem' // 20px
		}
	};

	// Get state-based styles
	const getStateStyles = () => {
		if (error) {
			return {
				border: `1px solid ${colors.error[500]}`,
				focusBorder: colors.error[500],
				focusRing: `0 0 0 3px ${colors.error[100]}`
			};
		}
		
		if (success) {
			return {
				border: `1px solid ${colors.success[500]}`,
				focusBorder: colors.success[500],
				focusRing: `0 0 0 3px ${colors.success[100]}`
			};
		}
		
		return {
			border: `1px solid ${colors.border.primary}`,
			focusBorder: colors.border.focus,
			focusRing: `0 0 0 3px ${colors.primary[100]}`
		};
	};

	// Get variant styles
	const getVariantStyles = (variant: string) => {
		switch (variant) {
			case 'filled':
				return {
					background: colors.background.secondary,
					border: 'none',
					borderRadius: '0.375rem'
				};
			case 'flushed':
				return {
					background: 'transparent',
					border: 'none',
					borderBottom: `2px solid ${colors.border.primary}`,
					borderRadius: '0'
				};
			default: // 'default'
				return {
					background: colors.background.primary,
					borderRadius: '0.375rem'
				};
		}
	};

	const config = sizeConfig[size];
	const stateStyles = getStateStyles();
	const variantStyles = getVariantStyles(variant);

	// Base input styles
	const inputStyles = `
		display: flex;
		align-items: center;
		width: ${fullWidth ? '100%' : 'auto'};
		height: ${config.height};
		padding: ${config.padding};
		font-family: ${getTextStyle('ui', 'input').fontFamily};
		font-size: ${config.fontSize};
		font-weight: ${getTextStyle('ui', 'input').fontWeight};
		line-height: ${getTextStyle('ui', 'input').lineHeight};
		color: ${disabled ? colors.text.muted : colors.text.primary};
		background: ${variantStyles.background};
		border: ${variant === 'flushed' ? variantStyles.borderBottom : stateStyles.border};
		border-radius: ${variantStyles.borderRadius};
		transition: all 0.2s ease-in-out;
		outline: none;
		${disabled ? 'cursor: not-allowed; opacity: 0.6;' : ''}
		${readonly ? 'cursor: default;' : ''}
	`;

	// Container styles for inputs with icons
	const hasIcons = leftIcon || rightIcon;
	const containerStyles = hasIcons ? `
		position: relative;
		display: inline-flex;
		align-items: center;
		width: ${fullWidth ? '100%' : 'auto'};
	` : '';

	// Icon styles
	const iconStyles = `
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: ${config.iconSize};
		height: ${config.iconSize};
		color: ${colors.text.tertiary};
		pointer-events: none;
		z-index: 1;
	`;

	const leftIconStyles = `${iconStyles} left: 0.75rem;`;
	const rightIconStyles = `${iconStyles} right: 0.75rem;`;

	// Adjust padding when icons are present
	const adjustedInputStyles = hasIcons ? `
		${inputStyles}
		padding-left: ${leftIcon ? '2.5rem' : config.padding.split(' ')[1]};
		padding-right: ${rightIcon ? '2.5rem' : config.padding.split(' ')[1]};
	` : inputStyles;

	// Helper text ID for accessibility
	const helperTextId = helperText || errorMessage ? `${id || name}-helper` : undefined;
	const computedAriaDescribedby = ariaDescribedby || helperTextId;
</script>

<div class="tribute-input-group" style="width: {fullWidth ? '100%' : 'auto'};">
	{#if hasIcons}
		<div style={containerStyles}>
			{#if leftIcon}
				<div style={leftIconStyles}>
					{@render leftIcon()}
				</div>
			{/if}
			
			<input
				{type}
				bind:value
				{placeholder}
				{name}
				{id}
				{required}
				{disabled}
				{readonly}
				{pattern}
				{minlength}
				{maxlength}
				{min}
				{max}
				{step}
				style={adjustedInputStyles}
				class="tribute-input"
				aria-label={ariaLabel}
				aria-describedby={computedAriaDescribedby}
				aria-invalid={ariaInvalid || error}
				{oninput}
				{onchange}
				{onfocus}
				{onblur}
				{onkeydown}
			/>
			
			{#if rightIcon}
				<div style={rightIconStyles}>
					{@render rightIcon()}
				</div>
			{/if}
		</div>
	{:else}
		<input
			{type}
			bind:value
			{placeholder}
			{name}
			{id}
			{required}
			{disabled}
			{readonly}
			{pattern}
			{minlength}
			{maxlength}
			{min}
			{max}
			{step}
			style={inputStyles}
			class="tribute-input"
			aria-label={ariaLabel}
			aria-describedby={computedAriaDescribedby}
			aria-invalid={ariaInvalid || error}
			{oninput}
			{onchange}
			{onfocus}
			{onblur}
			{onkeydown}
		/>
	{/if}

	{#if helperText && !error}
		<div
			id={helperTextId}
			style="
				margin-top: 0.25rem;
				font-size: {getTextStyle('ui', 'caption').fontSize};
				color: {colors.text.tertiary};
			"
		>
			{helperText}
		</div>
	{/if}

	{#if errorMessage && error}
		<div
			id={helperTextId}
			style="
				margin-top: 0.25rem;
				font-size: {getTextStyle('ui', 'caption').fontSize};
				color: {colors.error[600]};
			"
		>
			{errorMessage}
		</div>
	{/if}
</div>

<style>
	:global(.tribute-input:focus) {
		border-color: var(--focus-border-color, #3b82f6);
		box-shadow: var(--focus-ring, 0 0 0 3px rgba(59, 130, 246, 0.1));
	}

	:global(.tribute-input::placeholder) {
		color: #9ca3af;
		opacity: 1;
	}

	:global(.tribute-input:disabled::placeholder) {
		color: #d1d5db;
	}

	/* Remove default browser styles */
	:global(.tribute-input) {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}

	/* Remove number input spinners */
	:global(.tribute-input[type="number"]::-webkit-outer-spin-button),
	:global(.tribute-input[type="number"]::-webkit-inner-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}

	:global(.tribute-input[type="number"]) {
		-moz-appearance: textfield;
	}
</style>
