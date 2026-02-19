import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { email } = await request.json();
		
		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		console.log('🔧 [DEBUG] Setting admin claims for:', email);

		// Get user by email
		const user = await adminAuth.getUserByEmail(email);
		console.log('👤 [DEBUG] Found user:', user.uid, user.email);

		// Get existing claims
		const existingClaims = user.customClaims || {};
		console.log('📋 [DEBUG] Existing claims:', existingClaims);

		// Set admin claims (only role needed now)
		await adminAuth.setCustomUserClaims(user.uid, {
			...existingClaims,
			role: 'admin'
		});

		console.log('✅ [DEBUG] Admin claims set successfully');

		// Verify the claims were set
		const updatedUser = await adminAuth.getUser(user.uid);
		console.log('🔍 [DEBUG] Updated claims:', updatedUser.customClaims);

		return json({ 
			success: true, 
			message: `Admin claims set for ${email}`,
			uid: user.uid,
			claims: updatedUser.customClaims
		});
	} catch (error: any) {
		console.error('❌ [DEBUG] Error setting admin claims:', error);
		return json({ 
			error: error.message,
			code: error.code 
		}, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url }) => {
	const email = url.searchParams.get('email');
	
	if (!email) {
		return json({ error: 'Email parameter is required' }, { status: 400 });
	}

	try {
		const user = await adminAuth.getUserByEmail(email);
		return json({
			uid: user.uid,
			email: user.email,
			customClaims: user.customClaims || {}
		});
	} catch (error: any) {
		return json({ 
			error: error.message,
			code: error.code 
		}, { status: 500 });
	}
};
