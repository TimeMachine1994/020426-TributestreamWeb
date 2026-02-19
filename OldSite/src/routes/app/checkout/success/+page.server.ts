import { adminDb } from '$lib/server/firebase';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';
// Use fallback for PUBLIC_BASE_URL if not set
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
import type { LivestreamConfig } from '$lib/types/livestream';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const configId = url.searchParams.get('configId');
	if (!configId) {
		throw error(400, 'Missing configuration ID');
	}

	const configDoc = await adminDb.collection('livestreamConfigurations').doc(configId).get();

	if (!configDoc.exists) {
		throw error(404, 'Configuration not found');
	}

	const configData = configDoc.data();

	if (configData?.userId !== locals.user.uid) {
		throw error(403, 'Forbidden');
	}

	const config: LivestreamConfig = {
		id: configDoc.id,
		...(configData as Omit<LivestreamConfig, 'id' | 'createdAt'>),
		createdAt: configData?.createdAt?.toDate ? configData.createdAt.toDate().toISOString() : null
	};

	if (locals.user.email && configData) {
		await sendEnhancedRegistrationEmail({
			email: locals.user.email,
			ownerName: locals.user.name || 'Tributestream User',
			lovedOneName: configData.formData.lovedOneName,
			memorialUrl: `${PUBLIC_BASE_URL}/memorials/${configData.memorialId}`
		});
	}

	return {
		config
	};
};
