<!--
ADMIN LAYOUT COMPONENT

Provides consistent layout for all admin pages:
- Sidebar navigation with domain grouping
- Breadcrumb navigation
- Page header with actions
- Command palette trigger (Cmd+K)

Based on ADMIN_REFACTOR_1_ARCHITECTURE.md
-->
<script lang="ts">
	import { page } from '$app/stores';
	import { adminUser, can } from '$lib/stores/adminUser';
	import { getAccessibleNav, getBreadcrumbs, type NavDomain } from '$lib/admin/navigation';
	import { goto } from '$app/navigation';
	
	let {
		title,
		subtitle,
		actions = [],
		children
	}: {
		title: string;
		subtitle?: string;
		actions?: Array<{ label: string; onclick: () => void; variant?: string; icon?: string }>;
		children?: any;
	} = $props();

	// State
	let sidebarOpen = $state(true);
	let mobileMenuOpen = $state(false);

	// Navigation filtered by permissions
	let accessibleNav = $derived(
		getAccessibleNav((resource, action) => $can(resource, action))
	);

	// Breadcrumbs for current page
	let breadcrumbs = $derived(getBreadcrumbs($page.url.pathname));

	// Recently viewed items (stored in localStorage)
	let recentlyViewed = $state<Array<{ label: string; href: string }>>([]);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function openCommandPalette() {
		// This will be handled by CommandPalette component
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
	}
</script>

<svelte:head>
	<title>{title} - Tributestream Admin</title>
</svelte:head>

<!-- Keyboard shortcuts -->
<svelte:window
	onkeydown={(e) => {
		// Cmd/Ctrl + K for command palette
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			openCommandPalette();
		}
	}}
/>

<div class="admin-layout">
	<!-- Sidebar Navigation -->
	<aside class="admin-sidebar" class:open={sidebarOpen} class:mobile-open={mobileMenuOpen}>
		<!-- Logo & Close -->
		<div class="sidebar-header">
			<div class="logo">
				<span class="logo-icon">🕊️</span>
				<span class="logo-text">Tributestream</span>
			</div>
			<button class="close-mobile" onclick={() => (mobileMenuOpen = false)}>✕</button>
		</div>

		<!-- Command Palette Trigger -->
		<button class="command-trigger" onclick={openCommandPalette}>
			<span class="icon">🔍</span>
			<span class="text">Search...</span>
			<kbd>⌘K</kbd>
		</button>

		<!-- Navigation Domains -->
		<nav class="sidebar-nav">
			{#each accessibleNav as domain}
				<div class="nav-domain">
					<div class="domain-header">
						<span class="domain-icon">{domain.icon}</span>
						<span class="domain-label">{domain.label}</span>
					</div>
					<ul class="domain-items">
						{#each domain.items as item}
							<li>
								<a
									href={item.href}
									class="nav-item"
									class:active={$page.url.pathname === item.href}
									onclick={() => (mobileMenuOpen = false)}
								>
									<span class="item-icon">{item.icon}</span>
									<span class="item-label">{item.label}</span>
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</nav>

		<!-- Recently Viewed (Bottom of sidebar) -->
		{#if recentlyViewed.length > 0}
			<div class="sidebar-footer">
				<div class="footer-section">
					<h4>Recently Viewed</h4>
					<ul class="recent-items">
						{#each recentlyViewed.slice(0, 5) as item}
							<li>
								<a href={item.href}>{item.label}</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/if}

		<!-- User Info -->
		<div class="sidebar-user">
			{#if $adminUser}
				<div class="user-info">
					<div class="user-avatar">{$adminUser.email?.charAt(0).toUpperCase()}</div>
					<div class="user-details">
						<div class="user-email">{$adminUser.email}</div>
						<div class="user-role">{$adminUser.adminRole || 'admin'}</div>
					</div>
				</div>
			{/if}
		</div>
	</aside>

	<!-- Main Content Area -->
	<main class="admin-main" class:sidebar-collapsed={!sidebarOpen}>
		<!-- Top Bar -->
		<header class="admin-topbar">
			<!-- Mobile Menu Toggle -->
			<button class="mobile-menu-toggle" onclick={() => (mobileMenuOpen = !mobileMenuOpen)}>
				☰
			</button>

			<!-- Desktop Sidebar Toggle -->
			<button class="sidebar-toggle" onclick={toggleSidebar}>
				{sidebarOpen ? '◀' : '▶'}
			</button>

			<!-- Breadcrumbs -->
			<nav class="breadcrumbs">
				{#each breadcrumbs as crumb, i}
					{#if i > 0}
						<span class="separator">/</span>
					{/if}
					<a href={crumb.href} class="crumb">{crumb.label}</a>
				{/each}
			</nav>

			<!-- Search Trigger (Mobile) -->
			<button class="search-mobile" onclick={openCommandPalette}>
				🔍
			</button>
		</header>

		<!-- Page Header -->
		<div class="page-header">
			<div class="header-content">
				<h1>{title}</h1>
				{#if subtitle}
					<p class="subtitle">{subtitle}</p>
				{/if}
			</div>
			{#if actions.length > 0}
				<div class="header-actions">
					{#each actions as action}
						<button
							class="action-btn"
							class:primary={action.variant === 'primary'}
							class:danger={action.variant === 'danger'}
							onclick={action.onclick}
						>
							{#if action.icon}
								<span class="icon">{action.icon}</span>
							{/if}
							{action.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Page Content -->
		<div class="page-content">
			{@render children()}
		</div>
	</main>
</div>

<style>
	.admin-layout {
		display: flex;
		min-height: 100vh;
		background: #f5f7fa;
	}

	/* Sidebar */
	.admin-sidebar {
		width: 260px;
		background: white;
		border-right: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 100;
		transition: transform 0.2s;
	}

	.admin-sidebar:not(.open) {
		transform: translateX(-260px);
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo-icon {
		font-size: 1.5rem;
	}

	.logo-text {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a202c;
	}

	.close-mobile {
		display: none;
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #718096;
	}

	/* Command Trigger */
	.command-trigger {
		margin: 1rem;
		padding: 0.75rem;
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
		color: #4a5568;
	}

	.command-trigger:hover {
		background: #edf2f7;
		border-color: #cbd5e0;
	}

	.command-trigger .icon {
		font-size: 1rem;
	}

	.command-trigger .text {
		flex: 1;
	}

	.command-trigger kbd {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.25rem;
		padding: 0.125rem 0.375rem;
		font-size: 0.75rem;
		color: #718096;
	}

	/* Navigation */
	.sidebar-nav {
		flex: 1;
		overflow-y: auto;
		padding: 1rem 0;
	}

	.nav-domain {
		margin-bottom: 1.5rem;
	}

	.domain-header {
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #718096;
		letter-spacing: 0.05em;
	}

	.domain-items {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1rem;
		color: #4a5568;
		text-decoration: none;
		transition: all 0.2s;
		font-size: 0.9375rem;
	}

	.nav-item:hover {
		background: #f7fafc;
		color: #2d3748;
	}

	.nav-item.active {
		background: #ebf8ff;
		color: #2c5282;
		border-right: 3px solid #3182ce;
	}

	/* Sidebar Footer */
	.sidebar-footer {
		border-top: 1px solid #e2e8f0;
		padding: 1rem;
		font-size: 0.875rem;
	}

	.sidebar-footer h4 {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #718096;
		margin: 0 0 0.5rem 0;
	}

	.recent-items {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.recent-items a {
		display: block;
		padding: 0.375rem 0.5rem;
		color: #4a5568;
		text-decoration: none;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.recent-items a:hover {
		background: #f7fafc;
	}

	/* Sidebar User */
	.sidebar-user {
		border-top: 1px solid #e2e8f0;
		padding: 1rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user-avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.user-details {
		flex: 1;
		min-width: 0;
	}

	.user-email {
		font-size: 0.8125rem;
		color: #2d3748;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-role {
		font-size: 0.6875rem;
		color: #718096;
		text-transform: capitalize;
	}

	/* Main Content */
	.admin-main {
		flex: 1;
		margin-left: 260px;
		transition: margin-left 0.2s;
		display: flex;
		flex-direction: column;
	}

	.admin-main.sidebar-collapsed {
		margin-left: 0;
	}

	/* Top Bar */
	.admin-topbar {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 1rem 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.mobile-menu-toggle {
		display: none;
	}

	.sidebar-toggle {
		background: none;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		padding: 0.375rem 0.75rem;
		cursor: pointer;
		color: #718096;
		font-size: 0.875rem;
	}

	.sidebar-toggle:hover {
		background: #f7fafc;
		color: #4a5568;
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		font-size: 0.875rem;
	}

	.breadcrumbs .crumb {
		color: #4a5568;
		text-decoration: none;
	}

	.breadcrumbs .crumb:hover {
		color: #2d3748;
		text-decoration: underline;
	}

	.breadcrumbs .separator {
		color: #cbd5e0;
	}

	.search-mobile {
		display: none;
	}

	/* Page Header */
	.page-header {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 2rem 1.5rem;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 2rem;
	}

	.header-content h1 {
		font-size: 1.875rem;
		font-weight: 700;
		color: #1a202c;
		margin: 0 0 0.5rem 0;
	}

	.subtitle {
		font-size: 0.9375rem;
		color: #718096;
		margin: 0;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.action-btn {
		padding: 0.625rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: white;
		color: #4a5568;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: #f7fafc;
		border-color: #cbd5e0;
	}

	.action-btn.primary {
		background: #3182ce;
		color: white;
		border-color: #3182ce;
	}

	.action-btn.primary:hover {
		background: #2c5282;
	}

	.action-btn.danger {
		background: #e53e3e;
		color: white;
		border-color: #e53e3e;
	}

	.action-btn.danger:hover {
		background: #c53030;
	}

	/* Page Content */
	.page-content {
		flex: 1;
		padding: 1.5rem;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.admin-sidebar {
			transform: translateX(-100%);
		}

		.admin-sidebar.mobile-open {
			transform: translateX(0);
		}

		.close-mobile {
			display: block;
		}

		.admin-main {
			margin-left: 0;
		}

		.mobile-menu-toggle {
			display: block;
			background: none;
			border: none;
			font-size: 1.5rem;
			cursor: pointer;
			color: #4a5568;
		}

		.sidebar-toggle {
			display: none;
		}

		.search-mobile {
			display: block;
			background: none;
			border: none;
			font-size: 1.25rem;
			cursor: pointer;
			color: #4a5568;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-actions {
			width: 100%;
		}

		.action-btn {
			flex: 1;
			justify-content: center;
		}
	}
</style>
