<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { user } = $props();
	let selectedRole = $state(page.url.searchParams.get('preview_role') || 'admin');

	const roles = ['admin', 'owner', 'funeral_director'];

	$effect(() => {
		const url = new URL(page.url);
		if (selectedRole && selectedRole !== 'admin') {
			url.searchParams.set('preview_role', selectedRole);
		} else {
			url.searchParams.delete('preview_role');
		}

		// Avoid navigation loops by checking if the URL is already correct
		if (url.href !== page.url.href) {
			goto(url.toString(), { keepFocus: true, noScroll: true, replaceState: true });
		}
	});
</script>

{#if user?.admin}
	<div class="fixed right-4 bottom-4 z-50 rounded-lg bg-gray-800 p-4 text-white shadow-lg">
		<h3 class="mb-2 font-bold">Admin Role Preview</h3>
		<select bind:value={selectedRole} class="rounded-md border border-gray-600 bg-gray-700 p-2">
			{#each roles as role}
				<option value={role}>
					{role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
				</option>
			{/each}
		</select>
	</div>
{/if}
