<script lang="ts">
	import { onMount } from 'svelte';

	let streamId = $state('');
	let testResults = $state<any>({});
	let testing = $state(false);
	let logs = $state<string[]>([]);

	function addLog(message: string) {
		logs = [...logs, `${new Date().toLocaleTimeString()}: ${message}`];
		console.log(message);
	}

	async function testStream() {
		if (!streamId.trim()) {
			addLog('❌ Please enter a stream ID');
			return;
		}

		testing = true;
		testResults = {};
		logs = [];

		addLog('🧪 Starting stream tests...');

		// Test 1: Check if stream exists in database
		try {
			addLog('📋 Test 1: Checking stream in database...');
			const streamResponse = await fetch(`/api/streams/${streamId}`);
			const streamData = await streamResponse.json();

			if (streamData.success) {
				testResults.streamExists = true;
				testResults.streamData = streamData.stream;
				addLog(`✅ Stream found: ${streamData.stream.title} (Status: ${streamData.stream.status})`);
			} else {
				testResults.streamExists = false;
				addLog(`❌ Stream not found: ${streamData.error}`);
			}
		} catch (error) {
			testResults.streamExists = false;
			addLog(`❌ Error checking stream: ${error}`);
		}

		// Test 2: Test HLS API endpoint
		try {
			addLog('📺 Test 2: Testing HLS API endpoint...');
			const hlsResponse = await fetch(`/api/streams/${streamId}/hls`);
			const hlsData = await hlsResponse.json();

			if (hlsData.success) {
				testResults.hlsApi = true;
				testResults.hlsUrl = hlsData.hlsUrl;
				addLog(`✅ HLS API working: ${hlsData.hlsUrl}`);
			} else {
				testResults.hlsApi = false;
				addLog(`❌ HLS API failed: ${hlsData.error}`);
			}
		} catch (error) {
			testResults.hlsApi = false;
			addLog(`❌ Error testing HLS API: ${error}`);
		}

		// Test 3: Test direct HLS URL
		if (testResults.hlsUrl) {
			try {
				addLog('🔗 Test 3: Testing direct HLS URL...');
				const directResponse = await fetch(testResults.hlsUrl, { method: 'HEAD' });

				if (directResponse.ok) {
					testResults.hlsUrlAccessible = true;
					addLog(`✅ Direct HLS URL accessible (${directResponse.status})`);
				} else {
					testResults.hlsUrlAccessible = false;
					addLog(`❌ Direct HLS URL failed (${directResponse.status})`);
				}
			} catch (error) {
				testResults.hlsUrlAccessible = false;
				addLog(`❌ Error testing direct HLS URL: ${error}`);
			}
		}

		// Test 4: Test embedding page
		try {
			addLog('🌐 Test 4: Testing HLS embedding page...');
			const embedResponse = await fetch(`/hls/${streamId}`, { method: 'HEAD' });

			if (embedResponse.ok) {
				testResults.embedPageAccessible = true;
				addLog(`✅ HLS embedding page accessible (${embedResponse.status})`);
			} else {
				testResults.embedPageAccessible = false;
				addLog(`❌ HLS embedding page failed (${embedResponse.status})`);
			}
		} catch (error) {
			testResults.embedPageAccessible = false;
			addLog(`❌ Error testing embedding page: ${error}`);
		}

		// Test 5: Test WHEP API endpoint
		try {
			addLog('🎯 Test 5: Testing WHEP API endpoint...');
			const whepResponse = await fetch(`/api/streams/${streamId}/whep`);
			const whepData = await whepResponse.json();

			if (whepData.success) {
				testResults.whepApi = true;
				testResults.whepUrl = whepData.whepUrl;
				addLog(`✅ WHEP API working: ${whepData.whepUrl}`);
			} else {
				testResults.whepApi = false;
				addLog(`❌ WHEP API failed: ${whepData.error}`);
			}
		} catch (error) {
			testResults.whepApi = false;
			addLog(`❌ Error testing WHEP API: ${error}`);
		}

		testing = false;
		addLog('🏁 Tests completed!');
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		addLog(`📋 Copied to clipboard: ${text}`);
	}
</script>

<div class="mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-3xl font-bold">🧪 Stream Testing Tool</h1>

	<div class="mb-6 rounded-lg bg-white p-6 shadow">
		<h2 class="mb-4 text-xl font-semibold">Test Stream URLs</h2>

		<div class="mb-4 flex gap-4">
			<input
				bind:value={streamId}
				placeholder="Enter Stream ID"
				class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
			/>
			<button
				onclick={testStream}
				disabled={testing}
				class="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{testing ? '🔄 Testing...' : '🧪 Run Tests'}
			</button>
		</div>

		{#if Object.keys(testResults).length > 0}
			<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
				<!-- Stream Status -->
				<div
					class="rounded-lg p-4 {testResults.streamExists
						? 'border border-green-200 bg-green-50'
						: 'border border-red-200 bg-red-50'}"
				>
					<h3 class="mb-2 font-semibold">📋 Stream Database</h3>
					<p class="text-sm">
						{testResults.streamExists ? '✅ Found' : '❌ Not Found'}
					</p>
					{#if testResults.streamData}
						<p class="mt-1 text-xs text-gray-600">
							Status: {testResults.streamData.status} | Title: {testResults.streamData.title}
						</p>
					{/if}
				</div>

				<!-- HLS API -->
				<div
					class="rounded-lg p-4 {testResults.hlsApi
						? 'border border-green-200 bg-green-50'
						: 'border border-red-200 bg-red-50'}"
				>
					<h3 class="mb-2 font-semibold">📺 HLS API</h3>
					<p class="text-sm">
						{testResults.hlsApi ? '✅ Working' : '❌ Failed'}
					</p>
					{#if testResults.hlsUrl}
						<button
							onclick={() => copyToClipboard(testResults.hlsUrl)}
							class="mt-1 text-xs text-blue-600 hover:text-blue-800"
						>
							📋 Copy HLS URL
						</button>
					{/if}
				</div>

				<!-- Direct HLS -->
				<div
					class="rounded-lg p-4 {testResults.hlsUrlAccessible
						? 'border border-green-200 bg-green-50'
						: 'border border-red-200 bg-red-50'}"
				>
					<h3 class="mb-2 font-semibold">🔗 Direct HLS URL</h3>
					<p class="text-sm">
						{testResults.hlsUrlAccessible ? '✅ Accessible' : '❌ Not Accessible'}
					</p>
				</div>

				<!-- Embedding Page -->
				<div
					class="rounded-lg p-4 {testResults.embedPageAccessible
						? 'border border-green-200 bg-green-50'
						: 'border border-red-200 bg-red-50'}"
				>
					<h3 class="mb-2 font-semibold">🌐 Embedding Page</h3>
					<p class="text-sm">
						{testResults.embedPageAccessible ? '✅ Accessible' : '❌ Not Accessible'}
					</p>
					{#if testResults.embedPageAccessible}
						<button
							onclick={() => copyToClipboard(`${window.location.origin}/hls/${streamId}`)}
							class="mt-1 text-xs text-blue-600 hover:text-blue-800"
						>
							📋 Copy Embed URL
						</button>
					{/if}
				</div>

				<!-- WHEP API -->
				<div
					class="rounded-lg p-4 {testResults.whepApi
						? 'border border-green-200 bg-green-50'
						: 'border border-red-200 bg-red-50'}"
				>
					<h3 class="mb-2 font-semibold">🎯 WHEP API</h3>
					<p class="text-sm">
						{testResults.whepApi ? '✅ Working' : '❌ Failed'}
					</p>
					{#if testResults.whepUrl}
						<button
							onclick={() => copyToClipboard(testResults.whepUrl)}
							class="mt-1 text-xs text-blue-600 hover:text-blue-800"
						>
							📋 Copy WHEP URL
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- OBS Instructions -->
	{#if testResults.hlsUrl || testResults.embedPageAccessible}
		<div class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
			<h2 class="mb-4 text-xl font-semibold">🎬 OBS Setup Instructions</h2>

			{#if testResults.hlsUrl}
				<div class="mb-4">
					<h3 class="mb-2 font-semibold text-green-700">✅ Option 1: Media Source (Recommended)</h3>
					<ol class="ml-4 list-inside list-decimal space-y-1 text-sm">
						<li>Add → Media Source</li>
						<li>Uncheck "Local File"</li>
						<li>
							Input: <code class="rounded bg-gray-100 px-2 py-1 text-xs">{testResults.hlsUrl}</code>
						</li>
						<li>Check "Restart playback when source becomes active"</li>
					</ol>
				</div>
			{/if}

			{#if testResults.embedPageAccessible}
				<div class="mb-4">
					<h3 class="mb-2 font-semibold text-blue-700">✅ Option 2: Browser Source</h3>
					<ol class="ml-4 list-inside list-decimal space-y-1 text-sm">
						<li>Add → Browser Source</li>
						<li>
							URL: <code class="rounded bg-gray-100 px-2 py-1 text-xs"
								>{window.location.origin}/hls/{streamId}</code
							>
						</li>
						<li>Width: 1920, Height: 1080</li>
						<li>Check "Control audio via OBS"</li>
					</ol>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Logs -->
	{#if logs.length > 0}
		<div class="rounded-lg bg-gray-50 p-6">
			<h2 class="mb-4 text-xl font-semibold">📝 Test Logs</h2>
			<div class="max-h-64 overflow-y-auto rounded bg-black p-4 font-mono text-sm text-green-400">
				{#each logs as log}
					<div>{log}</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	code {
		word-break: break-all;
	}
</style>
