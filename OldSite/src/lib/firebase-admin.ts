import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// EMULATORS DISABLED - Always use production Firebase
const isDevelopment = false; // Disabled emulators - always use production

// Initialize Firebase Admin SDK
let adminApp;

if (getApps().length === 0) {
	if (isDevelopment) {
		// Development mode - connect to emulators
		console.log('🔥 Firebase Admin connecting to emulators...');

		// Set emulator environment variables for Admin SDK
		process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
		process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

		adminApp = initializeApp({
			projectId: 'firebasetweb' // Use your main project ID
		});
	} else {
		// Production mode - use default credentials or service account
		console.log('🔥 Firebase Admin connecting to production...');
		
		try {
			// Try to use service account if available
			const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
				? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
				: undefined;

			if (serviceAccount) {
				console.log('🔑 Using service account credentials');
				adminApp = initializeApp({
					credential: cert(serviceAccount),
					projectId: 'firebasetweb'
				});
			} else {
				console.log('🔑 Using default application credentials');
				// Use default application credentials (works in many environments)
				adminApp = initializeApp({
					projectId: 'firebasetweb'
				});
			}
		} catch (error) {
			console.error('❌ Firebase Admin initialization failed:', error);
			throw error;
		}
	}
} else {
	adminApp = getApps()[0];
}

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);

// Emulators disabled - using production Firestore
console.log('🔥 Firebase Admin initialized for production project: firebasetweb');

export { adminApp, FieldValue };
