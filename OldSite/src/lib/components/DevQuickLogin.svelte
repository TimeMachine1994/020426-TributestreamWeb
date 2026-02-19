<script lang="ts">
	import { auth } from '$lib/firebase';
	import { signInWithEmailAndPassword } from 'firebase/auth';
	import { isDevelopment } from '$lib/utils/environment';
	import { DEV_TEST_ACCOUNTS, devLog } from '$lib/config/dev-mode';
	
	let selectedRole = $state<'admin' | 'owner' | 'funeral_director' | 'viewer'>('owner');
	let loading = $state(false);
	let isExpanded = $state(false);
	let error = $state<string | null>(null);
	
	async function quickLogin() {
		loading = true;
		error = null;
		
		const account = DEV_TEST_ACCOUNTS.find(a => a.role === selectedRole);
		if (!account) {
			error = 'Account not found';
			loading = false;
			return;
		}
		
		devLog.info(`Quick login attempt for role: ${selectedRole}`);
		
		try {
			// Sign in with Firebase
			const userCredential = await signInWithEmailAndPassword(
				auth, 
				account.email, 
				account.password
			);
			const idToken = await userCredential.user.getIdToken();
			
			devLog.success(`Signed in as ${account.email}`);
			
			// Create session
			const response = await fetch('/api/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ idToken })
			});
			
			if (response.ok) {
				devLog.success('Session created, redirecting...');
				window.location.href = '/';
			} else {
				throw new Error('Failed to create session');
			}
		} catch (err: any) {
			console.error('Quick login failed:', err);
			error = err.message;
			devLog.error('Quick login failed:', err.message);
		} finally {
			loading = false;
		}
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
	
	function getRoleLabel(role: string): string {
		switch (role) {
			case 'admin': return 'Admin';
			case 'funeral_director': return 'Funeral Director';
			case 'owner': return 'Memorial Owner';
			case 'viewer': return 'Viewer';
			default: return role;
		}
	}
</script>

{#if isDevelopment}
	<div class="dev-quick-login" class:expanded={isExpanded}>
		<button 
			class="toggle-button"
			onclick={() => isExpanded = !isExpanded}
			type="button"
		>
			🚀 {isExpanded ? '▼' : '◀'} Quick Login
		</button>
		
		{#if isExpanded}
			<div class="login-panel">
				<div class="banner">
					⚡ DEV MODE - Quick Login
				</div>
				
				<div class="form-group">
					<label for="role-select">
						Select Role:
					</label>
					<select 
						id="role-select"
						bind:value={selectedRole}
						disabled={loading}
					>
						{#each DEV_TEST_ACCOUNTS as account}
							<option value={account.role}>
								{getRoleIcon(account.role)} {getRoleLabel(account.role)}
							</option>
						{/each}
					</select>
				</div>
				
				<div class="credentials">
					{#each DEV_TEST_ACCOUNTS as account}
						{#if account.role === selectedRole}
							<div class="credential-info">
								<div class="credential-row">
									<span class="label">Email:</span>
									<code>{account.email}</code>
								</div>
								<div class="credential-row">
									<span class="label">Password:</span>
									<code>{account.password}</code>
								</div>
								<div class="description">{account.description}</div>
							</div>
						{/if}
					{/each}
				</div>
				
				{#if error}
					<div class="error">
						❌ {error}
					</div>
				{/if}
				
				<button 
					class="login-button"
					onclick={quickLogin}
					disabled={loading}
					type="button"
				>
					{#if loading}
						⏳ Logging in...
					{:else}
						{getRoleIcon(selectedRole)} Login as {getRoleLabel(selectedRole)}
					{/if}
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.dev-quick-login {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 9999;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.toggle-button {
		background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
		color: white;
		border: none;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.875rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.toggle-button:hover {
		background: linear-gradient(135deg, #334155 0%, #475569 100%);
		transform: translateY(-2px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1);
	}
	
	.toggle-button:active {
		transform: translateY(0);
	}
	
	.login-panel {
		position: absolute;
		bottom: 100%;
		right: 0;
		margin-bottom: 0.5rem;
		background: white;
		border-radius: 12px;
		padding: 1rem;
		min-width: 320px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.15);
		border: 2px solid #1e293b;
		animation: slideUp 0.2s ease;
	}
	
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.banner {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: black;
		padding: 0.5rem;
		margin: -1rem -1rem 1rem -1rem;
		font-weight: bold;
		border-radius: 10px 10px 0 0;
		text-align: center;
		font-size: 0.875rem;
	}
	
	.form-group {
		margin-bottom: 1rem;
	}
	
	label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #1e293b;
		font-size: 0.875rem;
	}
	
	select {
		width: 100%;
		padding: 0.5rem;
		border: 2px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.875rem;
		background: white;
		cursor: pointer;
		transition: border-color 0.2s ease;
	}
	
	select:hover {
		border-color: #cbd5e1;
	}
	
	select:focus {
		outline: none;
		border-color: #f59e0b;
	}
	
	.credentials {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 0.75rem;
		margin-bottom: 1rem;
		font-size: 0.75rem;
	}
	
	.credential-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.credential-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.label {
		font-weight: 600;
		color: #64748b;
		min-width: 70px;
	}
	
	code {
		background: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		border: 1px solid #e2e8f0;
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		color: #1e293b;
	}
	
	.description {
		margin-top: 0.25rem;
		color: #64748b;
		font-style: italic;
		font-size: 0.7rem;
	}
	
	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.5rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.75rem;
	}
	
	.login-button {
		width: 100%;
		padding: 0.75rem;
		background: linear-gradient(135deg, #d5ba7f 0%, #c4a868 100%);
		color: black;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
	}
	
	.login-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #c4a868 0%, #b39757 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	
	.login-button:active:not(:disabled) {
		transform: translateY(0);
	}
	
	.login-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	/* Mobile adjustments */
	@media (max-width: 640px) {
		.dev-quick-login {
			bottom: 10px;
			right: 10px;
		}
		
		.login-panel {
			min-width: 280px;
		}
		
		.toggle-button {
			padding: 0.625rem 0.875rem;
			font-size: 0.8125rem;
		}
	}
</style>
