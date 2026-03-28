import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// In dev/emulator mode we use a demo project — no real Firebase account needed.
// In production, fill in the real values in .env.local
const USE_EMULATOR = process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

const firebaseConfig = USE_EMULATOR
  ? {
      apiKey:    'demo-key',
      projectId: 'demo-gigiz',
      authDomain: 'demo-gigiz.firebaseapp.com',
      storageBucket: 'demo-gigiz.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:demo',
    }
  : {
      apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);

// Connect to local emulators — host is the computer's LAN IP so real devices can connect
if (USE_EMULATOR) {
  const host = process.env.EXPO_PUBLIC_EMULATOR_HOST ?? '192.168.1.109';
  connectFirestoreEmulator(db, host, 8080);
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectStorageEmulator(storage, host, 9199);
}

export default app;
