<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let showDeleteModal = $state(false);

	const statusOptions = [
		{ value: 'draft', label: 'Draft' },
		{ value: 'scheduled', label: 'Scheduled' },
		{ value: 'live', label: 'Live' },
		{ value: 'ended', label: 'Ended' },
		{ value: 'archived', label: 'Archived' }
	];
</script>

<div>
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Edit Memorial</h1>
		<button
			type="button"
			onclick={() => (showDeleteModal = true)}
			class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
		>
			Delete
		</button>
	</div>

	<form method="POST" action="?/update" use:enhance class="mt-8 max-w-2xl space-y-6">
		{#if form?.error}
			<div class="rounded-md bg-red-50 p-4 text-sm text-red-700">
				{form.error}
			</div>
		{/if}

		<div>
			<label for="title" class="block text-sm font-medium text-gray-700">Title</label>
			<input
				type="text"
				id="title"
				name="title"
				required
				value={data.memorial.title}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			/>
		</div>

		<div>
			<label for="slug" class="block text-sm font-medium text-gray-700">URL Slug</label>
			<div class="mt-1 flex rounded-md shadow-sm">
				<span
					class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500"
				>
					tributestream.com/
				</span>
				<input
					type="text"
					id="slug"
					name="slug"
					required
					value={data.memorial.slug}
					class="block w-full rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>
		</div>

		<div>
			<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
			<textarea
				id="description"
				name="description"
				rows="3"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			>{data.memorial.description ?? ''}</textarea>
		</div>

		<div>
			<label for="status" class="block text-sm font-medium text-gray-700">Status</label>
			<select
				id="status"
				name="status"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			>
				{#each statusOptions as option}
					<option value={option.value} selected={data.memorial.status === option.value}>
						{option.label}
					</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="assignedVideographerId" class="block text-sm font-medium text-gray-700">
				Assigned Videographer
			</label>
			<select
				id="assignedVideographerId"
				name="assignedVideographerId"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			>
				<option value="">— No videographer assigned —</option>
				{#each data.videographers as videographer}
					<option
						value={videographer.id}
						selected={data.memorial.assignedVideographerId === videographer.id}
					>
						{videographer.username}
					</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="scheduledAt" class="block text-sm font-medium text-gray-700"
				>Scheduled Date & Time</label
			>
			<input
				type="datetime-local"
				id="scheduledAt"
				name="scheduledAt"
				value={data.memorial.scheduledAt ?? ''}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			/>
		</div>

		<div class="flex items-center gap-2">
			<input
				type="checkbox"
				id="chatEnabled"
				name="chatEnabled"
				checked={data.memorial.chatEnabled}
				class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
			/>
			<label for="chatEnabled" class="text-sm font-medium text-gray-700">Enable chat</label>
		</div>

		<div class="flex gap-4">
			<button
				type="submit"
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
			>
				Save Changes
			</button>
			<a
				href="/admin/memorials"
				class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
			>
				Cancel
			</a>
		</div>
	</form>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h2 class="text-lg font-semibold text-gray-900">Delete Memorial</h2>
			<p class="mt-2 text-sm text-gray-600">
				Are you sure you want to delete "{data.memorial.title}"? This action cannot be undone.
			</p>
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={() => (showDeleteModal = false)}
					class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
				>
					Cancel
				</button>
				<form method="POST" action="?/delete" use:enhance>
					<button
						type="submit"
						class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
					>
						Delete
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
