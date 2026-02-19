<script lang="ts">
	let { data }: { data: import('./$types').PageData } = $props();
</script>

<div class="container">
	<h1>Thank you for your purchase!</h1>
	<p>A receipt has been sent to your email.</p>

	<h2>Order Summary</h2>
	<p><strong>Package:</strong> {data.config.basePackage}</p>
	<p><strong>Duration:</strong> {data.config.duration} minutes</p>
	<p><strong>Platform:</strong> {data.config.platform}</p>
	<p><strong>OBS Support:</strong> {data.config.addObs ? 'Yes' : 'No'}</p>
	<p><strong>Extra Cameras:</strong> {data.config.addExtraCameras}</p>
	<p><strong>Extra Microphones:</strong> {data.config.addExtraMicrophones}</p>
	<p><strong>Total:</strong> ${data.config.total}</p>
</div>

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #ccc;
		border-radius: 8px;
	}
</style>
