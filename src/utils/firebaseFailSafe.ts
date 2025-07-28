// src/utils/firebaseFailsafe.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, resetFirestoreConnection } from '../lib/firebase';

type FailsafeResult<T> = {
  data: T | null;
  error: string | null;
  metadata?: {
    attempts: number;
    duration: number;
  };
};

type WriteResult = {
  success: boolean;
  error: string | null;
  metadata?: {
    attempts: number;
    duration: number;
  };
};

const DEFAULT_MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;

/**
 * Checks if an error is retryable based on its code
 */
type FirestoreError = {
  code?: string;
  message?: string;
};

const isRetryableError = (error: unknown): boolean => {
  const retryableCodes = [
    'unavailable',
    'resource-exhausted',
    'internal',
    'deadline-exceeded',
    'aborted'
  ];

  const err = error as FirestoreError;

  return !(
    err.code === 'permission-denied' || 
    err.code === 'not-found' ||
    err.code === 'already-exists' ||
    err.code === 'invalid-argument'
  ) && (retryableCodes.includes(err.code ?? '') || !err.code);
};

/**
 * Gets a document with retry logic and connection reset
 */
export async function getDocumentFailsafe<T>(
  collectionName: string, 
  documentId: string,
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<FailsafeResult<T>> {
  let lastError: unknown = null;
  const startTime = Date.now();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Reset connection on retry attempts
      if (attempt > 0) {
        console.warn(`Attempt ${attempt + 1}: Resetting Firestore connection...`);
        await resetFirestoreConnection();
        
        // Exponential backoff with jitter
        const delay = Math.min(
          BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500,
          MAX_DELAY_MS
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { 
          data: docSnap.data() as T, 
          error: null,
          metadata: {
            attempts: attempt + 1,
            duration: Date.now() - startTime
          }
        };
      }
      
      // Document doesn't exist - no point retrying
      return { 
        data: null, 
        error: 'Document not found',
        metadata: {
          attempts: attempt + 1,
          duration: Date.now() - startTime
        }
      };
    } catch (error: unknown) {
      lastError = error;
      const errorMessage = (typeof error === 'object' && error !== null && 'message' in error)
        ? (error as { message?: string }).message
        : String(error);
      console.error(`Attempt ${attempt + 1} failed:`, errorMessage);
      
      if (!isRetryableError(error)) {
        break;
      }
    }
  }
  
  return { 
    data: null, 
    error: (typeof lastError === 'object' && lastError !== null && 'message' in lastError)
      ? (lastError as { message?: string }).message || 'Failed to fetch document after multiple attempts'
      : 'Failed to fetch document after multiple attempts',
    metadata: {
      attempts: maxRetries,
      duration: Date.now() - startTime
    }
  };
}

/**
 * Sets a document with retry logic and connection reset
 */
export async function setDocumentFailsafe<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  data: T,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  merge: boolean = false
): Promise<WriteResult> {
  let lastError: unknown = null;
  const startTime = Date.now();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.warn(`Write attempt ${attempt + 1}: Resetting Firestore connection...`);
        await resetFirestoreConnection();
        
        const delay = Math.min(
          BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500,
          MAX_DELAY_MS
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const docRef = doc(db, collectionName, documentId);
      await setDoc(docRef, data, merge ? { merge } : {});
      
      return { 
        success: true, 
        error: null,
        metadata: {
          attempts: attempt + 1,
          duration: Date.now() - startTime
        }
      };
    } catch (error: unknown) {
      lastError = error;
      const errorMessage = (typeof error === 'object' && error !== null && 'message' in error)
        ? (error as { message?: string }).message
        : String(error);
      console.error(`Write attempt ${attempt + 1} failed:`, errorMessage);
      
      if (!isRetryableError(error)) {
        break;
      }
    }
  }
  
  return { 
    success: false, 
    error: (typeof lastError === 'object' && lastError !== null && 'message' in lastError)
      ? (lastError as { message?: string }).message || 'Failed to write document after multiple attempts'
      : 'Failed to write document after multiple attempts',
    metadata: {
      attempts: maxRetries,
      duration: Date.now() - startTime
    }
  };
}