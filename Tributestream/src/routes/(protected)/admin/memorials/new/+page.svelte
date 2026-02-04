<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div>
	<h1 class="text-2xl font-bold text-gray-900">Create Memorial</h1>

	<form method="POST" use:enhance class="mt-8 max-w-2xl space-y-6">
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
				placeholder="In Loving Memory of John Doe"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			/>
		</div>

		<div>
			<label for="slug" class="block text-sm font-medium text-gray-700">URL Slug</label>
			<div class="mt-1 flex rounded-md shadow-sm">
				<span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
					tributestream.com/
				</span>
				<input
					type="text"
					id="slug"
					name="slug"
					required
					placeholder="john-doe-2026"
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
			></textarea>
		</div>

		<div>
			<label for="scheduledAt" class="block text-sm font-medium text-gray-700">Scheduled Date & Time</label>
			<input
				type="datetime-local"
				id="scheduledAt"
				name="scheduledAt"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			/>
		</div>

		<div class="flex items-center gap-2">
			<input
				type="checkbox"
				id="chatEnabled"
				name="chatEnabled"
				checked
				class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
			/>
			<label for="chatEnabled" class="text-sm font-medium text-gray-700">Enable chat</label>
		</div>

		<div class="flex gap-4">
			<button
				type="submit"
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
			>
				Create Memorial
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
