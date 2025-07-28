'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { getDocumentFailsafe, setDocumentFailsafe } from '@/utils/firebaseFailSafe'
import { NetworkStatus } from '../components/NetworkStatus'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [role, setRole] = useState<'doctor' | 'receptionist'>('doctor')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setRetryCount(0)

    try {
      if (isRegister) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password)

        // Use failsafe method to store role in Firestore
        const userData = {
          email,
          role,
          createdAt: new Date(),
        }

        const { success, error: firestoreError } = await setDocumentFailsafe(
          'users', 
          userCred.user.uid, 
          userData,
          3 // max retries
        )

        if (!success) {
          throw new Error(`Failed to save user data: ${firestoreError}`)
        }

        router.push(`/${role}`)
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password)

        // Use failsafe method to get user role
        const { data: userData, error: firestoreError } = await getDocumentFailsafe<{
          email: string
          role: 'doctor' | 'receptionist'
          createdAt: Date
        }>('users', userCred.user.uid, 3) // max retries

        if (firestoreError) {
          // If it's a connection issue, show retry option
          if (firestoreError.includes('offline') || 
              firestoreError.includes('unavailable') ||
              firestoreError.includes('transport errored')) {
            setError(`Connection issue: ${firestoreError}`)
            setRetryCount(prev => prev + 1)
            return
          } else {
            throw new Error(`Failed to get user data: ${firestoreError}`)
          }
        }

        if (!userData) {
          throw new Error('User role not found in database.')
        }

        const userRole = userData.role
        router.push(`/${userRole}`)
      }
    } catch (err: unknown) {
      console.error('Login error:', err)

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('No user found with this email.')
            break
          case 'auth/wrong-password':
            setError('Incorrect password.')
            break
          case 'auth/email-already-in-use':
            setError('Email is already in use.')
            break
          case 'auth/invalid-email':
            setError('Invalid email format.')
            break
          case 'auth/network-request-failed':
            setError('Network error. Please check your connection and try again.')
            break
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later.')
            break
          default:
            setError(`Authentication error: ${err.message}`)
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError('')
    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  const isConnectionError = error.includes('Connection issue') || 
                           error.includes('Network error') || 
                           error.includes('offline')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm">
        {/* Network Status Component */}
        <NetworkStatus />
        
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow-md"
        >
          <h1 className="text-xl font-semibold mb-4">
            {isRegister ? 'Register' : 'Login'}
          </h1>

          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          {isRegister && (
            <select
              className="w-full p-2 mb-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as 'doctor' | 'receptionist')
              }
              disabled={loading}
            >
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
            </select>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isRegister ? 'Creating Account...' : 'Signing In...'}
                {retryCount > 0 && <span className="ml-1">({retryCount})</span>}
              </>
            ) : (
              isRegister ? 'Register' : 'Login'
            )}
          </button>

          <p className="text-sm mt-3">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
                setRetryCount(0)
              }}
              className="text-blue-600 underline hover:text-blue-800"
              disabled={loading}
            >
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>

          {/* Enhanced Error Display */}
          {error && (
            <div className={`mt-3 p-3 rounded text-sm ${
              isConnectionError 
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {isConnectionError ? (
                    <svg className="h-4 w-4 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-2 flex-1">
                  <p>{error}</p>
                  {isConnectionError && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={loading}
                      className="mt-2 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded text-xs transition-colors disabled:opacity-50"
                    >
                      Retry Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Connection Quality Indicator */}
          {retryCount > 0 && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Connection attempts: {retryCount}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}