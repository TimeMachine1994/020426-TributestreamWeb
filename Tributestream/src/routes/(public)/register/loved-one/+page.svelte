<script lang="ts">
	import { enhance } from '$app/forms';

	let { form, data } = $props();

	let loading = $state(false);
</script>

<div class="flex min-h-[80vh] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900">Create a Memorial</h1>
			<p class="mt-2 text-gray-600">
				Tell us about yourself so we can set up your memorial page.
			</p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="mt-8 space-y-5"
		>
			{#if form?.error}
				<div class="rounded-md bg-red-50 p-4 text-sm text-red-700">
					{form.error}
					{#if form.error.includes('already exists')}
						<a href="/login" class="ml-1 font-medium text-red-800 underline hover:text-red-900">Sign in</a>
					{/if}
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
					value={form?.lovedOneName ?? data.lovedOneName ?? ''}
					placeholder="e.g., Jane Doe"
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>

			<div>
				<label for="displayName" class="block text-sm font-medium text-gray-700">
					Your Name <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="displayName"
					name="displayName"
					required
					value={form?.displayName ?? ''}
					placeholder="e.g., John Smith"
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">
					Your Email <span class="text-red-500">*</span>
				</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					value={form?.email ?? ''}
					placeholder="john@example.com"
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
				<p class="mt-1 text-xs text-gray-500">We'll send your login details to this email.</p>
			</div>

			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700">
					Phone Number <span class="text-gray-400">(optional)</span>
				</label>
				<input
					type="tel"
					id="phone"
					name="phone"
					value={form?.phone ?? ''}
					placeholder="(555) 123-4567"
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
			>
				{#if loading}
					Creating your account...
				{:else}
					Get Started
				{/if}
			</button>

			<p class="text-center text-sm text-gray-500">
				No password needed — we'll create one and email it to you.
			</p>

			<p class="text-center text-sm text-gray-600">
				Already have an account? <a href="/login" class="text-indigo-600 hover:text-indigo-500">Sign in</a>
			</p>
		</form>
	</div>
</div>
