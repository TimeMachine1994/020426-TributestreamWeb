<script lang="ts">
	import { user } from '$lib/auth';
	import { Button } from '../index.js';
	import { colors } from '../tokens/colors.js';
	import { getSemanticSpacing } from '../tokens/spacing.js';
	import { getTextStyle } from '../tokens/typography.js';

	interface Props {
		// Navigation configuration
		brand?: {
			text: string;
			href: string;
		};
		navigationItems?: Array<{
			label: string;
			href: string;
			external?: boolean;
		}>;
		
		// Styling
		variant?: 'dark' | 'light' | 'transparent';
		sticky?: boolean;
		
		// Mobile behavior
		mobileBreakpoint?: 'sm' | 'md' | 'lg';
	}

	let {
		brand = { text: 'Tributestream', href: '/' },
		navigationItems = [
			{ label: 'Create Memorial', href: '/register/loved-one' },
			{ label: 'For Families', href: '/for-families' },
			{ label: 'For Funeral Directors', href: '/for-funeral-directors' },
			{ label: 'Contact Us', href: '/contact' }
		],
		variant = 'dark',
		sticky = true,
		mobileBreakpoint = 'md'
	}: Props = $props();

	// Mobile menu state
	let mobileMenuOpen = $state(false);

	// Get variant styles
	const getVariantStyles = (variant: string) => {
		switch (variant) {
			case 'light':
				return {
					background: colors.background.primary,
					text: colors.text.primary,
					border: `1px solid ${colors.border.primary}`
				};
			case 'transparent':
				return {
					background: 'rgba(0, 0, 0, 0.8)',
					text: colors.text.inverse,
					border: 'none',
					backdropFilter: 'blur(10px)'
				};
			default: // 'dark'
				return {
					background: colors.neutral[900],
					text: colors.text.inverse,
					border: 'none'
				};
		}
	};

	const variantStyles = getVariantStyles(variant);

	// Navigation styles
	const navStyles = `
		position: ${sticky ? 'sticky' : 'relative'};
		top: 0;
		z-index: 50;
		width: 100%;
		background: ${variantStyles.background};
		border-bottom: ${variantStyles.border};
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		${variantStyles.backdropFilter ? `backdrop-filter: ${variantStyles.backdropFilter};` : ''}
	`;

	const containerStyles = `
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 80rem;
		margin: 0 auto;
		padding: ${getSemanticSpacing('nav', 'padding')} ${getSemanticSpacing('container', 'md')};
	`;

	const brandStyles = `
		display: flex;
		align-items: center;
		font-family: ${getTextStyle('heading', 'h3').fontFamily};
		font-size: ${getTextStyle('heading', 'h3').fontSize};
		font-weight: ${getTextStyle('heading', 'h3').fontWeight};
		font-style: italic;
		color: ${variantStyles.text};
		text-decoration: none;
		transition: color 0.2s ease-in-out;
	`;

	const navListStyles = `
		display: flex;
		align-items: center;
		gap: ${getSemanticSpacing('nav', 'item')};
		list-style: none;
		margin: 0;
		padding: 0;
	`;

	const navItemStyles = `
		font-family: ${getTextStyle('body', 'md').fontFamily};
		font-size: ${getTextStyle('body', 'md').fontSize};
		font-weight: ${getTextStyle('ui', 'button').md.fontWeight};
		color: ${variantStyles.text};
		text-decoration: none;
		transition: color 0.2s ease-in-out;
		padding: 0.5rem 0;
	`;

	// Mobile menu styles
	const mobileMenuStyles = `
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: ${variantStyles.background};
		border-top: ${variantStyles.border};
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		${variantStyles.backdropFilter ? `backdrop-filter: ${variantStyles.backdropFilter};` : ''}
	`;

	const mobileNavListStyles = `
		display: flex;
		flex-direction: column;
		gap: 0;
		list-style: none;
		margin: 0;
		padding: ${getSemanticSpacing('layout', 'sm')};
	`;

	const mobileNavItemStyles = `
		${navItemStyles}
		padding: ${getSemanticSpacing('component', 'md')} 0;
		border-bottom: 1px solid ${colors.border.primary};
	`;

	// Get user portal link
	const getUserPortalLink = (user: any) => {
		if (!user) return '/login';
		
		switch (user.role) {
			case 'admin':
				return '/admin';
			case 'funeral_director':
			case 'owner':
				return '/profile';
			default:
				return '/my-portal';
		}
	};

	const getUserPortalLabel = (user: any) => {
		if (!user) return 'Login';
		
		switch (user.role) {
			case 'funeral_director':
			case 'owner':
				return 'My Profile';
			default:
				return 'My Portal';
		}
	};

	// Toggle mobile menu
	const toggleMobileMenu = () => {
		mobileMenuOpen = !mobileMenuOpen;
	};

	// Close mobile menu when clicking outside
	const closeMobileMenu = () => {
		mobileMenuOpen = false;
	};
</script>

<nav style={navStyles} class="tribute-navbar">
	<div style={containerStyles}>
		<!-- Brand/Logo -->
		<a href={brand.href} style={brandStyles} class="brand-link">
			{brand.text}
		</a>

		<!-- Desktop Navigation -->
		<div class="desktop-nav" style="display: none;">
			<ul style={navListStyles}>
				{#each navigationItems as item}
					<li>
						<a
							href={item.href}
							style={navItemStyles}
							class="nav-link"
							target={item.external ? '_blank' : undefined}
							rel={item.external ? 'noopener noreferrer' : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
				<li>
					<Button
						variant="role"
						role={$user?.role || 'viewer'}
						size="md"
						rounded="full"
						href={getUserPortalLink($user)}
					>
						{getUserPortalLabel($user)}
					</Button>
				</li>
			</ul>
		</div>

		<!-- Mobile Menu Button -->
		<button
			class="mobile-menu-button"
			style="
				display: none;
				background: none;
				border: none;
				color: {variantStyles.text};
				cursor: pointer;
				padding: 0.5rem;
			"
			onclick={toggleMobileMenu}
			aria-label="Toggle navigation menu"
			aria-expanded={mobileMenuOpen}
		>
			<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{#if mobileMenuOpen}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				{/if}
			</svg>
		</button>
	</div>

	<!-- Mobile Navigation Menu -->
	{#if mobileMenuOpen}
		<div style={mobileMenuStyles} class="mobile-menu">
			<ul style={mobileNavListStyles}>
				{#each navigationItems as item}
					<li>
						<a
							href={item.href}
							style={mobileNavItemStyles}
							class="mobile-nav-link"
							onclick={closeMobileMenu}
							target={item.external ? '_blank' : undefined}
							rel={item.external ? 'noopener noreferrer' : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
				<li style="padding-top: {getSemanticSpacing('component', 'md')};">
					<Button
						variant="role"
						role={$user?.role || 'viewer'}
						size="md"
						rounded="full"
						fullWidth={true}
						href={getUserPortalLink($user)}
						onclick={closeMobileMenu}
					>
						{getUserPortalLabel($user)}
					</Button>
				</li>
			</ul>
		</div>
	{/if}
</nav>

<style>
	/* Responsive breakpoints */
	@media (min-width: 768px) {
		:global(.tribute-navbar .desktop-nav) {
			display: block !important;
		}
		
		:global(.tribute-navbar .mobile-menu-button) {
			display: none !important;
		}
	}

	@media (max-width: 767px) {
		:global(.tribute-navbar .mobile-menu-button) {
			display: block !important;
		}
	}

	/* Hover effects */
	:global(.tribute-navbar .brand-link:hover) {
		color: #d1d5db;
	}

	:global(.tribute-navbar .nav-link:hover) {
		color: #d1d5db;
	}

	:global(.tribute-navbar .mobile-nav-link:hover) {
		color: #d1d5db;
	}

	/* Focus styles */
	:global(.tribute-navbar .brand-link:focus-visible),
	:global(.tribute-navbar .nav-link:focus-visible),
	:global(.tribute-navbar .mobile-nav-link:focus-visible) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
		border-radius: 0.25rem;
	}

	:global(.tribute-navbar .mobile-menu-button:focus-visible) {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
		border-radius: 0.25rem;
	}

	/* Mobile menu animation */
	:global(.tribute-navbar .mobile-menu) {
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
