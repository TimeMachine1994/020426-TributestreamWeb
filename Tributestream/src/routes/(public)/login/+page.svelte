<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<div class="flex min-h-[80vh] items-center justify-center px-4">
	<div class="w-full max-w-md">
		<h2 class="text-center text-2xl font-bold text-gray-900">Sign in to your account</h2>

		<form method="POST" use:enhance class="mt-8 space-y-6">
			{#if form?.error}
				<div class="rounded-md bg-red-50 p-4 text-sm text-red-700">
					{form.error}
				</div>
			{/if}

			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
			>
				Sign in
			</button>
		</form>
	</div>
</div>
