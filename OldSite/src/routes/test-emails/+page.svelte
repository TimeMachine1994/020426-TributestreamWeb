<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/minimal-modern';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';

	const theme = getTheme('minimal');

	let testEmail = $state('test@example.com');
	let selectedTemplate = $state('enhanced_registration');
	let isLoading = $state(false);
	let result: any = $state(null);
	let templateInfo: any = $state(null);

	// Pre-populated test data for each template type
	const testData = {
		enhanced_registration: {
			lovedOneName: 'John Doe',
			memorialUrl: 'https://tributestream.com/john-doe-memorial',
			ownerName: 'Jane Doe',
			password: 'TempPass123!'
		},
		basic_registration: {
			lovedOneName: 'John Doe',
			password: 'TempPass123!'
		},
		invitation: {
			fromName: 'Jane Doe',
			memorialName: 'John Doe Memorial',
			invitationId: 'test-invitation-123'
		},
		email_change: {
			userName: 'Jane Doe',
			confirmationUrl: 'https://tributestream.com/confirm-email?token=test123'
		},
		payment_confirmation: {
			memorialId: 'test-memorial-123',
			paymentIntentId: 'pi_test123456789',
			lovedOneName: 'John Doe',
			amount: 299.99
		},
		payment_action: {
			memorialId: 'test-memorial-123',
			paymentIntentId: 'pi_test123456789',
			lovedOneName: 'John Doe',
			nextActionUrl: 'https://tributestream.com/payment/confirm'
		},
		payment_failure: {
			memorialId: 'test-memorial-123',
			paymentIntentId: 'pi_test123456789',
			lovedOneName: 'John Doe',
			failureReason: 'Card declined - insufficient funds'
		},
		contact_form: {
			name: 'Test User',
			subject: 'Test Contact Form Submission',
			message: 'This is a test message from the email testing interface.'
		}
	};

	// Reactive test data that updates when template selection changes
	let currentTestData: Record<string, any> = $state({...testData['enhanced_registration']});
	let lastSelectedTemplate = $state('enhanced_registration');

	// Update test data when template changes
	$effect(() => {
		if (selectedTemplate !== lastSelectedTemplate) {
			currentTestData = {...testData[selectedTemplate as keyof typeof testData]} as Record<string, any>;
			lastSelectedTemplate = selectedTemplate;
		}
	});

	onMount(async () => {
		// Load template configuration info
		try {
			const response = await fetch('/api/test-emails');
			templateInfo = await response.json();
		} catch (error) {
			console.error('Failed to load template info:', error);
		}
	});

	async function sendTestEmail() {
		if (!testEmail) {
			alert('Please enter a test email address');
			return;
		}

		isLoading = true;
		result = null;

		try {
			const response = await fetch('/api/test-emails', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					templateType: selectedTemplate,
					testEmail: testEmail,
					customData: currentTestData
				})
			});

			result = await response.json();
		} catch (error) {
			result = {
				success: false,
				error: 'Network error',
				details: error instanceof Error ? error.message : 'Unknown error'
			};
		} finally {
			isLoading = false;
		}
	}

	async function sendAllEmails() {
		if (!testEmail) {
			alert('Please enter a test email address');
			return;
		}

		isLoading = true;
		const results = [];

		for (const templateType of Object.keys(testData)) {
			try {
				const response = await fetch('/api/test-emails', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						templateType,
						testEmail: testEmail,
						customData: testData[templateType as keyof typeof testData]
					})
				});

				const result = await response.json();
				results.push({ templateType, ...result });
			} catch (error) {
				results.push({
					templateType,
					success: false,
					error: 'Network error',
					details: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		}

		result = {
			success: true,
			message: 'Batch email test completed',
			results
		};
		isLoading = false;
	}

	const templateLabels = {
		enhanced_registration: 'Enhanced Registration',
		basic_registration: 'Basic Registration',
		invitation: 'Memorial Invitation',
		email_change: 'Email Change Confirmation',
		payment_confirmation: 'Payment Confirmation',
		payment_action: 'Payment Action Required',
		payment_failure: 'Payment Failure',
		contact_form: 'Contact Form'
	};
</script>

<svelte:head>
	<title>SendGrid Email Template Tester - Tributestream</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4">
		<div class="bg-white rounded-lg shadow-lg p-6">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">📧 SendGrid Email Template Tester</h1>
			<p class="text-gray-600 mb-6">Test all SendGrid dynamic templates with pre-populated data</p>

			<!-- Template Configuration Status -->
			{#if templateInfo}
				<div class="mb-6 p-4 rounded-lg {templateInfo.validation.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}">
					<h3 class="font-semibold mb-2">
						{templateInfo.validation.valid ? '✅ Template Configuration' : '⚠️ Template Configuration Issues'}
					</h3>
					{#if templateInfo.validation.valid}
						<p class="text-green-700">All templates are properly configured!</p>
					{:else}
						<p class="text-yellow-700 mb-2">Missing or misconfigured templates:</p>
						<ul class="list-disc list-inside text-yellow-600">
							{#each templateInfo.validation.missing as missing}
								<li>{missing}</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}

			<!-- Test Email Input -->
			<div class="mb-6">
				<label for="testEmail" class="block text-sm font-medium text-gray-700 mb-2">
					Test Email Address
				</label>
				<input
					id="testEmail"
					type="email"
					bind:value={testEmail}
					placeholder="your-email@example.com"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<!-- Template Selection -->
			<div class="mb-6">
				<label for="templateSelect" class="block text-sm font-medium text-gray-700 mb-2">
					Select Template to Test
				</label>
				<select
					id="templateSelect"
					bind:value={selectedTemplate}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					{#each Object.entries(templateLabels) as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>
			</div>

			<!-- Debug Info (temporary) -->
			<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
				<strong>Debug:</strong> Selected: {selectedTemplate} | Last: {lastSelectedTemplate} | 
				Keys: {Object.keys(currentTestData).join(', ')}
			</div>

			<!-- Test Data Editor -->
			<div class="mb-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-3">Test Data for {templateLabels[selectedTemplate as keyof typeof templateLabels]}</h3>
				<div class="bg-gray-50 p-4 rounded-lg">
					{#each Object.entries(currentTestData) as [key, value]}
						<div class="mb-3">
							<label for={key} class="block text-sm font-medium text-gray-700 mb-1 capitalize">
								{key.replace(/([A-Z])/g, ' $1').trim()}
							</label>
							{#if key === 'message'}
								<textarea
									id={key}
									bind:value={currentTestData[key]}
									rows="3"
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								></textarea>
							{:else if key === 'amount'}
								<input
									id={key}
									type="number"
									step="0.01"
									bind:value={currentTestData[key]}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							{:else}
								<input
									id={key}
									type="text"
									bind:value={currentTestData[key]}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-4 mb-6">
				<Button
					theme="minimal"
					onclick={sendTestEmail}
					disabled={isLoading || !testEmail}
					class="flex-1 bg-[#D5BA7F] text-black hover:bg-[#C5AA6F] disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? '⏳ Sending...' : `📤 Send ${templateLabels[selectedTemplate as keyof typeof templateLabels]}`}
				</Button>

				<Button
					theme="minimal"
					variant="secondary"
					onclick={sendAllEmails}
					disabled={isLoading || !testEmail}
					class="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? '⏳ Sending All...' : '📬 Send All Templates'}
				</Button>
			</div>

			<!-- Results -->
			{#if result}
				<div class="mt-6 p-4 rounded-lg {result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
					<h3 class="font-semibold mb-2 {result.success ? 'text-green-800' : 'text-red-800'}">
						{result.success ? '✅ Success' : '❌ Error'}
					</h3>
					<p class="{result.success ? 'text-green-700' : 'text-red-700'} mb-2">
						{result.message}
					</p>

					{#if result.details}
						<p class="text-sm {result.success ? 'text-green-600' : 'text-red-600'}">
							Details: {result.details}
						</p>
					{/if}

					{#if result.results}
						<div class="mt-4">
							<h4 class="font-medium mb-2">Batch Results:</h4>
							<div class="space-y-2">
								{#each result.results as batchResult}
									<div class="flex items-center justify-between p-2 bg-white rounded border">
										<span class="font-medium">{templateLabels[batchResult.templateType as keyof typeof templateLabels]}</span>
										<span class="{batchResult.success ? 'text-green-600' : 'text-red-600'}">
											{batchResult.success ? '✅ Sent' : '❌ Failed'}
										</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if result.validation && !result.validation.valid}
						<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
							<p class="text-yellow-800 font-medium">⚠️ Template Configuration Issues:</p>
							<ul class="list-disc list-inside text-yellow-700 mt-1">
								{#each result.validation.missing as missing}
									<li>{missing}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Instructions -->
			<div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<h3 class="font-semibold text-blue-800 mb-2">📋 Instructions</h3>
				<ul class="list-disc list-inside text-blue-700 space-y-1">
					<li>Enter your email address to receive test emails</li>
					<li>Select a template type and customize the test data</li>
					<li>Click "Send" to test individual templates</li>
					<li>Click "Send All Templates" to test all templates at once</li>
					<li>Check your inbox for the test emails</li>
					<li>Verify templates display correctly in your email client</li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	/* Custom styles for better form appearance */
	input:focus,
	select:focus,
	textarea:focus {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
</style>
