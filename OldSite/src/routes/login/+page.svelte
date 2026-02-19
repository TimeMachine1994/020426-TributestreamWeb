<script lang="ts">
	import Login from '$lib/components/Login.svelte';
	import type { ActionData } from './$types';

	let { form }: { form?: ActionData } = $props();
</script>

<Login {form} />
