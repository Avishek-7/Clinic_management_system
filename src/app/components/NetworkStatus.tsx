// src/app/components/NetworkStatus.tsx
'use client'

import { useEffect, useState } from 'react'
import { handleFirestoreConnection, resetFirestoreConnection } from '../../lib/firebase'

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(true)

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      const connected = await handleFirestoreConnection()
      setIsFirestoreConnected(connected)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsFirestoreConnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetryConnection = async () => {
    const success = await resetFirestoreConnection()
    setIsFirestoreConnected(success)
  }

  if (!isOnline || !isFirestoreConnected) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                {!isOnline 
                  ? "You're currently offline. Some features may not work properly." 
                  : "Database connection issue. Some features may not work properly."
                }
              </p>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={handleRetryConnection}
              className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}