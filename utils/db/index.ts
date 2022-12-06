import { initializeApp } from 'firebase/app';
import { getDatabase, ref, child, get } from 'firebase/database';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

const getValues = async <T>(path: string) => {
  try {
    const db = getDatabase(app);
    const databaseRef = ref(db);
    const snapshot = await get(child(databaseRef, path));

    if (!snapshot.exists()) {
      throw new Error('No data available');
    }
    return snapshot.val() as T;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export { getValues };
export default app;
