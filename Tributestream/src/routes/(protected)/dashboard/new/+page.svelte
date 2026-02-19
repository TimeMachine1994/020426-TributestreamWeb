<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="mx-auto max-w-lg px-4 py-12 sm:px-6">
	<div class="text-center">
		<h1 class="text-3xl font-bold text-gray-900">Create a Memorial</h1>
		<p class="mt-2 text-gray-600">Tell us about your loved one to get started.</p>
	</div>

	<form method="POST" use:enhance class="mt-10 space-y-6">
		{#if form?.error}
			<div class="rounded-md bg-red-50 p-4 text-sm text-red-700">
				{form.error}
			</div>
		{/if}

		<div>
			<label for="lovedOneName" class="block text-sm font-medium text-gray-700">
				Loved One's Name <span class="text-red-500">*</span>
			</label>
			<input
				type="text"
				id="lovedOneName"
				name="lovedOneName"
				required
				placeholder="e.g., Jane Doe"
				class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			/>
		</div>

		<div>
			<label for="funeralHomeName" class="block text-sm font-medium text-gray-700">
				Funeral Home <span class="text-gray-400">(optional)</span>
			</label>
			<input
				type="text"
				id="funeralHomeName"
				name="funeralHomeName"
				placeholder="e.g., Greenfield Memorial Chapel"
				class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
			/>
		</div>

		<button
			type="submit"
			class="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
		>
			Start Planning
		</button>

		<p class="text-center text-sm text-gray-500">
			You'll be taken to the service calculator next.
		</p>
	</form>
</div>
