import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';
import { indexMemorial } from '$lib/server/algolia-indexing';
import type { Memorial } from '$lib/types/memorial';
import { validateEmail } from '$lib/utils/email-validation';
import { generateUniqueMemorialSlug } from '$lib/utils/memorial-slug';
import { createStandardUserProfile } from '$lib/utils/user-profile';
import { verifyRecaptcha, RECAPTCHA_ACTIONS, getScoreThreshold } from '$lib/utils/recaptcha';
import { checkRateLimit, getClientIP, RATE_LIMITS, getBlockedTimeRemaining } from '$lib/server/rate-limiter';
import { checkGeoLocation, getCountryName, logSuspiciousActivity, isCountryWhitelisted } from '$lib/server/geo-filter';

// Helper function to generate a random password
function generateRandomPassword(length = 12) {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
	let password = '';
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		password += charset[randomIndex];
	}
	return password;
}


export const actions: Actions = {
	default: async ({ request, cookies }) => {
		console.log('Family member registration started 👨‍👩‍👧‍👦');
		
		// 🛡️ LAYER 2: Rate Limiting - Check before any processing
		const clientIP = getClientIP(request);
		console.log(`📍 Request from IP: ${clientIP}`);
		
		const rateLimit = checkRateLimit(clientIP, RATE_LIMITS.MEMORIAL_REGISTRATION);
		if (!rateLimit.allowed) {
			const blockedTime = getBlockedTimeRemaining(clientIP);
			console.warn(`🚫 Rate limit exceeded for IP ${clientIP}. Retry after: ${rateLimit.retryAfter}s`);
			
			return fail(429, { 
				error: blockedTime 
					? `Too many registration attempts. Your IP has been temporarily blocked for ${blockedTime}. Please try again later or contact support if you need assistance.`
					: `Too many registration attempts. Please wait ${rateLimit.retryAfter} seconds before trying again.`,
				field: 'rateLimit'
			});
		}
		
		console.log(`✅ Rate limit check passed. Remaining attempts: ${rateLimit.remaining}`);
		
		// 🛡️ LAYER 3: Geographic IP Filtering
		const geoCheck = checkGeoLocation(request);
		const countryDisplay = geoCheck.country ? `${getCountryName(geoCheck.country)} (${geoCheck.country})` : 'Unknown';
		console.log(`🌍 Request from: ${countryDisplay}`);
		
		// Check if country is whitelisted first
		if (geoCheck.country && isCountryWhitelisted(geoCheck.country)) {
			console.log(`✅ Country ${geoCheck.country} is whitelisted, bypassing geo-filter`);
		} else if (geoCheck.blocked) {
			logSuspiciousActivity({
				ip: clientIP,
				country: geoCheck.country,
				reason: `Blocked country: ${countryDisplay}`,
				endpoint: '/register/loved-one'
			});
			
			return fail(403, {
				error: `Registration from your location is currently not available due to spam prevention measures. If you believe this is an error, please contact our support team at support@tributestream.com with your location details.`,
				field: 'geoLocation'
			});
		} else if (geoCheck.suspicious) {
			// Log suspicious but allow with warning
			logSuspiciousActivity({
				ip: clientIP,
				country: geoCheck.country,
				reason: geoCheck.reason || 'Suspicious country',
				endpoint: '/register/loved-one'
			});
			console.warn(`⚠️ Suspicious location detected: ${countryDisplay} - ${geoCheck.reason}`);
		}
		
		const data = await request.formData();
		const lovedOneName = (data.get('lovedOneName') as string)?.trim();
		const name = (data.get('name') as string)?.trim();
		const email = (data.get('email') as string)?.trim();
		const phone = (data.get('phone') as string)?.trim();
		const recaptchaToken = (data.get('recaptchaToken') as string)?.trim();
		const honeypot = (data.get('website') as string)?.trim(); // 🍯 Honeypot field

		// 🛡️ LAYER 4: Honeypot Check - Bots fill this, humans don't
		if (honeypot) {
			console.error(`🚫 BOT DETECTED! Honeypot field filled with: "${honeypot}"`);
			logSuspiciousActivity({
				ip: clientIP,
				country: geoCheck.country,
				email: email || 'unknown',
				reason: `Honeypot triggered: Field filled with "${honeypot}"`,
				endpoint: '/register/loved-one'
			});
			
			// Return success to fool the bot, but don't actually create anything
			return { success: true };
		}

		if (!lovedOneName || !name || !email) {
			return fail(400, { error: 'Please fill out all required fields.' });
		}

		// Verify reCAPTCHA token (HIGH_SECURITY threshold for memorial creation)
		if (!recaptchaToken) {
			console.error('❌ reCAPTCHA token missing from request');
			return fail(400, { 
				error: 'Security verification failed. Please refresh the page and try again.',
				field: 'recaptcha'
			});
		}

		const recaptchaResult = await verifyRecaptcha(
			recaptchaToken,
			RECAPTCHA_ACTIONS.CREATE_MEMORIAL,
			getScoreThreshold(RECAPTCHA_ACTIONS.CREATE_MEMORIAL)
		);

		if (!recaptchaResult.success) {
			console.error('❌ reCAPTCHA verification failed:', recaptchaResult.error);
			console.error('Score:', recaptchaResult.score);
			return fail(403, { 
				error: 'Security verification failed. Your request appears suspicious. Please try again or contact support if this persists.',
				field: 'recaptcha'
			});
		}

		console.log(`✅ reCAPTCHA verified. Score: ${recaptchaResult.score}`);
		// Continue with rest of validation...

		// Pre-validate email before expensive operations
		console.log('Pre-validating email...');
		const emailValidation = await validateEmail(email, 'email');
		if (!emailValidation.isValid) {
			console.error('Email validation failed:', emailValidation.error);
			return fail(400, {
				error: emailValidation.error,
				field: emailValidation.field
			});
		}
		console.log('Email validation passed.');

		const password = generateRandomPassword();
		const fullSlug = await generateUniqueMemorialSlug(lovedOneName);

		try {
			// 1. Create user in Firebase Auth
			console.log(`Attempting to create user: ${email} 👤`);
			const userRecord = await adminAuth.createUser({
				email,
				password,
				displayName: name
			});
			console.log(`User created successfully: ${userRecord.uid}`);

			// 2. Set custom claim for owner role
			await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'owner' });
			console.log(`Custom claim 'owner' set for ${email} 👑`);

			// Wait for user propagation in Firebase
			console.log('⏳ Waiting for Firebase user propagation...');
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// 3. Create user profile in Firestore
			const userProfile = createStandardUserProfile({
				email,
				displayName: name,
				phone,
				role: 'owner'
			});

			await adminDb.collection('users').doc(userRecord.uid).set(userProfile);
			console.log(`User profile created for ${email} with owner role 📝`);

			// 4. Create memorial
			const memorialData = {
				lovedOneName: lovedOneName,
				fullSlug,
				ownerUid: userRecord.uid, // V1: Single source of truth for ownership
				creatorEmail: email,
				familyContactEmail: email,

				// Service Details - basic structure for family registration
				services: {
					main: {
						location: {
							name: '',
							address: '',
							isUnknown: true
						},
						time: {
							date: null,
							time: null,
							isUnknown: true
						},
						hours: 2 // Default duration
					},
					additional: [] // Empty initially
				},

				// Basic memorial settings
				isPublic: true, // Set to true by default
				isComplete: false, // New memorials start as scheduled/incomplete
				content: '',
				custom_html: null,

				createdAt: new Date(),
				updatedAt: new Date()
			};
			const memorialRef = await adminDb.collection('memorials').add(memorialData);
			console.log(`Memorial created for ${lovedOneName} with fullSlug: ${fullSlug} 🕊️`);

			// Index the new memorial in Algolia
			await indexMemorial({ ...memorialData, id: memorialRef.id } as unknown as Memorial);

			// 5. Send enhanced registration email
			await sendEnhancedRegistrationEmail({
				email,
				ownerName: name,
				lovedOneName,
				memorialUrl: `https://tributestream.com/${fullSlug}`,
				password // Pass the generated password to the enhanced email function
			});

			// 6. Create a custom token for auto-login
			// Verify user exists before creating token
			try {
				await adminAuth.getUser(userRecord.uid);
				console.log('✅ User record verified before token creation');
			} catch (verifyError) {
				console.log('⚠️ User not found, waiting additional time...');
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
			// Create custom token with additional claims to prevent tenant errors
			const customToken = await adminAuth.createCustomToken(userRecord.uid, {
				role: 'owner',
				email: email
			});
			console.log(`Custom token created for ${email} 🎟️`);

			// 7. Redirect to the session creation page
			const redirectUrl = `/auth/session?token=${customToken}&fullSlug=${fullSlug}`;
			redirect(303, redirectUrl);
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error('Error during registration process:', error);
			
			// Since we pre-validated email, this should rarely happen
			if (error.code === 'auth/email-already-exists') {
				return fail(400, { 
					error: `An account with email ${email} already exists. Please use a different email or sign in to your existing account.`,
					field: 'email'
				});
			}
			
			return fail(500, { 
				error: 'Registration failed. Please try again.'
			});
		}

		return { success: true };
	}
};
