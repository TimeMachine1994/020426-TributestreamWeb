<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Plus, User, Calendar } from 'lucide-svelte';

	let lovedOneName = $state('');
	let isCreating = $state(false);

	async function createNewMemorial() {
		if (!lovedOneName.trim()) {
			alert('Please enter the name of your loved one');
			return;
		}

		isCreating = true;

		try {
			const response = await fetch('/api/memorials', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					lovedOneName: lovedOneName.trim(),
					type: 'memorial_service'
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Redirect to the memorial-specific calculator
				goto(`/schedule/${result.memorialId}`);
			} else {
				alert(`Failed to create memorial: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error creating memorial:', error);
			alert('Failed to create memorial. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			createNewMemorial();
		}
	}
</script>

<svelte:head>
	<title>Create New Memorial - Tributestream</title>
	<meta
		name="description"
		content="Create a new memorial service and configure your livestream package."
	/>
</svelte:head>

<!-- Header -->
<section class="bg-gradient-to-br from-black via-gray-900 to-amber-900 py-16 text-white">
	<div class="mx-auto max-w-4xl px-4 text-center">
		<div class="mb-6 flex items-center justify-center">
			<Plus class="mr-4 h-12 w-12 text-amber-400" />
			<h1
				class="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-4xl font-bold text-transparent"
			>
				Create New Memorial Service
			</h1>
		</div>
		<p class="mx-auto max-w-2xl text-xl text-gray-300">
			Start by creating a memorial service, then configure your livestream package
		</p>
	</div>
</section>

<!-- Creation Form -->
<section class="min-h-screen bg-gray-900 px-4 py-12">
	<div class="mx-auto max-w-2xl">
		<div class="rounded-lg border border-amber-500/20 bg-black/80 p-8 shadow-lg backdrop-blur-sm">
			<div class="mb-8 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20"
				>
					<User class="h-8 w-8 text-amber-400" />
				</div>
				<h2 class="mb-2 text-2xl font-bold text-white">Memorial Information</h2>
				<p class="text-gray-400">
					Let's start with the basic information for your memorial service
				</p>
			</div>

			<div class="space-y-6">
				<div>
					<label for="loved-one-name" class="mb-2 block text-sm font-medium text-gray-300">
						Name of your loved one *
					</label>
					<input
						id="loved-one-name"
						type="text"
						bind:value={lovedOneName}
						onkeypress={handleKeyPress}
						placeholder="Enter the full name"
						class="w-full rounded-lg border border-gray-600 bg-gray-800 p-4 text-white placeholder-gray-400 transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
						disabled={isCreating}
					/>
					<p class="mt-1 text-xs text-gray-500">
						This will be used throughout your memorial service configuration
					</p>
				</div>

				<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
					<h3 class="mb-2 flex items-center text-lg font-semibold text-white">
						<Calendar class="mr-2 h-5 w-5 text-amber-400" />
						What happens next?
					</h3>
					<ul class="space-y-2 text-sm text-gray-300">
						<li class="flex items-start">
							<span class="mr-2 text-amber-400">1.</span>
							We'll create your memorial service profile
						</li>
						<li class="flex items-start">
							<span class="mr-2 text-amber-400">2.</span>
							You'll configure your livestream package and pricing
						</li>
						<li class="flex items-start">
							<span class="mr-2 text-amber-400">3.</span>
							Your configuration will be automatically saved as you work
						</li>
						<li class="flex items-start">
							<span class="mr-2 text-amber-400">4.</span>
							You can save and return later, or proceed to payment
						</li>
					</ul>
				</div>

				<div class="flex space-x-4">
					<button
						onclick={createNewMemorial}
						disabled={isCreating || !lovedOneName.trim()}
						class="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-4 font-medium text-black transition-all duration-300 hover:from-amber-600 hover:to-yellow-700 hover:shadow-lg hover:shadow-amber-500/25 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400"
					>
						{#if isCreating}
							<div class="flex items-center justify-center">
								<div
									class="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"
								></div>
								Creating Memorial...
							</div>
						{:else}
							Create Memorial & Continue
						{/if}
					</button>

					<button
						onclick={() => goto('/my-portal')}
						disabled={isCreating}
						class="rounded-lg border border-amber-500 px-6 py-4 font-medium text-amber-400 transition-colors hover:bg-amber-500/10 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
</section>
