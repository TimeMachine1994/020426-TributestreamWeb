<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';

	interface Props {
		memorialId: string;
		onClose: () => void;
	}

	let { memorialId, onClose }: Props = $props();

	let qrCodeDataUrl = $state<string | null>(null);
	let token = $state<string | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(true);
	let expiresAt = $state<Date | null>(null);
	let timeRemaining = $state<number>(0);

	async function generateToken() {
		loading = true;
		error = null;

		try {
			const response = await fetch('/api/devices/create-token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to generate token');
			}

			const data = await response.json();
			token = data.token;
			expiresAt = new Date(data.expiresAt);

			// Generate QR code
			const cameraUrl = `${window.location.origin}/camera?token=${token}`;
			qrCodeDataUrl = await QRCode.toDataURL(cameraUrl, {
				width: 256,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#ffffff'
				}
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function updateTimeRemaining() {
		if (!expiresAt) return;
		const now = new Date();
		const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
		timeRemaining = diff;

		if (diff === 0) {
			// Token expired, generate a new one
			generateToken();
		}
	}

	onMount(() => {
		generateToken();

		const interval = setInterval(updateTimeRemaining, 1000);
		return () => clearInterval(interval);
	});

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
	<div class="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-white">Add Camera</h2>
			<button onclick={onClose} class="text-gray-400 hover:text-white" aria-label="Close modal">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<p class="mt-2 text-sm text-gray-400">
			Scan this QR code with a phone to add it as a camera source.
		</p>

		<div class="mt-6 flex justify-center">
			{#if loading}
				<div class="flex h-64 w-64 items-center justify-center rounded-lg bg-gray-700">
					<div class="text-center">
						<svg
							class="mx-auto h-8 w-8 animate-spin text-indigo-500"
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
						<span class="mt-2 block text-sm text-gray-400">Generating...</span>
					</div>
				</div>
			{:else if error}
				<div class="flex h-64 w-64 flex-col items-center justify-center rounded-lg bg-gray-700">
					<svg class="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<span class="mt-2 text-sm text-red-400">{error}</span>
					<button
						onclick={generateToken}
						class="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500"
					>
						Retry
					</button>
				</div>
			{:else if qrCodeDataUrl}
				<div class="rounded-lg bg-white p-2">
					<img src={qrCodeDataUrl} alt="QR Code" class="h-60 w-60" />
				</div>
			{/if}
		</div>

		{#if !loading && !error && timeRemaining > 0}
			<div class="mt-4 text-center">
				<p class="text-xs text-gray-500">
					Code expires in <span class="font-mono text-gray-400">{formatTime(timeRemaining)}</span>
				</p>
			</div>
		{/if}

		<div class="mt-4 rounded-lg bg-gray-700/50 p-3">
			<p class="text-xs text-gray-400">
				<strong class="text-gray-300">Tip:</strong> Open the camera app on your phone and point it at
				this QR code, or use a QR scanner app.
			</p>
		</div>

		<div class="mt-6 flex justify-between">
			<button
				onclick={generateToken}
				disabled={loading}
				class="rounded bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600 disabled:opacity-50"
			>
				New Code
			</button>
			<button onclick={onClose} class="rounded bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600">
				Cancel
			</button>
		</div>
	</div>
</div>
