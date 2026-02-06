<script lang="ts">
	import AddCameraModal from '$lib/components/AddCameraModal.svelte';
	import DeviceStream from '$lib/components/DeviceStream.svelte';
	import type { ConnectionState } from '$lib/webrtc/peer';

	let { data } = $props();

	let showAddCamera = $state(false);
	let localStreams = $state<Array<{ id: string; stream: MediaStream; label: string }>>([]);
	let localIdCounter = $state(0);
	let selectedSource = $state<string | null>(null);
	let programSource = $state<string | null>(null);
	let deviceStates = $state<Map<string, ConnectionState>>(new Map());

	const statusColors: Record<string, string> = {
		draft: 'bg-gray-600',
		scheduled: 'bg-blue-600',
		live: 'bg-red-600 animate-pulse',
		ended: 'bg-gray-600',
		archived: 'bg-gray-600'
	};

	function selectSource(deviceId: string) {
		selectedSource = deviceId;
	}

	function takeToProgram() {
		if (selectedSource) {
			programSource = selectedSource;
		}
	}

	function handleDeviceConnection(deviceId: string, state: ConnectionState) {
		deviceStates.set(deviceId, state);
		deviceStates = deviceStates; // trigger reactivity
	}

	function getDeviceState(deviceId: string): ConnectionState {
		return deviceStates.get(deviceId) ?? 'new';
	}

	function handleLocalStream(stream: MediaStream, label: string) {
		const id = `local-${localIdCounter++}`;
		localStreams = [...localStreams, { id, stream, label }];
	}

	function srcObject(node: HTMLVideoElement, stream: MediaStream) {
		node.srcObject = stream;
		return {
			update(newStream: MediaStream) {
				node.srcObject = newStream;
			},
			destroy() {
				node.srcObject = null;
			}
		};
	}

	let isStreamLoading = $state(false);
	let streamError = $state<string | null>(null);
	let currentStatus = $state(data.memorial.status);

	async function goLive() {
		isStreamLoading = true;
		streamError = null;

		try {
			// First ensure stream is created
			const createResponse = await fetch('/api/streams/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId: data.memorial.id })
			});

			if (!createResponse.ok) {
				const err = await createResponse.json();
				throw new Error(err.message || 'Failed to create stream');
			}

			// Then go live
			const liveResponse = await fetch('/api/streams/go-live', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId: data.memorial.id })
			});

			if (!liveResponse.ok) {
				const err = await liveResponse.json();
				throw new Error(err.message || 'Failed to go live');
			}

			currentStatus = 'live';
		} catch (e) {
			streamError = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isStreamLoading = false;
		}
	}

	async function endStream() {
		isStreamLoading = true;
		streamError = null;

		try {
			const response = await fetch('/api/streams/end', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ memorialId: data.memorial.id })
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || 'Failed to end stream');
			}

			currentStatus = 'ended';
		} catch (e) {
			streamError = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			isStreamLoading = false;
		}
	}
</script>

<div class="flex h-screen flex-col bg-gray-900 text-white">
	<!-- Header -->
	<header class="flex h-14 shrink-0 items-center justify-between border-b border-gray-700 px-4">
		<div class="flex items-center gap-4">
			<a href="/switcher" class="text-sm text-gray-400 hover:text-white">← Back</a>
			<div>
				<h1 class="text-lg font-semibold">{data.memorial.title}</h1>
				<span class="text-xs text-gray-400">/{data.memorial.slug}</span>
			</div>
		</div>
		<div class="flex items-center gap-4">
			{#if streamError}
				<span class="text-xs text-red-400">{streamError}</span>
			{/if}
			<span class="rounded px-2 py-1 text-xs font-medium {statusColors[currentStatus]}">
				{currentStatus.toUpperCase()}
			</span>
			{#if currentStatus === 'live'}
				<button
					type="button"
					onclick={endStream}
					disabled={isStreamLoading}
					class="rounded bg-gray-600 px-4 py-1.5 text-sm font-semibold hover:bg-gray-500 disabled:opacity-50"
				>
					{isStreamLoading ? 'ENDING...' : 'END STREAM'}
				</button>
			{:else if currentStatus !== 'ended'}
				<button
					type="button"
					onclick={goLive}
					disabled={isStreamLoading}
					class="rounded bg-red-600 px-4 py-1.5 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
				>
					{isStreamLoading ? 'STARTING...' : 'GO LIVE'}
				</button>
			{/if}
		</div>
	</header>

	<!-- Main Content -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Multiviewer Area -->
		<div class="flex flex-1 flex-col p-4">
			<!-- Program/Preview Monitors -->
			<div class="grid flex-1 grid-cols-2 gap-4">
				<!-- Preview Monitor -->
				<div class="flex flex-col">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs font-medium uppercase tracking-wider text-gray-400">Preview</span>
						<button
							onclick={takeToProgram}
							disabled={!selectedSource}
							class="rounded bg-indigo-600 px-3 py-1 text-xs font-medium hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							TAKE →
						</button>
					</div>
					<div
						class="relative flex-1 rounded-lg border-2 border-green-500 bg-black"
					>
						<div class="absolute inset-0 flex items-center justify-center">
							{#if selectedSource}
								<span class="text-sm text-gray-400">Preview: {selectedSource}</span>
							{:else}
								<span class="text-sm text-gray-500">Select a source</span>
							{/if}
						</div>
						<div class="absolute bottom-2 left-2 rounded bg-green-600 px-2 py-0.5 text-xs font-medium">
							PVW
						</div>
					</div>
				</div>

				<!-- Program Monitor -->
				<div class="flex flex-col">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs font-medium uppercase tracking-wider text-gray-400">Program</span>
						{#if data.memorial.status === 'live'}
							<span class="flex items-center gap-1 text-xs text-red-500">
								<span class="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
								LIVE
							</span>
						{/if}
					</div>
					<div
						class="relative flex-1 rounded-lg border-2 border-red-500 bg-black"
					>
						<div class="absolute inset-0 flex items-center justify-center">
							{#if programSource}
								<span class="text-sm text-gray-400">Program: {programSource}</span>
							{:else}
								<span class="text-sm text-gray-500">No program source</span>
							{/if}
						</div>
						<div class="absolute bottom-2 left-2 rounded bg-red-600 px-2 py-0.5 text-xs font-medium">
							PGM
						</div>
					</div>
				</div>
			</div>

			<!-- Source Thumbnails (Multiviewer) -->
			<div class="mt-4">
				<div class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Sources</div>
				<div class="grid grid-cols-4 gap-2">
					{#each data.devices as device}
						<button
							onclick={() => selectSource(device.id)}
							class="relative aspect-video overflow-hidden rounded border-2 bg-gray-800 transition {selectedSource === device.id
								? 'border-green-500'
								: programSource === device.id
									? 'border-red-500'
									: 'border-gray-600 hover:border-gray-500'}"
						>
							<DeviceStream
								deviceId={device.id}
								memorialId={data.memorial.id}
								deviceName={device.name ?? 'Camera'}
								onConnectionChange={(state) => handleDeviceConnection(device.id, state)}
							/>
							{#if device.batteryLevel !== null}
								<div class="absolute bottom-1 right-1 rounded bg-gray-900/80 px-1.5 py-0.5 text-xs">
									{device.batteryLevel}%
								</div>
							{/if}
						</button>
					{/each}

					<!-- Local Camera Sources -->
					{#each localStreams as local}
						<button
							onclick={() => selectSource(local.id)}
							class="relative aspect-video overflow-hidden rounded border-2 bg-gray-800 transition {selectedSource === local.id
								? 'border-green-500'
								: programSource === local.id
									? 'border-red-500'
									: 'border-gray-600 hover:border-gray-500'}"
						>
							<video
								autoplay
								playsinline
								muted
								class="h-full w-full object-cover"
								use:srcObject={local.stream}
							></video>
							<div class="absolute bottom-1 left-1 rounded bg-gray-900/80 px-1.5 py-0.5 text-xs">
								{local.label}
							</div>
							<div class="absolute top-1 right-1 rounded bg-indigo-600/80 px-1.5 py-0.5 text-xs">
								Local
							</div>
						</button>
					{/each}

					<!-- Add Device Slot -->
					<button
						onclick={() => (showAddCamera = true)}
						class="flex aspect-video items-center justify-center rounded border-2 border-dashed border-gray-600 bg-gray-800/50 transition hover:border-gray-500 hover:bg-gray-800"
					>
						<div class="text-center">
							<svg class="mx-auto h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							<span class="mt-1 block text-xs text-gray-500">Add Camera</span>
						</div>
					</button>
				</div>
			</div>
		</div>

		<!-- Right Sidebar -->
		<aside class="w-72 shrink-0 overflow-y-auto border-l border-gray-700 bg-gray-800">
			<!-- Devices Panel -->
			<div class="border-b border-gray-700 p-4">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">
					Connected Devices ({data.devices.length})
				</h2>
				<div class="mt-3 space-y-2">
					{#if data.devices.length === 0}
						<p class="text-sm text-gray-500">No devices connected.</p>
						<button
							onclick={() => (showAddCamera = true)}
							class="mt-2 w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500"
						>
							Add Camera
						</button>
					{:else}
						{#each data.devices as device}
							<div class="flex items-center justify-between rounded bg-gray-700 px-3 py-2">
								<div class="flex items-center gap-2">
									<span class="h-2 w-2 rounded-full {device.status === 'connected' ? 'bg-green-500' : 'bg-gray-500'}"></span>
									<span class="text-sm">{device.name ?? 'Camera'}</span>
								</div>
								{#if device.batteryLevel !== null}
									<span class="text-xs text-gray-400">{device.batteryLevel}%</span>
								{/if}
							</div>
						{/each}
						<button
							onclick={() => (showAddCamera = true)}
							class="w-full rounded border border-gray-600 px-3 py-2 text-sm hover:bg-gray-700"
						>
							+ Add Another
						</button>
					{/if}
				</div>
			</div>

			<!-- Stream Info -->
			<div class="border-b border-gray-700 p-4">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Stream Info</h2>
				<div class="mt-3 space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-400">Status</span>
						<span class="font-medium">{data.memorial.status}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-400">Chat</span>
						<span class="font-medium">{data.memorial.chatEnabled ? 'Enabled' : 'Disabled'}</span>
					</div>
					{#if data.memorial.scheduledAt}
						<div class="flex justify-between">
							<span class="text-gray-400">Scheduled</span>
							<span class="font-medium text-xs">
								{new Date(data.memorial.scheduledAt).toLocaleString()}
							</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="p-4">
				<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400">Actions</h2>
				<div class="mt-3 space-y-2">
					<a
						href="/{data.memorial.slug}"
						target="_blank"
						class="block w-full rounded bg-gray-700 px-3 py-2 text-center text-sm hover:bg-gray-600"
					>
						View Public Page
					</a>
					<a
						href="/admin/memorials/{data.memorial.id}"
						class="block w-full rounded bg-gray-700 px-3 py-2 text-center text-sm hover:bg-gray-600"
					>
						Edit Memorial
					</a>
				</div>
			</div>
		</aside>
	</div>
</div>

{#if showAddCamera}
	<AddCameraModal
		memorialId={data.memorial.id}
		onClose={() => (showAddCamera = false)}
		onLocalStream={handleLocalStream}
	/>
{/if}
