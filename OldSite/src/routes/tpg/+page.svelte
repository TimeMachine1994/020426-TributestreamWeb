<script lang="ts">
	import { completeWorkflow, downloadReport } from '$lib/tpg';
	
	let premiereOriginalText = $state('');
	let premiereEditedText = $state('');
	let officialText = $state('');
	let clipReportText = $state('');
	let statusMessage = $state('');
	let isProcessing = $state(false);
	let progressStage = $state('');
	let progressPercent = $state(0);
	let debugLog = $state<string[]>([]);
	let showDebug = $state(false);
	
	function addLog(message: string) {
		const timestamp = new Date().toLocaleTimeString();
		const logMessage = `[${timestamp}] ${message}`;
		console.log(logMessage);
		debugLog = [...debugLog, logMessage];
	}
	
	async function processTranscripts() {
		console.log('=== TPG PROCESSING STARTED ===');
		addLog('🚀 Starting transcript processing...');
		
		// Reset state
		clipReportText = '';
		debugLog = [];
		progressPercent = 0;
		
		// Validate inputs
		addLog('📝 Validating inputs...');
		if (!premiereOriginalText.trim()) {
			statusMessage = '❌ Please paste Original Premiere Pro transcript';
			addLog('❌ Missing: Original Premiere Pro transcript');
			return;
		}
		if (!premiereEditedText.trim()) {
			statusMessage = '❌ Please paste Edited Premiere Pro transcript';
			addLog('❌ Missing: Edited Premiere Pro transcript');
			return;
		}
		if (!officialText.trim()) {
			statusMessage = '❌ Please paste Official transcript';
			addLog('❌ Missing: Official transcript');
			return;
		}
		
		addLog(`✅ Input validation passed`);
		addLog(`📊 Original Premiere: ${premiereOriginalText.length} characters`);
		addLog(`📊 Edited Premiere: ${premiereEditedText.length} characters`);
		addLog(`📊 Official: ${officialText.length} characters`);
		
		isProcessing = true;
		statusMessage = '⏳ Processing transcripts...';
		progressStage = 'Initializing...';
		progressPercent = 5;
		
		try {
			// Stage 1: Parsing
			progressStage = 'Parsing transcripts...';
			progressPercent = 10;
			addLog('🔍 Stage 1: Parsing transcripts...');
			
			await new Promise(resolve => setTimeout(resolve, 100)); // Allow UI update
			
			// Stage 2: Building bridge
			progressStage = 'Building bridge map...';
			progressPercent = 20;
			addLog('🌉 Stage 2: Building bridge map...');
			addLog('⚠️ This may take 30-60 seconds for large files...');
			
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Run complete workflow with progress callback
			addLog('⚙️ Running complete workflow...');
			const result = await completeWorkflow(
				premiereOriginalText,
				premiereEditedText,
				officialText,
				{
					bridgeSaveAs: 'tpg-bridge',
					reportFormat: 'detailed',
					verbose: true,
					onBridgeProgress: (current: number, total: number, percent: number) => {
						// Update progress: 20% to 80% during bridge building
						progressPercent = 20 + (percent * 0.6);
						progressStage = `Building bridge: ${current}/${total} blocks (${percent.toFixed(0)}%)`;
						
						if (current % 20 === 0) {
							addLog(`📊 Bridge progress: ${current}/${total} blocks matched`);
						}
					}
				}
			);
			
			progressPercent = 80;
			addLog(`✅ Workflow completed successfully`);
			addLog(`📊 Bridge map size: ${result.bridgeMap.size} mappings`);
			addLog(`📊 Report segments: ${result.report.summary.totalSegments}`);
			addLog(`📊 Report gaps: ${result.report.summary.totalGaps}`);
			
			// Stage 3: Formatting
			progressStage = 'Formatting report...';
			progressPercent = 90;
			addLog('📄 Stage 3: Formatting report...');
			
			// Display result
			clipReportText = result.formatted;
			
			progressPercent = 100;
			progressStage = 'Complete!';
			statusMessage = `✅ Success! Generated ${result.report.summary.totalSegments} segments with ${result.report.summary.totalGaps} gaps`;
			
			addLog(`✅ Processing complete!`);
			addLog(`📊 Total video duration: ${result.report.summary.totalVideoDuration.toFixed(1)}s`);
			addLog(`📊 Coverage: ${result.report.summary.coveragePercent.toFixed(1)}%`);
			
			console.log('=== TPG PROCESSING COMPLETE ===');
			
		} catch (error) {
			progressStage = 'Error!';
			progressPercent = 0;
			console.error('=== TPG PROCESSING ERROR ===', error);
			addLog(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
			if (error instanceof Error && error.stack) {
				addLog(`Stack trace: ${error.stack}`);
			}
			statusMessage = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
		} finally {
			isProcessing = false;
		}
	}
	
	function downloadClipReport() {
		if (!clipReportText) {
			statusMessage = '❌ No report to download';
			return;
		}
		
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
		downloadReport(clipReportText, `clip-report-${timestamp}.txt`);
		statusMessage = '✅ Report downloaded';
	}
	
	function clearAll() {
		premiereOriginalText = '';
		premiereEditedText = '';
		officialText = '';
		clipReportText = '';
		statusMessage = '';
		debugLog = [];
		progressPercent = 0;
		progressStage = '';
	}
	
	async function loadSampleData() {
		addLog('📂 Loading sample data from files...');
		statusMessage = '⏳ Loading sample data...';
		
		try {
			// Load sample files via API
			const [premOriginal, premEdited, official] = await Promise.all([
				fetch('/tpg/api/sample?file=premtxt.txt').then(r => r.text()),
				fetch('/tpg/api/sample?file=editprem.txt').then(r => r.text()),
				fetch('/tpg/api/sample?file=officialtxt.txt').then(r => r.text())
			]);
			
			premiereOriginalText = premOriginal;
			premiereEditedText = premEdited;
			officialText = official;
			
			statusMessage = '✅ Sample data loaded successfully!';
			addLog('✅ Sample data loaded - ready to process');
			addLog(`📊 Loaded ${premOriginal.length + premEdited.length + official.length} total characters`);
		} catch (error) {
			statusMessage = '❌ Failed to load sample data';
			addLog(`❌ Error loading sample data: ${error}`);
			console.error('Load sample data error:', error);
		}
	}
	
	async function runDiagnostics() {
		const { parseOriginalPremiere, parseOfficialTranscript } = await import('$lib/tpg');
		const { findTextInOfficial } = await import('$lib/tpg/matching/textMatcher');
		const { normalizeText } = await import('$lib/tpg/matching/textNormalizer');
		
		addLog('🔬 Running diagnostics...');
		showDebug = true;
		statusMessage = '🔬 Running diagnostics...';
		
		try {
			// Parse transcripts
			const premBlocks = parseOriginalPremiere(premiereOriginalText);
			const officialLines = parseOfficialTranscript(officialText);
			
			addLog(`📊 Parsed ${premBlocks.length} Premiere blocks`);
			addLog(`📊 Parsed ${officialLines.length} Official lines`);
			
			if (premBlocks.length > 0) {
				const firstBlock = premBlocks[0];
				addLog(`\n🔍 First Premiere Block:`);
				addLog(`  Timecode: ${firstBlock.startTime} - ${firstBlock.endTime}`);
				addLog(`  Speaker: ${firstBlock.speaker}`);
				addLog(`  Content: "${firstBlock.content.substring(0, 150)}..."`);
				addLog(`  Normalized: "${normalizeText(firstBlock.content).substring(0, 150)}..."`);
			}
			
			if (officialLines.length > 0) {
				const contentLines = officialLines.filter(l => l.content.length > 0);
				const firstOfficialLines = contentLines.slice(0, 10);
				addLog(`\n🔍 First 10 Official Lines with content:`);
				firstOfficialLines.forEach(line => {
					addLog(`  ${line.pageLineId}: "${line.content}"`);
				});
			}
			
			// Try to match first block
			if (premBlocks.length > 0 && officialLines.length > 0) {
				const firstBlock = premBlocks[0];
				addLog(`\n🔬 Testing text matching with first block...`);
				
				const match = findTextInOfficial(firstBlock.content, officialLines, 0, {
					minSimilarity: 0.85,
					maxSearchWindow: 100,
					maxWindowSize: 10
				});
				
				if (match) {
					addLog(`✅ MATCH FOUND!`);
					addLog(`  Confidence: ${(match.confidence * 100).toFixed(1)}%`);
					addLog(`  Location: Page ${match.startPage}, Line ${match.startLine}`);
					addLog(`  Matched text: "${match.matchedText.substring(0, 150)}..."`);
				} else {
					addLog(`❌ NO MATCH FOUND with 85% threshold`);
					addLog(`  Try lowering the similarity threshold`);
					
					// Try with lower threshold
					addLog(`\n🔬 Trying with 50% threshold...`);
					const lowerMatch = findTextInOfficial(firstBlock.content, officialLines, 0, {
						minSimilarity: 0.5,
						maxSearchWindow: 200,
						maxWindowSize: 15
					});
					
					if (lowerMatch) {
						addLog(`⚠️  MATCH FOUND with lower threshold (50%)!`);
						addLog(`  Confidence: ${(lowerMatch.confidence * 100).toFixed(1)}%`);
						addLog(`  Location: Page ${lowerMatch.startPage}, Line ${lowerMatch.startLine}`);
						addLog(`  Matched text: "${lowerMatch.matchedText.substring(0, 150)}..."`);
						addLog(`\n💡 SOLUTION: Lower the similarity threshold to ${(lowerMatch.confidence * 100).toFixed(0)}% or less`);
					} else {
						addLog(`❌ No match even with 50% threshold`);
						addLog(`\n🔍 Checking if transcripts are related...`);
						
						// Show first few words comparison
						const premWords = normalizeText(firstBlock.content).split(' ').slice(0, 10).join(' ');
						const officialWords = officialLines.filter(l => l.content).slice(0, 5).map(l => 
							normalizeText(l.content).split(' ').slice(0, 10).join(' ')
						);
						
						addLog(`\nPremiere first words: "${premWords}"`);
						addLog(`\nOfficial first words:`);
						officialWords.forEach((words, i) => addLog(`  Line ${i}: "${words}"`));
						addLog(`\n❌ The transcripts may not match or have very different formatting`);
					}
				}
			}
			
			statusMessage = '✅ Diagnostics complete - check debug console';
		} catch (error) {
			console.error('Diagnostics error:', error);
			addLog(`❌ Diagnostics error: ${error}`);
			statusMessage = '❌ Diagnostics failed';
		}
	}
</script>

<svelte:head>
	<title>TPG - TributeStream</title>
	<meta name="description" content="TPG page" />
</svelte:head>

<div class="tpg-page">
	<div class="container">
		<div class="content-wrapper">
			<h1>TPG - Transcript Processing</h1>
			
			<div class="instructions">
				<div style="display: flex; justify-content: space-between; align-items: start;">
					<div>
						<p><strong>Instructions:</strong> Paste your transcripts below and click "Generate Clip Report"</p>
						<ol>
							<li>Paste the <strong>Original Premiere Pro</strong> transcript (full deposition)</li>
							<li>Paste the <strong>Edited Premiere Pro</strong> transcript (final video)</li>
							<li>Paste the <strong>Official Transcript</strong> (legal record with page:line numbers)</li>
						</ol>
					</div>
					<button class="btn btn-secondary" onclick={loadSampleData} style="flex-shrink: 0;">
						📂 Load Sample Data
					</button>
				</div>
			</div>
			
			<div class="textbox-grid">
				<!-- Original Premiere Pro -->
				<div class="textbox-container">
					<h3 class="textbox-header">Original Premiere Pro</h3>
					<textarea
						bind:value={premiereOriginalText}
						class="textbox"
						placeholder="Paste original Premiere Pro transcript here..."
						rows="20"
					></textarea>
				</div>

				<!-- Edited Premiere Pro -->
				<div class="textbox-container">
					<h3 class="textbox-header">Edited Premiere Pro</h3>
					<textarea
						bind:value={premiereEditedText}
						class="textbox"
						placeholder="Paste edited Premiere Pro transcript here..."
						rows="20"
					></textarea>
				</div>

				<!-- Official Transcript -->
				<div class="textbox-container">
					<h3 class="textbox-header">Official Transcript</h3>
					<textarea
						bind:value={officialText}
						class="textbox"
						placeholder="Paste official transcript here..."
						rows="20"
					></textarea>
				</div>
			</div>
			
			<!-- Action Buttons -->
			<div class="actions">
				<button 
					class="btn btn-primary" 
					onclick={processTranscripts}
					disabled={isProcessing}
				>
					{isProcessing ? '⏳ Processing...' : '🚀 Generate Clip Report'}
				</button>
				
				<button 
					class="btn btn-secondary" 
					onclick={downloadClipReport}
					disabled={!clipReportText || isProcessing}
				>
					📥 Download Report
				</button>
				
				<button 
					class="btn btn-ghost" 
					onclick={clearAll}
					disabled={isProcessing}
				>
					🗑️ Clear All
				</button>
				
				<button 
					class="btn btn-ghost" 
					onclick={() => showDebug = !showDebug}
				>
					{showDebug ? '🔼 Hide Debug' : '🔽 Show Debug'}
				</button>
				
				<button 
					class="btn btn-ghost" 
					onclick={runDiagnostics}
					disabled={!premiereOriginalText || !officialText || isProcessing}
				>
					🔬 Run Diagnostics
				</button>
			</div>
			
			<!-- Progress Bar -->
			{#if isProcessing}
				<div class="progress-container">
					<div class="progress-info">
						<span class="progress-stage">{progressStage}</span>
						<span class="progress-percent">{progressPercent}%</span>
					</div>
					<div class="progress-bar">
						<div class="progress-fill" style="width: {progressPercent}%"></div>
					</div>
				</div>
			{/if}
			
			<!-- Status Message -->
			{#if statusMessage}
				<div class="status-message {statusMessage.startsWith('✅') ? 'success' : statusMessage.startsWith('❌') ? 'error' : 'info'}">
					{statusMessage}
				</div>
			{/if}
			
			<!-- Debug Console -->
			{#if showDebug && debugLog.length > 0}
				<div class="debug-console">
					<h3 class="debug-header">🐛 Debug Console</h3>
					<div class="debug-log">
						{#each debugLog as log}
							<div class="log-entry">{log}</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- Clip Report Output -->
			{#if clipReportText}
				<div class="report-section">
					<h3 class="textbox-header">📋 Clip Report</h3>
					<textarea
						bind:value={clipReportText}
						class="textbox report-output"
						readonly
						rows="30"
					></textarea>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.tpg-page {
		min-height: 100vh;
		padding: 2rem 1rem;
		background-color: #fafafa;
	}

	.container {
		max-width: 1400px;
		margin: 0 auto;
	}

	.content-wrapper {
		padding: 2rem 1rem;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		font-weight: 600;
		text-align: center;
		color: #1e293b;
		font-family: 'ABeeZee', system-ui, sans-serif;
	}
	
	.instructions {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin: 1.5rem 0;
	}
	
	.instructions p {
		margin: 0 0 1rem 0;
		color: #374151;
	}
	
	.instructions ol {
		margin: 0;
		padding-left: 1.5rem;
		color: #6b7280;
	}
	
	.instructions li {
		margin: 0.5rem 0;
	}

	.textbox-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.textbox-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.textbox-header {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		padding: 0.5rem 0;
		color: #1e293b;
		font-family: 'ABeeZee', system-ui, sans-serif;
	}

	.textbox {
		width: 100%;
		padding: 1rem;
		border: 2px solid #d1d5db;
		border-radius: 0.5rem;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		resize: vertical;
		transition: border-color 0.2s;
		background: white;
	}

	.textbox:focus {
		outline: none;
		border-color: #D5BA7F;
		box-shadow: 0 0 0 3px rgba(213, 186, 127, 0.1);
	}

	.textbox::placeholder {
		color: #9ca3af;
	}
	
	.textbox.report-output {
		background: #f9fafb;
		border-color: #D5BA7F;
	}
	
	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin: 2rem 0;
		flex-wrap: wrap;
	}
	
	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		border: 2px solid transparent;
		font-family: 'ABeeZee', system-ui, sans-serif;
	}
	
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn-primary {
		background: #D5BA7F;
		color: white;
		border-color: #D5BA7F;
	}
	
	.btn-primary:hover:not(:disabled) {
		background: #c4a96f;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(213, 186, 127, 0.3);
	}
	
	.btn-secondary {
		background: white;
		color: #D5BA7F;
		border-color: #D5BA7F;
	}
	
	.btn-secondary:hover:not(:disabled) {
		background: #fef3e2;
		transform: translateY(-2px);
	}
	
	.btn-ghost {
		background: transparent;
		color: #6b7280;
		border-color: #d1d5db;
	}
	
	.btn-ghost:hover:not(:disabled) {
		background: #f3f4f6;
		border-color: #9ca3af;
	}
	
	.status-message {
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		margin: 1.5rem 0;
		font-weight: 500;
		text-align: center;
	}
	
	.status-message.success {
		background: #d1fae5;
		color: #065f46;
		border: 2px solid #10b981;
	}
	
	.status-message.error {
		background: #fee2e2;
		color: #991b1b;
		border: 2px solid #ef4444;
	}
	
	.status-message.info {
		background: #dbeafe;
		color: #1e40af;
		border: 2px solid #3b82f6;
	}
	
	.report-section {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid #e5e7eb;
	}
	
	/* Progress Bar */
	.progress-container {
		margin: 2rem 0;
		padding: 1.5rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
	}
	
	.progress-info {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.75rem;
		font-weight: 600;
		color: #374151;
	}
	
	.progress-stage {
		color: #D5BA7F;
	}
	
	.progress-percent {
		color: #6b7280;
	}
	
	.progress-bar {
		width: 100%;
		height: 24px;
		background: #f3f4f6;
		border-radius: 12px;
		overflow: hidden;
		border: 2px solid #e5e7eb;
	}
	
	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #D5BA7F 0%, #c4a96f 100%);
		transition: width 0.3s ease;
		border-radius: 10px;
	}
	
	/* Debug Console */
	.debug-console {
		margin: 2rem 0;
		background: #1e293b;
		border: 2px solid #334155;
		border-radius: 0.5rem;
		overflow: hidden;
	}
	
	.debug-header {
		padding: 1rem 1.5rem;
		margin: 0;
		background: #0f172a;
		color: #f1f5f9;
		font-size: 1rem;
		font-weight: 600;
		border-bottom: 2px solid #334155;
	}
	
	.debug-log {
		padding: 1rem;
		max-height: 400px;
		overflow-y: auto;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.875rem;
	}
	
	.log-entry {
		padding: 0.5rem 0.75rem;
		color: #94a3b8;
		border-bottom: 1px solid #334155;
		line-height: 1.5;
	}
	
	.log-entry:last-child {
		border-bottom: none;
	}
	
	.log-entry:hover {
		background: #334155;
	}

	/* Responsive design */
	@media (max-width: 1024px) {
		.textbox-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}

		.content-wrapper {
			padding: 1rem 0.5rem;
		}

		.textbox {
			font-size: 0.8rem;
		}
		
		.actions {
			flex-direction: column;
		}
		
		.btn {
			width: 100%;
		}
	}
</style>
