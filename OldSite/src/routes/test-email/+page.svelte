<script lang="ts">
	import { Button } from '$lib/components/minimal-modern';
	
	let testEmail = $state('');
	let result = $state('');
	let isLoading = $state(false);

	async function testEmailSending() {
		if (!testEmail) {
			result = 'Please enter an email address';
			return;
		}

		isLoading = true;
		result = '';

		try {
			const response = await fetch('/api/test-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ testEmail })
			});

			const data = await response.json();
			
			if (response.ok) {
				result = `✅ Success: ${data.message}\n\nTemplate IDs:\n${JSON.stringify(data.templateIds, null, 2)}`;
			} else {
				result = `❌ Error: ${data.error}\n\nDetails: ${data.details || 'No details'}\n\nTemplate IDs:\n${JSON.stringify(data.templateIds, null, 2)}`;
			}
		} catch (error) {
			result = `❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Email Testing - Tributestream</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12">
	<div class="mx-auto max-w-2xl px-4">
		<div class="bg-white rounded-lg shadow p-8">
			<h1 class="text-2xl font-bold mb-6">Email Configuration Test</h1>
			
			<div class="space-y-4">
				<div>
					<label for="testEmail" class="block text-sm font-medium text-gray-700 mb-2">
						Test Email Address
					</label>
					<input
						type="email"
						id="testEmail"
						bind:value={testEmail}
						placeholder="your@email.com"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<Button
					onclick={testEmailSending}
					disabled={isLoading}
					theme="minimal"
					class="w-full"
				>
					{isLoading ? 'Testing...' : 'Test Email Sending'}
				</Button>

				{#if result}
					<div class="mt-6 p-4 bg-gray-100 rounded-md">
						<h3 class="font-semibold mb-2">Result:</h3>
						<pre class="text-sm whitespace-pre-wrap">{result}</pre>
					</div>
				{/if}
			</div>

			<div class="mt-8 p-4 bg-blue-50 rounded-md">
				<h3 class="font-semibold text-blue-800 mb-2">Instructions:</h3>
				<ul class="text-sm text-blue-700 space-y-1">
					<li>1. Enter your email address above</li>
					<li>2. Click "Test Email Sending" to test the contact form confirmation email</li>
					<li>3. Check the result and your email inbox</li>
					<li>4. If there are errors, check your SendGrid configuration</li>
				</ul>
			</div>
		</div>
	</div>
</div>
