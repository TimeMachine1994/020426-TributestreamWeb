import admin from 'firebase-admin';
import type { FieldValue } from 'firebase-admin/firestore';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

// ALWAYS use production Firebase - clear any emulator env vars
delete process.env['FIREBASE_AUTH_EMULATOR_HOST'];
delete process.env['FIRESTORE_EMULATOR_HOST'];
delete process.env['FIREBASE_STORAGE_EMULATOR_HOST'];

console.log('--- SERVER FIREBASE INITIALIZATION START ---');
console.log('🔥 [FIREBASE] Mode: PRODUCTION (emulators disabled)');
console.log('🔥 [FIREBASE] Current admin apps count:', admin.apps.length);

if (admin.apps.length) {
	console.log('🔥 [FIREBASE] Firebase Admin SDK already initialized.');
	console.log(
		'🔥 [FIREBASE] Existing app names:',
		admin.apps.filter((app): app is admin.app.App => app !== null).map((app) => app.name)
	);
} else {
	const serviceAccountJson = env.PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY;
	const storageBucket = env.PRIVATE_FIREBASE_STORAGE_BUCKET || 'tributestream-lemhr.firebasestorage.app';

	console.log('🔥 [FIREBASE] Service account key present:', !!serviceAccountJson);
	console.log('🔥 [FIREBASE] Service account key length:', serviceAccountJson?.length || 0);

	if (serviceAccountJson && serviceAccountJson.length > 100) {
		try {
			const serviceAccount = JSON.parse(serviceAccountJson);
			console.log('🔥 [FIREBASE] Parsed service account project_id:', serviceAccount.project_id);

			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
				storageBucket: storageBucket
			});
			console.log('✅ [FIREBASE] Firebase Admin initialized with service account credentials.');
		} catch (parseError) {
			console.error('❌ [FIREBASE] Error parsing service account JSON:', parseError);
			admin.initializeApp({
				projectId: 'tributestream-lemhr',
				storageBucket: storageBucket
			});
			console.log('⚠️ [FIREBASE] Firebase Admin initialized with fallback configuration.');
		}
	} else {
		console.error('❌ [FIREBASE] Service account key missing or too short!');
		console.error('❌ [FIREBASE] Please add full service account JSON to PRIVATE_FIREBASE_SERVICE_ACCOUNT_KEY in .env');
		admin.initializeApp({
			projectId: 'tributestream-lemhr',
			storageBucket: storageBucket
		});
		console.log('⚠️ [FIREBASE] Firebase Admin initialized WITHOUT credentials (auth will fail).');
	}
}

console.log('--- SERVER FIREBASE INITIALIZATION END ---');

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

// Export FieldValue for array operations
export { FieldValue } from 'firebase-admin/firestore';
