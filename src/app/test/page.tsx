'use client'

import { useRouter } from 'next/navigation'

export default function TestPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Test Page</h1>
        <p className="text-gray-600 mb-6">This page is working correctly!</p>
        
        <div className="space-y-2">
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
          
          <button 
            onClick={() => router.push('/doctor')}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Doctor Dashboard
          </button>
          
          <button 
            onClick={() => router.push('/receptionist')}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Receptionist Dashboard
          </button>
        </div>
      </div>
    </div>
  )
} 