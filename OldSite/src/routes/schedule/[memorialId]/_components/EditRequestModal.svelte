<script lang="ts">
	import { X, Send, AlertCircle } from 'lucide-svelte';

	let {
		memorial,
		onClose,
		onSubmit
	}: {
		memorial: any;
		onClose: () => void;
		onSubmit: (details: string) => Promise<void>;
	} = $props();

	let requestDetails = $state('');
	let isSubmitting = $state(false);
	let error = $state('');
	let characterCount = $derived(requestDetails.length);
	const maxCharacters = 500;

	async function handleSubmit() {
		// Validation
		if (!requestDetails.trim()) {
			error = 'Please describe the changes you would like to make';
			return;
		}

		if (requestDetails.length > maxCharacters) {
			error = `Request details must be ${maxCharacters} characters or less`;
			return;
		}

		error = '';
		isSubmitting = true;

		try {
			await onSubmit(requestDetails);
			// Success - parent component will handle closing and showing success message
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to submit request. Please try again.';
			isSubmitting = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Modal Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
	onclick={onClose}
	role="dialog"
	aria-modal="true"
	aria-labelledby="modal-title"
>
	<!-- Modal Content -->
	<div
		class="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
		onclick={(e) => e.stopPropagation()}
	>
		<!-- Header -->
		<div class="mb-6 flex items-start justify-between">
			<div>
				<h2 id="modal-title" class="text-2xl font-bold text-gray-900">
					Request Schedule Changes
				</h2>
				<p class="mt-1 text-sm text-gray-600">
					Memorial: <strong>{memorial.lovedOneName}</strong>
				</p>
			</div>
			<button
				onclick={onClose}
				class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
				aria-label="Close modal"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- Info Box -->
		<div class="mb-6 rounded-lg bg-blue-50 p-4">
			<div class="flex items-start">
				<AlertCircle class="mr-3 h-5 w-5 flex-shrink-0 text-blue-500" />
				<div class="text-sm text-blue-700">
					<p class="font-medium">Important Information</p>
					<p class="mt-1">
						Your request will be reviewed by our team. We'll contact you to discuss the changes and
						any pricing adjustments if applicable.
					</p>
				</div>
			</div>
		</div>

		<!-- Form -->
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="mb-4">
				<label for="request-details" class="mb-2 block text-sm font-medium text-gray-700">
					What changes would you like to make? <span class="text-red-500">*</span>
				</label>
				<textarea
					id="request-details"
					bind:value={requestDetails}
					placeholder="Example: I need to change the service date from January 15th to January 20th. The new time would be 2:00 PM instead of 10:00 AM."
					class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
					rows="6"
					maxlength={maxCharacters}
					disabled={isSubmitting}
					required
				></textarea>
				<div class="mt-2 flex items-center justify-between text-xs">
					<span class="text-gray-500">Please be as specific as possible</span>
					<span class="font-medium {characterCount > maxCharacters ? 'text-red-500' : 'text-gray-500'}">
						{characterCount} / {maxCharacters}
					</span>
				</div>
			</div>

			<!-- Error Message -->
			{#if error}
				<div class="mb-4 rounded-lg bg-red-50 p-4">
					<div class="flex items-start">
						<AlertCircle class="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
						<p class="text-sm text-red-700">{error}</p>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex items-center justify-end space-x-3">
				<button
					type="button"
					onclick={onClose}
					disabled={isSubmitting}
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isSubmitting || !requestDetails.trim() || characterCount > maxCharacters}
					class="flex items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isSubmitting}
						<svg
							class="mr-2 h-4 w-4 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Submitting...
					{:else}
						<Send class="mr-2 h-4 w-4" />
						Submit Request
					{/if}
				</button>
			</div>
		</form>

		<!-- Contact Info -->
		<div class="mt-6 border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
			<p>Prefer to call? Contact us at <strong>(407) 221-5922</strong></p>
		</div>
	</div>
</div>
