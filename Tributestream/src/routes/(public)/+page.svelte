<script lang="ts">
	import { goto } from '$app/navigation';

	let lovedOneName = $state('');
	let searchQuery = $state('');

	function handleCreateMemorial() {
		const params = new URLSearchParams();
		if (lovedOneName.trim()) {
			params.set('name', lovedOneName.trim());
		}
		goto(`/register/loved-one?${params.toString()}`);
	}

	function handleSearch() {
		if (searchQuery.trim()) {
			goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}

	function handleCreateKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleCreateMemorial();
	}
</script>

<div class="flex min-h-[85vh] flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-4">
	<div class="mx-auto max-w-4xl text-center">
		<h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl">
			Beautiful, reliable memorial livestreams
		</h1>
		<p class="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
			Bring everyone together — at church, graveside, or from home.
		</p>

		<div class="mx-auto mt-12 grid max-w-2xl gap-8 sm:grid-cols-2">
			<!-- Create Memorial -->
			<div class="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
				<h3 class="mb-4 text-lg font-semibold text-white">Create a Memorial</h3>
				<div class="flex flex-col gap-3">
					<input
						type="text"
						placeholder="Loved one's name"
						bind:value={lovedOneName}
						onkeydown={handleCreateKeydown}
						class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
					/>
					<button
						onclick={handleCreateMemorial}
						class="w-full rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 transition hover:bg-amber-400"
					>
						Create Memorial
					</button>
				</div>
			</div>

			<!-- Search Memorials -->
			<div class="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
				<h3 class="mb-4 text-lg font-semibold text-white">Find a Memorial</h3>
				<div class="flex flex-col gap-3">
					<input
						type="text"
						placeholder="Search by name..."
						bind:value={searchQuery}
						onkeydown={handleSearchKeydown}
						class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
					/>
					<button
						onclick={handleSearch}
						class="w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
					>
						Search Memorials
					</button>
				</div>
			</div>
		</div>

		<p class="mt-8 text-sm text-slate-400">
			Already have an account? <a href="/login" class="text-amber-400 hover:text-amber-300">Sign in</a>
		</p>
	</div>
</div>
