import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';

// Firebase config - you'll need to replace with your actual config
const firebaseConfig = {
	// Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const testAccounts = [
	{
		email: 'admin@test.com',
		password: 'test123',
		role: 'admin',
		name: 'Admin User',
		data: {
			isAdmin: true,
			role: 'admin'
		}
	},
	{
		email: 'director@test.com',
		password: 'test123',
		role: 'funeral_director',
		name: 'John Director',
		data: {
			role: 'funeral_director',
			companyName: 'Smith & Sons Funeral Home',
			phone: '(555) 123-4567',
			address: {
				street: '123 Memorial Drive',
				city: 'Orlando',
				state: 'FL',
				zipCode: '32801'
			}
		}
	},
	{
		email: 'owner@test.com',
		password: 'test123',
		role: 'owner',
		name: 'Sarah Owner',
		data: {
			role: 'owner',
			phone: '(555) 987-6543'
		}
	}
];

async function createTestAccounts() {
	console.log('Creating test accounts...');

	for (const account of testAccounts) {
		try {
			console.log(`Creating ${account.role}: ${account.email}`);

			// Create user account
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				account.email,
				account.password
			);
			const user = userCredential.user;

			// Create user document in Firestore
			await setDoc(doc(db, 'users', user.uid), {
				name: account.name,
				email: account.email,
				...account.data,
				createdAt: new Date().toISOString(),
				lastLoginAt: new Date().toISOString()
			});

			console.log(`✅ Created ${account.role}: ${account.email}`);
		} catch (error) {
			if (error.code === 'auth/email-already-in-use') {
				console.log(`⚠️  Account already exists: ${account.email}`);
			} else {
				console.error(`❌ Error creating ${account.email}:`, error);
			}
		}
	}
}

async function createTestMemorial() {
	try {
		console.log('Creating test memorial...');

		// Sign in as owner to create memorial
		const ownerCredential = await signInWithEmailAndPassword(auth, 'owner@test.com', 'test123');

		// Create a test memorial
		const memorialData = {
			lovedOneName: 'Robert Johnson',
			dateOfBirth: '1945-03-15',
			dateOfPassing: '2024-09-01',
			biography:
				'Robert was a loving father, grandfather, and friend to many. He spent his career as a teacher, inspiring countless students over 40 years. He loved fishing, gardening, and spending time with his family.',
			serviceDetails: {
				date: '2024-09-15',
				time: '2:00 PM',
				location: 'Smith & Sons Funeral Home',
				address: '123 Memorial Drive, Orlando, FL 32801'
			},
			createdBy: ownerCredential.user.uid,
			createdAt: new Date().toISOString(),
			isPublic: true,
			photos: [],
			tributes: [],
			followers: []
		};

		const memorialRef = await addDoc(collection(db, 'memorials'), memorialData);
		console.log('✅ Created test memorial:', memorialRef.id);

		return memorialRef.id;
	} catch (error) {
		console.error('❌ Error creating test memorial:', error);
	}
}

async function main() {
	try {
		await createTestAccounts();
		await createTestMemorial();
		console.log('\n🎉 Test accounts and memorial created successfully!');
		console.log('\nTest Accounts:');
		testAccounts.forEach((account) => {
			console.log(`${account.role}: ${account.email} / ${account.password}`);
		});
	} catch (error) {
		console.error('Error in main:', error);
	}
}

main();
