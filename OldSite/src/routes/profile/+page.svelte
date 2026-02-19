<script lang="ts">
	import Profile from '$lib/components/Profile.svelte';
	let { data, form } = $props();
</script>

<Profile {data} {form} />
