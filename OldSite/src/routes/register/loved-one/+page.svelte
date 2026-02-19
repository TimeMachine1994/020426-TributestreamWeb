<script lang="ts">
	import { enhance } from '$app/forms';
	import LiveUrlPreview from '$lib/components/LiveUrlPreview.svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/ui';
	import { CheckCircle, Package } from 'lucide-svelte';
	import { executeRecaptcha, RECAPTCHA_ACTIONS } from '$lib/utils/recaptcha';
	import { dev } from '$app/environment';

	console.log('🎯 Loved-One Registration form initializing');

	let { form }: { form?: { error?: any; field?: string; success?: boolean } } = $props();

	// Pre-fill lovedOneName from URL parameter
	let lovedOneName = $state($page.url.searchParams.get('name') || '');
	let selectedPackage = $state($page.url.searchParams.get('package') || '');
	let name = $state('');
	let email = $state('');
	let phone = $state('');
	
	// Submission state for double-click prevention
	let isSubmitting = $state(false);
	let recaptchaToken = $state('');

	console.log('📝 Form state initialized with runes');

	// Form validation
	let validationErrors = $state<string[]>([]);
	let fieldErrors = $state<Record<string, string>>({});

	// Handle server-side validation errors
	$effect(() => {
		if (form?.error) {
			if (form.field) {
				// Field-specific error
				fieldErrors = { [form.field]: form.error };
				validationErrors = [];
			} else {
				// General error - clear field errors
				fieldErrors = {};
			}
		}
	});

	// Client-side validation function
	function validateFormFields(): boolean {
		const errors: string[] = [];

		if (!lovedOneName.trim()) errors.push("Loved one's name is required");
		if (!name.trim()) errors.push('Your name is required');
		if (!email.trim()) errors.push('Your email is required');

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (email && !emailRegex.test(email)) {
			errors.push('Your email must be valid');
		}

		validationErrors = errors;
		return errors.length === 0;
	}
</script>

<div class="registration-container">
	<div class="registration-card">
		<div class="form-header">
			<h1 class="form-title">Create a Memorial</h1>
			<p class="form-description">
				Enter your loved one's name to create a beautiful memorial page.
			</p>
		</div>

		<!-- Package Selection Banner -->
		{#if selectedPackage}
			<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
				<div class="flex items-center space-x-3">
					<div class="flex-shrink-0">
						<CheckCircle class="h-6 w-6 text-green-600" />
					</div>
					<div class="flex-1">
						<h3 class="text-sm font-semibold text-green-800 capitalize">
							{selectedPackage} Package Selected
						</h3>
						<p class="text-sm text-green-700">
							Your package has been selected. Create a memorial to continue.
						</p>
					</div>
					<div class="flex-shrink-0">
						<Package class="h-5 w-5 text-green-600" />
					</div>
				</div>
			</div>
		{/if}

		<form 
			method="POST"
			use:enhance={async ({ formData, cancel }) => {
				console.log('📤 Form submission started');
				
				// Client-side validation first
				if (!validateFormFields()) {
					console.log('❌ Form validation failed');
					cancel(); // Cancel submission
					return;
				}
				
				// Get reCAPTCHA token if not already set
				if (!recaptchaToken) {
					isSubmitting = true;
					
					// Dev mode bypass for local testing
					if (dev) {
						console.log('🔧 Dev mode: bypassing reCAPTCHA');
						recaptchaToken = 'dev-bypass';
						formData.set('recaptchaToken', 'dev-bypass');
					} else {
						console.log('🤖 Executing reCAPTCHA verification...');
						
						const token = await executeRecaptcha(RECAPTCHA_ACTIONS.CREATE_MEMORIAL);
						
						if (!token) {
							console.warn('⚠️ reCAPTCHA token fetch failed');
							isSubmitting = false;
							cancel(); // Cancel if reCAPTCHA fails
							validationErrors = ['Security verification failed. Please refresh and try again.'];
							return;
						}
						
						console.log('✅ reCAPTCHA token obtained');
						recaptchaToken = token;
						formData.set('recaptchaToken', token);
					}
				} else {
					// Token already exists, add it to formData
					console.log('✅ Using existing reCAPTCHA token');
					formData.set('recaptchaToken', recaptchaToken);
				}
				
				isSubmitting = true;
				
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					recaptchaToken = ''; // Reset token after submission
				};
			}}
		>
			<!-- 🍯 HONEYPOT FIELD - Hidden trap for bots -->
			<div style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;" aria-hidden="true">
				<label for="website">Website (leave blank)</label>
				<input 
					type="text" 
					name="website" 
					id="website" 
					tabindex="-1" 
					autocomplete="off"
					placeholder="Leave this field blank"
				/>
			</div>
			
			<section class="form-section">
				<LiveUrlPreview bind:lovedOneName />
			</section>

			<section class="form-section">
				<div class="section-header">
					<h2 class="section-title">Memorial Details</h2>
				</div>
				<div class="form-grid">
					<div class="form-group">
						<label for="lovedOneName" class="form-label">Loved One's Name *</label>
						<input
							id="lovedOneName"
							name="lovedOneName"
							type="text"
							required
							bind:value={lovedOneName}
							class="form-input {fieldErrors.lovedOneName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
						/>
						{#if fieldErrors.lovedOneName}
							<p class="mt-1 text-sm text-red-600">{fieldErrors.lovedOneName}</p>
						{/if}
					</div>
					<div class="form-group">
						<label for="name" class="form-label">Your Name *</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							bind:value={name}
							class="form-input {fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
						/>
						{#if fieldErrors.name}
							<p class="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
						{/if}
					</div>
					<div class="form-group">
						<label for="email" class="form-label">Your Email *</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							bind:value={email}
							class="form-input {fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}"
						/>
						{#if fieldErrors.email}
							<p class="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
						{/if}
					</div>
					<div class="form-group">
						<label for="phone" class="form-label">Your Phone Number</label>
						<input id="phone" name="phone" type="tel" bind:value={phone} class="form-input" />
					</div>
				</div>
			</section>

			<!-- reCAPTCHA validation happens server-side, errors shown via form.error -->

			{#if validationErrors.length > 0}
				<div class="error-section">
					<h3 class="error-title">❌ Please correct the following errors:</h3>
					<ul class="error-list">
						{#each validationErrors as error}
							<li class="error-item">{error}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if form?.error}
				<div class="form-message error-message">
					<span class="message-icon">❌</span>
					<span class="message-text">{form.error}</span>
				</div>
			{/if}

			{#if form?.success}
				<div class="form-message success-message">
					<span class="message-icon">✅</span>
					<span class="message-text">
						Success! Please check your email for your login details and memorial setup information.
					</span>
				</div>
			{/if}

			<div class="submit-section">
				<Button
					type="submit"
					variant="role"
					role="owner"
					size="xl"
					fullWidth
					rounded="lg"
					disabled={isSubmitting}
					loading={isSubmitting}
				>
					{isSubmitting ? '🔄 Creating Memorial...' : '🚀 Create Memorial'}
				</Button>
				<p class="submit-note">
					By submitting this form, you'll create your account and set up the memorial page. Login
					credentials will be sent to your email address.
				</p>
			</div>
		</form>
	</div>
</div>

<style>
	/* Styles adapted from funeral-director registration */
	.registration-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #d5ba7f 0%, #b8a06b 100%);
		padding: 2rem 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.registration-card {
		background: white;
		border-radius: 16px;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		max-width: 800px;
		width: 100%;
		overflow: hidden;
	}

	.form-header {
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
		color: #d5ba7f;
		padding: 2rem;
		text-align: center;
	}

	.form-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		line-height: 1.2;
	}

	.form-description {
		font-size: 1.1rem;
		margin: 0;
		opacity: 0.9;
		line-height: 1.5;
	}

	.form-section {
		padding: 2rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.form-section:last-child {
		border-bottom: none;
	}

	.section-header {
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-label {
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}

	.form-input {
		padding: 0.75rem 1rem;
		border: 2px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
		transition: all 0.2s ease;
		background: white;
	}

	.form-input:focus {
		outline: none;
		border-color: #d5ba7f;
		box-shadow: 0 0 0 3px rgba(213, 186, 127, 0.1);
	}

	.error-section {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 2rem;
	}

	.error-title {
		color: #dc2626;
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
	}

	.error-list {
		margin: 0;
		padding-left: 1.5rem;
		color: #dc2626;
	}

	.error-item {
		margin-bottom: 0.25rem;
	}

	.form-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 8px;
		margin: 1rem 2rem;
		font-weight: 500;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
	}

	.success-message {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.message-icon {
		font-size: 1.25rem;
	}

	.submit-section {
		padding: 2rem;
		background: #f9fafb;
		text-align: center;
		margin: 1rem 0 0 0;
	}

	.submit-button {
		background: linear-gradient(135deg, #d5ba7f 0%, #b8a06b 100%);
		color: #1a1a1a;
		border: none;
		padding: 1rem 2rem;
		border-radius: 12px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		min-width: 250px;
	}

	.submit-button:hover {
		background: linear-gradient(135deg, #e5ca8f 0%, #c5aa6f 100%);
		transform: translateY(-1px);
		box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
	}

	.submit-button:active {
		transform: translateY(0);
	}

	.submit-note {
		margin: 1rem 0 0 0;
		color: #6b7280;
		font-size: 0.9rem;
		line-height: 1.5;
		max-width: 500px;
		margin-left: auto;
		margin-right: auto;
	}

	@media (max-width: 768px) {
		.registration-container {
			padding: 1rem;
		}
		.form-header {
			padding: 1.5rem;
		}
		.form-title {
			font-size: 1.75rem;
		}
		.form-description {
			font-size: 1rem;
		}
		.form-section {
			padding: 1.5rem;
		}
		.form-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.submit-section {
			padding: 1.5rem;
		}
		.submit-button {
			width: 100%;
			min-width: auto;
		}
	}
</style>
