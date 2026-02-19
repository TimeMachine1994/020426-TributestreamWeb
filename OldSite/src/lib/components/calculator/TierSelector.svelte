<script lang="ts">
	import type { Tier } from '$lib/types/livestream';

	let { selectedTier, onchange }: { selectedTier: Tier; onchange: (tier: Tier) => void } = $props();

	console.log('👑 TierSelector Initializing...', { selectedTier });

	function selectTier(tier: Tier) {
		console.log('👑 Tier selected:', tier);
		onchange(tier);
	}

	const tiers = [
		{
			name: 'Tributestream Record',
			alias: 'record',
			price: 699,
			features: [
				'2 Hours of Broadcast Time',
				'Custom Link',
				'Complimentary Download',
				'One Year Hosting',
				'DIY Livestream Kit'
			]
		},
		{
			name: 'Tributestream Live',
			alias: 'live',
			price: 1299,
			features: [
				'2 Hours of Broadcast Time',
				'Custom Link',
				'Complimentary Download',
				'One Year Hosting',
				'Professional Videographer',
				'Professional Livestream Tech'
			]
		},
		{
			name: 'Tributestream Legacy',
			alias: 'legacy',
			price: 1599,
			features: [
				'2 Hours of Broadcast Time',
				'Custom Link',
				'Complimentary Download',
				'One Year Hosting',
				'Professional Videographer',
				'Professional Livestream Tech',
				'Video Editing',
				'Engraved USB Drive and Wooden Keepsake Box'
			]
		}
	];
</script>

<div class="card p-4 md:p-6">
	<h2 class="h2 mb-6 text-center">Choose Your Package</h2>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		{#each tiers as tier}
			<button
				class="card preset-filled-surface-200-800 card-hover space-y-4 p-4 text-left transition-all duration-200"
				class:preset-outlined-primary-500={selectedTier === tier.alias}
				onclick={() => selectTier(tier.alias as Tier)}
			>
				<h3 class="h3">{tier.name}</h3>
				<p class="h1 text-primary-500 font-bold">${tier.price}</p>
				<ul class="list-inside list-disc space-y-2">
					{#each tier.features as feature}
						<li>{feature}</li>
					{/each}
				</ul>
			</button>
		{/each}
	</div>
</div>
