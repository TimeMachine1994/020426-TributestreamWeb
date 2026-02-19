import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { verifyRecaptcha, RECAPTCHA_ACTIONS, getScoreThreshold } from '$lib/utils/recaptcha';
import { validateEmail } from '$lib/utils/email-validation';
import { createStandardUserProfile, validateUserProfileData } from '$lib/utils/user-profile';
import { sendOwnerWelcomeEmail, sendFuneralDirectorWelcomeEmail } from '$lib/server/email';

export const actions: Actions = {
	registerOwner: async ({ request }) => {
		console.log('[+page.server.ts] Register owner action started.');
		const data = await request.formData();
		const name = data.get('name');
		const email = data.get('email');
		const password = data.get('password');
		const recaptchaToken = data.get('recaptchaToken');

		if (!name || !email || !password) {
			console.error('[+page.server.ts] Missing required fields.');
			return fail(400, {
				message: 'Name, email and password are required'
			});
		}

		// Pre-validate email before expensive operations
		console.log('[+page.server.ts] Pre-validating email...');
		const emailValidation = await validateEmail(email.toString(), 'email');
		if (!emailValidation.isValid) {
			console.error('[+page.server.ts] Email validation failed:', emailValidation.error);
			return fail(400, {
				message: emailValidation.error,
				field: emailValidation.field
			});
		}
		console.log('[+page.server.ts] Email validation passed.');

		// Verify reCAPTCHA
		if (recaptchaToken) {
			const recaptchaResult = await verifyRecaptcha(
				recaptchaToken.toString(),
				RECAPTCHA_ACTIONS.REGISTER_OWNER,
				getScoreThreshold(RECAPTCHA_ACTIONS.REGISTER_OWNER)
			);

			if (!recaptchaResult.success) {
				console.error('[+page.server.ts] reCAPTCHA verification failed:', recaptchaResult.error);
				return fail(400, {
					message: 'Security verification failed. Please try again.'
				});
			}

			console.log(`[+page.server.ts] reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
		} else {
			console.warn('[+page.server.ts] No reCAPTCHA token provided');
			return fail(400, {
				message: 'Security verification required. Please refresh and try again.'
			});
		}

		try {
			console.log(`[+page.server.ts] Attempting to create owner: ${email}`);
			const userRecord = await adminAuth.createUser({
				email: email.toString(),
				password: password.toString(),
				displayName: name.toString()
			});

			// Set custom claims for owner role
			await adminAuth.setCustomUserClaims(userRecord.uid, {
				role: 'owner',
				isOwner: true
			});

			// Create standardized user profile
			const userProfile = createStandardUserProfile({
				email: userRecord.email!,
				displayName: name.toString(),
				role: 'owner'
			});

			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			await userDocRef.set(userProfile);

			console.log(`[+page.server.ts] Owner created and profile stored successfully: ${email}`);

			// Send welcome email
			try {
				await sendOwnerWelcomeEmail({
					email: email.toString(),
					displayName: name.toString()
				});
				console.log(`[+page.server.ts] Owner welcome email sent to: ${email}`);
			} catch (emailError) {
				console.error(`[+page.server.ts] Failed to send welcome email, but continuing:`, emailError);
				// Don't fail registration if email fails
			}

			const customToken = await adminAuth.createCustomToken(userRecord.uid);

			return {
				success: true,
				customToken
			};
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error(`[+page.server.ts] Error creating owner ${email}:`, error);
			
			// Since we pre-validated email, this should rarely happen
			// But keep for safety in case of network issues or other errors
			if (error.code === 'auth/email-already-exists') {
				return fail(400, {
					message: `An account with email ${email} already exists. Please use a different email or sign in to your existing account.`,
					field: 'email'
				});
			}
			
			return fail(500, {
				message: 'Registration failed. Please try again.'
			});
		}
	},
	registerViewer: async ({ request }) => {
		console.log('[+page.server.ts] Register viewer action started.');
		const data = await request.formData();
		const name = data.get('name');
		const email = data.get('email');
		const password = data.get('password');
		const recaptchaToken = data.get('recaptchaToken');

		if (!name || !email || !password) {
			console.error('[+page.server.ts] Missing required fields.');
			return fail(400, {
				message: 'Name, email and password are required'
			});
		}

		// Pre-validate email before expensive operations
		console.log('[+page.server.ts] Pre-validating email...');
		const emailValidation = await validateEmail(email.toString(), 'email');
		if (!emailValidation.isValid) {
			console.error('[+page.server.ts] Email validation failed:', emailValidation.error);
			return fail(400, {
				message: emailValidation.error,
				field: emailValidation.field
			});
		}
		console.log('[+page.server.ts] Email validation passed.');

		// Verify reCAPTCHA
		if (recaptchaToken) {
			const recaptchaResult = await verifyRecaptcha(
				recaptchaToken.toString(),
				RECAPTCHA_ACTIONS.REGISTER_VIEWER,
				getScoreThreshold(RECAPTCHA_ACTIONS.REGISTER_VIEWER)
			);

			if (!recaptchaResult.success) {
				console.error('[+page.server.ts] reCAPTCHA verification failed:', recaptchaResult.error);
				return fail(400, {
					message: 'Security verification failed. Please try again.'
				});
			}

			console.log(`[+page.server.ts] reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
		} else {
			console.warn('[+page.server.ts] No reCAPTCHA token provided');
			return fail(400, {
				message: 'Security verification required. Please refresh and try again.'
			});
		}

		try {
			console.log(`[+page.server.ts] Attempting to create viewer: ${email}`);
			const userRecord = await adminAuth.createUser({
				email: email.toString(),
				password: password.toString(),
				displayName: name.toString()
			});

			// Set custom claims for viewer role
			await adminAuth.setCustomUserClaims(userRecord.uid, {
				role: 'viewer',
				isViewer: true
			});

			// Create standardized user profile
			const userProfile = createStandardUserProfile({
				email: userRecord.email!,
				displayName: name.toString(),
				role: 'viewer'
			});

			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			await userDocRef.set(userProfile);

			console.log(`[+page.server.ts] Viewer created and profile stored successfully: ${email}`);

			const customToken = await adminAuth.createCustomToken(userRecord.uid);

			return {
				success: true,
				customToken
			};
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error(`[+page.server.ts] Error creating viewer ${email}:`, error);
			
			// Since we pre-validated email, this should rarely happen
			if (error.code === 'auth/email-already-exists') {
				return fail(400, {
					message: `An account with email ${email} already exists. Please use a different email or sign in to your existing account.`,
					field: 'email'
				});
			}
			
			return fail(500, {
				message: 'Registration failed. Please try again.'
			});
		}
	},
	registerAdmin: async ({ request }) => {
		console.log('[+page.server.ts] Register admin action started.');
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		if (!email || !password) {
			console.error('[+page.server.ts] Missing email or password.');
			return fail(400, {
				message: 'Email and password are required'
			});
		}

		// Pre-validate email before expensive operations
		console.log('[+page.server.ts] Pre-validating email...');
		const emailValidation = await validateEmail(email.toString(), 'email');
		if (!emailValidation.isValid) {
			console.error('[+page.server.ts] Email validation failed:', emailValidation.error);
			return fail(400, {
				message: emailValidation.error,
				field: emailValidation.field
			});
		}
		console.log('[+page.server.ts] Email validation passed.');

		try {
			console.log(`[+page.server.ts] Attempting to create admin user: ${email}`);
			const userRecord = await adminAuth.createUser({
				email: email.toString(),
				password: password.toString()
			});

			await adminAuth.setCustomUserClaims(userRecord.uid, {
				role: 'admin',
				isAdmin: true
			});

			// Create standardized user profile
			const userProfile = createStandardUserProfile({
				email: userRecord.email!,
				displayName: userRecord.email!, // Admin uses email as display name by default
				role: 'admin'
			});

			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			await userDocRef.set(userProfile);

			console.log(`[+page.server.ts] Admin user created and profile stored successfully: ${email}`);

			const customToken = await adminAuth.createCustomToken(userRecord.uid);

			const redirectUrl = `/auth/session?token=${customToken}`;
			redirect(303, redirectUrl);
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error(`[+page.server.ts] Error creating admin user ${email}:`, error);
			
			// Since we pre-validated email, this should rarely happen
			if (error.code === 'auth/email-already-exists') {
				return fail(400, {
					message: `An account with email ${email} already exists. Please use a different email or sign in to your existing account.`,
					field: 'email'
				});
			}
			
			return fail(500, {
				message: 'Registration failed. Please try again.'
			});
		}
	},
	registerFuneralDirector: async ({ request }) => {
		console.log('[+page.server.ts] Register funeral director action started.');
		const data = await request.formData();
		const name = data.get('name');
		const email = data.get('email');
		const password = data.get('password');
		const recaptchaToken = data.get('recaptchaToken');

		if (!name || !email || !password) {
			console.error('[+page.server.ts] Missing required fields.');
			return fail(400, {
				message: 'Name, email and password are required'
			});
		}

		// Pre-validate email before expensive operations
		console.log('[+page.server.ts] Pre-validating email...');
		const emailValidation = await validateEmail(email.toString(), 'email');
		if (!emailValidation.isValid) {
			console.error('[+page.server.ts] Email validation failed:', emailValidation.error);
			return fail(400, {
				message: emailValidation.error,
				field: emailValidation.field
			});
		}
		console.log('[+page.server.ts] Email validation passed.');

		// Verify reCAPTCHA
		if (recaptchaToken) {
			const recaptchaResult = await verifyRecaptcha(
				recaptchaToken.toString(),
				RECAPTCHA_ACTIONS.REGISTER_FUNERAL_DIRECTOR,
				getScoreThreshold(RECAPTCHA_ACTIONS.REGISTER_FUNERAL_DIRECTOR)
			);

			if (!recaptchaResult.success) {
				console.error('[+page.server.ts] reCAPTCHA verification failed:', recaptchaResult.error);
				return fail(400, {
					message: 'Security verification failed. Please try again.'
				});
			}

			console.log(`[+page.server.ts] reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
		} else {
			console.warn('[+page.server.ts] No reCAPTCHA token provided');
			return fail(400, {
				message: 'Security verification required. Please refresh and try again.'
			});
		}

		try {
			console.log(`[+page.server.ts] Attempting to create funeral director: ${email}`);
			const userRecord = await adminAuth.createUser({
				email: email.toString(),
				password: password.toString(),
				displayName: name.toString()
			});

			// Set custom claims for funeral director role
			await adminAuth.setCustomUserClaims(userRecord.uid, {
				role: 'funeral_director',
				isFuneralDirector: true
			});

			// Create basic user profile - will be completed in the funeral director form
			const userProfile = createStandardUserProfile({
				email: userRecord.email!,
				displayName: name.toString(),
				role: 'funeral_director'
			});

			const userDocRef = adminDb.collection('users').doc(userRecord.uid);
			await userDocRef.set(userProfile);

			console.log(`[+page.server.ts] Funeral director basic account created successfully: ${email}`);

			// Send welcome email
			try {
				await sendFuneralDirectorWelcomeEmail({
					email: email.toString(),
					displayName: name.toString()
				});
				console.log(`[+page.server.ts] Funeral director welcome email sent to: ${email}`);
			} catch (emailError) {
				console.error(`[+page.server.ts] Failed to send welcome email, but continuing:`, emailError);
				// Don't fail registration if email fails
			}

			const customToken = await adminAuth.createCustomToken(userRecord.uid);

			return {
				success: true,
				customToken
			};
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error(`[+page.server.ts] Error creating funeral director ${email}:`, error);
			
			// Since we pre-validated email, this should rarely happen
			if (error.code === 'auth/email-already-exists') {
				return fail(400, {
					message: `An account with email ${email} already exists. Please use a different email or sign in to your existing account.`,
					field: 'email'
				});
			}
			
			return fail(500, {
				message: 'Registration failed. Please try again.'
			});
		}
	}
};
