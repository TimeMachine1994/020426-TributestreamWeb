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
		<div class="flex gap-3">
			<a
				href="/schedule/{data.memorial.id}"
				class="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-400"
			>
				Open Calculator
			</a>
			<button
				type="button"
				onclick={() => (showDeleteModal = true)}
				class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
			>
				Delete
			</button>
		</div>
	</div>

	<!-- Calculator Config Summary -->
	{#if data.memorial.calculatorConfig}
		<div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
			<h3 class="text-sm font-semibold text-amber-800">Booking Summary</h3>
			<div class="mt-2 flex items-center gap-4 text-sm text-amber-700">
				<span>Status: <strong>{data.memorial.calculatorConfig.status}</strong></span>
				<span>Total: <strong>${data.memorial.calculatorConfig.total?.toLocaleString()}</strong></span>
				<span>Paid: <strong>{data.memorial.isPaid ? 'Yes' : 'No'}</strong></span>
			</div>
		</div>
	{/if}

	<!-- Owner / Family Contact Info -->
	{#if data.owner}
		<div class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
			<h3 class="text-sm font-semibold text-gray-700">Family Contact</h3>
			<div class="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
				<span class="text-gray-600">
					<strong>{data.owner.displayName || '—'}</strong>
				</span>
				<a href="mailto:{data.owner.email}" class="text-indigo-600 hover:text-indigo-900">{data.owner.email}</a>
				{#if data.owner.phone}
					<span class="text-gray-500">{data.owner.phone}</span>
				{/if}
				<a href="/admin/users/{data.owner.id}" class="text-indigo-600 hover:text-indigo-900 text-xs">View Account</a>
			</div>
			{#if data.memorial.familyContactName || data.memorial.familyContactEmail || data.memorial.familyContactPhone}
				<div class="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
					{#if data.memorial.familyContactName}<span>Contact: {data.memorial.familyContactName}</span>{/if}
					{#if data.memorial.familyContactEmail}<span>{data.memorial.familyContactEmail}</span>{/if}
					{#if data.memorial.familyContactPhone}<span>{data.memorial.familyContactPhone}</span>{/if}
				</div>
			{/if}
		</div>
	{/if}

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
						{videographer.displayName || videographer.email}
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

		<hr class="border-gray-200" />
		<h3 class="text-lg font-semibold text-gray-900">Memorial Details</h3>

		<div>
			<label for="lovedOneName" class="block text-sm font-medium text-gray-700">Loved One's Name</label>
			<input
				type="text"
				id="lovedOneName"
				name="lovedOneName"
				value={data.memorial.lovedOneName ?? ''}
				placeholder="e.g., Jane Doe"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			/>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="directorFullName" class="block text-sm font-medium text-gray-700">Funeral Director Name</label>
				<input
					type="text"
					id="directorFullName"
					name="directorFullName"
					value={data.memorial.directorFullName ?? ''}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>
			<div>
				<label for="funeralHomeName" class="block text-sm font-medium text-gray-700">Funeral Home</label>
				<input
					type="text"
					id="funeralHomeName"
					name="funeralHomeName"
					value={data.memorial.funeralHomeName ?? ''}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>
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
