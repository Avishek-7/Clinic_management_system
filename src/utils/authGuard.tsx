'use client'

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

export default function AuthGuard() {
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if(!user) {
                router.push("/login")
            } else {
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [router])

    return loading
}


