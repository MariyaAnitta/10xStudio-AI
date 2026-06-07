import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';

// Use the service-account.json service account JSON for tenxds-agents-idp
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

let app: admin.app.App;
try {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
  console.log('Firebase Admin initialized successfully under unified account (tenxds-agents-idp).');
} catch (error) {
  console.error('Firebase Admin initialization error', error);
  app = admin.app();
}

// Connect to the default Firestore database of the tenxds-agents-idp project
const db = getFirestore(app);

/**
 * Uploads a local file to Google Cloud Storage (GCS) and returns a public URL.
 * Prints detailed, high-fidelity real-time logs in the terminal.
 * @param localFilePath Path to the local file
 * @param destination Destination path inside the GCS bucket
 */
export async function uploadToFirebaseStorage(localFilePath: string, destination: string): Promise<string> {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || '10xstudio-ai';
  
  console.log(`\n[STORAGE] 🚀 Initiating upload to Google Cloud Storage...`);
  console.log(`[STORAGE] 📁 Local file: ${localFilePath}`);
  console.log(`[STORAGE] 📦 Bucket: ${bucketName}`);
  console.log(`[STORAGE] ☁️ Destination: ${destination}`);

  try {
    const bucket = getStorage(app).bucket(bucketName);
    
    // Upload local file to GCS
    await bucket.upload(localFilePath, {
      destination: destination,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      }
    });

    console.log(`[STORAGE] 📤 File successfully uploaded to GCS bucket.`);

    let publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
    
    // Attempt to make the file public for standard public access
    try {
      await bucket.file(destination).makePublic();
      console.log(`[STORAGE] 🔓 File ACL set to public read access.`);
    } catch (aclError) {
      console.log(`[STORAGE] ℹ️ Uniform Bucket-Level Access or permissions restricted ACL settings. Generating signed URL instead.`);
      const [signedUrl] = await bucket.file(destination).getSignedUrl({
        action: 'read',
        expires: '01-01-2099' // Far future expiry
      });
      publicUrl = signedUrl;
    }

    console.log(`[STORAGE] ✅ Upload Complete!`);
    console.log(`[STORAGE] 🔗 GCS URL: ${publicUrl}\n`);
    
    return publicUrl;

  } catch (error: any) {
    console.error(`\n[STORAGE] ❌ GCS Upload Failed! Error: ${error.message}\n`);
    throw error;
  }
}

/**
 * Saves a document to a Firestore collection.
 * @param collectionName The collection to save to
 * @param data The data object
 */
export async function saveToFirestore(collectionName: string, data: any) {
  const docRef = db.collection(collectionName).doc();
  await docRef.set({
    ...data,
    id: docRef.id,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Diagnostic utility to verify Firestore and GCS uploads without console access.
 */
export async function getStorageAndDbStatus() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || '10xstudio-ai';
  const status: any = {
    firestoreConnected: false,
    firestoreDocuments: [],
    gcsConnected: false,
    gcsFiles: [],
    error: null
  };

  try {
    // 1. Fetch recent Firestore documents from visual_audits
    const snapshot = await db.collection('visual_audits').orderBy('timestamp', 'desc').limit(5).get();
    status.firestoreConnected = true;
    status.firestoreDocuments = snapshot.docs.map(doc => ({
      id: doc.id,
      dishName: doc.data().dishName || 'Unnamed',
      timestamp: doc.data().timestamp
    }));

    // 2. Fetch recent files in the GCS bucket under 'generated/'
    const bucket = getStorage(app).bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix: 'generated/', maxResults: 10 });
    status.gcsConnected = true;
    status.gcsFiles = files.map(file => ({
      name: file.name,
      publicUrl: `https://storage.googleapis.com/${bucketName}/${file.name}`
    }));
  } catch (err: any) {
    status.error = err.message;
    console.error('[DIAGNOSTICS] Diagnostic query failed:', err.message);
  }

  return status;
}

/**
 * Retrieves a user session from Firestore.
 * @param email User email (used as document ID)
 */
export async function getSession(email: string) {
  console.log(`[FIRESTORE] 🔍 Fetching session for email: ${email}`);
  try {
    const docRef = db.collection('userSessions').doc(email);
    const doc = await docRef.get();
    if (doc.exists) {
      console.log(`[FIRESTORE] ✅ Session found for email: ${email}`);
      return doc.data();
    }
    console.log(`[FIRESTORE] ℹ️ No session found for email: ${email}`);
    return null;
  } catch (error: any) {
    console.error(`[FIRESTORE] ❌ Failed to fetch session for email: ${email}, Error: ${error.message}`);
    throw error;
  }
}

/**
 * Saves or updates a user session in Firestore.
 * @param email User email (used as document ID)
 * @param sessionData Session details to merge/save
 */
export async function saveSession(email: string, sessionData: any) {
  console.log(`[FIRESTORE] 💾 Saving session for email: ${email}`);
  try {
    const docRef = db.collection('userSessions').doc(email);
    await docRef.set({
      ...sessionData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`[FIRESTORE] ✅ Session successfully synced for email: ${email}`);
    return true;
  } catch (error: any) {
    console.error(`[FIRESTORE] ❌ Failed to save session for email: ${email}, Error: ${error.message}`);
    throw error;
  }
}


/**
 * Saves a scheduled post document to the scheduled_posts collection.
 */
export async function saveScheduledPost(data: {
  platforms: any[];
  imageUrls: Record<string, string>;
  caption: string;
  dishName: string;
}) {
  const docRef = db.collection('scheduled_posts').doc();
  await docRef.set({
    ...data,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    id: docRef.id,
  });
  console.log(`[SCHEDULER] scheduled post saved to Firestore: ${docRef.id}`);
  return docRef.id;
}

/**
 * Fetches all pending scheduled posts whose scheduleTime has passed,
 * and atomically marks them as 'processing' to prevent double-firing.
 */
export async function getAndLockDuePosts(): Promise<any[]> {
  const now = new Date().toISOString();
  const snapshot = await db.collection('scheduled_posts')
    .where('status', '==', 'pending')
    .get();

  const due: any[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hasDuePlatform = (data.platforms || []).some(
      (p: any) => p.scheduleTime && p.scheduleTime <= now
    );
    if (hasDuePlatform) {
      await doc.ref.update({ status: 'processing' });
      due.push({ id: doc.id, ...data });
    }
  }
  return due;
}

/**
 * Marks a scheduled post document as published.
 */
export async function markPostPublished(docId: string, results: any) {
  await db.collection('scheduled_posts').doc(docId).update({
    status: 'published',
    publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    publishResults: results,
  });
  console.log(`[SCHEDULER] Post ${docId} marked as published`);
}
