<script lang="ts">
	import type { Stream } from '$lib/types/stream';
	import { Video, Eye, EyeOff, Archive, StopCircle, Copy, Check, ChevronDown, Calendar, ExternalLink, MessageCircle, MessageCircleOff, Pencil, Film } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';

	let { stream, canManage, memorialId, selectable = false, isSelected = false, onToggleSelect, memorialName }: { stream: Stream; canManage: boolean; memorialId: string; selectable?: boolean; isSelected?: boolean; onToggleSelect?: (id: string) => void; memorialName?: string } = $props();

	let loading = $state(false);
	let copiedWhip = $state(false);
	let copiedRtmp = $state(false);
	let copiedStreamKey = $state(false);
	let showEditTime = $state(false);
	let editedStartTime = $state('');
	
	// Edit title state
	let showEditTitle = $state(false);
	let editedTitle = $state(stream.title);
	
	// Chat toggle state
	let chatEnabled = $state(stream.chat?.enabled ?? true);
	let togglingChat = $state(false);

	// Embed state
	let showEmbedForm = $state(false);
	let embedCode = $state(stream.embed?.code || '');
	let embedTitle = $state(stream.embed?.title || '');
	let embedPosition = $state<'above' | 'below' | 'replace'>(stream.embed?.position || 'below');
	let savingEmbed = $state(false);

	// Live stream detection
	let isStreamingLive = $state(false);
	let liveWatchUrl = $state<string | null>(null);
	let checkingLive = $state(false);
	let liveCheckInterval: NodeJS.Timeout | null = null;

	// Status badge styling
	const statusColor = $derived({
		ready: 'bg-green-100 text-green-800',
		scheduled: 'bg-blue-100 text-blue-800',
		live: 'bg-red-100 text-red-800 animate-pulse',
		ended: 'bg-yellow-100 text-yellow-800',
		completed: 'bg-gray-100 text-gray-800',
		error: 'bg-red-100 text-red-800'
	}[stream.status]);

	const visibilityIcon = $derived({
		public: Eye,
		hidden: EyeOff,
		archived: Archive
	}[stream.visibility || 'public']);

	async function handleStop() {
		if (!confirm('Are you sure you want to stop this stream?')) return;

		loading = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/stop`, {
				method: 'POST'
			});

			if (response.ok) {
				window.location.reload();
			} else {
				alert('Failed to stop stream');
			}
		} catch (error) {
			console.error('Error stopping stream:', error);
			alert('Failed to stop stream');
		} finally {
			loading = false;
		}
	}

	async function handleVisibilityToggle() {
		const currentVisibility = stream.visibility || 'public';
		const newVisibility =
			currentVisibility === 'public'
				? 'hidden'
				: currentVisibility === 'hidden'
					? 'archived'
					: 'public';

		loading = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/visibility`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ visibility: newVisibility })
			});

			if (response.ok) {
				window.location.reload();
			} else {
				alert('Failed to update visibility');
			}
		} catch (error) {
			console.error('Error updating visibility:', error);
			alert('Failed to update visibility');
		} finally {
			loading = false;
		}
	}

	async function copyToClipboard(text: string, type: 'whip' | 'rtmp' | 'streamKey') {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'whip') {
				copiedWhip = true;
				setTimeout(() => (copiedWhip = false), 2000);
			} else if (type === 'rtmp') {
				copiedRtmp = true;
				setTimeout(() => (copiedRtmp = false), 2000);
			} else if (type === 'streamKey') {
				copiedStreamKey = true;
				setTimeout(() => (copiedStreamKey = false), 2000);
			}
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	}


	function openEditTime() {
		// Format existing time for datetime-local input
		if (stream.scheduledStartTime) {
			const date = new Date(stream.scheduledStartTime);
			// Format as YYYY-MM-DDTHH:MM for datetime-local input
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			editedStartTime = `${year}-${month}-${day}T${hours}:${minutes}`;
		}
		showEditTime = true;
	}

	function openEditTitle() {
		console.log('✏️ [StreamCard] openEditTitle called for stream:', stream.id);
		console.log('✏️ [StreamCard] Current title:', stream.title);
		editedTitle = stream.title;
		showEditTitle = true;
		console.log('✏️ [StreamCard] showEditTitle set to:', showEditTitle);
	}

	async function handleUpdateTitle() {
		if (!editedTitle || !editedTitle.trim()) {
			alert('Please enter a title');
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/title`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: editedTitle.trim()
				})
			});

			if (response.ok) {
				showEditTitle = false;
				window.location.reload();
			} else {
				const data = await response.json();
				alert(`Failed to update title: ${data.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error updating title:', error);
			alert('Failed to update title');
		} finally {
			loading = false;
		}
	}

	async function handleUpdateTime() {
		if (!editedStartTime) {
			alert('Please select a date and time');
			return;
		}

		loading = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/schedule`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					scheduledStartTime: new Date(editedStartTime).toISOString()
				})
			});

			if (response.ok) {
				showEditTime = false;
				window.location.reload();
			} else {
				const data = await response.json();
				alert(`Failed to update time: ${data.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error updating time:', error);
			alert('Failed to update time');
		} finally {
			loading = false;
		}
	}

	async function checkIfLive() {
		if (checkingLive) return; // Prevent overlapping checks
		
		checkingLive = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/check-live`);
			if (response.ok) {
				const data = await response.json();
				isStreamingLive = data.isLive;
				liveWatchUrl = data.watchUrl || null;
				
				if (data.isLive) {
					console.log('🔴 [StreamCard] Stream is LIVE!', stream.id);
				} else {
					console.log('📴 [StreamCard] Stream is NOT live', stream.id);
				}
			}
		} catch (error) {
			console.error('❌ [StreamCard] Error checking if live:', error);
		} finally {
			checkingLive = false;
		}
	}

	function openStream() {
		if (liveWatchUrl) {
			window.open(liveWatchUrl, '_blank');
		}
	}

	// Check if stream is live on mount and periodically
	onMount(() => {
		// Check if stream has Mux credentials (ready for streaming)
		if (stream.mux?.liveStreamId) {
			checkIfLive(); // Initial check
			
			// Check every 15 seconds
			liveCheckInterval = setInterval(checkIfLive, 15000);
		}
	});

	onDestroy(() => {
		if (liveCheckInterval) {
			clearInterval(liveCheckInterval);
		}
	});

	// Toggle chat enabled/disabled
	async function handleChatToggle() {
		togglingChat = true;
		try {
			const newState = !chatEnabled;
			const response = await fetch(`/api/streams/${stream.id}/chat/toggle`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled: newState })
			});

			if (response.ok) {
				chatEnabled = newState;
				console.log('💬 [StreamCard] Chat toggled to:', newState);
			} else {
				const data = await response.json();
				alert(`Failed to toggle chat: ${data.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('❌ [StreamCard] Error toggling chat:', error);
			alert('Failed to toggle chat');
		} finally {
			togglingChat = false;
		}
	}

	// Embed management functions
	function openEmbedForm() {
		embedCode = stream.embed?.code || '';
		embedTitle = stream.embed?.title || '';
		embedPosition = stream.embed?.position || 'below';
		showEmbedForm = true;
	}

	async function handleSaveEmbed() {
		if (!embedCode.trim()) {
			alert('Please enter an embed code');
			return;
		}

		savingEmbed = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/embed`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code: embedCode.trim(),
					title: embedTitle.trim() || undefined,
					position: embedPosition
				})
			});

			if (response.ok) {
				showEmbedForm = false;
				console.log('📹 [StreamCard] Embed saved successfully');
				window.location.reload();
			} else {
				const data = await response.json();
				alert(`Failed to save embed: ${data.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('❌ [StreamCard] Error saving embed:', error);
			alert('Failed to save embed');
		} finally {
			savingEmbed = false;
		}
	}

	async function handleRemoveEmbed() {
		if (!confirm('Are you sure you want to remove this embed?')) return;

		savingEmbed = true;
		try {
			const response = await fetch(`/api/streams/${stream.id}/embed`, {
				method: 'DELETE'
			});

			if (response.ok) {
				console.log('🗑️ [StreamCard] Embed removed successfully');
				window.location.reload();
			} else {
				const data = await response.json();
				alert(`Failed to remove embed: ${data.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('❌ [StreamCard] Error removing embed:', error);
			alert('Failed to remove embed');
		} finally {
			savingEmbed = false;
		}
	}
</script>

<div
	class="overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl {isSelected ? 'border-blue-500 shadow-xl bg-blue-50' : 'border-gray-200 bg-white shadow-lg'}"
>
	<!-- Header -->
	<div class="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
		<div class="flex items-start justify-between">
			<div class="flex items-start gap-3 flex-1">
				{#if selectable}
					<input
						type="checkbox"
						checked={isSelected}
						onclick={(e) => {
							e.stopPropagation();
							onToggleSelect?.(stream.id);
						}}
						class="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
					/>
				{/if}
				<div class="flex-1">
					<div class="flex items-center gap-3">
						<h2 class="text-xl font-semibold text-gray-900">{stream.title}</h2>
					<span class="rounded-full px-3 py-1 text-xs font-medium {statusColor}">
						{stream.status.toUpperCase()}
					</span>
					</div>
					{#if memorialName}
						<a
							href="/admin/services/memorials/{memorialId}"
							class="mt-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
							onclick={(e) => e.stopPropagation()}
						>
							🕊️ {memorialName}
						</a>
					{/if}
				{#if stream.description}
					<p class="mt-1 text-sm text-gray-600">{stream.description}</p>
				{/if}
				{#if stream.scheduledStartTime}
					<p class="mt-2 text-xs text-gray-500">
						Scheduled: {new Date(stream.scheduledStartTime).toLocaleString()}
					</p>
				{/if}
				<p class="mt-1 text-xs text-gray-500">
					Created {new Date(stream.createdAt).toLocaleDateString()}
				</p>
				</div>
			</div>

			{#if canManage}
				<div class="flex items-center gap-2">
					<svelte:component
						this={visibilityIcon}
						class="h-5 w-5 {(stream.visibility || 'public') === 'public'
							? 'text-green-600'
							: 'text-gray-400'}"
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Body -->
	<div class="p-6">
		<div class="space-y-4">
			<!-- OBS Streaming Credentials - Mux Platform (NEW) or Cloudflare (Legacy) -->
			{#if stream.mux?.rtmpUrl && stream.mux?.streamKey}
				<!-- MUX CREDENTIALS -->
				<div class="rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-5">
					<h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-purple-900">
						<Video class="h-5 w-5" />
						OBS Streaming Setup (Mux Platform)
					</h3>
					
					<p class="mb-4 text-sm text-purple-800">
						Use these credentials in OBS Studio to stream to this memorial service:
					</p>
					
					<div class="space-y-3">
						<div>
							<label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-purple-800">RTMP Server URL</label>
							<div class="flex items-center gap-2">
								<code class="flex-1 rounded-lg bg-white px-4 py-3 text-sm text-purple-900 border border-purple-200 font-mono break-all">
									{stream.mux.rtmpUrl}
								</code>
								<button
									onclick={() => copyToClipboard(stream.mux!.rtmpUrl, 'rtmp')}
									class="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-purple-700 hover:shadow-md"
									title="Copy RTMP URL"
								>
									{#if copiedRtmp}
										<Check class="h-4 w-4" />
										<span>Copied!</span>
									{:else}
										<Copy class="h-4 w-4" />
										<span>Copy</span>
									{/if}
								</button>
							</div>
						</div>

						<div>
							<label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-purple-800">Stream Key</label>
							<div class="flex items-center gap-2">
								<code class="flex-1 rounded-lg bg-white px-4 py-3 text-sm text-purple-900 border border-purple-200 font-mono break-all">
									{stream.mux.streamKey}
								</code>
								<button
									onclick={() => copyToClipboard(stream.mux!.streamKey, 'streamKey')}
									class="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-purple-700 hover:shadow-md"
									title="Copy Stream Key"
								>
									{#if copiedStreamKey}
										<Check class="h-4 w-4" />
										<span>Copied!</span>
									{:else}
										<Copy class="h-4 w-4" />
										<span>Copy</span>
									{/if}
								</button>
							</div>
						</div>
					</div>
				</div>
			{/if}
			
			{#if stream.mux?.rtmpUrl}

					<div class="mt-4 rounded-lg bg-white border border-green-200 p-4">
						<p class="mb-2 text-sm font-semibold text-green-900">📋 Setup Instructions:</p>
						<ol class="space-y-1.5 text-sm text-green-800">
							<li class="flex gap-2">
								<span class="font-semibold">1.</span>
								<span>Open OBS Studio on your computer</span>
							</li>
							<li class="flex gap-2">
								<span class="font-semibold">2.</span>
								<span>Go to <strong>Settings → Stream</strong></span>
							</li>
							<li class="flex gap-2">
								<span class="font-semibold">3.</span>
								<span>Set Service to <strong>"Custom"</strong></span>
							</li>
							<li class="flex gap-2">
								<span class="font-semibold">4.</span>
								<span>Paste the RTMP Server URL above</span>
							</li>
							<li class="flex gap-2">
								<span class="font-semibold">5.</span>
								<span>Paste the Stream Key above</span>
							</li>
							<li class="flex gap-2">
								<span class="font-semibold">6.</span>
								<span>Click <strong>"Start Streaming"</strong> when ready</span>
							</li>
						</ol>
					</div>

					<p class="mt-4 text-xs text-green-700 italic">
						💡 These credentials are permanent and will work anytime you're ready to stream.
					</p>
			{/if}

	
			<!-- Status Info -->
			{#if stream.status === 'live'}
				<div class="rounded-lg bg-red-50 p-4">
					<p class="text-sm text-red-800">
						 <strong>Live Now</strong> - Stream is currently broadcasting
					</p>
				</div>
			{:else if stream.status === 'completed' || stream.mux?.recordingReady}
				<div class="rounded-lg bg-green-50 p-4">
					<p class="text-sm font-semibold text-green-800">
						📼 {stream.mux?.recordings?.length && stream.mux.recordings.length > 1 ? `${stream.mux.recordings.length} Recordings Available` : 'Recording Available'}
					</p>
					{#if stream.mux?.recordings?.length}
						<div class="mt-2 space-y-2">
							{#each stream.mux.recordings as recording, i}
								<div class="rounded bg-green-100 p-2 text-xs text-green-700">
									<p>
										<strong>Session {i + 1}:</strong>
										<code class="bg-green-200 px-1 rounded">{recording.vodPlaybackId}</code>
										{#if recording.duration}
											— {Math.floor(recording.duration / 60)}m {Math.floor(recording.duration % 60)}s
										{/if}
									</p>
								</div>
							{/each}
						</div>
					{:else if stream.mux?.vodPlaybackId}
						<div class="mt-2 text-xs text-green-700">
							<p><strong>VOD Playback ID:</strong> <code class="bg-green-100 px-1 rounded">{stream.mux.vodPlaybackId}</code></p>
							{#if stream.mux?.duration}
								<p class="mt-1"><strong>Duration:</strong> {Math.floor(stream.mux.duration / 60)}m {Math.floor(stream.mux.duration % 60)}s</p>
							{/if}
						</div>
					{/if}
				</div>
			{:else if stream.status === 'ended'}
				<div class="rounded-lg bg-yellow-50 p-4">
					<p class="text-sm text-yellow-800">
						 <strong>⏳ Processing Recording</strong> - Stream ended, recording is being prepared...
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Footer Actions -->
	{#if canManage}
		<div class="border-t border-gray-100 bg-gray-50 px-6 py-4">
			<div class="flex flex-wrap gap-3">
				{#if isStreamingLive && liveWatchUrl}
					<button
						onclick={openStream}
						class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					>
						<ExternalLink class="h-4 w-4" />
						Open Stream
					</button>
				{/if}

				{#if stream.status === 'live'}
					<button
						onclick={handleStop}
						disabled={loading}
						class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
					>
						<StopCircle class="h-4 w-4" />
						Stop Stream
					</button>
				{/if}

				<button
					onclick={openEditTitle}
					disabled={loading}
					class="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
				>
					<Pencil class="h-4 w-4" />
					Edit Title
				</button>

				{#if stream.scheduledStartTime}
					<button
						onclick={openEditTime}
						disabled={loading}
						class="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
					>
						<Calendar class="h-4 w-4" />
						Edit Start Time
					</button>
				{/if}
				{#if (stream.visibility || 'public') !== 'archived'}
					<button
						onclick={handleVisibilityToggle}
						disabled={loading}
						class="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
					>
						<svelte:component this={visibilityIcon} class="h-4 w-4" />
						{(stream.visibility || 'public') === 'public' ? 'Hide' : (stream.visibility || 'public') === 'hidden' ? 'Archive' : 'Show'}
					</button>
				{/if}

				<!-- Chat Toggle Button -->
				{#if stream.mux?.playbackId}
					<button
						onclick={handleChatToggle}
						disabled={togglingChat}
						class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 {chatEnabled ? 'border border-green-300 bg-green-50 text-green-700 hover:bg-green-100' : 'border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'}"
						title="{chatEnabled ? 'Disable' : 'Enable'} chat for viewers"
					>
						{#if chatEnabled}
							<MessageCircle class="h-4 w-4" />
							Chat On
						{:else}
							<MessageCircleOff class="h-4 w-4" />
							Chat Off
						{/if}
					</button>
				{/if}

				<!-- Embed Button -->
				<button
					onclick={openEmbedForm}
					disabled={savingEmbed}
					class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 {stream.embed ? 'border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100' : 'border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'}"
					title="{stream.embed ? 'Edit' : 'Add'} video embed"
				>
					<Film class="h-4 w-4" />
					{stream.embed ? 'Edit Embed' : 'Add Embed'}
				</button>
			</div>

			<!-- Active Embed Display -->
			{#if stream.embed}
				<div class="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Film class="h-4 w-4 text-purple-600" />
							<span class="text-sm font-medium text-purple-800">
								{stream.embed.title || 'Video Embed'} 
								<span class="text-purple-600">({stream.embed.position === 'above' ? '↑ Above' : stream.embed.position === 'below' ? '↓ Below' : '⟷ Replaces'} video)</span>
							</span>
						</div>
						<button
							onclick={handleRemoveEmbed}
							disabled={savingEmbed}
							class="text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
						>
							Remove
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Edit Start Time Modal -->
{#if showEditTime}
	<div class="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50" onclick={() => (showEditTime = false)}>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onclick={(e) => e.stopPropagation()}>
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Edit Start Time</h3>
			
			<div class="mb-4">
				<label for="start-time" class="mb-2 block text-sm font-medium text-gray-700">
					Scheduled Start Time
				</label>
				<input
					id="start-time"
					type="datetime-local"
					bind:value={editedStartTime}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div class="flex gap-3">
				<button
					onclick={handleUpdateTime}
					disabled={loading}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? 'Updating...' : 'Update'}
				</button>
				<button
					onclick={() => (showEditTime = false)}
					disabled={loading}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Title Modal -->
{#if showEditTitle}
	<div class="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50" onclick={() => (showEditTitle = false)}>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onclick={(e) => e.stopPropagation()}>
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Edit Stream Title</h3>
			
			<div class="mb-4">
				<label for="stream-title" class="mb-2 block text-sm font-medium text-gray-700">
					Stream Title
				</label>
				<input
					id="stream-title"
					type="text"
					bind:value={editedTitle}
					placeholder="e.g., Celebration of Life"
					maxlength="200"
					class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<p class="mt-1 text-xs text-gray-500">This title appears on the memorial page placeholder card</p>
			</div>

			<div class="flex gap-3">
				<button
					onclick={handleUpdateTitle}
					disabled={loading || !editedTitle?.trim()}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? 'Updating...' : 'Update Title'}
				</button>
				<button
					onclick={() => (showEditTitle = false)}
					disabled={loading}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Embed Modal -->
{#if showEmbedForm}
	<div class="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50" onclick={() => (showEmbedForm = false)}>
		<div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onclick={(e) => e.stopPropagation()}>
			<h3 class="mb-4 text-lg font-semibold text-gray-900">
				<Film class="inline h-5 w-5 mr-2 text-purple-600" />
				{stream.embed ? 'Edit Video Embed' : 'Add Video Embed'}
			</h3>
			
			<p class="mb-4 text-sm text-gray-600">
				Add an external video embed (YouTube, Vimeo, etc.) that will appear above or below this stream's video player.
			</p>
			
			<div class="space-y-4">
				<div>
					<label for="embed-title-input" class="mb-2 block text-sm font-medium text-gray-700">
						Title (optional)
					</label>
					<input
						id="embed-title-input"
						type="text"
						bind:value={embedTitle}
						placeholder="e.g., Funeral Service Recording"
						maxlength="200"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
					/>
				</div>

				<div>
					<label for="embed-code-input" class="mb-2 block text-sm font-medium text-gray-700">
						Embed Code *
					</label>
					<textarea
						id="embed-code-input"
						bind:value={embedCode}
						placeholder='Paste iframe embed code, e.g.:
<iframe src="https://www.youtube.com/embed/..." ...></iframe>
or
<iframe src="https://player.vimeo.com/video/..." ...></iframe>'
						rows="5"
						class="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
					></textarea>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						Position
					</label>
					<div class="flex flex-wrap gap-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="embed-position"
								value="above"
								checked={embedPosition === 'above'}
								onchange={() => embedPosition = 'above'}
								class="h-4 w-4 text-purple-600 focus:ring-purple-500"
							/>
							<span class="text-sm text-gray-700">↑ Above video</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="embed-position"
								value="below"
								checked={embedPosition === 'below'}
								onchange={() => embedPosition = 'below'}
								class="h-4 w-4 text-purple-600 focus:ring-purple-500"
							/>
							<span class="text-sm text-gray-700">↓ Below video</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="embed-position"
								value="replace"
								checked={embedPosition === 'replace'}
								onchange={() => embedPosition = 'replace'}
								class="h-4 w-4 text-purple-600 focus:ring-purple-500"
							/>
							<span class="text-sm text-gray-700">⟷ Replace stream</span>
						</label>
					</div>
					<p class="mt-1 text-xs text-gray-500">
						"Replace stream" shows the embed instead of the video player, keeping chat if enabled.
					</p>
				</div>
			</div>

			<div class="mt-6 flex gap-3">
				<button
					onclick={handleSaveEmbed}
					disabled={savingEmbed || !embedCode.trim()}
					class="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
				>
					{savingEmbed ? 'Saving...' : 'Save Embed'}
				</button>
				<button
					onclick={() => (showEmbedForm = false)}
					disabled={savingEmbed}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
