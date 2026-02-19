<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { User, Mail, MapPin, Shield, Phone, Save, ArrowLeft, Eye, EyeOff } from 'lucide-svelte';
	import { getTheme } from '$lib/design-tokens/minimal-modern-theme';
	import { Button, Input } from '$lib/components/minimal-modern';
	import { onMount } from 'svelte';

	let { data, form } = $props();
	
	const theme = getTheme('minimal');
	const userRole = data.user?.role || 'owner';
	
	// Form state - handle both displayName and name fields
	let displayName = $state(data.profile?.displayName || data.profile?.name || '');
	let email = $state(data.profile?.email || '');
	let phone = $state(data.profile?.phone || '');
	let address = $state({
		street: data.profile?.address?.street || '',
		city: data.profile?.address?.city || '',
		state: data.profile?.address?.state || '',
		zipCode: data.profile?.address?.zipCode || ''
	});
	
	// Password change state
	let showPasswordSection = $state(false);
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	
	let isSubmitting = $state(false);
	let mounted = $state(false);

	function getRoleInfo(role: string) {
		switch (role) {
			case 'admin':
				return {
					title: 'Admin',
					gradient: 'from-red-600 via-pink-600 to-purple-600',
					bgGradient: 'from-red-50 to-pink-50',
					accentColor: 'red'
				};
			case 'funeral_director':
				return {
					title: 'Funeral Director',
					gradient: 'from-yellow-600 via-amber-600 to-orange-600',
					bgGradient: 'from-yellow-50 to-amber-50',
					accentColor: 'amber'
				};
			case 'owner':
				return {
					title: 'Memorial Owner',
					gradient: 'from-amber-500 via-orange-500 to-red-500',
					bgGradient: 'from-amber-50 to-orange-50',
					accentColor: 'amber'
				};
			default:
				return {
					title: 'User',
					gradient: 'from-gray-600 to-gray-800',
					bgGradient: 'from-gray-50 to-gray-100',
					accentColor: 'gray'
				};
		}
	}

	const roleInfo = getRoleInfo(userRole);

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>Account Settings | Tributestream</title>
	<meta name="description" content="Manage your account settings and preferences" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br {roleInfo.bgGradient} relative overflow-hidden">
	<!-- Animated background elements -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl"></div>
		<div class="absolute -bottom-40 -left-40 h-96 w-96 animate-pulse rounded-full bg-gradient-to-tr from-white/5 to-transparent blur-3xl delay-1000"></div>
	</div>

	<div class="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8 {mounted ? 'animate-fade-in-up' : 'opacity-0'}" style="animation-delay: 0.1s;">
			<div class="flex items-center space-x-4 mb-6">
				<a href="/profile" class="flex items-center text-gray-600 hover:text-{roleInfo.accentColor}-600 transition-colors">
					<ArrowLeft class="h-5 w-5 mr-2" />
					Back to Profile
				</a>
			</div>
			
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
			<p class="text-gray-600">Manage your account information and preferences</p>
		</div>

		<!-- Success/Error Messages -->
		{#if form?.message}
			<div class="mb-6 p-4 rounded-xl {form.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} border {mounted ? 'animate-fade-in-up' : 'opacity-0'}" style="animation-delay: 0.2s;">
				{form.message}
			</div>
		{/if}

		<div class="space-y-8">
			<!-- Personal Information -->
			<div class="rounded-3xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-xl {mounted ? 'animate-fade-in-up' : 'opacity-0'}" style="animation-delay: 0.3s;">
				<h2 class="flex items-center text-2xl font-bold text-gray-900 mb-6">
					<User class="mr-3 h-6 w-6 text-{roleInfo.accentColor}-600" />
					Personal Information
				</h2>

				<form method="POST" action="?/updateProfile" use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						isSubmitting = false;
						await update();
					};
				}}>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="displayName" class="block text-sm font-medium text-gray-700 mb-2">
								Display Name
							</label>
							<input
								type="text"
								id="displayName"
								name="displayName"
								bind:value={displayName}
								class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-{roleInfo.accentColor}-500"
								placeholder="Your display name"
							/>
						</div>

						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
								Email Address
							</label>
							<input
								type="email"
								id="email"
								name="email"
								bind:value={email}
								class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-{roleInfo.accentColor}-500"
								placeholder="your@email.com"
							/>
							
							<!-- Pending Email Change Notification -->
							{#if data.profile?.pendingEmailChange}
								<div class="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
									<div class="flex items-start space-x-2">
										<Mail class="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
										<div class="text-sm">
											<p class="text-amber-800 font-medium">Email change pending</p>
											<p class="text-amber-700">
												Confirmation email sent to <strong>{data.profile.pendingEmailChange.newEmail}</strong>
											</p>
											<p class="text-amber-600 text-xs mt-1">
												Please check your email and click the confirmation link within 24 hours.
											</p>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
								Phone Number
							</label>
							<input
								type="tel"
								id="phone"
								name="phone"
								bind:value={phone}
								class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-{roleInfo.accentColor}-500"
								placeholder="(555) 123-4567"
							/>
						</div>
					</div>

					<div class="mt-6">
						<h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
							<MapPin class="mr-2 h-5 w-5 text-{roleInfo.accentColor}-600" />
							Address
						</h3>
						
						<div class="grid grid-cols-1 gap-4">
							<div>
								<label for="street" class="block text-sm font-medium text-gray-700 mb-2">
									Street Address
								</label>
								<input
									type="text"
									id="street"
									name="street"
									bind:value={address.street}
									class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-{roleInfo.accentColor}-500"
									placeholder="123 Main Street"
								/>
							</div>
							
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label for="city" class="block text-sm font-medium text-gray-700 mb-2">
										City
									</label>
									<input
										type="text"
										id="city"
										name="city"
										bind:value={address.city}
										class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-{roleInfo.accentColor}-500"
										placeholder="City"
									/>
								</div>
								
								<div>
									<label for="state" class="block text-sm font-medium text-gray-700 mb-2">
										State
									</label>
									<input
										type="text"
										id="state"
										name="state"
										bind:value={address.state}
										class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-{roleInfo.accentColor}-500"
										placeholder="FL"
									/>
								</div>
								
								<div>
									<label for="zipCode" class="block text-sm font-medium text-gray-700 mb-2">
										ZIP Code
									</label>
									<input
										type="text"
										id="zipCode"
										name="zipCode"
										bind:value={address.zipCode}
										class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-{roleInfo.accentColor}-500"
										placeholder="12345"
									/>
								</div>
							</div>
						</div>
					</div>

					<div class="mt-8 flex justify-end">
						<Button
							type="submit"
							variant="role"
							role="owner"
							size="lg"
							rounded="lg"
							disabled={isSubmitting}
						>
							<Save class="mr-2 h-4 w-4" />
							{isSubmitting ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				</form>
			</div>

			<!-- Password Change -->
			<div class="rounded-3xl border border-white/20 bg-white/70 p-8 shadow-2xl backdrop-blur-xl {mounted ? 'animate-fade-in-up' : 'opacity-0'}" style="animation-delay: 0.4s;">
				<div class="flex items-center justify-between mb-6">
					<h2 class="flex items-center text-2xl font-bold text-gray-900">
						<Shield class="mr-3 h-6 w-6 text-{roleInfo.accentColor}-600" />
						Password & Security
					</h2>
					
					{#if !showPasswordSection}
						<Button
							variant="secondary"
							size="md"
							rounded="lg"
							onclick={() => showPasswordSection = true}
						>
							Change Password
						</Button>
					{/if}
				</div>

				{#if showPasswordSection}
					<form method="POST" action="?/changePassword" use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							if (result.type === 'success') {
								currentPassword = '';
								newPassword = '';
								confirmPassword = '';
								showPasswordSection = false;
							}
							await update();
						};
					}}>
						<div class="space-y-6">
							<div>
								<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
									Current Password
								</label>
								<div class="relative">
									<input
										type={showCurrentPassword ? 'text' : 'password'}
										id="currentPassword"
										name="currentPassword"
										bind:value={currentPassword}
										class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 pr-12 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-{roleInfo.accentColor}-500"
										placeholder="Enter current password"
										required
									/>
									<button
										type="button"
										class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
										onclick={() => showCurrentPassword = !showCurrentPassword}
									>
										{#if showCurrentPassword}
											<EyeOff class="h-5 w-5" />
										{:else}
											<Eye class="h-5 w-5" />
										{/if}
									</button>
								</div>
							</div>

							<div>
								<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
									New Password
								</label>
								<div class="relative">
									<input
										type={showNewPassword ? 'text' : 'password'}
										id="newPassword"
										name="newPassword"
										bind:value={newPassword}
										class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 pr-12 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-{roleInfo.accentColor}-500"
										placeholder="Enter new password"
										required
									/>
									<button
										type="button"
										class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
										onclick={() => showNewPassword = !showNewPassword}
									>
										{#if showNewPassword}
											<EyeOff class="h-5 w-5" />
										{:else}
											<Eye class="h-5 w-5" />
										{/if}
									</button>
								</div>
							</div>

							<div>
								<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
									Confirm New Password
								</label>
								<div class="relative">
									<input
										type={showConfirmPassword ? 'text' : 'password'}
										id="confirmPassword"
										name="confirmPassword"
										bind:value={confirmPassword}
										class="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 pr-12 backdrop-blur-sm transition-all focus:border-transparent focus:ring-2 focus:ring-{roleInfo.accentColor}-500"
										placeholder="Confirm new password"
										required
									/>
									<button
										type="button"
										class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
										onclick={() => showConfirmPassword = !showConfirmPassword}
									>
										{#if showConfirmPassword}
											<EyeOff class="h-5 w-5" />
										{:else}
											<Eye class="h-5 w-5" />
										{/if}
									</button>
								</div>
							</div>

							<div class="flex justify-end space-x-4">
								<Button
									variant="secondary"
									size="md"
									rounded="lg"
									onclick={() => {
										showPasswordSection = false;
										currentPassword = '';
										newPassword = '';
										confirmPassword = '';
									}}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									variant="role"
									role="owner"
									size="md"
									rounded="lg"
									disabled={isSubmitting || newPassword !== confirmPassword}
								>
									<Shield class="mr-2 h-4 w-4" />
									{isSubmitting ? 'Updating...' : 'Update Password'}
								</Button>
							</div>
						</div>
					</form>
				{:else}
					<p class="text-gray-600">Keep your account secure by regularly updating your password.</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in-up {
		animation: fade-in-up 0.8s ease-out forwards;
	}
</style>
