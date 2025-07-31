'use client'

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

export default function UserHeader() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const router = useRouter()

  useEffect(() => {
    const user = auth.currentUser 
    if (user) {
      setEmail(user.email || '')
      getDoc(doc(db, 'users', user.uid)).then(snapshot => {
        if (snapshot.exists()) {
          setRole(snapshot.data().role)
        }
      })
    }
  }, [])

  const handleLogout = async () => {
    await signOut(auth) 
    router.push('/login')
  }
  
  return (
    <div className="flex justify-between items-center p-4 bg-gray-100 border-b mb-4">
      <div>
        <p className="text-sm text-gray-600">Logged in as <strong>{email}</strong></p>
        {role && <p className="text-sm text-gray-500">Role: {role}</p>} 
      </div>
      <button
        onClick={handleLogout} 
        className="bg-red-500 text-white px-3 py-1 rounded"
       >
        Logout 
      </button>
    </div>
  )

} 

