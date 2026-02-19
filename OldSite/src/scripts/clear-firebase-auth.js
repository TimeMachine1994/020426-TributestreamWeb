import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin with your service account
const serviceAccountPath = join(__dirname, '..', 'fir-tweb-service-account.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('❌ Error loading service account file:', error.message);
  console.error('Make sure fir-tweb-service-account.json exists in the parent directory');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function listAllUsers(nextPageToken) {
  const users = [];
  try {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    
    listUsersResult.users.forEach((userRecord) => {
      users.push({
        uid: userRecord.uid,
        email: userRecord.email || 'No email',
        displayName: userRecord.displayName || 'No name'
      });
    });

    if (listUsersResult.pageToken) {
      const moreUsers = await listAllUsers(listUsersResult.pageToken);
      users.push(...moreUsers);
    }

    return users;
  } catch (error) {
    console.error('Error listing users:', error);
    return users;
  }
}

async function deleteUsersBatch(uids) {
  try {
    const result = await admin.auth().deleteUsers(uids);
    return {
      successCount: result.successCount,
      failureCount: result.failureCount,
      errors: result.errors
    };
  } catch (error) {
    console.error('Error deleting batch:', error);
    return {
      successCount: 0,
      failureCount: uids.length,
      errors: [{ error }]
    };
  }
}

async function clearFirebaseAuth() {
  console.log('\n🔥 Firebase Authentication User Deletion Script\n');
  console.log('⚠️  WARNING: This will DELETE ALL users from Firebase Authentication!\n');

  // List all users first
  console.log('📋 Fetching all users...\n');
  const users = await listAllUsers();

  if (users.length === 0) {
    console.log('✅ No users found. Database is already empty.');
    rl.close();
    process.exit(0);
  }

  console.log(`Found ${users.length} users:\n`);
  
  // Show first 10 users as preview
  const preview = users.slice(0, 10);
  preview.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.email} (${user.displayName}) - UID: ${user.uid.substring(0, 8)}...`);
  });
  
  if (users.length > 10) {
    console.log(`  ... and ${users.length - 10} more users\n`);
  }

  // Confirmation prompt
  const answer = await question('\n❓ Are you sure you want to delete ALL these users? Type "DELETE ALL" to confirm: ');

  if (answer !== 'DELETE ALL') {
    console.log('\n❌ Deletion cancelled. No users were deleted.');
    rl.close();
    process.exit(0);
  }

  console.log('\n🗑️  Starting user deletion...\n');

  // Delete users in batches of 100 (Firebase limit)
  const batchSize = 100;
  let totalDeleted = 0;
  let totalFailed = 0;

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const uids = batch.map(u => u.uid);

    console.log(`Deleting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)} (${uids.length} users)...`);

    const result = await deleteUsersBatch(uids);
    totalDeleted += result.successCount;
    totalFailed += result.failureCount;

    if (result.errors && result.errors.length > 0) {
      console.error(`  ⚠️  ${result.errors.length} errors in this batch`);
    } else {
      console.log(`  ✅ Batch deleted successfully`);
    }
  }

  console.log('\n📊 DELETION SUMMARY');
  console.log('==================');
  console.log(`Total users processed: ${users.length}`);
  console.log(`Successfully deleted: ${totalDeleted}`);
  console.log(`Failed to delete: ${totalFailed}`);

  if (totalDeleted === users.length) {
    console.log('\n✅ All users deleted successfully!');
  } else if (totalDeleted > 0) {
    console.log('\n⚠️  Some users could not be deleted. Check the errors above.');
  } else {
    console.log('\n❌ No users were deleted. Check the errors above.');
  }

  rl.close();
  process.exit(0);
}

// Run the script
clearFirebaseAuth().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  rl.close();
  process.exit(1);
});