'use client'

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"

export default function useAuthGuard(expectedRole?: 'doctor' | 'receptionist') {
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user')
            
            if(!user) {
                console.log('No user found, redirecting to login')
                router.push('/login')
                return 
            }

            try {
                // Fetch user role from Firestore
                const userRef = doc(db, 'users', user.uid)
                const userSnap = await getDoc(userRef)

                if(!userSnap.exists()) {
                    console.error('User not found in Firestore')
                    router.push('/login')
                    return 
                }

                const userData = userSnap.data()
                const role = userData?.role 
                
                console.log('User role:', role, 'Expected role:', expectedRole)

                if(expectedRole && role !== expectedRole) {
                    console.warn(`Access denied. Expected role ${expectedRole}, Found: ${role}`)
                    router.push('/login')
                    return 
                }

                // If no expected role is specified, redirect based on user's actual role
                if (!expectedRole && role) {
                    console.log(`Redirecting to ${role} dashboard`)
                    router.push(`/${role}`)
                    return
                }

                setLoading(false)
            } catch (error) {
                console.error('Error in auth guard:', error)
                router.push('/login')
            }
        })

        return () => unsubscribe()
    }, [expectedRole, router])

    return loading
}