<script lang="ts">
	import type { Tier } from '$lib/features/booking/types';
	import type { PricingConfig } from '$lib/config/pricing';
	import { DEFAULT_PRICING, TIER_FEATURES } from '$lib/config/pricing';

	let {
		selectedTier,
		onchange,
		pricing = DEFAULT_PRICING
	}: {
		selectedTier: Tier;
		onchange: (tier: Tier) => void;
		pricing?: PricingConfig;
	} = $props();

	const tiers: Array<{ name: string; alias: Tier; features: string[] }> = [
		{ name: 'Tributestream Record', alias: 'record', features: TIER_FEATURES.record },
		{ name: 'Tributestream Live', alias: 'live', features: TIER_FEATURES.live },
		{ name: 'Tributestream Legacy', alias: 'legacy', features: TIER_FEATURES.legacy }
	];
</script>

<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
	<h2 class="mb-6 text-center text-2xl font-bold text-gray-900">Choose Your Package</h2>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		{#each tiers as tier}
			<button
				class="relative rounded-xl border-2 p-6 text-left transition-all duration-200 hover:shadow-md
					{selectedTier === tier.alias
					? 'border-amber-500 bg-amber-50 shadow-md'
					: 'border-gray-200 bg-white hover:border-gray-300'}"
				onclick={() => onchange(tier.alias)}
			>
				{#if selectedTier === tier.alias}
					<div
						class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white"
					>
						Selected
					</div>
				{/if}
				<h3 class="text-lg font-bold text-gray-900">{tier.name}</h3>
				<p class="mt-2 text-3xl font-bold text-amber-600">
					${pricing.tiers[tier.alias].toLocaleString()}
				</p>
				<ul class="mt-4 space-y-2">
					{#each tier.features as feature}
						<li class="flex items-start gap-2 text-sm text-gray-600">
							<span class="mt-0.5 text-amber-500">✓</span>
							<span>{feature}</span>
						</li>
					{/each}
				</ul>
			</button>
		{/each}
	</div>
</div>
