import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();
		
		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		console.log('🔧 [DEBUG] Fixing admin role for:', email);

		// Get user by email
		const user = await adminAuth.getUserByEmail(email);
		console.log('👤 [DEBUG] Found user:', user.uid, user.email);

		// Set proper admin claims with admin role
		await adminAuth.setCustomUserClaims(user.uid, {
			admin: true,
			role: 'admin'  // Set role to admin instead of owner
		});

		console.log('✅ [DEBUG] Admin role fixed successfully');

		// Verify the claims were set
		const updatedUser = await adminAuth.getUser(user.uid);
		console.log('🔍 [DEBUG] Updated claims:', updatedUser.customClaims);

		return json({ 
			success: true, 
			message: `Admin role fixed for ${email}`,
			uid: user.uid,
			oldClaims: user.customClaims,
			newClaims: updatedUser.customClaims
		});
	} catch (error: any) {
		console.error('❌ [DEBUG] Error fixing admin role:', error);
		return json({ 
			error: error.message,
			code: error.code 
		}, { status: 500 });
	}
};
