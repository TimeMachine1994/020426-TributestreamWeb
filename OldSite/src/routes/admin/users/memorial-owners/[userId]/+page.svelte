<script lang="ts">
	import AdminLayout from '$lib/components/admin/AdminLayout.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	function goBack() {
		goto('/admin/users/memorial-owners');
	}
</script>

<AdminLayout
	title="User Details: {data.user.displayName}"
	subtitle="View all data for {data.user.email}"
	actions={[
		{
			label: '← Back to Memorial Owners',
			icon: '◀',
			onclick: goBack
		},
		{
			label: 'Edit User',
			icon: '✏️',
			onclick: () => console.log('Edit user')
		},
		{
			label: 'Suspend User',
			icon: '🚫',
			onclick: () => console.log('Suspend user')
		}
	]}
>
	<!-- User Profile Card -->
	<div class="card">
		<h2>Profile Information</h2>
		<div class="profile-grid">
			<div class="field">
				<label>Name:</label>
				<span>{data.user.displayName}</span>
			</div>
			<div class="field">
				<label>Email:</label>
				<span>{data.user.email}</span>
			</div>
			<div class="field">
				<label>Role:</label>
				<span class="badge role-{data.user.role}">{data.user.role}</span>
			</div>
			<div class="field">
				<label>Phone:</label>
				<span>{data.user.phone || 'N/A'}</span>
			</div>
			<div class="field">
				<label>Status:</label>
				<span class="badge status-{data.user.suspended ? 'suspended' : 'active'}">
					{data.user.suspended ? '🚫 Suspended' : '✅ Active'}
				</span>
			</div>
			<div class="field">
				<label>Has Paid:</label>
				<span>{data.user.hasPaidForMemorial ? '✅ Yes' : '❌ No'}</span>
			</div>
			<div class="field">
				<label>Joined:</label>
				<span
					>{data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString() : 'N/A'}</span
				>
			</div>
			<div class="field">
				<label>Last Login:</label>
				<span
					>{data.user.lastLoginAt
						? new Date(data.user.lastLoginAt).toLocaleDateString()
						: 'Never'}</span
				>
			</div>
		</div>
	</div>

	<!-- Funeral Director Info (if applicable) -->
	{#if data.funeralDirector}
		<div class="card">
			<h2>Funeral Director Information</h2>
			<div class="profile-grid">
				<div class="field">
					<label>Company Name:</label>
					<span>{data.funeralDirector.companyName}</span>
				</div>
				<div class="field">
					<label>Contact Person:</label>
					<span>{data.funeralDirector.contactPerson}</span>
				</div>
				<div class="field">
					<label>License Number:</label>
					<span>{data.funeralDirector.licenseNumber || 'N/A'}</span>
				</div>
				<div class="field">
					<label>Address:</label>
					<span>
						{data.funeralDirector.address.street},
						{data.funeralDirector.address.city},
						{data.funeralDirector.address.state}
						{data.funeralDirector.address.zipCode}
					</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Statistics Card -->
	<div class="card stats-card">
		<h2>Account Statistics</h2>
		<div class="stats-grid">
			<div class="stat">
				<div class="stat-value">{data.stats.memorialCount}</div>
				<div class="stat-label">Memorials Created</div>
			</div>
			<div class="stat">
				<div class="stat-value">{data.stats.streamCount}</div>
				<div class="stat-label">Streams Created</div>
			</div>
			<div class="stat">
				<div class="stat-value">{data.stats.slideshowCount}</div>
				<div class="stat-label">Slideshows Created</div>
			</div>
			<div class="stat">
				<div class="stat-value">{data.stats.chatMessageCount}</div>
				<div class="stat-label">Chat Messages</div>
			</div>
			<div class="stat">
				<div class="stat-value">{data.stats.invitationCount}</div>
				<div class="stat-label">Invitations Sent</div>
			</div>
			<div class="stat">
				<div class="stat-value">{data.stats.scheduleRequestCount}</div>
				<div class="stat-label">Schedule Requests</div>
			</div>
			<div class="stat">
				<div class="stat-value">{data.stats.followedMemorialsCount}</div>
				<div class="stat-label">Memorials Following</div>
			</div>
		</div>
	</div>

	<!-- Memorials Table -->
	<div class="card">
		<h2>Memorials ({data.memorials.length})</h2>
		{#if data.memorials.length > 0}
			<table class="data-table">
				<thead>
					<tr>
						<th>Loved One Name</th>
						<th>Full Slug</th>
						<th>Status</th>
						<th>Payment</th>
						<th>Created</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.memorials as memorial}
						<tr>
							<td>{memorial.lovedOneName}</td>
							<td><code>{memorial.fullSlug}</code></td>
							<td>
								<span class="badge status-{memorial.isPublic ? 'public' : 'private'}">
									{memorial.isPublic ? '🌍 Public' : '🔒 Private'}
								</span>
							</td>
							<td>
								<span class="badge payment-{memorial.isPaid ? 'paid' : 'unpaid'}">
									{memorial.isPaid ? '✅ Paid' : '❌ Unpaid'}
								</span>
							</td>
							<td
								>{memorial.createdAt
									? new Date(memorial.createdAt.seconds * 1000).toLocaleDateString()
									: 'N/A'}</td
							>
							<td>
								<a href="/{memorial.fullSlug}" target="_blank" class="btn-link">View</a>
								<a href="/admin/content/memorials" class="btn-link">Edit</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="empty-state">No memorials created yet</p>
		{/if}
	</div>

	<!-- Streams Table -->
	<div class="card">
		<h2>Streams ({data.streams.length})</h2>
		{#if data.streams.length > 0}
			<table class="data-table">
				<thead>
					<tr>
						<th>Title</th>
						<th>Memorial</th>
						<th>Status</th>
						<th>Scheduled</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{#each data.streams as stream}
						<tr>
							<td>{stream.title}</td>
							<td>
								{#if data.memorials.find((m) => m.id === stream.memorialId)}
									{data.memorials.find((m) => m.id === stream.memorialId).lovedOneName}
								{:else}
									{stream.memorialId}
								{/if}
							</td>
							<td>
								<span class="badge status-{stream.status}">
									{stream.status}
								</span>
							</td>
							<td>{stream.scheduledStartTime || 'N/A'}</td>
							<td>{new Date(stream.createdAt).toLocaleDateString()}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="empty-state">No streams created yet</p>
		{/if}
	</div>

	<!-- Slideshows Table -->
	<div class="card">
		<h2>Slideshows ({data.slideshows.length})</h2>
		{#if data.slideshows.length > 0}
			<table class="data-table">
				<thead>
					<tr>
						<th>Title</th>
						<th>Memorial</th>
						<th>Status</th>
						<th>Photos</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{#each data.slideshows as slideshow}
						<tr>
							<td>{slideshow.title}</td>
							<td>{slideshow.memorialName}</td>
							<td>
								<span class="badge status-{slideshow.status}">
									{slideshow.status}
								</span>
							</td>
							<td>{slideshow.photos?.length || 0}</td>
							<td>{new Date(slideshow.createdAt).toLocaleDateString()}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="empty-state">No slideshows created yet</p>
		{/if}
	</div>

	<!-- Schedule Edit Requests -->
	{#if data.scheduleRequests.length > 0}
		<div class="card">
			<h2>Schedule Edit Requests ({data.scheduleRequests.length})</h2>
			<table class="data-table">
				<thead>
					<tr>
						<th>Memorial</th>
						<th>Request Details</th>
						<th>Status</th>
						<th>Created</th>
					</tr>
				</thead>
				<tbody>
					{#each data.scheduleRequests as request}
						<tr>
							<td>{request.memorialName}</td>
							<td>{request.requestDetails}</td>
							<td>
								<span class="badge status-{request.status}">
									{request.status}
								</span>
							</td>
							<td>{new Date(request.createdAt.seconds * 1000).toLocaleDateString()}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Admin Actions (if admin user) -->
	{#if data.adminActions.length > 0}
		<div class="card">
			<h2>Admin Actions ({data.adminActions.length})</h2>
			<table class="data-table">
				<thead>
					<tr>
						<th>Action</th>
						<th>Target Type</th>
						<th>Target ID</th>
						<th>Timestamp</th>
					</tr>
				</thead>
				<tbody>
					{#each data.adminActions as action}
						<tr>
							<td>{action.action}</td>
							<td>{action.targetType}</td>
							<td><code>{action.targetId}</code></td>
							<td>{new Date(action.timestamp.seconds * 1000).toLocaleString()}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</AdminLayout>

<style>
	.card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.card h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #1a202c;
	}

	.profile-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #718096;
	}

	.field span {
		font-size: 1rem;
		color: #1a202c;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1.5rem;
	}

	.stat {
		text-align: center;
		padding: 1rem;
		background: #f7fafc;
		border-radius: 0.5rem;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #d5ba7f;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #718096;
		margin-top: 0.5rem;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.data-table thead {
		background: #f7fafc;
	}

	.data-table th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		color: #4a5568;
		border-bottom: 2px solid #e2e8f0;
	}

	.data-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.data-table tbody tr:hover {
		background: #f7fafc;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge.role-admin {
		background: #fed7d7;
		color: #c53030;
	}

	.badge.role-owner {
		background: #c6f6d5;
		color: #276749;
	}

	.badge.role-funeral_director {
		background: #bee3f8;
		color: #2c5282;
	}

	.badge.status-active {
		background: #c6f6d5;
		color: #276749;
	}

	.badge.status-suspended {
		background: #fed7d7;
		color: #c53030;
	}

	.badge.status-public {
		background: #bee3f8;
		color: #2c5282;
	}

	.badge.status-private {
		background: #e2e8f0;
		color: #4a5568;
	}

	.badge.payment-paid {
		background: #c6f6d5;
		color: #276749;
	}

	.badge.payment-unpaid {
		background: #feebc8;
		color: #c05621;
	}

	.badge.status-scheduled,
	.badge.status-ready,
	.badge.status-live {
		background: #bee3f8;
		color: #2c5282;
	}

	.badge.status-completed {
		background: #e2e8f0;
		color: #4a5568;
	}

	.badge.status-pending {
		background: #feebc8;
		color: #c05621;
	}

	.badge.status-approved {
		background: #c6f6d5;
		color: #276749;
	}

	.badge.status-denied {
		background: #fed7d7;
		color: #c53030;
	}

	.btn-link {
		color: #d5ba7f;
		text-decoration: none;
		margin-right: 1rem;
		font-weight: 500;
	}

	.btn-link:hover {
		text-decoration: underline;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #a0aec0;
	}

	code {
		background: #edf2f7;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family: 'Courier New', monospace;
	}
</style>
