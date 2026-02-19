<script>
	// 1. STARTUP COSTS (One-time capital expenditures)
	let startupCosts = $state([
		{ name: 'Lion & Shield Signage/Branding', price: 1500 },
		{ name: 'Initial Printer Purchase/Deposit', price: 2500 },
		{ name: 'Legal Setup & Florida Incorporation', price: 800 },
		{ name: 'Furniture & Tech Setup', price: 2000 }
	]);

	// 2. FIXED COSTS (Monthly recurring)
	let fixedCosts = $state([
		{ name: 'Office Rent (Real Estate)', price: 1200 },
		{ name: 'Insurance & Utilities', price: 300 },
		{ name: 'Software Subs', price: 300 }
	]);

	// 3. VARIABLE COSTS (COGS per unit)
	let variableCosts = $state([
		{ name: 'Paper & Ink', price: 0.40 },
		{ name: 'Labor/Handling', price: 0.10 }
	]);

	// TARGETS & MARGINS (editable)
	let targets = $state([1000, 10000, 100000]);
	const margins = [0.10, 0.20, 0.30];

	// CUSTOM PRICE ANALYSIS (state must be at top level)
	let customPrices = $state([2.00, 5.00, 10.00]);

	// REVENUE RUNES
	const totalStartup = $derived(startupCosts.reduce((acc, item) => acc + item.price, 0));
	const totalFixed = $derived(fixedCosts.reduce((acc, item) => acc + item.price, 0));
	const unitCogs = $derived(variableCosts.reduce((acc, item) => acc + item.price, 0));

	function calcPrice(margin) { return unitCogs / (1 - margin); }

	function addItem(list) { list.push({ name: 'New Item', price: 0 }); }

	// Helper functions for per-margin KPIs
	function getBreakeven(margin) {
		const price = calcPrice(margin);
		return Math.ceil(totalFixed / (price - unitCogs));
	}

	function getUnitsNeeded(margin, targetMRR) {
		const price = calcPrice(margin);
		return Math.ceil((targetMRR + totalFixed) / price);
	}

	function getMonthlyProfit(margin, targetMRR) {
		const units = getUnitsNeeded(margin, targetMRR);
		return targetMRR - (units * unitCogs) - totalFixed;
	}

	function getPayback(margin, targetMRR) {
		const profit = getMonthlyProfit(margin, targetMRR);
		if (profit <= 0) return '∞';
		return (totalStartup / profit).toFixed(1);
	}
	
	function getContribution(margin) {
		return (margin / 2 * 100).toFixed(0); // Half of margin target
	}

	function getPostContributionProfit(margin, targetMRR) {
		const profit = getMonthlyProfit(margin, targetMRR);
		const contributionRate = margin / 2;
		return profit * (1 - contributionRate);
	}
</script>

<div class="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen font-sans">
	<header class="mb-10 flex justify-between items-end border-b-2 border-slate-200 pb-6">
		<div>
			<h1 class="text-4xl font-black text-slate-900 tracking-tight">KING & PARTNER</h1>
			<p class="text-slate-500 font-medium">Business Intelligence Ledger • Florida Edition</p>
		</div>
		<div class="text-right">
			<p class="text-xs font-bold text-slate-400 uppercase">Capital to Launch</p>
			<p class="text-3xl font-mono font-bold text-blue-600">${totalStartup.toLocaleString()}</p>
		</div>
	</header>

	<!-- HELP & EXPLANATION SECTION -->
	<div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
		<h2 class="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
			<span>📚</span> How This Calculator Works
		</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
			<div class="bg-white p-4 rounded-lg shadow-sm">
				<h3 class="font-bold text-slate-800 mb-2 flex items-center gap-2">
					<span class="text-blue-600">💰</span> Cost Structure
				</h3>
				<ul class="space-y-2 text-slate-600">
					<li><strong class="text-blue-700">Startup Costs:</strong> One-time capital needed to launch (equipment, legal, setup)</li>
					<li><strong class="text-slate-700">Fixed Costs:</strong> Monthly recurring expenses regardless of sales (rent, insurance, software)</li>
					<li><strong class="text-green-700">Unit COGS:</strong> Cost to produce each unit (materials, labor). Variable costs that scale with production.</li>
				</ul>
			</div>

			<div class="bg-white p-4 rounded-lg shadow-sm">
				<h3 class="font-bold text-slate-800 mb-2 flex items-center gap-2">
					<span class="text-purple-600">🎯</span> Pricing Logic
				</h3>
				<ul class="space-y-2 text-slate-600">
					<li><strong>Margin Target:</strong> Desired profit percentage. Formula: <code class="bg-slate-100 px-1 rounded">Price = COGS ÷ (1 - Margin)</code></li>
					<li><strong>Example:</strong> $0.50 COGS with 20% margin = $0.625 price (you keep $0.125 profit per unit)</li>
					<li><strong>Higher margins</strong> = higher prices but fewer units needed to hit revenue targets</li>
				</ul>
			</div>

			<div class="bg-white p-4 rounded-lg shadow-sm">
				<h3 class="font-bold text-slate-800 mb-2 flex items-center gap-2">
					<span class="text-red-600">📊</span> Key Metrics
				</h3>
				<ul class="space-y-2 text-slate-600">
					<li><strong>Breakeven:</strong> Units/month needed to cover fixed costs (profit = $0)</li>
					<li><strong>Units Needed:</strong> Sales required to hit MRR target + cover all costs</li>
					<li><strong>Monthly Profit:</strong> Revenue - (Unit COGS × Units) - Fixed Costs</li>
					<li><strong>Payback Period:</strong> Months to recover startup investment from monthly profit</li>
				</ul>
			</div>

			<div class="bg-white p-4 rounded-lg shadow-sm">
				<h3 class="font-bold text-slate-800 mb-2 flex items-center gap-2">
					<span class="text-green-600">🤝</span> Contribution Model
				</h3>
				<ul class="space-y-2 text-slate-600">
					<li><strong>Contribution Rate:</strong> 50% of your margin target goes to contributions/partnerships</li>
					<li><strong>Example:</strong> 20% margin = 10% contribution rate</li>
					<li><strong>Post-Contribution Profit:</strong> What you keep after paying partners/contributions</li>
				</ul>
			</div>
		</div>

		<div class="mt-4 bg-blue-100 border border-blue-300 rounded p-3">
			<p class="text-xs text-blue-900">
				<strong>💡 How to Use:</strong> Edit the costs in the boxes below. The calculator will automatically show profitability at 10%, 20%, and 30% margin targets. 
				Adjust MRR targets to model different growth scenarios. All fields are editable—experiment to find your optimal pricing strategy!
			</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
		<div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
			<h2 class="font-bold text-blue-700 mb-4 flex justify-between">Startup Costs <button onclick={() => addItem(startupCosts)} class="text-xs bg-blue-50 px-2 py-1 rounded">+</button></h2>
			{#each startupCosts as item}
				<div class="flex gap-2 mb-2"><input class="flex-1 text-sm border-b" bind:value={item.name} /><input type="number" class="w-20 text-sm text-right" bind:value={item.price} /></div>
			{/each}
		</div>

		<div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
			<h2 class="font-bold text-slate-700 mb-4 flex justify-between">Monthly Fixed <button onclick={() => addItem(fixedCosts)} class="text-xs bg-slate-50 px-2 py-1 rounded">+</button></h2>
			{#each fixedCosts as item}
				<div class="flex gap-2 mb-2"><input class="flex-1 text-sm border-b" bind:value={item.name} /><input type="number" class="w-20 text-sm text-right" bind:value={item.price} /></div>
			{/each}
		</div>

		<div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
			<h2 class="font-bold text-green-700 mb-4 flex justify-between">Unit COGS <button onclick={() => addItem(variableCosts)} class="text-xs bg-green-50 px-2 py-1 rounded">+</button></h2>
			{#each variableCosts as item}
				<div class="flex gap-2 mb-2"><input class="flex-1 text-sm border-b" bind:value={item.name} /><input type="number" step="0.01" class="w-20 text-sm text-right" bind:value={item.price} /></div>
			{/each}
		</div>
	</div>

	<!-- Editable MRR Targets -->
	<div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
		<h2 class="font-bold text-purple-700 mb-3 text-sm uppercase">MRR Targets (Editable)</h2>
		<div class="flex flex-wrap gap-4">
			{#each targets as t, i}
				<div class="flex items-center gap-1">
					<span class="text-slate-400 text-sm">$</span>
					<input type="number" class="w-24 text-sm border-b border-purple-200 text-right font-mono" bind:value={targets[i]} />
				</div>
			{/each}
			<button onclick={() => targets.push(50000)} class="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">+ Add</button>
		</div>
		<p class="text-xs text-purple-600 mt-2">💡 These are monthly recurring revenue goals. Adjust to model different business scales.</p>
	</div>

	<!-- Custom Price Analysis -->
	<div class="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl shadow-sm border-2 border-orange-200 mb-6">
		<h2 class="font-bold text-orange-800 mb-2 text-lg flex items-center gap-2">
			<span>💰</span> Custom Price Analysis
		</h2>
		<p class="text-xs text-orange-700 mb-4">Set your own price and see what margin you'll actually get. Perfect for competitive pricing or testing specific price points.</p>
		
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			{#each customPrices as _, idx}
				{@const customPrice = customPrices[idx]}
				{@const calculatedMargin = (customPrice - unitCogs) / unitCogs > 0 ? (customPrice - unitCogs) / customPrice : 0}
				{@const marginPercent = calculatedMargin * 100}
				
				<div class="bg-white p-5 rounded-lg border border-orange-200 shadow-sm">
					<div class="mb-4">
						<label class="text-xs font-bold text-slate-500 uppercase block mb-2">Set Your Price</label>
						<div class="flex items-center gap-1">
							<span class="text-slate-400">$</span>
							<input 
								type="number" 
								step="0.01" 
								bind:value={customPrices[idx]}
								class="flex-1 text-2xl font-mono font-bold border-b-2 border-orange-300 text-right focus:border-orange-500 outline-none"
							/>
						</div>
					</div>
					
					<div class="space-y-3 pt-3 border-t border-orange-100">
						<div>
							<p class="text-xs font-bold text-orange-600 uppercase">Resulting Margin</p>
							<p class="text-3xl font-black {marginPercent > 0 ? 'text-green-600' : 'text-red-500'}">
								{marginPercent.toFixed(1)}%
							</p>
							<p class="text-[10px] text-slate-500 mt-1">
								{#if marginPercent < 0}
									⚠️ Losing money per unit!
								{:else if marginPercent < 10}
									Low margin - high volume needed
								{:else if marginPercent < 30}
									Balanced margin strategy
								{:else}
									Premium pricing strategy
								{/if}
							</p>
						</div>
						
						<div>
							<p class="text-xs font-bold text-slate-400 uppercase">Profit Per Unit</p>
							<p class="text-xl font-mono {(customPrice - unitCogs) > 0 ? 'text-green-600' : 'text-red-500'}">
								${(customPrice - unitCogs).toFixed(2)}
							</p>
						</div>
						
						<div>
							<p class="text-xs font-bold text-slate-400 uppercase">Breakeven Units/mo</p>
							<p class="text-xl font-mono text-blue-600">
								{customPrice > unitCogs ? Math.ceil(totalFixed / (customPrice - unitCogs)).toLocaleString() : '∞'}
							</p>
						</div>
						
						<!-- MRR Target Scenarios -->
						<div class="pt-3 border-t border-slate-100">
							<p class="text-xs font-bold text-purple-600 uppercase mb-2">Quick MRR Scenarios</p>
							{#each targets.slice(0, 2) as t}
								{@const unitsNeeded = Math.ceil((t + totalFixed) / customPrice)}
								{@const monthlyProfit = (unitsNeeded * customPrice) - (unitsNeeded * unitCogs) - totalFixed}
								<div class="mb-2">
									<div class="flex justify-between text-xs mb-1">
										<span class="text-slate-500">${t.toLocaleString()} MRR:</span>
										<span class="font-mono font-bold">{unitsNeeded.toLocaleString()} units</span>
									</div>
									<div class="text-[10px] text-slate-400">
										Profit: <span class="{monthlyProfit > 0 ? 'text-green-600' : 'text-red-500'} font-bold">
											${Math.abs(monthlyProfit).toLocaleString(undefined, {maximumFractionDigits: 0})}
										</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
		
		<div class="mt-4 bg-orange-100 border border-orange-300 rounded p-3">
			<p class="text-xs text-orange-800">
				<strong>💡 Use Case:</strong> If competitors charge $5, what's your margin? Type it in above! 
				Or if you need 25% margin minimum, find the lowest price that works. This works backwards from price → margin, 
				while the sections below work margin → price.
			</p>
		</div>
	</div>

	{#each margins as m}
		{@const p = calcPrice(m)}
		<div class="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden mb-6">
			<div class="bg-slate-900 text-white p-4 flex justify-between items-center">
				<h3 class="font-bold text-lg">{m * 100}% Margin Target</h3>
				<div class="text-right">
					<p class="text-2xl font-mono">${p.toFixed(2)} <span class="text-sm text-slate-400">per unit</span></p>
					<p class="text-xs text-slate-400">Contribution: {getContribution(m)}%</p>
				</div>
			</div>
			
			<!-- Per-MRR breakdown -->
			<div class="grid divide-x divide-slate-100" style="grid-template-columns: repeat({targets.length}, 1fr)">
				{#each targets as t}
					{@const profit = getMonthlyProfit(m, t)}
					{@const postProfit = getPostContributionProfit(m, t)}
					<div class="p-4">
						<div class="text-center mb-3 pb-3 border-b border-slate-100">
							<p class="text-xs font-bold text-purple-600 uppercase">${t.toLocaleString()} MRR</p>
						</div>
						
						<div class="space-y-3 text-center">
							<div>
								<p class="text-[10px] font-bold text-slate-400 uppercase">Units Needed</p>
								<p class="text-xl font-mono font-bold text-slate-900">{getUnitsNeeded(m, t).toLocaleString()}</p>
							</div>
							
							<div>
								<p class="text-[10px] font-bold text-slate-400 uppercase">Monthly Profit</p>
								<p class="text-lg font-mono font-bold {profit >= 0 ? 'text-green-600' : 'text-red-500'}">
									{profit >= 0 ? '' : '-'}${Math.abs(profit).toLocaleString(undefined, {maximumFractionDigits: 0})}
								</p>
							</div>
							
							<div>
								<p class="text-[10px] font-bold text-slate-400 uppercase">Payback</p>
								<p class="text-lg font-mono font-bold text-blue-600">{getPayback(m, t)} <span class="text-xs text-slate-400">mo</span></p>
							</div>
							
							<div class="pt-2 border-t border-slate-100">
								<p class="text-[10px] font-bold text-green-600 uppercase">Post-Contribution</p>
								<p class="text-lg font-mono font-bold {postProfit >= 0 ? 'text-green-700' : 'text-red-500'}">
									{postProfit >= 0 ? '' : '-'}${Math.abs(postProfit).toLocaleString(undefined, {maximumFractionDigits: 0})}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Bottom KPIs -->
			<div class="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-t border-slate-200">
				<div class="text-center">
					<p class="text-xs font-bold text-slate-500 uppercase mb-1">Breakeven</p>
					<p class="text-xl font-black text-slate-900">{getBreakeven(m).toLocaleString()}</p>
					<p class="text-[10px] text-slate-400">units/mo</p>
				</div>

				<div class="text-center">
					<p class="text-xs font-bold text-slate-500 uppercase mb-1">Contribution Rate</p>
					<p class="text-xl font-black text-green-600">{getContribution(m)}%</p>
					<p class="text-[10px] text-slate-400">of margin target</p>
				</div>

				<div class="text-center">
					<p class="text-xs font-bold text-red-600 uppercase mb-1">Burn Rate</p>
					<p class="text-xl font-black text-red-500">${totalFixed.toLocaleString()}</p>
					<p class="text-[10px] text-slate-400">monthly fixed</p>
				</div>
			</div>
		</div>
	{/each}
</div>