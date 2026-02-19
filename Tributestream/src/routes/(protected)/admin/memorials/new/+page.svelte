<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let title = $state('');
	let slug = $state('');
	let manualSlug = $state(false);

	function generateSlug(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim();
	}

	$effect(() => {
		if (!manualSlug && title) {
			slug = generateSlug(title);
		}
	});
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
				bind:value={title}
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
					bind:value={slug}
					oninput={() => (manualSlug = true)}
					placeholder="john-doe-2026"
					class="block w-full rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>
			<p class="mt-1 text-xs text-gray-500">Auto-generated from title. Edit to customize.</p>
		</div>

		<div>
			<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
			<textarea
				id="description"
				name="description"
				rows="3"
				placeholder="A celebration of life for..."
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			></textarea>
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
					<option value={videographer.id}>{videographer.displayName || videographer.email}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="scheduledAt" class="block text-sm font-medium text-gray-700">Scheduled Date & Time</label>
			<input
				type="datetime-local"
				id="scheduledAt"
				name="scheduledAt"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			/>
			<p class="mt-1 text-xs text-gray-500">Leave empty to save as draft.</p>
		</div>

		<div>
			<label for="lovedOneName" class="block text-sm font-medium text-gray-700">Loved One's Name</label>
			<input
				type="text"
				id="lovedOneName"
				name="lovedOneName"
				placeholder="e.g., Jane Doe"
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

		<hr class="border-gray-200" />
		<div>
			<h3 class="text-lg font-semibold text-gray-900">Customer Account</h3>
			<p class="mt-1 text-sm text-gray-500">
				Optionally create an account for the family. They'll receive login details via email.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="customerName" class="block text-sm font-medium text-gray-700">Customer Name</label>
				<input
					type="text"
					id="customerName"
					name="customerName"
					placeholder="John Smith"
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>
			<div>
				<label for="customerEmail" class="block text-sm font-medium text-gray-700">Customer Email</label>
				<input
					type="email"
					id="customerEmail"
					name="customerEmail"
					placeholder="john@example.com"
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>
		</div>

		<div class="md:w-1/2">
			<label for="customerPhone" class="block text-sm font-medium text-gray-700">Customer Phone</label>
			<input
				type="tel"
				id="customerPhone"
				name="customerPhone"
				placeholder="(555) 123-4567"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			/>
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
