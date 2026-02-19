<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-3xl font-bold">Admin Test Page</h1>

	<div class="mb-6 rounded-lg bg-white p-6 shadow-lg">
		<h2 class="mb-4 text-xl font-semibold">User Information</h2>
		<div class="space-y-2">
			<p><strong>Email:</strong> {data.user.email}</p>
			<p><strong>UID:</strong> {data.user.uid}</p>
			<p><strong>Role:</strong> {data.user.role}</p>
			<p><strong>Admin Flag:</strong> {data.user.isAdmin}</p>
		</div>
	</div>

	<div class="rounded-lg bg-white p-6 shadow-lg">
		<h2 class="mb-4 text-xl font-semibold">Test Results</h2>

		{#if data.testResults.error}
			<div class="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
				<strong>Error:</strong>
				{data.testResults.error}
				<br />
				<strong>Type:</strong>
				{data.testResults.errorType}
			</div>
		{:else}
			<div class="space-y-3">
				<div class="flex items-center space-x-2">
					<span class="text-green-500">✅</span>
					<span
						>Firestore Connection: {data.testResults.firestoreConnection
							? 'Success'
							: 'Failed'}</span
					>
				</div>

				{#if data.testResults.memorialCount !== undefined}
					<div class="flex items-center space-x-2">
						<span class="text-green-500">✅</span>
						<span>Memorial Count: {data.testResults.memorialCount}</span>
					</div>
				{/if}

				{#if data.testResults.userCount !== undefined}
					<div class="flex items-center space-x-2">
						<span class="text-green-500">✅</span>
						<span>User Count: {data.testResults.userCount}</span>
					</div>
				{/if}

				{#if data.testResults.sampleMemorialLoaded !== undefined}
					<div class="flex items-center space-x-2">
						<span class="text-green-500">✅</span>
						<span
							>Sample Memorial Loaded: {data.testResults.sampleMemorialLoaded ? 'Yes' : 'No'}</span
						>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="mt-6">
		<a
			href="/admin"
			class="mr-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
		>
			Try Admin Dashboard
		</a>
		<a href="/profile" class="rounded bg-gray-500 px-4 py-2 font-bold text-white hover:bg-gray-700">
			Back to Profile
		</a>
	</div>
</div>
