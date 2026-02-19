<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		data: {
			user: {
				id: string;
				email: string;
				displayName: string | null;
				role: string;
			};
		};
	}

	let { children, data }: Props = $props();

	const roleLabels: Record<string, string> = {
		admin: 'Administrator',
		funeral_director: 'Funeral Director',
		videographer: 'Videographer',
		family_member: 'Family Member',
		contributor: 'Contributor',
		viewer: 'Viewer'
	};
</script>

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow">
		<nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between items-center">
				<a href="/dashboard" class="text-xl font-semibold text-gray-900">Tributestream</a>
				<div class="flex items-center gap-4">
					<span class="text-sm text-gray-500">
						{data.user.displayName || data.user.email} ({roleLabels[data.user.role] || data.user.role})
					</span>
					<form method="POST" action="/logout">
						<button
							type="submit"
							class="text-sm text-gray-600 hover:text-gray-900"
						>
							Sign out
						</button>
					</form>
				</div>
			</div>
		</nav>
	</header>
	<main>
		{@render children()}
	</main>
</div>
