<!--
  reCAPTCHA v3 Provider Component
  Loads the reCAPTCHA script and provides context for forms
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';

	const PUBLIC_RECAPTCHA_SITE_KEY = env.PUBLIC_RECAPTCHA_SITE_KEY;

	export const badge: 'bottomright' | 'bottomleft' | 'inline' = 'bottomright';

	let scriptLoaded = false;
	let scriptError = false;

	onMount(() => {
		// Check if reCAPTCHA is already loaded
		if (window.grecaptcha) {
			scriptLoaded = true;
			return;
		}

		// Load reCAPTCHA script
		const script = document.createElement('script');
		script.src = `https://www.google.com/recaptcha/api.js?render=${PUBLIC_RECAPTCHA_SITE_KEY}`;
		script.async = true;
		script.defer = true;

		script.onload = () => {
			scriptLoaded = true;
			console.log('reCAPTCHA v3 loaded successfully');
		};

		script.onerror = () => {
			scriptError = true;
			console.error('Failed to load reCAPTCHA v3 script');
		};

		document.head.appendChild(script);

		// Cleanup on component destroy
		return () => {
			// Remove script if component is destroyed
			if (script.parentNode) {
				script.parentNode.removeChild(script);
			}
		};
	});
</script>

<!-- Slot for child components -->
<slot {scriptLoaded} {scriptError} />

{#if scriptError}
	<div class="recaptcha-error" role="alert">
		<p>⚠️ Security verification unavailable. Please refresh the page or contact support.</p>
	</div>
{/if}

<style>
	/* reCAPTCHA badge positioning */
	:global(.grecaptcha-badge) {
		z-index: 1000;
	}
	
	:global(.grecaptcha-badge.bottomright) {
		bottom: 14px;
		right: 14px;
	}
	
	:global(.grecaptcha-badge.bottomleft) {
		bottom: 14px;
		left: 14px;
	}

	.recaptcha-error {
		background: #fee2e2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 12px;
		border-radius: 6px;
		margin: 10px 0;
		font-size: 14px;
	}
</style>
