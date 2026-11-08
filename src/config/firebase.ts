import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore with the database ID specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Connection verification probe
export async function testFirestoreConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, '_health', 'probe'));
    return { ok: true, message: 'Connected to Firestore' };
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message && err.message.includes('the client is offline')) {
      return { ok: false, message: 'Client is offline. Please check connection and Firestore configuration.' };
    }
    // Document not existing or permission denied on probe is still a valid live connection to backend
    return { ok: true, message: 'Live Firestore server responded: ' + (err.message || 'ready') };
  }
}
