// src/lib/hooks/useFirestoreWithRetry.ts
import { useState, useEffect, useCallback } from 'react'
import { 
  doc, 
  onSnapshot, 
  DocumentSnapshot 
} from 'firebase/firestore'
import { db, resetFirestoreConnection } from '../firebase'

interface UseFirestoreOptions {
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: number
}

export function useFirestoreDoc<T>(
  collectionName: string, 
  documentId: string,
  options: UseFirestoreOptions = {}
) {
  const { 
    enableRetry = true, 
    maxRetries = 3, 
    retryDelay = 2000 
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionIssue, setConnectionIssue] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleError = useCallback(async (err: unknown, attempt: number = 0) => {
    console.error(`Firestore error (attempt ${attempt + 1}):`, err)

    // Check if it's a WebChannel/Listen stream error
    let message = ''
    let code = ''
    type FirestoreError = { message?: string; code?: string }
    if (typeof err === 'object' && err !== null) {
      const errorObj = err as FirestoreError
      if ('message' in errorObj && typeof errorObj.message === 'string') {
        message = errorObj.message
      }
      if ('code' in errorObj && typeof errorObj.code === 'string') {
        code = errorObj.code
      }
    }

    if (message.includes('transport errored') || 
        message.includes('WebChannelConnection') ||
        code === 'unavailable' ||
        message.includes('offline')) {
      
      setConnectionIssue(true)
      
      if (enableRetry && attempt < maxRetries) {
        setError(`Connection issue, retrying... (${attempt + 1}/${maxRetries})`)
        setRetryCount(attempt + 1)
        
        // Try to reset the connection
        await resetFirestoreConnection()
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        
        return true // Indicate retry should happen
      } else {
        setError('Connection failed. Please refresh the page.')
        setConnectionIssue(true)
      }
    } else {
      setError(`Error: ${message || 'Unknown error'}`)
      setConnectionIssue(false)
    }
    
    setLoading(false)
    return false // No retry
  }, [enableRetry, maxRetries, retryDelay])

  const fetchData = useCallback(async (attempt: number = 0) => {
    if (!documentId) {
      setLoading(false)
      return
    }

    try {
      const docRef = doc(db, collectionName, documentId)
      
      // Use onSnapshot with error handling
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) {
            setData(docSnap.data() as T)
            setError(null)
            setConnectionIssue(false)
            setRetryCount(0)
          } else {
            setData(null)
            setError('Document not found')
          }
          setLoading(false)
        },
        async (err) => {
          const shouldRetry = await handleError(err, attempt)
          if (shouldRetry) {
            // Retry after a delay
            setTimeout(() => fetchData(attempt + 1), retryDelay)
          }
        }
      )

      return unsubscribe
    } catch (err: unknown) {
      const shouldRetry = await handleError(err, attempt)
      if (shouldRetry) {
        setTimeout(() => fetchData(attempt + 1), retryDelay)
      }
    }
  }, [collectionName, documentId, handleError, retryDelay])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeListener = async () => {
      unsubscribe = await fetchData()
    }

    initializeListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [fetchData])

  const manualRetry = useCallback(() => {
    setLoading(true)
    setError(null)
    setRetryCount(0)
    fetchData(0)
  }, [fetchData])

  return { 
    data, 
    loading, 
    error, 
    connectionIssue, 
    retryCount, 
    manualRetry 
  }
}