// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  memoryLocalCache, 
  enableNetwork, 
  disableNetwork,
  Firestore,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Type for our enhanced Firebase services
type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  analytics?: Analytics;
};

// Environment configuration with validation
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required configuration
const validateFirebaseConfig = () => {
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase config keys: ${missingKeys.join(', ')}`);
  }
};

// Initialize Firebase services with retry logic
const initializeFirebase = (): FirebaseServices => {
  validateFirebaseConfig();

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

  // Enhanced Firestore initialization with error recovery
  const initializeFirestoreWithRetry = (attempt = 0): Firestore => {
    try {
      const db = initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: process.env.NODE_ENV === 'development',
      });

      if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true') {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('Firestore emulator connected');
      }

      console.log('Firestore initialized with memoryLocalCache');
      return db;
    } catch (error) {
      console.error(`Firestore initialization attempt ${attempt + 1} failed:`, error);
      
      if (attempt < 2) {
        console.log('Retrying Firestore initialization...');
        return initializeFirestoreWithRetry(attempt + 1);
      }
      
      throw new Error('Failed to initialize Firestore after multiple attempts');
    }
  };

  const db = initializeFirestoreWithRetry();
  const auth = getAuth(app);

  // Analytics initialization with feature detection
  let analytics: Analytics | undefined;
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('Analytics initialized');
      } else {
        console.log('Analytics not supported in this environment');
      }
    }).catch((error) => {
      console.error('Analytics initialization failed:', error);
    });
  }

  return { app, auth, db, analytics };
};

// Connection management utilities
const connectionManager = (db: Firestore) => {
  let isOnline = true;
  let retryCount = 0;
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 1000;

  const setOnlineStatus = (status: boolean) => {
    isOnline = status;
    console.log(`Firestore is now ${status ? 'online' : 'offline'}`);
  };

  const enableConnection = async (): Promise<boolean> => {
    try {
      await enableNetwork(db);
      setOnlineStatus(true);
      retryCount = 0;
      return true;
    } catch (error) {
      console.error('Failed to enable network:', error);
      return false;
    }
  };

  const disableConnection = async (): Promise<boolean> => {
    try {
      await disableNetwork(db);
      setOnlineStatus(false);
      return true;
    } catch (error) {
      console.error('Failed to disable network:', error);
      return false;
    }
  };

  const resetConnection = async (): Promise<boolean> => {
    if (retryCount >= MAX_RETRIES) {
      console.warn('Max connection reset attempts reached');
      return false;
    }

    retryCount++;
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount - 1), 10000);
    
    try {
      console.log(`Resetting connection (attempt ${retryCount}) with ${delay}ms delay...`);
      await disableConnection();
      await new Promise(resolve => setTimeout(resolve, delay));
      const success = await enableConnection();
      
      if (success) {
        console.log('Connection reset successful');
        return true;
      }
    } catch (error) {
      console.error(`Connection reset attempt ${retryCount} failed:`, error);
    }

    return false;
  };

  return {
    enableConnection,
    disableConnection,
    resetConnection,
    getStatus: () => isOnline,
  };
};

// Initialize all services
const { app, auth, db, analytics } = initializeFirebase();
const { enableConnection, disableConnection, resetConnection } = connectionManager(db);

export { 
  app, 
  auth, 
  db, 
  analytics,
  enableConnection as handleFirestoreConnection,
  resetConnection as resetFirestoreConnection,
  disableConnection as disableFirestoreNetwork
};

// Export types for better TypeScript support
export type { FirebaseServices };