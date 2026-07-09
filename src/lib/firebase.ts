import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let db: Firestore;
let emulatorsConnected = false;

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  }
  return app ?? getApps()[0];
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    if (typeof window !== "undefined") {
      db = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } else {
      db = getFirestore(firebaseApp);
    }

    if (
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
      !emulatorsConnected
    ) {
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
      emulatorsConnected = true;
    }
  }
  return db;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}
