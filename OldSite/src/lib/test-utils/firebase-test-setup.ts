import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
	getFirestore,
	connectFirestoreEmulator,
	enableNetwork,
	disableNetwork
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { adminDb, adminAuth } from '$lib/firebase-admin';

// Firebase test configuration
const testConfig = {
	projectId: 'test-project-id',
	apiKey: 'test-api-key',
	authDomain: 'test-project.firebaseapp.com',
	storageBucket: 'test-project.appspot.com',
	messagingSenderId: '123456789',
	appId: 'test-app-id'
};

let testApp: any = null;
let testDb: any = null;
let testAuth: any = null;

/**
 * Initialize Firebase for testing with emulators
 */
export async function initializeFirebaseTest() {
	// Clean up existing apps
	const existingApps = getApps();
	await Promise.all(existingApps.map((app) => deleteApp(app)));

	// Initialize test app
	testApp = initializeApp(testConfig, 'test-app');
	testDb = getFirestore(testApp);
	testAuth = getAuth(testApp);

	// Connect to emulators if available, otherwise use real Firebase
	try {
		if (process.env.NODE_ENV === 'test') {
			// Use emulators for isolated testing
			connectFirestoreEmulator(testDb, 'localhost', 8080);
			connectAuthEmulator(testAuth, 'http://localhost:9099');
		}
	} catch (error) {
		// Emulators not available, use real Firebase with test project
		console.log('Using real Firebase for testing');
	}

	return { testApp, testDb, testAuth };
}

/**
 * Clean up Firebase test environment
 */
export async function cleanupFirebaseTest() {
	if (testDb) {
		await disableNetwork(testDb);
	}

	if (testApp) {
		await deleteApp(testApp);
	}

	testApp = null;
	testDb = null;
	testAuth = null;
}

/**
 * Create test memorial data
 */
export async function createTestMemorial(overrides: any = {}) {
	const memorial = {
		id: `test-memorial-${Date.now()}`,
		lovedOneName: 'Test Loved One',
		slug: 'test-loved-one',
		fullSlug: 'test-loved-one-123',
		creatorEmail: 'owner@test.com',
		creatorName: 'Test Owner',
		ownerUid: 'test-owner-123',
		funeralDirectorUid: 'test-fd-123',
		isPublic: true,
		content: 'Test memorial content',
		custom_html: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};

	// Add to test database
	if (testDb) {
		await testDb.collection('memorials').doc(memorial.id).set(memorial);
	} else {
		// Use admin DB for real Firebase testing
		await adminDb.collection('memorials').doc(memorial.id).set(memorial);
	}

	return memorial;
}

/**
 * Create test user with custom claims
 */
export async function createTestUser(overrides: any = {}) {
	const user = {
		uid: `test-user-${Date.now()}`,
		email: 'test@example.com',
		customClaims: {
			role: 'owner', // V1: Updated default role
			admin: false
		},
		...overrides
	};

	// Set custom claims using admin auth
	if (user.customClaims) {
		await adminAuth.setCustomUserClaims(user.uid, user.customClaims);
	}

	return user;
}

/**
 * Create test invitation
 */
export async function createTestInvitation(
	memorialId: string,
	inviteeEmail: string,
	overrides: any = {}
) {
	const invitation = {
		id: `test-invitation-${Date.now()}`,
		memorialId,
		inviteeEmail,
		inviterUid: 'test-owner-123',
		roleToAssign: 'owner', // V1: Updated role assignment
		status: 'pending',
		createdAt: new Date(),
		...overrides
	};

	const db = testDb || adminDb;
	await db.collection('invitations').doc(invitation.id).set(invitation);

	return invitation;
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
	const db = testDb || adminDb;

	// Clean up test memorials
	const memorialsSnap = await db
		.collection('memorials')
		.where('id', '>=', 'test-memorial-')
		.where('id', '<', 'test-memorial-z')
		.get();

	const deletePromises = memorialsSnap.docs.map((doc) => doc.ref.delete());

	// Clean up test invitations
	const invitationsSnap = await db
		.collection('invitations')
		.where('id', '>=', 'test-invitation-')
		.where('id', '<', 'test-invitation-z')
		.get();

	deletePromises.push(...invitationsSnap.docs.map((doc) => doc.ref.delete()));

	await Promise.all(deletePromises);
}

export { testApp, testDb, testAuth };
