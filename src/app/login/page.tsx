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
            setError('Network error. Please check your connection.')
            break
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later.')
            break
          case 'auth/weak-password':
            setError('Password should be at least 6 characters.')
            break
          default:
            setError(`Authentication error: ${err.message}`)
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred.')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Network Status Component */}
        <NetworkStatus />
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full mr-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Clinic Management</h1>
          </div>
          <p className="text-gray-600">Streamline your healthcare operations</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600">
                {isRegister ? 'Join our healthcare platform' : 'Sign in to your account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as 'doctor' | 'receptionist')
                    }
                    disabled={loading}
                  >
                    <option value="doctor">👨‍⚕️ Doctor</option>
                    <option value="receptionist">🧑‍💼 Receptionist</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isRegister ? 'Creating Account...' : 'Signing In...'}
                    {retryCount > 0 && <span className="ml-1">({retryCount})</span>}
                  </>
                ) : (
                  isRegister ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            {/* Toggle Register/Login */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister)
                    setError('')
                    setRetryCount(0)
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  disabled={loading}
                >
                  {isRegister ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>

            {/* Enhanced Error Display */}
            {error && (
              <div className={`mt-6 p-4 rounded-lg text-sm ${
                isConnectionError 
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {isConnectionError ? (
                      <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium">{error}</p>
                    {isConnectionError && (
                      <button
                        type="button"
                        onClick={handleRetry}
                        disabled={loading}
                        className="mt-2 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 font-medium"
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
              <div className="mt-4 text-xs text-gray-500 text-center">
                Connection attempts: {retryCount}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Secure healthcare management system
          </p>
        </div>
      </div>
    </div>
  )
}