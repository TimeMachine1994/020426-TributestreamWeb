<script lang="ts">
	import RegisterMinimalModern from '$lib/components/RegisterMinimalModern.svelte';
	import type { ActionData } from './$types';

	let { form }: { form?: ActionData } = $props();
</script>

<RegisterMinimalModern {form} />
