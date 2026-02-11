<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard', exact: true },
		{ href: '/admin/memorials', label: 'Memorials' },
		{ href: '/admin/users', label: 'Users' },
		{ href: '/admin/billing', label: 'Billing' },
		{ href: '/admin/audit', label: 'Audit Log' }
	];

	function isActive(href: string, exact: boolean = false): boolean {
		if (exact) {
			return page.url.pathname === href;
		}
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="flex gap-8">
		<aside class="w-64 shrink-0">
			<nav class="space-y-1">
				{#each navItems as item}
					<a
						href={item.href}
						class="block rounded-md px-3 py-2 text-sm font-medium {isActive(item.href, item.exact)
							? 'bg-indigo-100 text-indigo-700'
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>
		</aside>
		<main class="flex-1">
			{@render children()}
		</main>
	</div>
</div>
