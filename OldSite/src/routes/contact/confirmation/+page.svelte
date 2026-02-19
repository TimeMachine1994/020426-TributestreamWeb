<script lang="ts">
	import { CheckCircle, ArrowLeft, Home } from 'lucide-svelte';
	import { Button } from '$lib/ui';
</script>

<svelte:head>
	<title>Message Sent - Tributestream</title>
	<meta
		name="description"
		content="Your message has been sent successfully. We'll get back to you soon."
	/>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-b from-yellow-50 to-white px-4"
>
	<div class="mx-auto max-w-md text-center">
		<div class="rounded-2xl border border-yellow-200 bg-white p-8 shadow-lg">
			<!-- Success Icon -->
			<div
				class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
			>
				<CheckCircle class="h-8 w-8 text-green-600" />
			</div>

			<!-- Success Message -->
			<h1 class="mb-4 text-2xl font-bold text-gray-900">Message Sent Successfully!</h1>
			<p class="mb-6 text-gray-600">
				Thank you for contacting us. We've received your message and will get back to you within 24
				hours.
			</p>

			<!-- Confirmation Details -->
			<div class="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
				<div class="mb-2 flex items-center justify-center">
					<Mail class="mr-2 h-5 w-5 text-yellow-600" />
					<span class="text-sm font-medium text-yellow-800">Confirmation Email Sent</span>
				</div>
				<p class="text-sm text-yellow-700">
					A confirmation email has been sent to your inbox with a copy of your message.
				</p>
			</div>

			<!-- Action Buttons -->
			<div class="space-y-3">
				<Button
					href="/contact"
					variant="role"
					role="owner"
					size="lg"
					fullWidth
					rounded="lg"
				>
					Send Another Message
				</Button>

				<a
					href="/"
					class="inline-flex w-full items-center justify-center rounded-lg border-2 border-gray-200 px-6 py-3 font-medium text-gray-700 transition-all duration-300 hover:border-yellow-500 hover:text-yellow-600"
				>
					<ArrowLeft class="mr-2 h-4 w-4" />
					Back to Home
				</a>
			</div>
		</div>

		<!-- Additional Info -->
		<div class="mt-8 text-center">
			<p class="text-sm text-gray-500">
				Need immediate assistance? Call us at <strong>1-800-TRIBUTE</strong>
			</p>
		</div>
	</div>
</div>
