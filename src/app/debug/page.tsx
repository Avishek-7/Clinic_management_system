'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export default function DebugPage() {
  const [authState, setAuthState] = useState<string>('Loading...')
  const [userData, setUserData] = useState<any>(null)
  const [firebaseError, setFirebaseError] = useState<string>('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthState('User is authenticated')
        
        try {
          const userRef = doc(db, 'users', user.uid)
          const userSnap = await getDoc(userRef)
          
          if (userSnap.exists()) {
            setUserData({
              uid: user.uid,
              email: user.email,
              ...userSnap.data()
            })
          } else {
            setUserData({
              uid: user.uid,
              email: user.email,
              firestoreData: 'User not found in Firestore'
            })
          }
        } catch (error) {
          setFirebaseError(`Firestore error: ${error}`)
        }
      } else {
        setAuthState('No user authenticated')
        setUserData(null)
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Debug Information</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> {authState}</p>
              {userData && (
                <>
                  <p><strong>UID:</strong> {userData.uid}</p>
                  <p><strong>Email:</strong> {userData.email}</p>
                  <p><strong>Role:</strong> {userData.role || 'Not set'}</p>
                  <p><strong>Created At:</strong> {userData.createdAt?.toString() || 'Not set'}</p>
                </>
              )}
            </div>
          </div>

          {/* Firebase Configuration */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Firebase Configuration</h2>
            <div className="space-y-2">
              <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}</p>
              <p><strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Missing'}</p>
              <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Missing'}</p>
              <p><strong>Storage Bucket:</strong> {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'Missing'}</p>
              <p><strong>Messaging Sender ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'Missing'}</p>
              <p><strong>App ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'Missing'}</p>
            </div>
          </div>

          {/* Errors */}
          {firebaseError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-4">Firebase Errors</h2>
              <p className="text-red-700">{firebaseError}</p>
            </div>
          )}

          {/* Navigation Test */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Navigation Test</h2>
            <div className="space-y-2">
              <a href="/login" className="block text-blue-600 hover:text-blue-800">Go to Login</a>
              <a href="/doctor" className="block text-blue-600 hover:text-blue-800">Go to Doctor Dashboard</a>
              <a href="/receptionist" className="block text-blue-600 hover:text-blue-800">Go to Receptionist Dashboard</a>
              <a href="/test" className="block text-blue-600 hover:text-blue-800">Go to Test Page</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 