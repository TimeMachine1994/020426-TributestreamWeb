<script lang="ts">
	import { isDevelopment } from '$lib/utils/environment';
	import { DEV_TEST_ACCOUNTS, getDevModeSummary, DEV_MODE_CONFIG } from '$lib/config/dev-mode';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/firebase';
	import { signInWithEmailAndPassword } from 'firebase/auth';
	
	// Redirect to home if not in development
	if (!isDevelopment) {
		goto('/');
	}
	
	const devSummary = getDevModeSummary();
	
	let seedingUsers = $state(false);
	let seedResult = $state<{ success: boolean; message: string } | null>(null);
	let loggingIn = $state<string | null>(null);
	
	async function seedDevUsers() {
		seedingUsers = true;
		seedResult = null;
		
		try {
			const response = await fetch('/api/dev/seed-users', {
				method: 'POST'
			});
			
			const result = await response.json();
			
			if (response.ok) {
				seedResult = { success: true, message: result.message || 'Users seeded successfully!' };
			} else {
				seedResult = { success: false, message: result.error || 'Failed to seed users' };
			}
		} catch (error: any) {
			seedResult = { success: false, message: error.message };
		} finally {
			seedingUsers = false;
		}
	}
	
	async function quickLogin(role: string) {
		loggingIn = role;
		
		const account = DEV_TEST_ACCOUNTS.find(a => a.role === role);
		if (!account) {
			loggingIn = null;
			return;
		}
		
		try {
			const userCredential = await signInWithEmailAndPassword(
				auth, 
				account.email, 
				account.password
			);
			const idToken = await userCredential.user.getIdToken();
			
			await fetch('/api/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idToken })
			});
			
			window.location.href = '/';
		} catch (error) {
			console.error('Login failed:', error);
			loggingIn = null;
		}
	}
	
	function clearLocalStorage() {
		localStorage.clear();
		alert('Local storage cleared!');
	}
	
	function clearSessionStorage() {
		sessionStorage.clear();
		alert('Session storage cleared!');
	}
	
	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
	
	function getRoleIcon(role: string): string {
		switch (role) {
			case 'admin': return '👑';
			case 'funeral_director': return '🏢';
			case 'owner': return '👤';
			case 'viewer': return '👁️';
			default: return '👤';
		}
	}
	
	function getRoleColor(role: string): string {
		switch (role) {
			case 'admin': return 'bg-purple-100 border-purple-300';
			case 'funeral_director': return 'bg-blue-100 border-blue-300';
			case 'owner': return 'bg-green-100 border-green-300';
			case 'viewer': return 'bg-gray-100 border-gray-300';
			default: return 'bg-gray-100 border-gray-300';
		}
	}
</script>

<div class="dev-tools-page">
	<div class="header">
		<h1>🛠️ Development Tools</h1>
		<div class="env-badge">
			{devSummary.environment} mode
			{#if devSummary.localhost}
				<span class="localhost-badge">localhost</span>
			{/if}
		</div>
	</div>
	
	<div class="grid">
		<!-- Test Accounts Section -->
		<section class="card">
			<h2>👥 Test Accounts</h2>
			<p class="description">Pre-configured accounts for testing different user roles</p>
			
			<div class="accounts-grid">
				{#each DEV_TEST_ACCOUNTS as account}
					<div class="account-card {getRoleColor(account.role)}">
						<div class="account-header">
							<span class="role-icon">{getRoleIcon(account.role)}</span>
							<h3>{account.role.replace('_', ' ').toUpperCase()}</h3>
						</div>
						
						<div class="credentials">
							<div class="credential-row">
								<label>Email:</label>
								<div class="value-group">
									<code>{account.email}</code>
									<button 
										class="copy-btn"
										onclick={() => copyToClipboard(account.email)}
										type="button"
										title="Copy email"
									>
										📋
									</button>
								</div>
							</div>
							
							<div class="credential-row">
								<label>Password:</label>
								<div class="value-group">
									<code>{account.password}</code>
									<button 
										class="copy-btn"
										onclick={() => copyToClipboard(account.password)}
										type="button"
										title="Copy password"
									>
										📋
									</button>
								</div>
							</div>
						</div>
						
						<p class="account-description">{account.description}</p>
						
						<button 
							class="login-btn"
							onclick={() => quickLogin(account.role)}
							disabled={loggingIn === account.role}
							type="button"
						>
							{#if loggingIn === account.role}
								⏳ Logging in...
							{:else}
								🚀 Quick Login
							{/if}
						</button>
					</div>
				{/each}
			</div>
		</section>
		
		<!-- Active Bypasses Section -->
		<section class="card">
			<h2>🔓 Active Bypasses</h2>
			<p class="description">Services that are mocked or bypassed in development</p>
			
			<div class="bypasses-list">
				{#each Object.entries(DEV_MODE_CONFIG) as [key, value]}
					<div class="bypass-item">
						<span class="bypass-icon">{value ? '✅' : '❌'}</span>
						<span class="bypass-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
						<span class="bypass-status {value ? 'active' : 'inactive'}">
							{value ? 'Enabled' : 'Disabled'}
						</span>
					</div>
				{/each}
			</div>
			
			{#if devSummary.activeBypasses.length > 0}
				<div class="active-summary">
					<strong>Active:</strong> {devSummary.activeBypasses.join(', ')}
				</div>
			{/if}
		</section>
		
		<!-- Quick Actions Section -->
		<section class="card">
			<h2>⚡ Quick Actions</h2>
			<p class="description">Useful development utilities and tools</p>
			
			<div class="actions-grid">
				<button 
					class="action-btn primary"
					onclick={seedDevUsers}
					disabled={seedingUsers}
					type="button"
				>
					<span class="btn-icon">🌱</span>
					<span class="btn-text">
						{seedingUsers ? 'Seeding...' : 'Seed Test Users'}
					</span>
				</button>
				
				<button 
					class="action-btn"
					onclick={clearLocalStorage}
					type="button"
				>
					<span class="btn-icon">🗑️</span>
					<span class="btn-text">Clear Local Storage</span>
				</button>
				
				<button 
					class="action-btn"
					onclick={clearSessionStorage}
					type="button"
				>
					<span class="btn-icon">🗑️</span>
					<span class="btn-text">Clear Session Storage</span>
				</button>
				
				<button 
					class="action-btn"
					onclick={() => window.location.reload()}
					type="button"
				>
					<span class="btn-icon">🔄</span>
					<span class="btn-text">Reload Page</span>
				</button>
			</div>
			
			{#if seedResult}
				<div class="result-message {seedResult.success ? 'success' : 'error'}">
					{seedResult.success ? '✅' : '❌'} {seedResult.message}
				</div>
			{/if}
		</section>
		
		<!-- Environment Info Section -->
		<section class="card">
			<h2>🌍 Environment Information</h2>
			<p class="description">Current environment configuration and status</p>
			
			<div class="info-grid">
				<div class="info-item">
					<label>Environment:</label>
					<span class="value">{devSummary.environment}</span>
				</div>
				
				<div class="info-item">
					<label>Localhost:</label>
					<span class="value">{devSummary.localhost ? 'Yes' : 'No'}</span>
				</div>
				
				<div class="info-item">
					<label>Test Accounts:</label>
					<span class="value">{devSummary.testAccountsCount}</span>
				</div>
				
				<div class="info-item">
					<label>Active Bypasses:</label>
					<span class="value">{devSummary.activeBypasses.length}</span>
				</div>
			</div>
		</section>
		
		<!-- Useful Links Section -->
		<section class="card">
			<h2>🔗 Useful Links</h2>
			<p class="description">Quick access to development resources</p>
			
			<div class="links-grid">
				<a href="/" class="link-btn">
					🏠 Homepage
				</a>
				<a href="/admin" class="link-btn">
					👑 Admin Dashboard
				</a>
				<a href="/profile" class="link-btn">
					👤 Profile
				</a>
				<a href="/register" class="link-btn">
					✍️ Registration
				</a>
				<a href="/login" class="link-btn">
					🔐 Login
				</a>
				<a href="/contact" class="link-btn">
					📧 Contact
				</a>
			</div>
		</section>
	</div>
</div>

<style>
	.dev-tools-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}
	
	h1 {
		font-size: 2.5rem;
		font-weight: 800;
		color: #1e293b;
		margin: 0;
	}
	
	.env-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: black;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 600;
		text-transform: uppercase;
		font-size: 0.875rem;
	}
	
	.localhost-badge {
		background: rgba(0, 0, 0, 0.2);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}
	
	.grid {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
	}
	
	.card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
		border: 1px solid #e2e8f0;
	}
	
	h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}
	
	.description {
		color: #64748b;
		font-size: 0.875rem;
		margin: 0 0 1.5rem 0;
	}
	
	/* Test Accounts Styles */
	.accounts-grid {
		display: grid;
		gap: 1rem;
	}
	
	.account-card {
		border: 2px solid;
		border-radius: 8px;
		padding: 1rem;
	}
	
	.account-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	
	.role-icon {
		font-size: 1.5rem;
	}
	
	h3 {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		color: #1e293b;
	}
	
	.credentials {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	
	.credential-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
	}
	
	.value-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	
	code {
		background: white;
		padding: 0.5rem;
		border-radius: 4px;
		border: 1px solid #e2e8f0;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		flex: 1;
	}
	
	.copy-btn {
		background: #f1f5f9;
		border: 1px solid #cbd5e1;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}
	
	.copy-btn:hover {
		background: #e2e8f0;
	}
	
	.account-description {
		font-size: 0.75rem;
		color: #64748b;
		font-style: italic;
		margin: 0 0 1rem 0;
	}
	
	.login-btn {
		width: 100%;
		padding: 0.75rem;
		background: linear-gradient(135deg, #d5ba7f 0%, #c4a868 100%);
		color: black;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.login-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #c4a868 0%, #b39757 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	
	.login-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	/* Bypasses Styles */
	.bypasses-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	
	.bypass-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #f8fafc;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
	}
	
	.bypass-icon {
		font-size: 1.25rem;
	}
	
	.bypass-name {
		flex: 1;
		font-weight: 500;
		color: #1e293b;
		text-transform: capitalize;
	}
	
	.bypass-status {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		text-transform: uppercase;
	}
	
	.bypass-status.active {
		background: #dcfce7;
		color: #166534;
	}
	
	.bypass-status.inactive {
		background: #fee2e2;
		color: #991b1b;
	}
	
	.active-summary {
		background: #fef3c7;
		border: 1px solid #fde047;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
	}
	
	/* Quick Actions Styles */
	.actions-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		margin-bottom: 1rem;
	}
	
	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem 1rem;
		background: #f8fafc;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 600;
	}
	
	.action-btn:hover:not(:disabled) {
		background: #f1f5f9;
		border-color: #cbd5e1;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}
	
	.action-btn.primary {
		background: linear-gradient(135deg, #d5ba7f 0%, #c4a868 100%);
		border-color: #b39757;
		color: black;
	}
	
	.action-btn.primary:hover:not(:disabled) {
		background: linear-gradient(135deg, #c4a868 0%, #b39757 100%);
	}
	
	.action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.btn-icon {
		font-size: 2rem;
	}
	
	.btn-text {
		font-size: 0.875rem;
	}
	
	.result-message {
		padding: 1rem;
		border-radius: 6px;
		font-weight: 500;
	}
	
	.result-message.success {
		background: #dcfce7;
		border: 1px solid #86efac;
		color: #166534;
	}
	
	.result-message.error {
		background: #fee2e2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}
	
	/* Environment Info Styles */
	.info-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	}
	
	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
	}
	
	.info-item label {
		font-size: 0.75rem;
	}
	
	.info-item .value {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1e293b;
	}
	
	/* Links Styles */
	.links-grid {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	}
	
	.link-btn {
		display: block;
		padding: 1rem;
		background: #f8fafc;
		border: 2px solid #e2e8f0;
		border-radius: 6px;
		text-align: center;
		text-decoration: none;
		color: #1e293b;
		font-weight: 600;
		transition: all 0.2s ease;
	}
	
	.link-btn:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
		transform: translateY(-1px);
	}
	
	/* Mobile Responsive */
	@media (max-width: 640px) {
		.dev-tools-page {
			padding: 1rem;
		}
		
		h1 {
			font-size: 2rem;
		}
		
		.grid {
			grid-template-columns: 1fr;
		}
		
		.actions-grid,
		.info-grid,
		.links-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
