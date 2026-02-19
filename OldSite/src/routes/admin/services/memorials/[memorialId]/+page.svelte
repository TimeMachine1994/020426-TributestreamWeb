<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import StreamCard from '$lib/components/streaming/StreamCard.svelte';
	import CustomPricingEditor from '$lib/components/admin/CustomPricingEditor.svelte';
	import AdminScheduleEditor from '$lib/components/admin/AdminScheduleEditor.svelte';
	import AdminChatPanel from '$lib/components/admin/AdminChatPanel.svelte';
	import MemorialBlockEditor from '$lib/components/admin/memorial-editor/MemorialBlockEditor.svelte';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	
	let { data } = $props();
	const { memorial, slideshows, followerCount } = data;
	
	// Mutable streams for block editor updates
	let streams = $state(data.streams);

	function formatDate(isoString: string | null) {
		if (!isoString) return 'N/A';
		return new Date(isoString).toLocaleString();
	}

	function formatRelativeTime(isoString: string | null) {
		if (!isoString) return '';
		const date = new Date(isoString);
		const diffMs = Date.now() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		
		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
	}

	const publicUrl = memorial.fullSlug ? `https://tributestream.com/${memorial.fullSlug}` : '';

	// Display settings state
	let isEditingDisplay = $state(false);
	let isSavingDisplay = $state(false);
	let displayError = $state<string | null>(null);
	let displaySuccess = $state<string | null>(null);
	let customTitleInput = $state(memorial.customTitle || '');

	// Handle custom pricing updates
	async function handlePricingUpdate() {
		console.log('💰 [PRICING] Custom pricing updated, reloading page data...');
		await invalidateAll();
	}

	async function handleDelete() {
		const confirmMessage = `Are you sure you want to delete "${memorial.lovedOneName}"?\n\nThis will mark it as deleted and hide it from the admin list.`;
		
		if (!confirm(confirmMessage)) {
			return;
		}

		try {
			console.log('🗑️ [DELETE] Attempting to delete memorial:', memorial.id);
			
			const response = await fetch('/api/admin/bulk-actions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					action: 'delete', 
					ids: [memorial.id], 
					resourceType: 'memorial' 
				})
			});

			const result = await response.json();
			console.log('🗑️ [DELETE] Response:', result);

			if (response.ok) {
				if (result.success && result.success.length > 0) {
					alert('Memorial deleted successfully');
					goto('/admin/services/memorials');
				} else if (result.failed && result.failed.length > 0) {
					const errorMsg = result.failed[0]?.error || 'Unknown error';
					console.error('❌ [DELETE] Failed:', errorMsg);
					alert(`Failed to delete memorial: ${errorMsg}`);
				} else {
					alert('Failed to delete memorial. Please try again.');
				}
			} else {
				const errorMsg = result.error || 'Unknown error';
				console.error('❌ [DELETE] Server error:', errorMsg);
				alert(`Failed to delete memorial: ${errorMsg}`);
			}
		} catch (error) {
			console.error('❌ [DELETE] Exception:', error);
			alert('An error occurred while deleting the memorial. Check the console for details.');
		}
	}


	// Display settings handlers
	async function handleSaveDisplaySettings() {
		isSavingDisplay = true;
		displayError = null;
		displaySuccess = null;

		try {
			const response = await fetch(`/api/admin/memorials/${memorial.id}/display-settings`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customTitle: customTitleInput.trim()
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to save display settings');
			}

			displaySuccess = 'Display settings saved successfully!';
			isEditingDisplay = false;
			await invalidateAll();

			setTimeout(() => {
				displaySuccess = null;
			}, 3000);
		} catch (err: any) {
			displayError = err.message || 'Failed to save display settings';
		} finally {
			isSavingDisplay = false;
		}
	}

	// Force refresh state
	let isForceRefreshing = $state(false);
	let forceRefreshSuccess = $state(false);

	async function handleForceRefresh() {
		if (!confirm('This will force-reload the memorial page for ALL viewers. Continue?')) return;

		isForceRefreshing = true;
		forceRefreshSuccess = false;

		try {
			const response = await fetch(`/api/memorials/${memorial.id}/force-refresh`, {
				method: 'POST'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to trigger force refresh');
			}

			forceRefreshSuccess = true;
			setTimeout(() => { forceRefreshSuccess = false; }, 3000);
			console.log('✅ [FORCE REFRESH] Triggered successfully');
		} catch (err: any) {
			console.error('❌ [FORCE REFRESH] Error:', err);
			alert(`Force refresh failed: ${err.message}`);
		} finally {
			isForceRefreshing = false;
		}
	}

	function cancelDisplayEdit() {
		isEditingDisplay = false;
		customTitleInput = memorial.customTitle || '';
		displayError = null;
	}

	async function clearDisplaySettings() {
		if (!confirm('Clear custom title? This will revert to defaults.')) {
			return;
		}

		isSavingDisplay = true;
		displayError = null;

		try {
			const response = await fetch(`/api/admin/memorials/${memorial.id}/display-settings`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to clear display settings');
			}

			customTitleInput = '';
			displaySuccess = 'Display settings cleared!';
			isEditingDisplay = false;
			await invalidateAll();

			setTimeout(() => {
				displaySuccess = null;
			}, 3000);
		} catch (err: any) {
			displayError = err.message || 'Failed to clear display settings';
		} finally {
			isSavingDisplay = false;
		}
	}
	
</script>

<AdminLayout title="Memorial Details" subtitle="View and manage all aspects of this memorial">
	<div class="header-actions">
		<button onclick={() => goto('/admin/services/memorials')}>← Back</button>
		<div style="display: flex; gap: 0.5rem; align-items: center;">
			<button 
				class="refresh-btn" 
				onclick={handleForceRefresh}
				disabled={isForceRefreshing}
			>
				{isForceRefreshing ? '⏳ Refreshing...' : forceRefreshSuccess ? '✅ Sent!' : '🔄 Force Refresh Viewers'}
			</button>
			<button class="danger-btn" onclick={handleDelete}>🗑️ Delete</button>
		</div>
	</div>

	<div class="card">
		<h1>💝 {memorial.lovedOneName}</h1>
		<p>{publicUrl}</p>
		<p>
			Created by 
			{#if memorial.ownerUid}
				<button 
					class="owner-link" 
					onclick={() => goto(`/admin/users/memorial-owners/${memorial.ownerUid}`)}
				>
					{memorial.creatorEmail}
				</button>
			{:else}
				{memorial.creatorEmail}
			{/if}
			 • {formatDate(memorial.createdAt)}
		</p>
		<div class="badges">
			<span class:complete={memorial.isComplete}>{memorial.isComplete ? '✅ Complete' : '⚠️ Incomplete'}</span>
			<span class:paid={memorial.isPaid}>{memorial.isPaid ? '✅ Paid' : `❌ Unpaid ($${memorial.totalPrice})`}</span>
			<span>{memorial.isPublic ? '👁️ Public' : '🔒 Private'}</span>
		</div>
	</div>

	<div class="card">
		<h2>📋 Basic Information</h2>
		<div class="grid">
			<div><strong>ID:</strong> {memorial.id}</div>
			<div><strong>Loved One:</strong> {memorial.lovedOneName}</div>
			<div><strong>Slug:</strong> {memorial.fullSlug}</div>
			<div><strong>Created:</strong> {formatDate(memorial.createdAt)}</div>
			<div><strong>Updated:</strong> {formatDate(memorial.updatedAt)} ({formatRelativeTime(memorial.updatedAt)})</div>
		</div>
	</div>

	<!-- Display Settings Editor -->
	<div class="card">
		<div class="section-header">
			<h2>🎨 Display Settings</h2>
			{#if !isEditingDisplay}
				<button class="edit-btn-small" onclick={() => isEditingDisplay = true}>
					✏️ Edit
				</button>
			{/if}
		</div>

		{#if displaySuccess}
			<div class="success-message">{displaySuccess}</div>
		{/if}

		{#if displayError}
			<div class="error-message">{displayError}</div>
		{/if}

		{#if isEditingDisplay}
			<div class="display-form">
				<div class="form-group">
					<label for="custom-title">Custom Title Override</label>
					<input
						id="custom-title"
						type="text"
						bind:value={customTitleInput}
						placeholder="Override the default title (e.g., 'Celebrating the Life of John Smith')"
						disabled={isSavingDisplay}
						maxlength="200"
					/>
					<p class="help-text">Leave blank to use "{memorial.lovedOneName}" as the title</p>
				</div>

				<div class="form-actions">
					<button 
						class="primary-btn" 
						onclick={handleSaveDisplaySettings}
						disabled={isSavingDisplay}
					>
						{isSavingDisplay ? '⏳ Saving...' : '💾 Save Display Settings'}
					</button>
					<button 
						onclick={cancelDisplayEdit}
						disabled={isSavingDisplay}
					>
						Cancel
					</button>
					{#if memorial.customTitle}
						<button 
							class="danger-btn-small"
							onclick={clearDisplaySettings}
							disabled={isSavingDisplay}
						>
							🗑️ Clear All
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<div class="display-preview">
				<div class="preview-row">
					<strong>Custom Title:</strong>
					{#if memorial.customTitle}
						<span class="custom-value">{memorial.customTitle}</span>
					{:else}
						<span class="default-value">Using default: "{memorial.lovedOneName}"</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Custom Pricing Editor -->
	<CustomPricingEditor memorial={memorial} onUpdate={handlePricingUpdate} />

	<!-- WYSIWYG Block Editor for Memorial Content -->
	<div class="card">
		<div class="section-header">
			<h2>📦 Memorial Content</h2>
			<p class="section-subtitle">Drag blocks to reorder how content appears on the public memorial page.</p>
		</div>
		<MemorialBlockEditor
			memorialId={memorial.id}
			initialBlocks={memorial.contentBlocks || []}
			{streams}
			onSave={() => invalidateAll()}
		/>
	</div>

	<!-- Livestream Info (read-only reference — use block editor above to manage content) -->
	{#if streams.length > 0}
		<div class="card">
			<div class="section-header">
				<h2>� Livestreams ({streams.length})</h2>
				<button 
					class="switcher-btn" 
					onclick={() => goto(`/admin/services/memorials/${memorial.id}/switcher`)}
				>
					🎬 Open Video Switcher
				</button>
			</div>
			<div class="streams-grid">
				{#each streams as stream}
					<div class="stream-item">
						<StreamCard {stream} canManage={true} memorialId={memorial.id} />
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Chat Moderation Section -->
	{#if streams.length > 0}
		<div class="card">
			<div class="section-header">
				<h2>💬 Chat Moderation</h2>
			</div>
			<div class="chat-panels">
				{#each streams as stream}
					<div class="chat-panel-wrapper">
						<h3 class="stream-chat-title">{stream.title}</h3>
						<AdminChatPanel 
							streamId={stream.id} 
							chatEnabled={stream.chat?.enabled ?? true}
							chatLocked={stream.chat?.locked ?? false}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="card">
		<div class="section-header">
			<h2>🖼️ Slideshows ({slideshows.length})</h2>
		</div>
		
		{#if slideshows.length === 0}
			<p class="empty-message">No slideshows yet. Create one to commemorate {memorial.lovedOneName}.</p>
		{/if}
		
		<div class="slideshows-list">
			{#each slideshows as slideshow}
				<a 
					href="/slideshow-generator?memorialId={memorial.id}&slideshowId={slideshow.id}" 
					class="slideshow-item"
					title="Click to edit slideshow"
				>
					<div class="slideshow-info">
						<h3>{slideshow.title}</h3>
						<p>{slideshow.photos?.length || 0} photos • Status: {slideshow.status}</p>
						{#if slideshow.musicTrackTitle}
							<p class="music-info">🎵 {slideshow.musicTrackTitle}</p>
						{/if}
					</div>
					<div class="slideshow-actions">
						<span class="edit-icon">✏️ Edit</span>
					</div>
				</a>
			{/each}
		</div>
	</div>

	<!-- Schedule & Billing Editor -->
	<AdminScheduleEditor memorial={memorial} onUpdate={handlePricingUpdate} />

	<div class="card">
		<h2>📊 Analytics</h2>
		<div class="stats">
			<div><strong>{streams.length}</strong> Streams</div>
			<div><strong>{slideshows.length}</strong> Slideshows</div>
			<div><strong>{followerCount}</strong> Followers</div>
		</div>
	</div>
</AdminLayout>


<style>
	.header-actions { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
	.card { background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; }
	h1 { font-size: 2rem; margin: 0 0 0.5rem 0; }
	h2 { font-size: 1.25rem; margin: 0 0 1rem 0; }
	h3 { font-size: 1.125rem; margin: 0 0 0.5rem 0; }
	.badges { display: flex; gap: 0.5rem; margin-top: 1rem; }
	.badges span { padding: 0.375rem 0.75rem; border-radius: 0.25rem; background: #e2e8f0; font-size: 0.8125rem; }
	.badges .complete { background: #c6f6d5; color: #22543d; }
	.badges .paid { background: #c6f6d5; color: #22543d; }
	.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
	.item { border: 1px solid #e2e8f0; padding: 1rem; border-radius: 0.375rem; margin-bottom: 0.75rem; }
	.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center; }
	
	/* Buttons */
	button { padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 0.375rem; background: white; cursor: pointer; transition: all 0.2s; }
	button:hover { background: #f7fafc; }
	button:disabled { opacity: 0.5; cursor: not-allowed; }
	button.danger-btn { background: #e53e3e; color: white; border-color: #e53e3e; }
	button.danger-btn:hover { background: #c53030; }
	button.primary-btn { background: #3182ce; color: white; border-color: #3182ce; font-weight: 600; }
	button.primary-btn:hover { background: #2c5282; }
	button.switcher-btn { background: #805ad5; color: white; border-color: #805ad5; font-weight: 600; }
	button.switcher-btn:hover { background: #6b46c1; }
	button.refresh-btn { background: #38a169; color: white; border-color: #38a169; font-weight: 600; }
	button.refresh-btn:hover { background: #2f855a; }
	button.danger-btn-small { background: #e53e3e; color: white; border-color: #e53e3e; padding: 0.375rem 0.75rem; font-size: 0.875rem; }
	button.danger-btn-small:hover { background: #c53030; }

	/* Section header */
	.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
	.section-header h2 { margin: 0; }
	.section-subtitle { margin: 0; font-size: 0.875rem; color: #718096; width: 100%; }

	.form-group { margin-bottom: 1rem; }
	.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #4a5568; font-size: 0.875rem; }
	.form-group input { width: 100%; padding: 0.625rem; border: 1px solid #cbd5e0; border-radius: 0.375rem; font-size: 0.875rem; }
	.form-group input:focus { outline: none; border-color: #3182ce; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1); }
	.form-group input:disabled { background: #edf2f7; cursor: not-allowed; }
	.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
	.form-actions button { flex: 0 0 auto; }

	.empty-message { color: #718096; font-style: italic; padding: 1rem 0; }
	
	.streams-grid { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem; }
	
	.stream-item { 
		border: 1px solid #e2e8f0; 
		border-radius: 0.5rem; 
		padding: 1rem; 
		background: white; 
	}
	
	/* Chat panels */
	.chat-panels {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.chat-panel-wrapper {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1rem;
		background: #f7fafc;
	}
	
	.stream-chat-title {
		margin: 0 0 0.75rem 0;
		font-size: 1rem;
		color: #4a5568;
	}
	
	/* Slideshows list */
	.slideshows-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
	}
	
	.slideshow-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 0.5rem;
		background: white;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
		cursor: pointer;
	}
	
	.slideshow-item:hover {
		border-color: #D5BA7F;
		background: #fffbf5;
		transform: translateX(4px);
		box-shadow: 0 2px 8px rgba(213, 186, 127, 0.2);
	}
	
	.slideshow-info {
		flex: 1;
	}
	
	.slideshow-info h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		color: #2d3748;
	}
	
	.slideshow-info p {
		margin: 0.25rem 0;
		font-size: 0.875rem;
		color: #718096;
	}
	
	.music-info {
		color: #D5BA7F;
		font-weight: 500;
	}
	
	.slideshow-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.edit-icon {
		color: #3182ce;
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
	}
	
	.slideshow-item:hover .edit-icon {
		color: #2c5282;
	}
	
	.form-group select {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #cbd5e0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		background: white;
		cursor: pointer;
	}
	
	.form-group select:focus {
		outline: none;
		border-color: #3182ce;
		box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
	}
	
	.form-group select:disabled {
		background: #edf2f7;
		cursor: not-allowed;
	}
	
	/* Edit button */
	button.edit-btn-small {
		background: #3182ce;
		color: white;
		border-color: #3182ce;
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}
	
	button.edit-btn-small:hover {
		background: #2c5282;
	}

	/* Display Settings styles */
	.display-form {
		background: #f7fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.display-preview {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.preview-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: flex-start;
	}

	.preview-row strong {
		min-width: 120px;
		color: #4a5568;
	}

	.custom-value {
		color: #2d3748;
		font-weight: 500;
	}

	.default-value {
		color: #718096;
		font-style: italic;
	}

	.success-message {
		background: #c6f6d5;
		border: 1px solid #9ae6b4;
		color: #22543d;
		padding: 0.75rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.error-message {
		background: #fed7d7;
		border: 1px solid #fc8181;
		color: #742a2a;
		padding: 0.75rem;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.help-text {
		margin: 0.5rem 0 0 0;
		font-size: 0.75rem;
		color: #718096;
		font-style: italic;
	}
	
	/* Clickable owner link styling */
	button.owner-link {
		background: none;
		border: none;
		color: #d5ba7f;
		text-decoration: none;
		cursor: pointer;
		font: inherit;
		padding: 0;
		margin: 0;
		transition: all 0.2s ease;
		font-weight: 600;
	}

	button.owner-link:hover {
		text-decoration: underline;
		color: #c4a76e;
		background: none;
	}
</style>
